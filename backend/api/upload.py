import os
import jwt
import json
from flask import Blueprint, request, jsonify, current_app, send_from_directory
from werkzeug.utils import secure_filename
from services.azure_blob import upload_to_azure, get_all_blobs, read_users_table, write_users_table, add_user_history, get_user_history

JWT_SECRET = os.getenv('JWT_SECRET', 'super-secret-key-123')
upload_bp = Blueprint('upload', __name__)

ALLOWED_EXTENSIONS = {'txt', 'pdf', 'docx'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def get_current_user(req):
    auth_header = req.headers.get('Authorization')
    if auth_header and auth_header.startswith('Bearer '):
        token = auth_header.split(' ')[1]
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
            return payload.get('email')
        except jwt.ExpiredSignatureError:
            return None
        except jwt.InvalidTokenError:
            return None
    return None

@upload_bp.route('/upload', methods=['POST'])
def upload_contract():
    email = get_current_user(request)
    if not email:
        return jsonify({"error": "Unauthorized"}), 401

    if 'file' not in request.files:
        return jsonify({"error": "No file part in the request"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
        
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        try:
            # 1. Extraction
            from services.extraction import extract_text
            extracted_text = extract_text(filepath)
            
            # 2. Vector DB Storage (Graceful fallback)
            chunks_saved = 0
            try:
                from services.weaviate_client import get_weaviate_client, store_document_chunks
                w_client = get_weaviate_client()
                if w_client:
                    chunks_saved = store_document_chunks(w_client, file.filename, extracted_text)
                    w_client.close()
            except Exception as e:
                print(f"Weaviate Storage Skipped/Warning: {e}")

            # 3. AI Analysis
            from services.ai_analyzer import generate_compliance_report
            json_report_str = generate_compliance_report(extracted_text)
            
            # 4. Report Generation
            from services.pdf_generator import create_pdf_report
            report_pdf_path = os.path.join(current_app.config['UPLOAD_FOLDER'], f"report_{filename}.pdf")
            created_report_path = create_pdf_report(json_report_str, report_pdf_path)
            
            # 5. Azure Blob Storage Upload
            safe_email = email.replace('@', '_at_').replace('.', '_')
            orig_blob_name = f"{safe_email}___{filename}"
            report_blob_name = f"report_{safe_email}___{filename}.pdf"
            
            orig_blob_url = upload_to_azure(filepath, blob_name=orig_blob_name)
            report_blob_url = upload_to_azure(created_report_path, blob_name=report_blob_name)
            
            # 6. Update user's contracts analyzed count
            users = read_users_table()
            for u in users:
                if u['email'] == email:
                    u['contracts_analyzed'] = u.get('contracts_analyzed', 0) + 1
                    break
            write_users_table(users)
            add_user_history(email, filename, orig_blob_url, report_blob_url)
            
            return jsonify({
                "message": "Analysis Complete",
                "filename": filename,
                "chunks_embedded": chunks_saved,
                "report_url": report_blob_url,
                "original_url": orig_blob_url,
                "raw_json": json_report_str
            }), 200
            
        except Exception as e:
            print(f"Pipeline Error: {e}")
            return jsonify({"error": str(e)}), 500
        finally:
            # Clean up the local temp upload
            if os.path.exists(filepath):
                os.remove(filepath)
            if 'created_report_path' in locals() and os.path.exists(created_report_path):
                os.remove(created_report_path)
        
    return jsonify({"error": "Invalid file type. Allowed types: pdf, txt, docx"}), 400

@upload_bp.route('/history', methods=['GET'])
def get_history():
    email = get_current_user(request)
    if not email:
        return jsonify({"error": "Unauthorized"}), 401

    if email == 'admin@gmail.com':
        safe_email = "" # Admin gets to see everything
    else:
        safe_email = email.replace('@', '_at_').replace('.', '_') + "___"

    blobs = get_all_blobs()
    history = []
    
    reports = {b['name']: b['url'] for b in blobs if b['name'].startswith('report_') and b['name'].endswith('.pdf')}
    originals = {b['name']: b['url'] for b in blobs if not b['name'].startswith('report_')}

    for orig_name, orig_url in originals.items():
        if safe_email and not orig_name.startswith(safe_email):
            continue
            
        report_name = f"report_{orig_name}.pdf"
        report_url = reports.get(report_name)
        
        display_name = orig_name
        if safe_email and display_name.startswith(safe_email):
            display_name = display_name[len(safe_email):]

        history.append({
            "contract_name": display_name,
            "contract_url": orig_url,
            "report_url": report_url
        })
        
    return jsonify(history), 200

# Keep local download fallback just in case
@upload_bp.route('/download/<filename>', methods=['GET'])
def download_file(filename):
    return send_from_directory(current_app.config['UPLOAD_FOLDER'], filename, as_attachment=True)
