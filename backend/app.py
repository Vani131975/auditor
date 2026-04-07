import os
from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
from api.upload import upload_bp
from api.auth import auth_bp

def create_app():
    # Flask app with React build in 'static'
    app = Flask(__name__, static_folder="static", static_url_path="")
    CORS(app)  # Allow frontend to communicate

    # Configure upload folder
    UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'temp_uploads')
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

    # Register API Blueprints
    app.register_blueprint(upload_bp, url_prefix='/api/v1')
    app.register_blueprint(auth_bp, url_prefix='/api/v1/auth')

    # Health check
    @app.route('/health', methods=['GET'])
    def health_check():
        return jsonify({"status": "healthy", "service": "compliance-auditor"})

    # Serve React for all other routes
    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve_react(path):
        # Skip API routes
        if path.startswith('api/'):
            return jsonify({"error": "API endpoint not found"}), 404

        # Full file path
        file_path = os.path.join(app.static_folder, path)

        # Serve static files if they exist
        if path != "" and os.path.exists(file_path):
            return send_from_directory(app.static_folder, path)

        # Otherwise, serve index.html (React handles routing)
        return send_from_directory(app.static_folder, "index.html")

    return app


if __name__ == '__main__':
    app = create_app()
    # use_reloader=False avoids PyTorch/CUDA conflicts if used
    app.run(debug=True, port=5000, use_reloader=False)