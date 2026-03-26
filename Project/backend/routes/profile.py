"""
Profile routes — /api/profile/*
GET   /api/profile
PUT   /api/profile           — update personal info
GET   /api/profile/education
POST  /api/profile/education
DELETE /api/profile/education/<id>
GET   /api/profile/experience
POST  /api/profile/experience
DELETE /api/profile/experience/<id>
GET   /api/profile/skills
POST  /api/profile/skills
DELETE /api/profile/skills/<id>
GET   /api/profile/certificates
POST  /api/profile/certificates
DELETE /api/profile/certificates/<id>
GET   /api/profile/preferences
PUT   /api/profile/preferences
GET   /api/profile/stats       — dashboard summary stats
"""
from flask import Blueprint, request, jsonify, g
from database import get_db
from middleware import token_required

profile_bp = Blueprint('profile', __name__, url_prefix='/api/profile')


# ── FULL PROFILE ─────────────────────────────────────────────
@profile_bp.route('', methods=['GET'])
@token_required
def get_profile():
    db   = get_db()
    user = db.execute("SELECT * FROM users WHERE id=?", (g.user_id,)).fetchone()
    edu  = db.execute("SELECT * FROM education WHERE user_id=? ORDER BY year_end DESC",
                      (g.user_id,)).fetchall()
    exp  = db.execute("SELECT * FROM experience WHERE user_id=? ORDER BY created_at DESC",
                      (g.user_id,)).fetchall()
    sk   = db.execute("SELECT * FROM skills WHERE user_id=? ORDER BY skill_name",
                      (g.user_id,)).fetchall()
    cert = db.execute("SELECT * FROM certificates WHERE user_id=? ORDER BY year DESC",
                      (g.user_id,)).fetchall()
    pref = db.execute("SELECT * FROM job_preferences WHERE user_id=?",
                      (g.user_id,)).fetchone()
    db.close()

    return jsonify({
        'user':         dict(user) if user else {},
        'education':    [dict(r) for r in edu],
        'experience':   [dict(r) for r in exp],
        'skills':       [dict(r) for r in sk],
        'certificates': [dict(r) for r in cert],
        'preferences':  dict(pref) if pref else {},
    })


@profile_bp.route('', methods=['PUT'])
@token_required
def update_profile():
    data = request.get_json(force=True) or {}
    allowed = ['name', 'phone', 'gender', 'category', 'state', 'city', 'dob', 'address']
    sets    = {k: v for k, v in data.items() if k in allowed}
    if not sets:
        return jsonify({'error': 'No valid fields provided'}), 400

    sql    = "UPDATE users SET " + ", ".join(f"{k}=?" for k in sets)
    sql   += ", updated_at=datetime('now') WHERE id=?"
    vals   = list(sets.values()) + [g.user_id]

    db = get_db()
    db.execute(sql, vals)
    db.commit()
    updated = db.execute("SELECT * FROM users WHERE id=?", (g.user_id,)).fetchone()
    db.close()
    return jsonify({'user': dict(updated)})


# ── EDUCATION ────────────────────────────────────────────────
@profile_bp.route('/education', methods=['GET'])
@token_required
def get_education():
    db   = get_db()
    rows = db.execute("SELECT * FROM education WHERE user_id=? ORDER BY year_end DESC",
                      (g.user_id,)).fetchall()
    db.close()
    return jsonify({'education': [dict(r) for r in rows]})


@profile_bp.route('/education', methods=['POST'])
@token_required
def add_education():
    data = request.get_json(force=True) or {}
    degree = (data.get('degree') or '').strip()
    inst   = (data.get('institution') or '').strip()
    if not degree or not inst:
        return jsonify({'error': 'Degree and institution are required'}), 400
    db  = get_db()
    cur = db.execute(
        "INSERT INTO education (user_id, degree, institution, year_start, year_end, grade) VALUES (?,?,?,?,?,?)",
        (g.user_id, degree, inst, data.get('year_start'), data.get('year_end'), data.get('grade'))
    )
    db.commit()
    new = db.execute("SELECT * FROM education WHERE id=?", (cur.lastrowid,)).fetchone()
    db.close()
    return jsonify({'education': dict(new)}), 201


@profile_bp.route('/education/<int:edu_id>', methods=['DELETE'])
@token_required
def delete_education(edu_id):
    db = get_db()
    db.execute("DELETE FROM education WHERE id=? AND user_id=?", (edu_id, g.user_id))
    db.commit()
    db.close()
    return jsonify({'message': 'Deleted'}), 200


# ── EXPERIENCE ───────────────────────────────────────────────
@profile_bp.route('/experience', methods=['GET'])
@token_required
def get_experience():
    db   = get_db()
    rows = db.execute("SELECT * FROM experience WHERE user_id=? ORDER BY created_at DESC",
                      (g.user_id,)).fetchall()
    db.close()
    return jsonify({'experience': [dict(r) for r in rows]})


@profile_bp.route('/experience', methods=['POST'])
@token_required
def add_experience():
    data  = request.get_json(force=True) or {}
    title = (data.get('title') or '').strip()
    comp  = (data.get('company') or '').strip()
    if not title or not comp:
        return jsonify({'error': 'Title and company are required'}), 400
    db  = get_db()
    cur = db.execute(
        "INSERT INTO experience (user_id, title, company, period, description) VALUES (?,?,?,?,?)",
        (g.user_id, title, comp, data.get('period'), data.get('description'))
    )
    db.commit()
    new = db.execute("SELECT * FROM experience WHERE id=?", (cur.lastrowid,)).fetchone()
    db.close()
    return jsonify({'experience': dict(new)}), 201


@profile_bp.route('/experience/<int:exp_id>', methods=['DELETE'])
@token_required
def delete_experience(exp_id):
    db = get_db()
    db.execute("DELETE FROM experience WHERE id=? AND user_id=?", (exp_id, g.user_id))
    db.commit()
    db.close()
    return jsonify({'message': 'Deleted'}), 200


# ── SKILLS ───────────────────────────────────────────────────
@profile_bp.route('/skills', methods=['GET'])
@token_required
def get_skills():
    db   = get_db()
    rows = db.execute("SELECT * FROM skills WHERE user_id=? ORDER BY skill_name",
                      (g.user_id,)).fetchall()
    db.close()
    return jsonify({'skills': [dict(r) for r in rows]})


@profile_bp.route('/skills', methods=['POST'])
@token_required
def add_skills():
    data      = request.get_json(force=True) or {}
    skill_names = data.get('skills', [])     # can send array
    if isinstance(skill_names, str):
        skill_names = [skill_names]
    level = data.get('level', 'Intermediate')
    db    = get_db()
    added = []
    for s in skill_names:
        s = s.strip()
        if not s:
            continue
        try:
            cur = db.execute(
                "INSERT INTO skills (user_id, skill_name, level) VALUES (?,?,?)",
                (g.user_id, s, level)
            )
            added.append({'id': cur.lastrowid, 'skill_name': s, 'level': level})
        except Exception:
            pass  # UNIQUE constraint — already exists
    db.commit()
    db.close()
    return jsonify({'added': added}), 201


@profile_bp.route('/skills/<int:skill_id>', methods=['DELETE'])
@token_required
def delete_skill(skill_id):
    db = get_db()
    db.execute("DELETE FROM skills WHERE id=? AND user_id=?", (skill_id, g.user_id))
    db.commit()
    db.close()
    return jsonify({'message': 'Deleted'}), 200


# ── CERTIFICATES ────────────────────────────────────────────
@profile_bp.route('/certificates', methods=['GET'])
@token_required
def get_certs():
    db   = get_db()
    rows = db.execute("SELECT * FROM certificates WHERE user_id=? ORDER BY year DESC",
                      (g.user_id,)).fetchall()
    db.close()
    return jsonify({'certificates': [dict(r) for r in rows]})


@profile_bp.route('/certificates', methods=['POST'])
@token_required
def add_cert():
    data = request.get_json(force=True) or {}
    name = (data.get('name') or '').strip()
    if not name:
        return jsonify({'error': 'Certificate name is required'}), 400
    db  = get_db()
    cur = db.execute(
        "INSERT INTO certificates (user_id, name, issuer, year, cert_url) VALUES (?,?,?,?,?)",
        (g.user_id, name, data.get('issuer'), data.get('year'), data.get('cert_url'))
    )
    db.commit()
    new = db.execute("SELECT * FROM certificates WHERE id=?", (cur.lastrowid,)).fetchone()
    db.close()
    return jsonify({'certificate': dict(new)}), 201


@profile_bp.route('/certificates/<int:cert_id>', methods=['DELETE'])
@token_required
def delete_cert(cert_id):
    db = get_db()
    db.execute("DELETE FROM certificates WHERE id=? AND user_id=?", (cert_id, g.user_id))
    db.commit()
    db.close()
    return jsonify({'message': 'Deleted'}), 200


# ── JOB PREFERENCES ─────────────────────────────────────────
@profile_bp.route('/preferences', methods=['GET'])
@token_required
def get_preferences():
    db   = get_db()
    pref = db.execute("SELECT * FROM job_preferences WHERE user_id=?",
                      (g.user_id,)).fetchone()
    db.close()
    return jsonify({'preferences': dict(pref) if pref else {}})


@profile_bp.route('/preferences', methods=['PUT'])
@token_required
def update_preferences():
    data    = request.get_json(force=True) or {}
    allowed = ['preferred_role', 'preferred_city', 'salary_range', 'job_type',
               'work_mode', 'notice_period']
    sets    = {k: v for k, v in data.items() if k in allowed}
    db = get_db()
    db.execute("INSERT OR IGNORE INTO job_preferences (user_id) VALUES (?)", (g.user_id,))
    if sets:
        sql  = "UPDATE job_preferences SET " + ", ".join(f"{k}=?" for k in sets)
        sql += ", updated_at=datetime('now') WHERE user_id=?"
        db.execute(sql, list(sets.values()) + [g.user_id])
    db.commit()
    pref = db.execute("SELECT * FROM job_preferences WHERE user_id=?",
                      (g.user_id,)).fetchone()
    db.close()
    return jsonify({'preferences': dict(pref)})


# ── DASHBOARD STATS ─────────────────────────────────────────
@profile_bp.route('/stats', methods=['GET'])
@token_required
def stats():
    db = get_db()
    saved_count   = db.execute("SELECT COUNT(*) FROM saved_jobs WHERE user_id=?",
                               (g.user_id,)).fetchone()[0]
    applied_count = db.execute("SELECT COUNT(*) FROM applications WHERE user_id=?",
                               (g.user_id,)).fetchone()[0]
    skills_count  = db.execute("SELECT COUNT(*) FROM skills WHERE user_id=?",
                               (g.user_id,)).fetchone()[0]
    last_interview = db.execute(
        "SELECT readiness_pct FROM interview_scores WHERE user_id=? ORDER BY taken_at DESC LIMIT 1",
        (g.user_id,)).fetchone()
    last_resume    = db.execute(
        "SELECT ats_score FROM resumes WHERE user_id=? ORDER BY uploaded_at DESC LIMIT 1",
        (g.user_id,)).fetchone()
    db.close()
    return jsonify({
        'saved_jobs':       saved_count,
        'applied_jobs':     applied_count,
        'skills':           skills_count,
        'interview_score':  last_interview['readiness_pct'] if last_interview else None,
        'resume_ats':       last_resume['ats_score'] if last_resume else None,
    })


# ── RESUMES ──────────────────────────────────────────────────
@profile_bp.route('/resumes', methods=['GET'])
@token_required
def get_resumes():
    db   = get_db()
    rows = db.execute(
        "SELECT * FROM resumes WHERE user_id=? ORDER BY uploaded_at DESC LIMIT 10",
        (g.user_id,)
    ).fetchall()
    db.close()
    return jsonify({'resumes': [dict(r) for r in rows]})


@profile_bp.route('/resumes', methods=['POST'])
@token_required
def add_resume():
    data      = request.get_json(force=True) or {}
    filename  = (data.get('filename') or 'resume.txt').strip()
    ats_score = int(data.get('ats_score', 0))
    grammar   = int(data.get('grammar_score', 0))
    keywords  = data.get('keywords_found', '')
    improv    = data.get('improvements', '')

    db  = get_db()
    cur = db.execute(
        """INSERT INTO resumes
           (user_id, filename, ats_score, grammar_score, keywords_found, improvements)
           VALUES (?,?,?,?,?,?)""",
        (g.user_id, filename, ats_score, grammar,
         keywords if isinstance(keywords, str) else str(keywords),
         improv   if isinstance(improv,   str) else str(improv))
    )
    db.commit()
    new = db.execute("SELECT * FROM resumes WHERE id=?", (cur.lastrowid,)).fetchone()
    db.close()
    return jsonify({'resume': dict(new)}), 201


