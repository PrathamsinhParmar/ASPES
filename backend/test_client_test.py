import asyncio
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

resp = client.post('/api/v1/auth/login', data={'username': 'admin', 'password': 'admin123'})
token = resp.json()['access_token']
headers = {'Authorization': 'Bearer ' + token}

r = client.get('/api/v1/projects/?limit=5', headers=headers)
projects = r.json()
print('Total projects:', len(projects))

pid = projects[0]['id']
print('Testing project:', pid)

r2 = client.get('/api/v1/projects/' + pid, headers=headers)
print('Status:', r2.status_code)
if r2.status_code == 200:
    print('SUCCESS')
else:
    print('ERROR:', r2.text[:2000])
