"""
Jobs routes — /api/jobs/*
GET  /api/jobs          — list jobs (filter/search)
GET  /api/jobs/<id>     — single job detail
POST /api/jobs/<id>/save    — save a job (auth)
DELETE /api/jobs/<id>/save  — unsave (auth)
GET  /api/jobs/saved        — user's saved jobs (auth)
POST /api/jobs/<id>/apply   — apply to job (auth)
GET  /api/jobs/applied      — user's applications (auth)
GET  /api/jobs/recommended  — AI recommended jobs (auth)
"""
import json
from flask import Blueprint, request, jsonify, g
from database import get_db
from middleware import token_required, optional_auth

jobs_bp = Blueprint('jobs', __name__, url_prefix='/api/jobs')


def _job_dict(row, saved_ids=None, applied_ids=None) -> dict:
    skills = []
    try:
        skills = json.loads(row['skills_required'] or '[]')
    except Exception:
        pass
    d = dict(row)
    d['skills_required'] = skills
    if saved_ids is not None:
        d['is_saved']    = row['id'] in saved_ids
    if applied_ids is not None:
        d['is_applied']  = row['id'] in applied_ids
    return d


# ── LIST JOBS ────────────────────────────────────────────────
@jobs_bp.route('', methods=['GET'])
@optional_auth
def list_jobs():
    q        = request.args.get('q', '').strip()
    location = request.args.get('location', '').strip()
    job_type = request.args.get('type', '').strip()
    work_mode = request.args.get('mode', '').strip()
    category  = request.args.get('category', '').strip()
    experience = request.args.get('exp', '').strip()
    salary_min = request.args.get('salary_min', type=int)
    page     = max(1, request.args.get('page', 1, type=int))
    per_page = min(50, request.args.get('per_page', 20, type=int))

    sql    = "SELECT * FROM jobs WHERE 1=1"
    params = []

    if q:
        sql += " AND (title LIKE ? OR company LIKE ? OR description LIKE ?)"
        params += [f'%{q}%', f'%{q}%', f'%{q}%']
    if location:
        sql += " AND (location LIKE ? OR state LIKE ?)"
        params += [f'%{location}%', f'%{location}%']
    if job_type:
        sql += " AND job_type = ?"
        params.append(job_type)
    if work_mode:
        sql += " AND work_mode = ?"
        params.append(work_mode)
    if category:
        sql += " AND category = ?"
        params.append(category)
    if experience:
        sql += " AND experience = ?"
        params.append(experience)
    if salary_min:
        sql += " AND salary_min >= ?"
        params.append(salary_min)

    db = get_db()
    total = db.execute(f"SELECT COUNT(*) FROM ({sql})", params).fetchone()[0]

    sql += " ORDER BY posted_at DESC LIMIT ? OFFSET ?"
    params += [per_page, (page - 1) * per_page]
    rows = db.execute(sql, params).fetchall()

    saved_ids   = set()
    applied_ids = set()
    if g.user_id:
        saved_ids   = {r['job_id'] for r in db.execute(
            "SELECT job_id FROM saved_jobs WHERE user_id=?", (g.user_id,)).fetchall()}
        applied_ids = {r['job_id'] for r in db.execute(
            "SELECT job_id FROM applications WHERE user_id=?", (g.user_id,)).fetchall()}
    db.close()

    return jsonify({
        'jobs': [_job_dict(r, saved_ids, applied_ids) for r in rows],
        'total': total,
        'page': page,
        'per_page': per_page,
        'pages': (total + per_page - 1) // per_page
    })


# ── JOB DETAIL ───────────────────────────────────────────────
@jobs_bp.route('/<int:job_id>', methods=['GET'])
@optional_auth
def job_detail(job_id):
    db  = get_db()
    row = db.execute("SELECT * FROM jobs WHERE id=?", (job_id,)).fetchone()
    db.close()
    if not row:
        return jsonify({'error': 'Job not found'}), 404
    return jsonify({'job': _job_dict(row)})


# ── SAVE A JOB ───────────────────────────────────────────────
@jobs_bp.route('/<int:job_id>/save', methods=['POST'])
@token_required
def save_job(job_id):
    db = get_db()
    db.execute("INSERT OR IGNORE INTO saved_jobs (user_id, job_id) VALUES (?,?)",
               (g.user_id, job_id))
    db.commit()
    db.close()
    return jsonify({'message': 'Job saved'}), 201


@jobs_bp.route('/<int:job_id>/save', methods=['DELETE'])
@token_required
def unsave_job(job_id):
    db = get_db()
    db.execute("DELETE FROM saved_jobs WHERE user_id=? AND job_id=?",
               (g.user_id, job_id))
    db.commit()
    db.close()
    return jsonify({'message': 'Job removed from saved'}), 200


# ── SAVED JOBS ───────────────────────────────────────────────
@jobs_bp.route('/saved', methods=['GET'])
@token_required
def saved_jobs():
    db   = get_db()
    rows = db.execute("""
        SELECT j.* FROM jobs j
        JOIN saved_jobs s ON s.job_id = j.id
        WHERE s.user_id = ?
        ORDER BY s.saved_at DESC
    """, (g.user_id,)).fetchall()
    db.close()
    return jsonify({'jobs': [_job_dict(r) for r in rows]})


# ── APPLY TO JOB ────────────────────────────────────────────
@jobs_bp.route('/<int:job_id>/apply', methods=['POST'])
@token_required
def apply_job(job_id):
    data = request.get_json(force=True) or {}
    cover = data.get('cover_note', '')
    db = get_db()
    try:
        db.execute("""
            INSERT INTO applications (user_id, job_id, cover_note)
            VALUES (?,?,?)
        """, (g.user_id, job_id, cover))
        db.commit()
        return jsonify({'message': 'Application submitted successfully!'}), 201
    except Exception as e:
        if 'UNIQUE' in str(e):
            return jsonify({'error': 'You have already applied to this job'}), 409
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()


# ── MY APPLICATIONS ─────────────────────────────────────────
@jobs_bp.route('/applied', methods=['GET'])
@token_required
def applied_jobs():
    db   = get_db()
    rows = db.execute("""
        SELECT j.*, a.status, a.applied_at, a.cover_note
        FROM jobs j
        JOIN applications a ON a.job_id = j.id
        WHERE a.user_id = ?
        ORDER BY a.applied_at DESC
    """, (g.user_id,)).fetchall()
    db.close()
    return jsonify({'applications': [dict(r) for r in rows]})


# ── AI RECOMMENDED JOBS ──────────────────────────────────────
@jobs_bp.route('/recommended', methods=['GET'])
@token_required
def recommended_jobs():
    db = get_db()
    # Get user's skills
    skills = [r['skill_name'].lower() for r in db.execute(
        "SELECT skill_name FROM skills WHERE user_id=?", (g.user_id,)).fetchall()]
    prefs  = db.execute("SELECT * FROM job_preferences WHERE user_id=?",
                        (g.user_id,)).fetchone()

    # Simple scoring: match skills in skills_required JSON
    all_jobs = db.execute("SELECT * FROM jobs ORDER BY posted_at DESC LIMIT 100").fetchall()
    db.close()

    scored = []
    for j in all_jobs:
        score = 0
        try:
            req = [s.lower() for s in json.loads(j['skills_required'] or '[]')]
        except Exception:
            req = []
        for sk in skills:
            if any(sk in r for r in req):
                score += 10
        if prefs:
            if prefs['preferred_city'] and prefs['preferred_city'].lower() in j['location'].lower():
                score += 15
            if prefs['job_type'] and prefs['job_type'] == j['job_type']:
                score += 8
            if prefs['work_mode'] and prefs['work_mode'] == j['work_mode']:
                score += 5
        scored.append((score, j))

    scored.sort(key=lambda x: x[0], reverse=True)
    top = [_job_dict(j) for _, j in scored[:10]]
    return jsonify({'jobs': top})
