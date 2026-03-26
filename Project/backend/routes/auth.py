"""
Auth routes — /api/auth/*
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
POST /api/auth/logout  (client-side, just returns 200)
"""
import jwt
import bcrypt
import datetime
from flask import Blueprint, request, jsonify, g
from database import get_db
from middleware import token_required
from config import SECRET_KEY, JWT_EXPIRY_H

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')


def _make_token(user_id: int) -> str:
    payload = {
        'sub': str(user_id),   # PyJWT v2 requires sub to be a string
        'iat': datetime.datetime.utcnow(),
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=JWT_EXPIRY_H)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm='HS256')


def _user_dict(row) -> dict:
    return {
        'id':    row['id'],
        'name':  row['name'],
        'email': row['email'],
        'phone': row['phone'],
        'state': row['state'],
        'city':  row['city'],
    }


# ── REGISTER ────────────────────────────────────────────────
@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json(force=True) or {}
    name  = (data.get('name') or '').strip()
    email = (data.get('email') or '').strip().lower()
    pw    = (data.get('password') or '')
    phone = (data.get('phone') or '').strip()
    state = (data.get('state') or '').strip()
    city  = (data.get('city') or '').strip()

    if not name or not email or not pw:
        return jsonify({'error': 'Name, email and password are required'}), 400
    if len(pw) < 6:
        return jsonify({'error': 'Password must be at least 6 characters'}), 400

    hashed = bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()

    db = get_db()
    try:
        cur = db.execute(
            "INSERT INTO users (name, email, password_hash, phone, state, city) VALUES (?,?,?,?,?,?)",
            (name, email, hashed, phone, state, city)
        )
        db.commit()
        user_id = cur.lastrowid
        # create empty job_preferences row
        db.execute("INSERT OR IGNORE INTO job_preferences (user_id) VALUES (?)", (user_id,))
        db.commit()
        user = db.execute("SELECT * FROM users WHERE id=?", (user_id,)).fetchone()
        token = _make_token(user_id)
        return jsonify({'token': token, 'user': _user_dict(user)}), 201
    except Exception as e:
        if 'UNIQUE' in str(e):
            return jsonify({'error': 'An account with this email already exists'}), 409
        return jsonify({'error': 'Registration failed. Please try again.'}), 500
    finally:
        db.close()


# ── LOGIN ───────────────────────────────────────────────────
@auth_bp.route('/login', methods=['POST'])
def login():
    data  = request.get_json(force=True) or {}
    email = (data.get('email') or '').strip().lower()
    pw    = (data.get('password') or '')

    if not email or not pw:
        return jsonify({'error': 'Email and password are required'}), 400

    db = get_db()
    try:
        user = db.execute("SELECT * FROM users WHERE email=?", (email,)).fetchone()
        if not user:
            return jsonify({'error': 'No account found with this email'}), 404
        if not bcrypt.checkpw(pw.encode(), user['password_hash'].encode()):
            return jsonify({'error': 'Incorrect password'}), 401
        token = _make_token(user['id'])
        return jsonify({'token': token, 'user': _user_dict(user)}), 200
    finally:
        db.close()


# ── ME (current user) ───────────────────────────────────────
@auth_bp.route('/me', methods=['GET'])
@token_required
def me():
    db   = get_db()
    user = db.execute("SELECT * FROM users WHERE id=?", (g.user_id,)).fetchone()
    db.close()
    if not user:
        return jsonify({'error': 'User not found'}), 404
    return jsonify({'user': _user_dict(user)}), 200


# ── LOGOUT (client deletes token) ───────────────────────────
@auth_bp.route('/logout', methods=['POST'])
def logout():
    return jsonify({'message': 'Logged out successfully'}), 200
