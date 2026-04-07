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
    
    # CRITICAL: We DO NOT set static_url_path='/' here. 
    # This allows our manual catch-all route to handle everything at the root level
    # without competing with Flask's internal static file server.
    app = Flask(__name__, static_folder=static_folder)
    CORS(app)

    # Configure upload folder
    UPLOAD_FOLDER = os.path.join(base_dir, 'temp_uploads')
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

    # Register Blueprints (Priority routes)
    app.register_blueprint(upload_bp, url_prefix='/api/v1')
    app.register_blueprint(auth_bp, url_prefix='/api/v1/auth')

    # Comprehensive Health check
    @app.route('/api/health', methods=['GET'])
    def health_check():
        return jsonify({
            "status": "healthy", 
            "service": "compliance-auditor",
            "paths": {
                "base_dir": base_dir,
                "static_folder": static_folder,
            },
            "exists": {
                "static_folder": os.path.exists(static_folder),
                "index_html": os.path.exists(os.path.join(static_folder, 'index.html'))
            }
        })

    # SPA Catch-all: This handles the root '/', React routes ('/login'), 
    # and also manually serves static assets from the root.
    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve(path):
        # 1. API routes safety check
        if path.startswith('api/'):
            return jsonify({"error": "API route not found"}), 404

        # 2. Try serving the path as a static file (e.g., assets/main.js, vite.svg)
        full_path = os.path.join(app.static_folder, path)
        if path != "" and os.path.exists(full_path):
            return send_from_directory(app.static_folder, path)
        
        # 3. Fallback to index.html for ALL other non-file paths
        # This allows React Router to handle its own navigation
        return send_from_directory(app.static_folder, 'index.html')

    return app

# Expose module-level app for Gunicorn
app = create_app()

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(debug=True, host='0.0.0.0', port=port, use_reloader=False)
