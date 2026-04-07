import requests

BASE_URL = "http://127.0.0.1:5000/api/v1"

def test_flow():
    # 1. Login Bob
    resp = requests.post(f"{BASE_URL}/auth/login", json={
        "email": "bob@acme.com",
        "password": "password"
    })
    bob_data = resp.json()
    bob_token = bob_data.get("token")
    print("Bob Token:", bob_token[:20] if bob_token else None)

    # 2. Upload file as Bob
    headers = {"Authorization": f"Bearer {bob_token}"}
    files = {'file': open('c:\\Users\\ManthravadiVani\\Desktop\\auditor\\test_contract.txt', 'rb')}
    print("Uploading file...")
    upload_resp = requests.post(f"{BASE_URL}/upload", headers=headers, files=files)
    print("Upload Response:", upload_resp.status_code, upload_resp.text)

    # 3. Check History
    history_resp = requests.get(f"{BASE_URL}/history")
    print("History:", history_resp.json())

    # 4. Login Alice (Admin)
    alice_resp = requests.post(f"{BASE_URL}/auth/login", json={
        "email": "alice@example.com",
        "password": "password"
    })
    alice_token = alice_resp.json().get("token")
    
    # 5. Check Admin Users endpoint
    admin_headers = {"Authorization": f"Bearer {alice_token}"}
    users_resp = requests.get(f"{BASE_URL}/auth/admin/users", headers=admin_headers)
    print("Users Logic:", users_resp.json())

if __name__ == "__main__":
    test_flow()
