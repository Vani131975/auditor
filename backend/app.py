import os
from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
from api.upload import upload_bp
from api.auth import auth_bp

def create_app():
    # Determine the path to the React build (static folder)
    static_folder = os.path.join(os.path.dirname(__file__), 'static')

    app = Flask(__name__, static_folder=static_folder, static_url_path='')
    CORS(app)  # Allow frontend to communicate

    # Configure upload folder
    UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'temp_uploads')
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

    # Register Blueprints
    app.register_blueprint(upload_bp, url_prefix='/api/v1')
    app.register_blueprint(auth_bp, url_prefix='/api/v1/auth')

    # Health check endpoint
    @app.route('/health', methods=['GET'])
    def health_check():
        return jsonify({"status": "healthy", "service": "compliance-auditor"})

    # -----------------------------------------------------------------------
    # Catch-all: serve the React SPA for any non-API route.
    # This is REQUIRED for React Router (BrowserRouter) to work on Render —
    # direct navigation to /login, /upload, etc. would otherwise 404.
    # -----------------------------------------------------------------------
    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve_react(path):
        # If the path maps to a real static file (JS, CSS, images), serve it
        static_file = os.path.join(app.static_folder, path)
        if path and os.path.exists(static_file):
            return send_from_directory(app.static_folder, path)
        # Otherwise fall through to index.html so React Router handles routing
        return send_from_directory(app.static_folder, 'index.html')

    return app


# Expose module-level `app` so Gunicorn can find it without factory syntax
app = create_app()

if __name__ == '__main__':
    app.run(debug=True, port=5000, use_reloader=False)
