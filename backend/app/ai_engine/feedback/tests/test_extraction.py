import zipfile
import pytest
from pathlib import Path
from tempfile import TemporaryDirectory

from app.ai_engine.feedback.extraction import (
    safe_extract_zip,
    extract_report_text,
    PathTraversalError,
    ZipBombError,
    TooManyFilesError,
    ExtractionError
)

def test_safe_extract_zip_success():
    with TemporaryDirectory() as tmpdir:
        root = Path(tmpdir)
        zip_path = root / "test.zip"
        target_dir = root / "extracted"
        
        # Create a valid zip
        with zipfile.ZipFile(zip_path, "w") as zf:
            zf.writestr("hello.py", "print('hello')")
            zf.writestr("dir/world.py", "print('world')")
            
        res = safe_extract_zip(zip_path, target_dir)
        assert len(res.files) == 2
        
        file_names = {f.name for f in res.files}
        assert "hello.py" in file_names
        assert "world.py" in file_names


def test_safe_extract_zip_traversal_rejection():
    with TemporaryDirectory() as tmpdir:
        root = Path(tmpdir)
        zip_path = root / "evil.zip"
        target_dir = root / "extracted"
        
        # Create a malicious zip with path traversal
        with zipfile.ZipFile(zip_path, "w") as zf:
            # zipfile normally strips leading slashes, but we can craft relative paths
            zf.writestr("../escaped.py", "malicious")
            
        with pytest.raises(PathTraversalError):
            safe_extract_zip(zip_path, target_dir)


def test_safe_extract_zip_bomb_rejection():
    with TemporaryDirectory() as tmpdir:
        root = Path(tmpdir)
        zip_path = root / "bomb.zip"
        target_dir = root / "extracted"
        
        # Write large content
        large_content = b"0" * 1024 * 1024 * 2  # 2 MB
        
        with zipfile.ZipFile(zip_path, "w", compression=zipfile.ZIP_DEFLATED) as zf:
            zf.writestr("huge.txt", large_content)
            
        # Extract with a 1 MB limit
        with pytest.raises(ZipBombError):
            safe_extract_zip(zip_path, target_dir, max_size_bytes=1024*1024)


def test_safe_extract_zip_file_count_rejection():
    with TemporaryDirectory() as tmpdir:
        root = Path(tmpdir)
        zip_path = root / "many.zip"
        target_dir = root / "extracted"
        
        with zipfile.ZipFile(zip_path, "w") as zf:
            for i in range(15):
                zf.writestr(f"file_{i}.txt", "data")
                
        # Limit to 10 files
        with pytest.raises(TooManyFilesError):
            safe_extract_zip(zip_path, target_dir, max_files=10)


def test_extract_report_text_plain():
    with TemporaryDirectory() as tmpdir:
        report = Path(tmpdir) / "report.md"
        report.write_text("Hello markdown")
        
        text = extract_report_text(report)
        assert text == "Hello markdown"
