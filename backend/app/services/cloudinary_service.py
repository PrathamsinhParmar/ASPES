"""
Cloudinary storage service for ASPES.
Handles secure upload, retrieval, and deletion of project archives,
documentation, faculty attachments, and media via Cloudinary.
"""
import logging
import os
import re
import tempfile
import uuid
from pathlib import Path
from typing import Any, Dict, Optional, Tuple

import aiofiles
import httpx
from fastapi import HTTPException, UploadFile, status

from app.config import settings

logger = logging.getLogger(__name__)

# Cloudinary library import
try:
    import cloudinary
    import cloudinary.uploader
    import cloudinary.api
    CLOUDINARY_AVAILABLE = True
except ImportError:
    CLOUDINARY_AVAILABLE = False
    logger.warning("Cloudinary library not installed. Install via `pip install cloudinary`")


class CloudinaryService:
    """Enterprise Cloudinary storage manager with raw asset and image support."""

    IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".bmp"}
    RAW_EXTENSIONS = {
        ".zip", ".tar", ".gz", ".tgz", ".rar", ".7z",
        ".py", ".js", ".jsx", ".ts", ".tsx", ".java", ".cpp", ".c", ".cs",
        ".html", ".css", ".php", ".go", ".rs", ".rb", ".json", ".sql",
        ".pdf", ".docx", ".doc", ".txt", ".md", ".markdown", ".rst", ".rtf", ".odt",
        ".pptx", ".ppt"
    }

    def __init__(self):
        self.cloud_name = settings.CLOUDINARY_CLOUD_NAME
        self.api_key = settings.CLOUDINARY_API_KEY
        self.api_secret = settings.CLOUDINARY_API_SECRET
        self.folder_prefix = settings.CLOUDINARY_FOLDER_PREFIX or "aspes"
        self.configured = False

        if CLOUDINARY_AVAILABLE and self.cloud_name and self.api_key and self.api_secret:
            try:
                cloudinary.config(
                    cloud_name=self.cloud_name,
                    api_key=self.api_key,
                    api_secret=self.api_secret,
                    secure=settings.CLOUDINARY_SECURE,
                )
                self.configured = True
                logger.info("CloudinaryService configured successfully.")
            except Exception as e:
                logger.error(f"Failed to initialize Cloudinary config: {e}")
                self.configured = False
        else:
            logger.info("Cloudinary credentials not fully configured; fallback mode will be active.")

    def is_configured(self) -> bool:
        """Check if Cloudinary is configured with valid credentials."""
        return self.configured

    def _determine_resource_type(self, filename: str) -> str:
        """Categorize into 'image' vs 'raw' (Cloudinary treats zip/code/pdf as 'raw')."""
        suffix = Path(filename).suffix.lower() if filename else ""
        if suffix in self.IMAGE_EXTENSIONS:
            return "image"
        return "raw"

    async def upload_file(
        self,
        file: UploadFile,
        subfolder: str = "projects",
        custom_name: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Uploads an UploadFile to Cloudinary.
        Validates size, streams contents, and returns metadata including secure_url and public_id.
        """
        if not self.is_configured():
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Cloudinary is not configured on the server."
            )

        if not file.filename:
            raise HTTPException(status_code=400, detail="Filename missing for upload")

        original_ext = Path(file.filename).suffix.lower()
        resource_type = self._determine_resource_type(file.filename)

        # Generate a unique public ID preserving the subfolder hierarchy
        unique_token = custom_name or uuid.uuid4().hex
        # For raw resources, keep extension in the public_id so Cloudinary serves the correct Content-Type/name
        if resource_type == "raw" and original_ext and not unique_token.endswith(original_ext):
            unique_token = f"{unique_token}{original_ext}"

        public_id = f"{self.folder_prefix}/{subfolder.strip('/')}/{unique_token}"

        # Read file chunks securely with size enforcement
        content_bytes = bytearray()
        bytes_read = 0
        max_size = settings.MAX_UPLOAD_SIZE

        try:
            while chunk := await file.read(1024 * 1024):  # 1 MB chunks
                bytes_read += len(chunk)
                if bytes_read > max_size:
                    raise HTTPException(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        detail=f"File exceeds maximum allowed upload size of {max_size} bytes."
                    )
                content_bytes.extend(chunk)
        finally:
            await file.seek(0)

        # Upload to Cloudinary
        try:
            target_asset_folder = f"{self.folder_prefix}/{subfolder.strip('/')}"
            upload_kwargs = {
                "public_id": public_id,
                "resource_type": resource_type,
                "overwrite": True,
                "use_filename": False,
                "unique_filename": False,
                "asset_folder": target_asset_folder,
            }

            response = cloudinary.uploader.upload(bytes(content_bytes), **upload_kwargs)

            secure_url = response.get("secure_url") or response.get("url")
            public_id = response.get("public_id")

            logger.info(f"Cloudinary upload successful: {public_id} ({resource_type}) -> {secure_url}")

            return {
                "url": secure_url,
                "public_id": public_id,
                "resource_type": resource_type,
                "bytes": response.get("bytes", len(content_bytes)),
                "format": response.get("format", original_ext.lstrip(".")),
                "original_filename": file.filename,
            }
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Cloudinary upload exception: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Cloudinary upload failed: {str(e)}"
            )

    def delete_file(self, public_id_or_url: str, resource_type: Optional[str] = None) -> bool:
        """
        Deletes an asset from Cloudinary using its public_id or full URL.
        """
        if not self.is_configured():
            logger.warning("Cloudinary not configured; cannot delete asset.")
            return False

        if not public_id_or_url:
            return False

        public_id, detected_type = self._extract_public_id_and_type(public_id_or_url)
        target_type = resource_type or detected_type or "raw"

        try:
            result = cloudinary.uploader.destroy(public_id, resource_type=target_type)
            is_ok = result.get("result") in ("ok", "not found")
            logger.info(f"Cloudinary delete for {public_id} [{target_type}]: {result}")
            return is_ok
        except Exception as e:
            logger.error(f"Failed to delete Cloudinary asset {public_id}: {e}")
            return False

    def get_download_url(self, public_id_or_url: str, attachment: bool = False) -> str:
        """
        Generates a secure, signed download URL for an asset via Cloudinary Admin API.
        This bypasses public CDN delivery restrictions (such as 'Blocked for delivery'
        or 'Customer is marked as untrusted' on PDF/ZIP files on free plans).
        """
        if not self.is_configured() or not public_id_or_url:
            return public_id_or_url

        try:
            # Normalize single slash if present
            clean_input = public_id_or_url.replace("\\", "/")
            if clean_input.startswith("https:/") and not clean_input.startswith("https://"):
                clean_input = "https://" + clean_input[7:].lstrip("/")
            elif clean_input.startswith("http:/") and not clean_input.startswith("http://"):
                clean_input = "http://" + clean_input[6:].lstrip("/")

            public_id, res_type = self._extract_public_id_and_type(clean_input)
            # Determine format/extension
            ext = Path(public_id).suffix.lstrip(".")
            if not ext and "." in clean_input:
                ext = Path(clean_input.split("?")[0]).suffix.lstrip(".")

            import cloudinary.utils
            signed_url = cloudinary.utils.private_download_url(
                public_id,
                ext or "raw",
                resource_type=res_type,
                type="upload",
                attachment=attachment
            )
            return signed_url
        except Exception as e:
            logger.warning(f"Could not generate signed download URL for {public_id_or_url}: {e}")
            return public_id_or_url

    def _extract_public_id_and_type(self, identifier: str) -> Tuple[str, str]:
        """
        Extracts public_id and resource_type from a Cloudinary URL or direct public_id.
        """
        clean_id = identifier.replace("\\", "/")
        if clean_id.startswith("https:/") and not clean_id.startswith("https://"):
            clean_id = "https://" + clean_id[7:].lstrip("/")
        elif clean_id.startswith("http:/") and not clean_id.startswith("http://"):
            clean_id = "http://" + clean_id[6:].lstrip("/")

        if not clean_id.startswith("http://") and not clean_id.startswith("https://"):
            res_type = self._determine_resource_type(clean_id)
            return clean_id, res_type

        # Parse URL: e.g. https://res.cloudinary.com/<cloud>/raw/upload/v12345/aspes/projects/abc.zip
        res_type = "raw"
        if "/image/upload/" in clean_id:
            res_type = "image"
        elif "/raw/upload/" in clean_id:
            res_type = "raw"
        elif "/video/upload/" in clean_id:
            res_type = "video"

        match = re.search(r"/(?:image|raw|video)/upload/(?:s--[^/]+--/)?(?:v\d+/)?([^?]+)", clean_id)
        if match:
            extracted_id = match.group(1)
            return extracted_id, res_type

        return clean_id, res_type

    @staticmethod
    async def download_to_temp(file_path_or_url: str, suffix: str = "") -> str:
        """
        Ensures a file is accessible on the local filesystem.
        If it's a remote URL (Cloudinary), downloads it to a temporary file.
        If it's already a local file path that exists, returns it directly.
        """
        if not file_path_or_url:
            return ""

        # Normalize single slash if present
        if file_path_or_url.startswith("https:/") and not file_path_or_url.startswith("https://"):
            file_path_or_url = "https://" + file_path_or_url[7:].lstrip("/")
        elif file_path_or_url.startswith("http:/") and not file_path_or_url.startswith("http://"):
            file_path_or_url = "http://" + file_path_or_url[6:].lstrip("/")

        # If it's a local file that already exists, return it
        if not file_path_or_url.startswith("http://") and not file_path_or_url.startswith("https://"):
            local_candidate = Path(file_path_or_url)
            if local_candidate.exists():
                return str(local_candidate)

        # Detect suffix from URL if not specified
        if not suffix:
            clean_url = file_path_or_url.split("?")[0]
            detected_ext = Path(clean_url).suffix
            if detected_ext:
                suffix = detected_ext

        temp_dir = Path(settings.TEMP_DIR)
        temp_dir.mkdir(parents=True, exist_ok=True)
        temp_file_path = temp_dir / f"aspes_remote_{uuid.uuid4().hex}{suffix}"

        # If it's a Cloudinary URL, use authenticated signed URL so CDN access restrictions don't block backend download
        fetch_url = file_path_or_url
        if "cloudinary.com" in file_path_or_url:
            cs = CloudinaryService()
            if cs.is_configured():
                fetch_url = cs.get_download_url(file_path_or_url, attachment=False)

        logger.info(f"Downloading remote asset from {fetch_url} to local temp {temp_file_path}")

        async with httpx.AsyncClient(timeout=60.0, follow_redirects=True) as client:
            resp = await client.get(fetch_url)
            if resp.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail=f"Failed to fetch file from Cloudinary (HTTP {resp.status_code})"
                )
            async with aiofiles.open(temp_file_path, "wb") as f:
                await f.write(resp.content)

        return str(temp_file_path)
