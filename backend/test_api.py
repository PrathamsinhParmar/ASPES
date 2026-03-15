import requests
import json
import logging
logging.disable(logging.CRITICAL)

base = 'http://localhost:8000/api/v1'
resp = requests.post(base + '/auth/login', data={'username': 'admin', 'password': 'admin123'})
token = resp.json()['access_token']
headers = {'Authorization': 'Bearer ' + token}

r = requests.get(base + '/projects/?limit=5', headers=headers)
projects = r.json()
print('Total projects:', len(projects))

pid = projects[0]['id']
print('Testing project:', pid)

r2 = requests.get(base + '/projects/' + pid, headers=headers)
print('Status:', r2.status_code)
if r2.status_code == 200:
    data = r2.json()
    e = data.get('evaluation')
    print('Has evaluation:', e is not None)
    if e:
        print('Eval status:', e.get('status'))
        print('Total score:', e.get('total_score'))
else:
    print('Error:', r2.text[:1000])
