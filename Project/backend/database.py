"""
ThiranMitra — Database layer
Supports both SQLite (default) and MySQL.
Set DB_TYPE=mysql in .env to switch to MySQL.
"""
import sqlite3
import config

# ── MySQL support ─────────────────────────────────────────────────────────
_MYSQL_AVAILABLE = False
if config.DB_TYPE == 'mysql':
    try:
        import pymysql
        import pymysql.cursors
        _MYSQL_AVAILABLE = True
    except ImportError:
        print("[WARNING] pymysql not installed. Falling back to SQLite.")
        print("          Run: pip install pymysql cryptography")


def get_db():
    """Return a database connection.
    - MySQL  → when DB_TYPE=mysql in .env
    - SQLite → default / fallback
    Connection is always returned with dict-like row access.
    """
    if config.DB_TYPE == 'mysql' and _MYSQL_AVAILABLE:
        con = pymysql.connect(
            host=config.MYSQL_HOST,
            port=config.MYSQL_PORT,
            user=config.MYSQL_USER,
            password=config.MYSQL_PASSWORD,
            database=config.MYSQL_DATABASE,
            charset='utf8mb4',
            cursorclass=pymysql.cursors.DictCursor,
            autocommit=False,
        )
        # Wrap so it behaves like sqlite3 (has .execute, .commit, .close)
        return _MySQLWrapper(con)
    else:
        con = sqlite3.connect(config.DB_PATH)
        con.row_factory = sqlite3.Row
        con.execute('PRAGMA journal_mode=WAL')
        con.execute('PRAGMA foreign_keys=ON')
        return con


class _MySQLWrapper:
    """Thin wrapper so MySQL behaves like sqlite3 for our code."""
    def __init__(self, con):
        self._con = con
        self._cur = con.cursor()

    def execute(self, sql, params=()):
        """Execute a query. Converts SQLite ? placeholders → MySQL %s."""
        sql = sql.replace('?', '%s')
        self._cur.execute(sql, params)
        return self   # return self so routes can do con.execute(...).fetchone()

    def executemany(self, sql, seq):
        sql = sql.replace('?', '%s')
        self._cur.executemany(sql, seq)
        return self

    def executescript(self, sql):
        """SQLite compat: run multiple statements (used in init_db only)."""
        for stmt in sql.split(';'):
            stmt = stmt.strip()
            if stmt and not stmt.startswith('--') and not stmt.startswith('PRAGMA'):
                try:
                    self._cur.execute(stmt)
                except Exception:
                    pass  # ignore CREATE IF NOT EXISTS conflicts
        self._con.commit()

    def fetchone(self):
        return self._cur.fetchone()

    def fetchall(self):
        return self._cur.fetchall()

    @property
    def lastrowid(self):
        return self._cur.lastrowid

    def commit(self):
        self._con.commit()

    def close(self):
        try:
            self._cur.close()
            self._con.close()
        except Exception:
            pass

    def __enter__(self):
        return self

    def __exit__(self, *args):
        self.close()


# Keep backward-compat alias
DB_PATH = config.DB_PATH


# ──────────────────────────────────────────────────────────────
#  SCHEMA
# ──────────────────────────────────────────────────────────────
SCHEMA = """
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

-- ── USERS ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    name            TEXT    NOT NULL,
    email           TEXT    NOT NULL UNIQUE,
    password_hash   TEXT    NOT NULL,
    phone           TEXT,
    gender          TEXT,
    category        TEXT,                      -- General/OBC/SC-ST/EWS
    state           TEXT,
    city            TEXT,
    dob             TEXT,
    address         TEXT,
    avatar_url      TEXT,
    is_verified     INTEGER DEFAULT 0,
    created_at      TEXT    DEFAULT (datetime('now')),
    updated_at      TEXT    DEFAULT (datetime('now'))
);

-- ── EDUCATION ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS education (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    degree      TEXT    NOT NULL,
    institution TEXT    NOT NULL,
    year_start  TEXT,
    year_end    TEXT,
    grade       TEXT,
    created_at  TEXT    DEFAULT (datetime('now'))
);

-- ── WORK EXPERIENCE ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS experience (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title       TEXT    NOT NULL,
    company     TEXT    NOT NULL,
    period      TEXT,
    description TEXT,
    created_at  TEXT    DEFAULT (datetime('now'))
);

-- ── SKILLS ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS skills (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    skill_name  TEXT    NOT NULL,
    level       TEXT    DEFAULT 'Intermediate',   -- Beginner/Intermediate/Expert
    created_at  TEXT    DEFAULT (datetime('now')),
    UNIQUE(user_id, skill_name)
);

-- ── CERTIFICATES ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS certificates (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name        TEXT    NOT NULL,
    issuer      TEXT,
    year        TEXT,
    cert_url    TEXT,
    created_at  TEXT    DEFAULT (datetime('now'))
);

-- ── JOB PREFERENCES ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS job_preferences (
    user_id          INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    preferred_role   TEXT,
    preferred_city   TEXT,
    salary_range     TEXT,
    job_type         TEXT,    -- Full-time/Part-time/Freelance/Govt
    work_mode        TEXT,    -- On-site/Hybrid/Remote
    notice_period    TEXT,
    updated_at       TEXT DEFAULT (datetime('now'))
);

-- ── RESUME ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS resumes (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    filename        TEXT    NOT NULL,
    ats_score       INTEGER,
    grammar_score   INTEGER,
    keywords_found  TEXT,    -- JSON array
    improvements    TEXT,    -- JSON array
    uploaded_at     TEXT DEFAULT (datetime('now'))
);

-- ── JOBS ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS jobs (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    title           TEXT    NOT NULL,
    company         TEXT    NOT NULL,
    location        TEXT    NOT NULL,
    state           TEXT,
    salary_min      INTEGER,
    salary_max      INTEGER,
    job_type        TEXT,    -- Full-time/Part-time/Govt/Internship
    work_mode       TEXT,    -- On-site/Hybrid/Remote
    category        TEXT,    -- Tech/Finance/Healthcare/etc
    experience      TEXT,    -- Fresher/1-3yrs/3-6yrs/6+yrs
    description     TEXT,
    skills_required TEXT,    -- JSON array
    is_verified     INTEGER DEFAULT 1,
    posted_at       TEXT    DEFAULT (datetime('now')),
    expires_at      TEXT
);

-- ── SAVED JOBS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS saved_jobs (
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    job_id      INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    saved_at    TEXT    DEFAULT (datetime('now')),
    PRIMARY KEY (user_id, job_id)
);

-- ── JOB APPLICATIONS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS applications (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    job_id      INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    status      TEXT    DEFAULT 'applied',  -- applied/viewed/shortlisted/rejected/hired
    cover_note  TEXT,
    applied_at  TEXT    DEFAULT (datetime('now')),
    updated_at  TEXT    DEFAULT (datetime('now')),
    UNIQUE(user_id, job_id)
);

-- ── INTERVIEW SCORES ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS interview_scores (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role            TEXT,
    readiness_pct   INTEGER,
    confidence_pct  INTEGER,
    clarity_pct     INTEGER,
    star_pct        INTEGER,
    grammar_pct     INTEGER,
    feedback        TEXT,    -- JSON array
    taken_at        TEXT DEFAULT (datetime('now'))
);

-- ── PLACEMENT TEST SCORES ────────────────────────────────────
CREATE TABLE IF NOT EXISTS placement_scores (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    test_type   TEXT,    -- aptitude/coding/hr
    score_pct   INTEGER,
    correct     INTEGER,
    wrong       INTEGER,
    skipped     INTEGER,
    taken_at    TEXT DEFAULT (datetime('now'))
);

-- ── GOVERNMENT SCHEMES ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS schemes (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT    NOT NULL,
    ministry    TEXT,
    category    TEXT,    -- skill/loan/women/rural/startup
    description TEXT,
    benefit     TEXT,
    eligibility TEXT,
    apply_url   TEXT,
    is_central  INTEGER DEFAULT 1,   -- 1=central, 0=state
    state       TEXT                 -- null if central
);

-- ── CONTACT / SUPPORT TICKETS ────────────────────────────────
CREATE TABLE IF NOT EXISTS support_tickets (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER REFERENCES users(id),
    name        TEXT,
    email       TEXT,
    subject     TEXT,
    message     TEXT    NOT NULL,
    status      TEXT    DEFAULT 'open',
    created_at  TEXT    DEFAULT (datetime('now'))
);
"""


def get_db():
    """Return a thread-safe SQLite connection."""
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row   # rows behave like dicts
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db():
    """Create all tables if they don't exist and seed sample data."""
    conn = get_db()
    conn.executescript(SCHEMA)
    conn.commit()
    _seed_jobs(conn)
    _seed_schemes(conn)
    conn.close()
    print(f"✅ Database initialised at: {DB_PATH}")


# ──────────────────────────────────────────────────────────────
#  SEED DATA — Jobs
# ──────────────────────────────────────────────────────────────
def _seed_jobs(conn):
    existing = conn.execute("SELECT COUNT(*) FROM jobs").fetchone()[0]
    if existing > 0:
        return

    jobs = [
        ("Full Stack Developer", "TechNova Pvt. Ltd.", "Bengaluru", "Karnataka",
         600000, 1200000, "Full-time", "Hybrid", "Tech", "1-3 yrs",
         "Build and maintain web applications using React and Node.js.",
         '["React","Node.js","MongoDB","REST API"]'),
        ("Data Analyst", "FinVeda Analytics", "Mumbai", "Maharashtra",
         500000, 900000, "Full-time", "On-site", "Finance", "Fresher",
         "Analyse financial data and create dashboards using Power BI.",
         '["Python","SQL","Power BI","Excel"]'),
        ("Digital Marketing Executive", "BrandSphere India", "Delhi", "Delhi",
         300000, 550000, "Full-time", "On-site", "Marketing", "Fresher",
         "Manage social media campaigns, SEO, and content strategy.",
         '["SEO","Google Ads","Content Writing","Analytics"]'),
        ("Government Bank Officer (IBPS PO)", "Bank of Maharashtra", "Pune", "Maharashtra",
         500000, 700000, "Govt", "On-site", "Banking", "Fresher",
         "Probationary Officer role at Bank of Maharashtra via IBPS PO exam.",
         '["Aptitude","Reasoning","Banking Awareness","English"]'),
        ("Machine Learning Engineer", "AIQuant Labs", "Hyderabad", "Telangana",
         900000, 1800000, "Full-time", "Remote", "Tech", "3-6 yrs",
         "Design and deploy ML models in production environments.",
         '["Python","TensorFlow","PyTorch","MLOps","AWS"]'),
        ("HR Executive", "PeopleFirst HR Services", "Jaipur", "Rajasthan",
         280000, 450000, "Full-time", "On-site", "HR", "Fresher",
         "Recruitment, onboarding, payroll management for mid-size firms.",
         '["Recruitment","Excel","Communication","HRMS"]'),
        ("Tiffin Delivery Driver", "DabbaMate Services", "Pune", "Maharashtra",
         180000, 240000, "Full-time", "On-site", "Logistics", "Fresher",
         "Deliver home-cooked tiffins across Pune city. Vehicle provided.",
         '["Driving License","Navigation","Punctuality"]'),
        ("ITI Electrician (Factory)", "Bharat Steel Works", "Nagpur", "Maharashtra",
         220000, 320000, "Full-time", "On-site", "Manufacturing", "1-3 yrs",
         "Maintain electrical systems at manufacturing plant. ITI required.",
         '["ITI Electrician","Wiring","Safety Protocols"]'),
        ("Rural BPO Agent (Hindi)", "GramConnect BPO", "Bhopal", "Madhya Pradesh",
         150000, 220000, "Full-time", "On-site", "BPO", "Fresher",
         "Handle customer calls in Hindi. Work from district office.",
         '["Hindi Communication","Computer Basics","Customer Service"]'),
        ("React Native Developer", "AppForge Studios", "Remote", "Pan India",
         700000, 1400000, "Full-time", "Remote", "Tech", "1-3 yrs",
         "Build cross-platform mobile apps for fintech clients.",
         '["React Native","JavaScript","REST API","Firebase"]'),
        ("Content Writer (WFH)", "ContentBridge Media", "Remote", "Pan India",
         200000, 480000, "Freelance", "Remote", "Media", "Fresher",
         "Write SEO blogs, articles and product descriptions. WFH.",
         '["English Writing","SEO","Research","MS Word"]'),
        ("SSC CGL — Tax Assistant", "Income Tax Department", "Multiple Cities", "Pan India",
         400000, 600000, "Govt", "On-site", "Government", "Fresher",
         "Tax Assistant vacancy under SSC CGL notification 2025–26.",
         '["Aptitude","English","Reasoning","Computer Basics"]'),
        ("Solar Panel Technician", "GreenWatt Energy", "Jaipur", "Rajasthan",
         240000, 380000, "Full-time", "On-site", "Clean Energy", "Fresher",
         "Install and maintain solar panels. Training provided.",
         '["Electrical Basics","Wiring","Physical Fitness"]'),
        ("Women Safety Officer (WFH)", "SafeHer Foundation", "Remote", "Pan India",
         300000, 500000, "Part-time", "Remote", "NGO", "Fresher",
         "Coordinate women helpline, build safety workshops. WFH job.",
         '["Communication","Empathy","MS Office","Hindi/English"]'),
        ("Graphic Designer", "CreativeBox Agency", "Chennai", "Tamil Nadu",
         350000, 700000, "Full-time", "Hybrid", "Design", "1-3 yrs",
         "Create branding materials, social media graphics and UI mockups.",
         '["Figma","Photoshop","Illustrator","Canva"]'),
        ("DevOps Engineer", "CloudNine Solutions", "Bengaluru", "Karnataka",
         1000000, 2000000, "Full-time", "Hybrid", "Tech", "3-6 yrs",
         "Manage CI/CD pipelines, Kubernetes clusters, AWS infrastructure.",
         '["AWS","Docker","Kubernetes","Terraform","Jenkins"]'),
        ("Bank Clerk (IBPS Clerk)", "State Bank of India", "All India", "Pan India",
         350000, 450000, "Govt", "On-site", "Banking", "Fresher",
         "Clerical cadre position at SBI via IBPS Clerk notification.",
         '["Aptitude","Computer","Banking","English","Hindi"]'),
        ("Tailor (WFH / Local)", "FabricArt Studio", "Surat", "Gujarat",
         150000, 280000, "Freelance", "On-site", "Fashion", "Fresher",
         "Stitch garments for boutique clients. Work from home option.",
         '["Tailoring","Stitching","Measurements","Sewing Machine"]'),
    ]
    conn.executemany("""
        INSERT INTO jobs (title, company, location, state, salary_min, salary_max,
                          job_type, work_mode, category, experience, description, skills_required)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
    """, jobs)
    conn.commit()
    print(f"  ✔ Seeded {len(jobs)} sample jobs")


# ──────────────────────────────────────────────────────────────
#  SEED DATA — Government Schemes
# ──────────────────────────────────────────────────────────────
def _seed_schemes(conn):
    existing = conn.execute("SELECT COUNT(*) FROM schemes").fetchone()[0]
    if existing > 0:
        return

    schemes = [
        ("PMKVY 4.0", "Ministry of Skill Development",
         "skill", "Pradhan Mantri Kaushal Vikas Yojana — Free skill training in 28 sectors with job placement support.",
         "Free training certificate + ₹8,000 stipend", "10th pass, 15–45 yrs", "https://skillindiadigital.gov.in", 1, None),
        ("Mudra Loan (PMMY)", "Ministry of Finance",
         "loan", "Pradhan Mantri Mudra Yojana — Collateral-free loans for small businesses.",
         "Loan ₹50K–₹10 Lakh at 7–9% interest", "Any Indian citizen starting a business", "https://www.mudra.org.in", 1, None),
        ("Startup India", "DPIIT",
         "startup", "Tax holiday, fast-track registration, ₹10,000 Cr Fund of Funds for DPIIT-recognised startups.",
         "3 yr tax holiday + ₹20L seed fund", "Registered startup under DPIIT", "https://www.startupindia.gov.in", 1, None),
        ("Skill India Mission", "NSDC",
         "skill", "National Skill Development Corporation — funds training across 700+ partners.",
         "Free & subsidised training", "Any Indian citizen", "https://www.skillindiadigital.gov.in", 1, None),
        ("Stand Up India", "Ministry of Finance",
         "women", "Loans ₹10L–₹1Cr for SC/ST and women entrepreneurs for greenfield enterprises.",
         "Loan ₹10L–₹1Cr at low interest", "SC/ST or Women entrepreneur", "https://www.standupmitra.in", 1, None),
        ("NCS Portal", "MoLE",
         "skill", "National Career Service Portal — connects job seekers with employers, PES offices.",
         "Free job placement + career guidance", "Any job seeker", "https://www.ncs.gov.in", 1, None),
        ("PM SVANidhi", "Ministry of Housing",
         "loan", "Loan for street vendors — ₹10K–₹50K working capital loan.",
         "₹10K–₹50K loan", "Street vendors, hawkers", "https://pmsvanidhi.mohua.gov.in", 1, None),
        ("NREGA (MGNREGS)", "Ministry of Rural Dev.",
         "rural", "100 days guaranteed wage employment per year for rural households.",
         "Min wage ₹255–₹332/day guaranteed", "Rural household (adult member)", "https://nrega.nic.in", 1, None),
        ("DAY-NRLM", "Ministry of Rural Dev.",
         "women", "Deendayal Antyodaya Yojana — Self Help Groups for rural women with skill training + micro-credit.",
         "Subsidised credit + skill training", "Rural women BPL families", "https://aajeevika.gov.in", 1, None),
        ("PM Vishwakarma Scheme", "Ministry of MSME",
         "skill", "Recognition, training and credit for 18 traditional craftwork trades.",
         "₹15K skill support + ₹3L credit", "Artisans in 18 listed trades", "https://pmvishwakarma.gov.in", 1, None),
    ]
    conn.executemany("""
        INSERT INTO schemes (name, ministry, category, description, benefit, eligibility, apply_url, is_central, state)
        VALUES (?,?,?,?,?,?,?,?,?)
    """, schemes)
    conn.commit()
    print(f"  ✔ Seeded {len(schemes)} government schemes")
