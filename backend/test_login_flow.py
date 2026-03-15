import urllib.request
import urllib.parse
import json

BASE = "http://localhost:8000/api/v1"

# Step 1: Login
login_data = urllib.parse.urlencode({"username": "admin@aspes.edu", "password": "admin123"}).encode()
req = urllib.request.Request(f"{BASE}/auth/login", data=login_data,
                             headers={"Content-Type": "application/x-www-form-urlencoded"}, method="POST")
with urllib.request.urlopen(req) as resp:
    login_resp = json.loads(resp.read())

token = login_resp.get("access_token")
print(f"LOGIN OK: token_length={len(token) if token else 0}")

# Step 2: Get /me using token
me_req = urllib.request.Request(f"{BASE}/auth/me", headers={"Authorization": f"Bearer {token}"})
try:
    with urllib.request.urlopen(me_req) as resp:
        me_data = json.loads(resp.read())
    print(f"ME OK: email={me_data.get('email')}, role={me_data.get('role')}")
except urllib.error.HTTPError as e:
    print(f"ME FAILED: {e.code} - {e.read().decode()}")
