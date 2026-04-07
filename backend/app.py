import os
from flask import Flask, jsonify
from flask_cors import CORS
from backend.api.upload import upload_bp
from apscheduler.schedulers.background import BackgroundScheduler

def create_app():
    app = Flask(__name__)
    CORS(app) # Allow frontend to communicate

    # Configure upload folder
    UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'temp_uploads')
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

    # Register Blueprints
    app.register_blueprint(upload_bp, url_prefix='/api/v1')
    from api.auth import auth_bp
    app.register_blueprint(auth_bp, url_prefix='/api/v1/auth')

    # Health check endpoint
    @app.route('/health', methods=['GET'])
    def health_check():
        return jsonify({"status": "healthy", "service": "compliance-auditor"})

    # Note: Scheduler for auto-deletion was removed to simplify the app.

    return app

app = create_app()

if __name__ == '__main__':
    # use_reloader=False prevents PyTorch/Transformers from crashing the server when it compiles cuda cache
    app.run(debug=True, port=5000, use_reloader=False)
