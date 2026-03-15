import asyncio
import uuid
import urllib.request
import urllib.parse
from urllib.error import HTTPError
import json
import io

BASE = "http://localhost:8000/api/v1"

def run_test():
    # 1. Login
    login_data = urllib.parse.urlencode({"username": "admin@aspes.edu", "password": "admin123"}).encode()
    req = urllib.request.Request(f"{BASE}/auth/login", data=login_data,
                                 headers={"Content-Type": "application/x-www-form-urlencoded"}, method="POST")
    with urllib.request.urlopen(req) as resp:
        token = json.loads(resp.read()).get("access_token")
    
    # 2. Upload dummy files using multipart/form-data
    import mimetypes
    from email.mime.multipart import MIMEMultipart
    from email.mime.base import MIMEBase
    from email.mime.text import MIMEText
    
    msg = MIMEMultipart("form-data")
    msg.attach(MIMEText("Test Project", _subtype="plain", _charset="utf-8").__class__("Test Project", _subtype="plain"))
    
    boundary = "----TestBoundary123"
    
    body = (
        f"--{boundary}\r\n"
        f"Content-Disposition: form-data; name=\"title\"\r\n\r\n"
        f"Test Project\r\n"
        f"--{boundary}\r\n"
        f"Content-Disposition: form-data; name=\"programming_language\"\r\n\r\n"
        f"python\r\n"
        f"--{boundary}\r\n"
        f"Content-Disposition: form-data; name=\"code_file\"; filename=\"test.zip\"\r\n"
        f"Content-Type: application/zip\r\n\r\n"
        f"dummy_zip_content\r\n"
        f"--{boundary}\r\n"
        f"Content-Disposition: form-data; name=\"doc_file\"; filename=\"test.pdf\"\r\n"
        f"Content-Type: application/pdf\r\n\r\n"
        f"dummy_pdf_content\r\n"
        f"--{boundary}--\r\n"
    )
    
    req = urllib.request.Request(f"{BASE}/projects/upload", data=body.encode('utf-8'), method="POST")
    req.add_header("Authorization", f"Bearer {token}")
    req.add_header("Content-Type", f"multipart/form-data; boundary={boundary}")
    
    try:
        with urllib.request.urlopen(req) as resp:
            print(resp.read().decode())
    except HTTPError as e:
        print(f"FAILED: {e.code}")
        print(e.read().decode())

if __name__ == "__main__":
    run_test()
