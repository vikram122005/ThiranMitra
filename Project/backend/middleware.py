"""
JWT Authentication middleware — decorator for protected routes.
"""
import jwt
from functools import wraps
from flask import request, jsonify, g
from config import SECRET_KEY
from database import get_db


def token_required(f):
    """Decorator — validates Bearer JWT and injects g.user_id."""
    @wraps(f)
    def decorated(*args, **kwargs):
        auth = request.headers.get('Authorization', '')
        if not auth.startswith('Bearer '):
            return jsonify({'error': 'No token provided'}), 401
        token = auth.split(' ', 1)[1]
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token expired, please login again'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token'}), 401

        db = get_db()
        user = db.execute("SELECT id, name, email FROM users WHERE id=?",
                          (int(payload['sub']),)).fetchone()   # sub is stored as str in JWT v2
        db.close()
        if not user:
            return jsonify({'error': 'User not found'}), 401

        g.user_id = user['id']
        g.user    = user
        return f(*args, **kwargs)
    return decorated


def optional_auth(f):
    """Decorator — sets g.user_id if token is present, otherwise None."""
    @wraps(f)
    def decorated(*args, **kwargs):
        g.user_id = None
        auth = request.headers.get('Authorization', '')
        if auth.startswith('Bearer '):
            try:
                token = auth.split(' ', 1)[1]
                payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
                g.user_id = int(payload['sub'])  # sub is stored as str in JWT v2
            except Exception:
                pass
        return f(*args, **kwargs)
    return decorated
