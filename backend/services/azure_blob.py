import os
from supabase import create_client, Client
import json

CONTAINER_NAME = "contracts"

def get_supabase_client() -> Client:
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_KEY")
    if not url or not key:
        return None
    return create_client(url, key)

def get_sas_url(blob_name):
    supabase = get_supabase_client()
    if not supabase: return None
    res = supabase.storage.from_(CONTAINER_NAME).get_public_url(blob_name)
    return f"{res}?download={blob_name}"

def upload_to_azure(file_path, blob_name=None):
    supabase = get_supabase_client()
    if not supabase: return None
    
    if not blob_name:
        blob_name = os.path.basename(file_path)
        
    with open(file_path, 'rb') as f:
        try:
            # Using v2 SDK, file_options={"upsert": "true"} safely overwrites if it already exists
            supabase.storage.from_(CONTAINER_NAME).upload(
                file=f, 
                path=blob_name, 
                file_options={"cache-control": "3600", "upsert": "true"}
            )
        except Exception as e:
            try:
                # Fallback to update for safety 
                 supabase.storage.from_(CONTAINER_NAME).update(
                     file=f, 
                     path=blob_name, 
                     file_options={"cache-control": "3600", "upsert": "true"}
                 )
            except Exception as e2:
                 print(f"Error uploading to Supabase Storage: {e2}")
                 
    return get_sas_url(blob_name)

def get_all_blobs():
    supabase = get_supabase_client()
    if not supabase: return []
    
    try:
        response = supabase.storage.from_(CONTAINER_NAME).list()
        blobs = []
        for file_obj in response:
            name = file_obj['name']
            if name == '.emptyFolderPlaceholder' or name.startswith('.'): continue
            url = get_sas_url(name)
            blobs.append({"name": name, "url": url})
        return blobs
    except Exception as e:
        print(f"Error listing blobs: {e}")
        return []

def read_users_table():
    supabase = get_supabase_client()
    if not supabase: return []
    try:
        response = supabase.table("users").select("*").execute()
        return response.data
    except Exception as e:
        print(f"Error reading users: {e}")
        return []

def write_users_table(users_list):
    supabase = get_supabase_client()
    if not supabase: return False
    try:
        max_id = 0
        for u in users_list:
            if 'id' in u and u['id'] is not None and u['id'] > max_id:
                max_id = u['id']
                
        for u in users_list:
            if 'id' not in u:
                max_id += 1
                u['id'] = max_id
                
        supabase.table("users").upsert(users_list).execute()
        return True
    except Exception as e:
        print(f"Error writing users: {e}")
        return False


def create_user(user_data):
    supabase = get_supabase_client()
    if not supabase: return False
    try:
        # Fetch the current max ID to work around PostgreSQL sequence desync after migration
        res = supabase.table("users").select("id").order("id", desc=True).limit(1).execute()
        max_id = res.data[0]['id'] if res.data else 0
        user_data['id'] = max_id + 1
        
        supabase.table("users").insert(user_data).execute()
        return True
    except Exception as e:
        print(f"Error creating user: {e}")
        return False

def add_user_history(email, contract_name, contract_url, report_url):
    users = read_users_table()
    if not users: return False
    
    for u in users:
        if u['email'] == email:
            history = u.get('document_history') or []
            history.append({
                "contract_name": contract_name,
                "contract_url": contract_url,
                "report_url": report_url
            })
            u['document_history'] = history
            return write_users_table([u])
    return False

def get_user_history(email):
    if email == 'admin@gmail.com':
        all_history = []
        for u in read_users_table():
            all_history.extend(u.get('document_history') or [])
        return all_history
        
    for u in read_users_table():
        if u['email'] == email:
            return u.get('document_history') or []
    return []
