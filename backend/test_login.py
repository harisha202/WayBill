import urllib.request
import json
req = urllib.request.Request(
    'http://127.0.0.1:8000/api/auth/login', 
    data=json.dumps({"email": "admin@waybill.com", "password": "adminpassword", "role": "admin"}).encode(),
    headers={'Content-Type': 'application/json'}
)
try:
    print(urllib.request.urlopen(req).read())
except Exception as e:
    print(e.read())
