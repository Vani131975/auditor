import os
import sys
from flask import Flask, jsonify, send_from_directory, request
from flask_cors import CORS
from api.upload import upload_bp
from api.auth import auth_bp

def create_app():
    # Use absolute path for robustness on Render
    base_dir = os.path.dirname(os.path.abspath(__file__))
    static_folder = os.path.join(base_dir, 'static')
    
    # We set static_url_path to '/' so that files in 'static' are served at the root
    app = Flask(__name__, static_folder=static_folder, static_url_path='/')
    CORS(app)

    # Configure upload folder
    UPLOAD_FOLDER = os.path.join(base_dir, 'temp_uploads')
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

    # Register Blueprints BEFORE the catch-all
    app.register_blueprint(upload_bp, url_prefix='/api/v1')
    app.register_blueprint(auth_bp, url_prefix='/api/v1/auth')

    # Comprehensive Health check
    @app.route('/api/health', methods=['GET'])
    def health_check():
        return jsonify({
            "status": "healthy", 
            "service": "compliance-auditor",
            "static_folder_exists": os.path.exists(static_folder),
            "index_exists": os.path.exists(os.path.join(static_folder, 'index.html'))
        })

    # SPA Catch-all: Handled carefully to avoid shadowing static files or APIs
    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve(path):
        # Safety: API routes that didn't match blueprints shouldn't return HTML
        if path.startswith('api/'):
            print(f"DEBUG: 404 API Route: {path}", file=sys.stderr)
            return jsonify({"error": "Resource not found"}), 404

        # Try serving the file directly if it exists in the static folder
        full_path = os.path.join(app.static_folder, path)
        if path != "" and os.path.exists(full_path):
            return send_from_directory(app.static_folder, path)
        
        # Fallback to index.html for React Router
        index_path = os.path.join(app.static_folder, 'index.html')
        if not os.path.exists(index_path):
            print(f"CRITICAL: index.html not found at {index_path}", file=sys.stderr)
            return "Frontend build not found. Please check deployment logs.", 404
            
        return send_from_directory(app.static_folder, 'index.html')

    return app

# Expose module-level app for Gunicorn
app = create_app()

if __name__ == '__main__':
    # Respect Render's PORT environment variable
    port = int(os.environ.get('PORT', 5000))
    app.run(debug=True, host='0.0.0.0', port=port, use_reloader=False)
