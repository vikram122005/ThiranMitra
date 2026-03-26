import sqlite3, os

db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'thiranmitra.db')
con = sqlite3.connect(db_path)
con.row_factory = sqlite3.Row

print('=' * 62)
print('   ThiranMitra DATABASE — LIVE INSPECTION')
print('=' * 62)
print(f'  File: {db_path}')
print(f'  Size: {os.path.getsize(db_path):,} bytes ({os.path.getsize(db_path)//1024} KB)')
print()

# All tables
sql = "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
tables = con.execute(sql).fetchall()
print(f'ALL TABLES ({len(tables)} total):')
for t in tables:
    nm = t['name']
    count = con.execute(f'SELECT COUNT(*) FROM {nm}').fetchone()[0]
    print(f'  [{count:>3} rows]  {nm}')

print()
print('REGISTERED USERS:')
users = con.execute('SELECT id,name,email,city,state,created_at FROM users').fetchall()
if users:
    for u in users:
        print(f'  #{u["id"]}  {u["name"]}  |  {u["email"]}  |  {u["city"]}, {u["state"]}  |  Joined: {u["created_at"]}')
else:
    print('  (none yet)')

print()
print('JOBS IN DATABASE (first 5 of total):')
jobs = con.execute(
    'SELECT id,title,company,location,salary_min,salary_max,job_type FROM jobs LIMIT 5'
).fetchall()
for j in jobs:
    print(f'  #{j["id"]}  {j["title"]}  @  {j["company"]}  |  {j["location"]}  |  Rs.{j["salary_min"]}-{j["salary_max"]}  |  {j["job_type"]}')
total_jobs = con.execute('SELECT COUNT(*) FROM jobs').fetchone()[0]
print(f'  >>> TOTAL: {total_jobs} jobs in database')

print()
print('GOVT SCHEMES (first 5 of total):')
schemes = con.execute('SELECT id,name,category,ministry FROM schemes LIMIT 5').fetchall()
for s in schemes:
    print(f'  #{s["id"]}  {s["name"]}  |  {s["category"]}  |  {s["ministry"]}')
total_sc = con.execute('SELECT COUNT(*) FROM schemes').fetchone()[0]
print(f'  >>> TOTAL: {total_sc} schemes in database')

print()
print('USER SKILLS:')
skills = con.execute(
    'SELECT s.skill_name, u.name FROM skills s JOIN users u ON u.id=s.user_id'
).fetchall()
if skills:
    for sk in skills:
        print(f'  {sk["skill_name"]}  (user: {sk["name"]})')
else:
    print('  (none yet)')

print()
print('APPLICATIONS:')
apps = con.execute(
    '''SELECT a.id, u.name, j.title, a.status
       FROM applications a
       JOIN users u ON u.id=a.user_id
       JOIN jobs  j ON j.id=a.job_id'''
).fetchall()
if apps:
    for a in apps:
        print(f'  #{a["id"]}  {a["name"]}  applied to: {a["title"]}  [status: {a["status"]}]')
else:
    print('  (none yet)')

print()
print('INTERVIEW SCORES:')
iv = con.execute(
    'SELECT i.id, u.name, i.role, i.readiness_pct, i.taken_at '
    'FROM interview_scores i JOIN users u ON u.id=i.user_id'
).fetchall()
if iv:
    for i in iv:
        print(f'  #{i["id"]}  {i["name"]}  |  {i["role"]}  |  {i["readiness_pct"]}%  |  {i["taken_at"]}')
else:
    print('  (none yet - will populate when users take mock interviews)')

print()
print('RESUME ANALYSES:')
resumes = con.execute(
    'SELECT r.id, u.name, r.ats_score, r.uploaded_at '
    'FROM resumes r JOIN users u ON u.id=r.user_id'
).fetchall()
if resumes:
    for r in resumes:
        print(f'  #{r["id"]}  {r["name"]}  |  ATS: {r["ats_score"]}%  |  {r["uploaded_at"]}')
else:
    print('  (none yet - will populate when users analyze resumes)')

con.close()
print()
print('=' * 62)
print('  YES - DATABASE IS CONNECTED AND ACTIVE!')
print('=' * 62)
