"""
File service - handles secure upload, validation, extraction, and deletion of project files.
"""
import os
import shutil
import uuid
import zipfile
from pathlib import Path
from typing import Optional, Tuple, List

import aiofiles
from fastapi import HTTPException, UploadFile, status

from app.config import settings

UPLOAD_DIR = Path(settings.UPLOAD_DIR)
ALLOWED_CODE_EXTENSIONS = {".py", ".js", ".java", ".cpp", ".c", ".zip"}
ALLOWED_DOC_EXTENSIONS = {".pdf", ".md", ".txt", ".docx"}
MAX_FILE_SIZE = settings.MAX_UPLOAD_SIZE


from app.services.cloudinary_service import CloudinaryService

class FileService:
    def __init__(self):
        self.upload_dir = Path(settings.UPLOAD_DIR)
        self.upload_dir.mkdir(parents=True, exist_ok=True)
        self.temp_dir = Path(settings.TEMP_DIR)
        self.temp_dir.mkdir(parents=True, exist_ok=True)
        self.cloudinary = CloudinaryService()

    def is_cloud_enabled(self) -> bool:
        """Returns True if Cloudinary is configured and active."""
        return self.cloudinary.is_configured()

    def validate_file(self, file: UploadFile, allowed_extensions: set) -> None:
        """
        Validate file size and extension.
        Raises HTTPException if invalid.
        """
        if not file.filename:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No filename provided")

        # Extension check
        suffix = Path(file.filename).suffix.lower()
        if suffix not in allowed_extensions:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid file type. Allowed: {allowed_extensions}"
            )

    async def save_file(self, file: UploadFile, subfolder: str) -> str:
        """
        Saves file to Cloudinary if configured; otherwise saves to local filesystem.
        Returns the public URL (Cloudinary) or local file path string.
        """
        # If Cloudinary is configured, upload directly to cloud
        if self.cloudinary.is_configured():
            res = await self.cloudinary.upload_file(file, subfolder=subfolder)
            return res["url"]

        # Local storage fallback
        target_dir = self.upload_dir / subfolder
        target_dir.mkdir(parents=True, exist_ok=True)

        original_ext = Path(file.filename).suffix.lower() if file.filename else ""
        unique_name = f"{uuid.uuid4().hex}{original_ext}"
        target_path = target_dir / unique_name

        # Save file asynchronously
        bytes_written = 0
        async with aiofiles.open(target_path, "wb") as f:
            while chunk := await file.read(1024 * 1024):  # 1MB chunks
                bytes_written += len(chunk)
                if bytes_written > MAX_FILE_SIZE:
                    target_path.unlink(missing_ok=True)
                    raise HTTPException(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        detail=f"File exceeds maximum size of {MAX_FILE_SIZE} bytes"
                    )
                await f.write(chunk)

        try:
            await file.seek(0)
        except Exception:
            pass

        return str(target_path)

    async def save_project_files(self, code_file: UploadFile, doc_file: UploadFile) -> Tuple[str, str]:
        """
        Validates and saves both the code file and the document file.
        Returns a tuple of their saved file paths or Cloudinary URLs.
        """
        self.validate_file(code_file, ALLOWED_CODE_EXTENSIONS)
        self.validate_file(doc_file, ALLOWED_DOC_EXTENSIONS)

        # Use a single subfolder for both files related to this upload session
        session_id = uuid.uuid4().hex
        
        code_path = await self.save_file(code_file, subfolder=f"projects/{session_id}")
        doc_path = await self.save_file(doc_file, subfolder=f"projects/{session_id}")
        
        return code_path, doc_path

    async def ensure_local_copy(self, file_path_or_url: str, suffix: str = "") -> str:
        """
        Ensures a local file copy exists on disk for processing by the AI engine.
        If file_path_or_url is a remote Cloudinary URL, downloads it to temp.
        If it's already a local file, returns the local path.
        """
        return await CloudinaryService.download_to_temp(file_path_or_url, suffix=suffix)

    def delete_file(self, file_path_or_url: str) -> bool:
        """
        Deletes a file from Cloudinary (if remote URL) or from disk (if local).
        Returns True on success, False otherwise.
        """
        if not file_path_or_url:
            return False

        # If Cloudinary URL, destroy via Cloudinary API
        if file_path_or_url.startswith("http://") or file_path_or_url.startswith("https://"):
            return self.cloudinary.delete_file(file_path_or_url)

        # Local filesystem deletion
        path = Path(file_path_or_url)
        try:
            path.relative_to(self.upload_dir)
        except ValueError:
            return False
            
        if path.exists():
            try:
                path.unlink()
                return True
            except OSError:
                return False
        return False

    def extract_zip(self, zip_path: str, extract_to: str) -> List[str]:
        """
        Extract a zip archive safely.
        Returns a list of extracted file paths.
        """
        extracted_files = []
        zip_obj = Path(zip_path)
        target_dir = Path(extract_to)
        
        if not zip_obj.exists():
            raise FileNotFoundError(f"Zip file not found: {zip_path}")

        target_dir.mkdir(parents=True, exist_ok=True)

        with zipfile.ZipFile(zip_obj, 'r') as zip_ref:
            for member in zip_ref.namelist():
                # Security: prevent zip-slip traversal
                if '..' in member or member.startswith('/') or member.startswith('\\'):
                    continue
                    
                zip_ref.extract(member, target_dir)
                extracted_files.append(str(target_dir / member))
                
        return extracted_files

    async def read_file_content(self, file_path: str) -> str:
        """
        Reads file content securely as a string.
        Falls back through utf-8 and latin-1.
        """
        path = Path(file_path)
        
        try:
            path.relative_to(self.upload_dir)
        except ValueError:
            return ""

        if not path.exists() or not path.is_file():
            return ""

        for encoding in ['utf-8', 'latin-1']:
            try:
                async with aiofiles.open(path, "r", encoding=encoding) as f:
                    return await f.read()
            except UnicodeDecodeError:
                continue
            except Exception:
                return ""
                
        return ""
