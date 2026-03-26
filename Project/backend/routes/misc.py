"""
Interview + Placement + Schemes + Dashboard + Resume + Notifications routes
"""
import json
import random
from flask import Blueprint, request, jsonify, g
from database import get_db
from middleware import token_required, optional_auth

interview_bp     = Blueprint('interview',     __name__, url_prefix='/api/interview')
placement_bp     = Blueprint('placement',     __name__, url_prefix='/api/placement')
schemes_bp       = Blueprint('schemes',       __name__, url_prefix='/api/schemes')
dashboard_bp     = Blueprint('dashboard',     __name__, url_prefix='/api/dashboard')
support_bp       = Blueprint('support',       __name__, url_prefix='/api/support')
resume_bp        = Blueprint('resume',        __name__, url_prefix='/api/resume')
notifications_bp = Blueprint('notifications', __name__, url_prefix='/api/notifications')


# ══════════════════════════════════════════════════════════════
#  INTERVIEW
# ══════════════════════════════════════════════════════════════
@interview_bp.route('/scores', methods=['GET'])
@token_required
def get_interview_scores():
    db   = get_db()
    rows = db.execute(
        "SELECT * FROM interview_scores WHERE user_id=? ORDER BY taken_at DESC LIMIT 10",
        (g.user_id,)).fetchall()
    db.close()
    result = []
    for r in rows:
        d = dict(r)
        try:
            d['feedback'] = json.loads(d['feedback'] or '[]')
        except Exception:
            d['feedback'] = []
        result.append(d)
    return jsonify({'scores': result})


@interview_bp.route('/scores', methods=['POST'])
@token_required
def save_interview_score():
    data    = request.get_json(force=True) or {}
    role    = data.get('role', '')
    readiness = data.get('readiness_pct', 0)
    confidence = data.get('confidence_pct', 0)
    clarity   = data.get('clarity_pct', 0)
    star      = data.get('star_pct', 0)
    grammar   = data.get('grammar_pct', 0)
    feedback  = json.dumps(data.get('feedback', []))

    db  = get_db()
    cur = db.execute("""
        INSERT INTO interview_scores
            (user_id, role, readiness_pct, confidence_pct, clarity_pct, star_pct, grammar_pct, feedback)
        VALUES (?,?,?,?,?,?,?,?)
    """, (g.user_id, role, readiness, confidence, clarity, star, grammar, feedback))
    db.commit()
    new = db.execute("SELECT * FROM interview_scores WHERE id=?",
                     (cur.lastrowid,)).fetchone()
    db.close()
    return jsonify({'score': dict(new)}), 201


# ══════════════════════════════════════════════════════════════
#  PLACEMENT
# ══════════════════════════════════════════════════════════════
@placement_bp.route('/scores', methods=['GET'])
@token_required
def get_placement_scores():
    db   = get_db()
    rows = db.execute(
        "SELECT * FROM placement_scores WHERE user_id=? ORDER BY taken_at DESC LIMIT 20",
        (g.user_id,)).fetchall()
    db.close()
    return jsonify({'scores': [dict(r) for r in rows]})


@placement_bp.route('/scores', methods=['POST'])
@token_required
def save_placement_score():
    data = request.get_json(force=True) or {}
    db   = get_db()
    cur  = db.execute("""
        INSERT INTO placement_scores (user_id, test_type, score_pct, correct, wrong, skipped)
        VALUES (?,?,?,?,?,?)
    """, (g.user_id, data.get('test_type', 'aptitude'),
          data.get('score_pct', 0), data.get('correct', 0),
          data.get('wrong', 0), data.get('skipped', 0)))
    db.commit()
    db.close()
    return jsonify({'id': cur.lastrowid}), 201


# ══════════════════════════════════════════════════════════════
#  SCHEMES
# ══════════════════════════════════════════════════════════════
@schemes_bp.route('', methods=['GET'])
def list_schemes():
    category  = request.args.get('category', '').strip()
    is_central = request.args.get('central', type=int)   # 1 or 0
    q          = request.args.get('q', '').strip()

    sql    = "SELECT * FROM schemes WHERE 1=1"
    params = []
    if category:
        sql += " AND category = ?"
        params.append(category)
    if is_central is not None:
        sql += " AND is_central = ?"
        params.append(is_central)
    if q:
        sql += " AND (name LIKE ? OR description LIKE ?)"
        params += [f'%{q}%', f'%{q}%']

    db   = get_db()
    rows = db.execute(sql + " ORDER BY id", params).fetchall()
    db.close()
    return jsonify({'schemes': [dict(r) for r in rows]})


@schemes_bp.route('/<int:scheme_id>', methods=['GET'])
def scheme_detail(scheme_id):
    db  = get_db()
    row = db.execute("SELECT * FROM schemes WHERE id=?", (scheme_id,)).fetchone()
    db.close()
    if not row:
        return jsonify({'error': 'Scheme not found'}), 404
    return jsonify({'scheme': dict(row)})


# ══════════════════════════════════════════════════════════════
#  DASHBOARD — AI Career Summary
# ══════════════════════════════════════════════════════════════
@dashboard_bp.route('', methods=['GET'])
@token_required
def dashboard():
    db = get_db()
    user     = db.execute("SELECT * FROM users WHERE id=?", (g.user_id,)).fetchone()
    skills   = [r['skill_name'] for r in db.execute(
        "SELECT skill_name FROM skills WHERE user_id=?", (g.user_id,)).fetchall()]
    saved    = db.execute("SELECT COUNT(*) FROM saved_jobs WHERE user_id=?",
                          (g.user_id,)).fetchone()[0]
    applied  = db.execute("SELECT COUNT(*) FROM applications WHERE user_id=?",
                          (g.user_id,)).fetchone()[0]
    last_iv  = db.execute(
        "SELECT * FROM interview_scores WHERE user_id=? ORDER BY taken_at DESC LIMIT 1",
        (g.user_id,)).fetchone()
    last_res = db.execute(
        "SELECT * FROM resumes WHERE user_id=? ORDER BY uploaded_at DESC LIMIT 1",
        (g.user_id,)).fetchone()
    last_pl  = db.execute(
        "SELECT * FROM placement_scores WHERE user_id=? ORDER BY taken_at DESC LIMIT 1",
        (g.user_id,)).fetchone()
    db.close()

    # Compute profile completeness
    completion = 20   # base for creating account
    if user['phone']:             completion += 10
    if user['city']:              completion += 10
    if skills:                    completion += 20
    if last_res:                  completion += 20
    if last_iv:                   completion += 10
    if applied > 0:               completion += 10

    # Career predictions (rule-based)
    predictions = []
    sl = [s.lower() for s in skills]
    if any(k in ' '.join(sl) for k in ['react','node','python','java','flutter','angular']):
        predictions.append({'role': 'Full Stack Developer',  'match': 87, 'icon': '💻'})
    if any(k in ' '.join(sl) for k in ['sql','python','excel','power bi','data','analytics']):
        predictions.append({'role': 'Data Analyst',         'match': 74, 'icon': '📊'})
    if any(k in ' '.join(sl) for k in ['marketing','seo','content','canva','social']):
        predictions.append({'role': 'Digital Marketer',     'match': 71, 'icon': '📣'})
    if not predictions:
        predictions = [
            {'role': 'Software Developer', 'match': 60, 'icon': '💻'},
            {'role': 'Data Entry Operator', 'match': 55, 'icon': '📋'},
        ]

    # Skill gap (top 5 in-demand skills user doesn't have)
    IN_DEMAND = ['Python', 'React.js', 'SQL', 'Machine Learning', 'AWS',
                 'Docker', 'Figma', 'TypeScript', 'Power BI', 'Git']
    skill_gap = [s for s in IN_DEMAND if s.lower() not in sl][:5]

    return jsonify({
        'user':             dict(user),
        'skills':           skills,
        'saved_jobs':       saved,
        'applied_jobs':     applied,
        'profile_completion': min(100, completion),
        'interview_score':  last_iv['readiness_pct'] if last_iv else None,
        'resume_ats':       last_res['ats_score']    if last_res else None,
        'placement_score':  last_pl['score_pct']     if last_pl else None,
        'career_predictions': predictions,
        'skill_gap':        skill_gap,
    })


# ══════════════════════════════════════════════════════════════
#  SUPPORT TICKETS
# ══════════════════════════════════════════════════════════════
@support_bp.route('', methods=['POST'])
def submit_ticket():
    data    = request.get_json(force=True) or {}
    message = (data.get('message') or '').strip()
    if not message:
        return jsonify({'error': 'Message is required'}), 400
    # Get user_id if logged in (optional)
    from middleware import optional_auth
    user_id = None
    auth    = request.headers.get('Authorization', '')
    if auth.startswith('Bearer '):
        import jwt
        from config import SECRET_KEY
        try:
            user_id = jwt.decode(auth.split()[1], SECRET_KEY,
                                 algorithms=['HS256'])['sub']
        except Exception:
            pass

    db  = get_db()
    cur = db.execute("""
        INSERT INTO support_tickets (user_id, name, email, subject, message)
        VALUES (?,?,?,?,?)
    """, (user_id, data.get('name'), data.get('email'),
          data.get('subject', 'General Inquiry'), message))
    db.commit()
    db.close()
    return jsonify({'message': 'Support ticket submitted. We\'ll respond within 24 hours.',
                    'ticket_id': cur.lastrowid}), 201


# ══════════════════════════════════════════════════════════════
#  RESUME ANALYZE  (/api/resume/analyze)
# ══════════════════════════════════════════════════════════════
@resume_bp.route('/analyze', methods=['POST'])
@optional_auth
def analyze_resume():
    """
    Accepts JSON: { text: str, filename: str, target_role: str }
    Returns ATS score, keywords found/missing, improvements.
    If logged in, also saves result to the resumes table.
    """
    data     = request.get_json(force=True) or {}
    text     = (data.get('text') or '').strip()
    filename = (data.get('filename') or 'resume.txt').strip()
    role     = (data.get('target_role') or 'General').strip()

    if not text:
        return jsonify({'error': 'Resume text is required'}), 400

    # --- Simple text-based analysis ---
    word_count = len(text.split())
    char_count = len(text)

    # ATS Score: base 50 + bonuses
    ats = 50
    action_verbs = ['developed','implemented','managed','led','built','designed',
                    'created','improved','increased','reduced','achieved','delivered']
    av_found = sum(1 for v in action_verbs if v in text.lower())
    ats += min(15, av_found * 3)          # +3 per action verb, max 15
    if word_count >= 200: ats += 10       # adequate length
    if '@' in text:       ats += 5        # has email
    if any(x in text.lower() for x in ['linkedin','github']): ats += 5
    if word_count > 700:  ats -= 5        # too long
    ats = min(95, max(30, ats + random.randint(-3, 5)))

    # Keywords by role
    ROLE_KW = {
        'data analyst':      {'found': ['python','sql','excel','tableau'], 'missing': ['machine learning','power bi','r programming','statistics']},
        'software engineer': {'found': ['python','git','agile','oop'],   'missing': ['docker','aws','system design','kubernetes']},
        'hr manager':        {'found': ['communication','leadership','ms office'], 'missing': ['hris','payroll','compliance','hr analytics']},
        'digital marketer':  {'found': ['seo','content','canva','social media'],  'missing': ['google ads','email marketing','crm','analytics']},
    }
    lrole = role.lower()
    kw = ROLE_KW.get(lrole, {
        'found':   [v for v in action_verbs if v in text.lower()][:6],
        'missing': ['machine learning','cloud computing','docker','system design','api development'][:5],
    })
    kw_found   = [k for k in (kw.get('found') or []) if k in text.lower()]
    kw_missing = [k for k in (kw.get('missing') or []) if k not in text.lower()]

    grammar_issues = max(0, random.randint(0, 3))
    improvements = [
        'Add a professional summary at the top.',
        'Quantify achievements: "Increased X by 30%" instead of "Improved X".',
        f'Add missing keywords for {role}: {', '.join(kw_missing[:3])}.',
        'Use action verbs to start every bullet point.',
        'Keep resume to 1-2 pages for better ATS parsing.',
        'Add a dedicated Skills section with specific competencies.',
    ]

    result = {
        'ats_score':       ats,
        'grammar_issues':  grammar_issues,
        'word_count':      word_count,
        'keywords_found':  kw_found,
        'keywords_missing': kw_missing,
        'improvements':    improvements,
        'grade':           'Excellent' if ats >= 85 else 'Good' if ats >= 70 else 'Average' if ats >= 55 else 'Needs Work',
    }

    # Save to DB if authenticated
    if g.user_id:
        db  = get_db()
        cur = db.execute(
            'INSERT INTO resumes (user_id, filename, ats_score, grammar_score, keywords_found, improvements) VALUES (?,?,?,?,?,?)',
            (g.user_id, filename, ats, 100 - grammar_issues * 10,
             json.dumps(kw_found), json.dumps(improvements))
        )
        db.commit()
        result['saved_id'] = cur.lastrowid
        db.close()

    return jsonify(result)


# ══════════════════════════════════════════════════════════════
#  NOTIFICATIONS  (/api/notifications)
# ══════════════════════════════════════════════════════════════
@notifications_bp.route('', methods=['GET'])
@token_required
def get_notifications():
    """
    Returns a smart notification feed based on user activity.
    """
    db = get_db()
    skills   = db.execute('SELECT COUNT(*) FROM skills WHERE user_id=?', (g.user_id,)).fetchone()[0]
    applied  = db.execute('SELECT COUNT(*) FROM applications WHERE user_id=?', (g.user_id,)).fetchone()[0]
    resumes  = db.execute('SELECT ats_score FROM resumes WHERE user_id=? ORDER BY uploaded_at DESC LIMIT 1', (g.user_id,)).fetchone()
    jobs_new = db.execute('SELECT COUNT(*) FROM jobs WHERE created_at >= date("now","-7 days")', ()).fetchone()[0]
    db.close()

    notes = []
    if jobs_new > 0:
        notes.append({'icon': '🆕', 'text': f'{jobs_new} new jobs added this week matching your profile', 'time': '1h ago',  'type': 'jobs',      'link': 'jobs.html'})
    if skills < 3:
        notes.append({'icon': '📊', 'text': 'Add at least 5 skills to unlock AI career predictions', 'time': '1d ago',  'type': 'warning',   'link': 'profile.html'})
    else:
        gap_skills = ['Docker', 'AWS', 'Machine Learning']  # simplified
        notes.append({'icon': '📊', 'text': f'Skill gap detected: learn {gap_skills[0]} & {gap_skills[1]} for better matches', 'time': '1d ago', 'type': 'warning', 'link': 'skills.html'})
    if resumes:
        if resumes['ats_score'] < 70:
            notes.append({'icon': '🎯', 'text': f'Your ATS score is {resumes["ats_score"]}% — improve it by 20+ points', 'time': '2d ago', 'type': 'resume', 'link': 'resume.html'})
        else:
            notes.append({'icon': '✅', 'text': f'Great ATS score: {resumes["ats_score"]}%! Keep applying to jobs.', 'time': '2d ago', 'type': 'success', 'link': 'jobs.html'})
    else:
        notes.append({'icon': '📄', 'text': 'Upload your resume to get an ATS score and improvement tips', 'time': '2d ago', 'type': 'resume', 'link': 'resume.html'})
    notes.append({'icon': '🏛️', 'text': 'PMKVY free skill training registration is open — apply now!', 'time': '3d ago', 'type': 'scheme', 'link': 'schemes.html'})
    if applied == 0:
        notes.append({'icon': '🚀', 'text': 'You haven\'t applied to any jobs yet — Browse 18+ opportunities!', 'time': '3d ago', 'type': 'jobs', 'link': 'jobs.html'})
    notes.append({'icon': '🎤', 'text': 'Practice 10 mock interview questions to boost your confidence', 'time': '4d ago', 'type': 'interview', 'link': 'interview.html'})

    return jsonify({'notifications': notes, 'unread': len(notes)})
