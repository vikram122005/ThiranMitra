"""
ThiranMitra Backend Configuration
Reads DB settings from .env file if present (MySQL),
falls back to SQLite for local development.
"""
import os

# ── Load .env file if it exists ─────────────────────────────────
def _load_env():
    env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '.env')
    if os.path.exists(env_path):
        with open(env_path) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    k, v = line.split('=', 1)
                    os.environ.setdefault(k.strip(), v.strip())

_load_env()

# ── Security ─────────────────────────────────────────────────────
SECRET_KEY   = os.environ.get('RS_SECRET', 'thiranmitra-super-secret-2026-change-in-prod')
JWT_EXPIRY_H = 24

# ── Database type: 'sqlite' or 'mysql' ───────────────────────────
DB_TYPE = os.environ.get('DB_TYPE', 'sqlite').lower()

# ── SQLite (UPDATED FOR RAILWAY) ─────────────────────────────────
DB_PATH = "/tmp/thiranmitra.db"   # ✅ FIXED (important for cloud)

# ── MySQL settings (used when DB_TYPE=mysql) ──────────────────────
MYSQL_HOST     = os.environ.get('MYSQL_HOST',     'localhost')
MYSQL_PORT     = int(os.environ.get('MYSQL_PORT', '3306'))
MYSQL_USER     = os.environ.get('MYSQL_USER',     'root')
MYSQL_PASSWORD = os.environ.get('MYSQL_PASSWORD', '')
MYSQL_DATABASE = os.environ.get('MYSQL_DATABASE', 'thiranmitra')

# ── CORS ──────────────────────────────────────────────────────────
ALLOWED_ORIGINS = [
    'http://localhost:8080', 'http://127.0.0.1:8080',
    'http://localhost:5500', 'http://127.0.0.1:5500',
    'http://localhost:5000', 'http://127.0.0.1:5000',
    'http://localhost:3000', 'http://127.0.0.1:3000',
    'http://localhost:4000', 'http://127.0.0.1:4000',
    'null',
]

# ── App ───────────────────────────────────────────────────────────
DEBUG = True
PORT  = 5000
HOST  = '0.0.0.0'
