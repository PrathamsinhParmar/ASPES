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
    RAW_EXTENSIONS = {".zip", ".py", ".js", ".jsx", ".ts", ".tsx", ".java", ".cpp", ".c", ".pdf", ".docx", ".doc", ".txt", ".md", ".rst"}

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

    def _extract_public_id_and_type(self, identifier: str) -> Tuple[str, str]:
        """
        Extracts public_id and resource_type from a Cloudinary URL or direct public_id.
        """
        if not identifier.startswith("http://") and not identifier.startswith("https://"):
            res_type = self._determine_resource_type(identifier)
            return identifier, res_type

        # Parse URL: e.g. https://res.cloudinary.com/<cloud>/raw/upload/v12345/aspes/projects/abc.zip
        res_type = "raw"
        if "/image/upload/" in identifier:
            res_type = "image"
        elif "/raw/upload/" in identifier:
            res_type = "raw"
        elif "/video/upload/" in identifier:
            res_type = "video"

        match = re.search(r"/(?:image|raw|video)/upload/(?:v\d+/)?(.+)$", identifier)
        if match:
            extracted_id = match.group(1)
            return extracted_id, res_type

        return identifier, res_type

    @staticmethod
    async def download_to_temp(file_path_or_url: str, suffix: str = "") -> str:
        """
        Ensures a file is accessible on the local filesystem.
        If it's a remote URL (Cloudinary), downloads it to a temporary file.
        If it's already a local file path that exists, returns it directly.
        """
        if not file_path_or_url:
            return ""

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

        logger.info(f"Downloading remote asset from {file_path_or_url} to local temp {temp_file_path}")

        async with httpx.AsyncClient(timeout=60.0, follow_redirects=True) as client:
            resp = await client.get(file_path_or_url)
            if resp.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail=f"Failed to fetch file from Cloudinary (HTTP {resp.status_code})"
                )
            async with aiofiles.open(temp_file_path, "wb") as f:
                await f.write(resp.content)

        return str(temp_file_path)
