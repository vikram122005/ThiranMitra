"""
ThiranMitra — Main Flask Application
Run: python app.py
API Base: http://localhost:5000/api
"""
import os
import sys

# Fix Windows console encoding so emoji in print() don't crash
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

# Make sure Python can find sibling modules when run from any directory
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS

import config
from database import init_db
from routes.auth    import auth_bp
from routes.jobs    import jobs_bp
from routes.profile import profile_bp
from routes.misc    import (interview_bp, placement_bp,
                             schemes_bp, dashboard_bp, support_bp,
                             resume_bp, notifications_bp)

# ── App factory ─────────────────────────────────────────────
app = Flask(__name__, static_folder='../.',
            static_url_path='')

CORS(app,
     origins=config.ALLOWED_ORIGINS + ['*'],
     supports_credentials=False,    # must be False when origins includes '*'
     allow_headers=['Content-Type', 'Authorization'],
     methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'])

# ── Register blueprints ──────────────────────────────────────
app.register_blueprint(auth_bp)
app.register_blueprint(jobs_bp)
app.register_blueprint(profile_bp)
app.register_blueprint(interview_bp)
app.register_blueprint(placement_bp)
app.register_blueprint(schemes_bp)
app.register_blueprint(dashboard_bp)
app.register_blueprint(support_bp)
app.register_blueprint(resume_bp)
app.register_blueprint(notifications_bp)


# ── Health check ─────────────────────────────────────────────
@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({
        'status':  'ok',
        'service': 'ThiranMitra API',
        'version': '1.0.0',
        'db':      config.DB_PATH
    })


# ── Serve frontend HTML files ─────────────────────────────────
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_frontend(path):
    # API calls should never reach here
    if path.startswith('api/'):
        return jsonify({'error': 'Not found'}), 404
    # Serve static files from project root
    root = os.path.join(os.path.dirname(__file__), '..')
    target = os.path.join(root, path)
    if path and os.path.exists(target) and os.path.isfile(target):
        return send_from_directory(root, path)
    # Default to index.html for SPA-style navigation
    return send_from_directory(root, 'index.html')


# ── Global error handlers ─────────────────────────────────────
@app.errorhandler(404)
def not_found(e):
    return jsonify({'error': 'Endpoint not found'}), 404


@app.errorhandler(405)
def method_not_allowed(e):
    return jsonify({'error': 'Method not allowed'}), 405


@app.errorhandler(500)
def server_error(e):
    return jsonify({'error': 'Internal server error', 'detail': str(e)}), 500


# ── Entry point ───────────────────────────────────────────────
if __name__ == '__main__':
    print("=" * 55)
    print("  [*] ThiranMitra Backend Starting...")
    print("=" * 55)
    init_db()
    print(f"\n[OK] Server running at: http://localhost:{config.PORT}")
    print(f"[OK] API base URL:       http://localhost:{config.PORT}/api")
    print(f"[OK] Frontend:           http://localhost:{config.PORT}/index.html")
    print(f"[OK] Health check:      http://localhost:{config.PORT}/api/health")
    print("\nPress Ctrl+C to stop\n")
    app.run(host=config.HOST, port=config.PORT, debug=config.DEBUG, use_reloader=False)
 