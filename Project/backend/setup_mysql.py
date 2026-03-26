"""
ThiranMitra — MySQL Migration Setup Script
Run this once to:
1. Create the thiranmitra MySQL database
2. Create all tables
3. Seed jobs and government schemes
4. Migrate any existing SQLite data

Usage: python setup_mysql.py
"""

import sys
import os
import getpass

# ─── Get MySQL credentials ───────────────────────────────────────────
print()
print("=" * 60)
print("  ThiranMitra — MySQL Database Setup")
print("=" * 60)
print()
print("Enter your MySQL credentials:")
MYSQL_HOST = input("  Host [localhost]: ").strip() or "localhost"
MYSQL_PORT = input("  Port [3306]: ").strip() or "3306"
MYSQL_USER = input("  Username [root]: ").strip() or "root"
MYSQL_PASS = getpass.getpass("  Password: ")
DB_NAME = input("  Database name [thiranmitra]: ").strip() or "thiranmitra"

try:
    import pymysql
except ImportError:
    print("\n[ERROR] pymysql not installed. Run: pip install pymysql cryptography")
    sys.exit(1)

# ─── Step 1: Connect & create DB ──────────────────────────────────────
print(f"\n[1/4] Connecting to MySQL at {MYSQL_HOST}:{MYSQL_PORT}...")
try:
    con = pymysql.connect(host=MYSQL_HOST, port=int(MYSQL_PORT),
                          user=MYSQL_USER, password=MYSQL_PASS,
                          charset='utf8mb4', autocommit=True)
    cur = con.cursor()
    cur.execute(f"CREATE DATABASE IF NOT EXISTS `{DB_NAME}` "
                f"CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
    cur.execute(f"USE `{DB_NAME}`")
    print(f"  ✅ Connected! Database '{DB_NAME}' ready.")
except pymysql.Error as e:
    print(f"  ❌ Connection failed: {e}")
    print("  Check your host, username, and password.")
    sys.exit(1)

# ─── Step 2: Create all tables ────────────────────────────────────────
print("\n[2/4] Creating tables...")

TABLES = [
    ("users", """
    CREATE TABLE IF NOT EXISTS users (
        id            INT AUTO_INCREMENT PRIMARY KEY,
        name          VARCHAR(120) NOT NULL,
        email         VARCHAR(180) NOT NULL UNIQUE,
        password_hash VARCHAR(256) NOT NULL,
        phone         VARCHAR(20),
        gender        VARCHAR(20),
        category      VARCHAR(30),
        state         VARCHAR(80),
        city          VARCHAR(80),
        dob           DATE,
        address       TEXT,
        avatar_url    TEXT,
        is_verified   TINYINT(1) DEFAULT 0,
        created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB
    """),

    ("education", """
    CREATE TABLE IF NOT EXISTS education (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        user_id     INT NOT NULL,
        degree      VARCHAR(120) NOT NULL,
        institution VARCHAR(200) NOT NULL,
        year_start  VARCHAR(10),
        year_end    VARCHAR(10),
        grade       VARCHAR(20),
        created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB
    """),

    ("experience", """
    CREATE TABLE IF NOT EXISTS experience (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        user_id     INT NOT NULL,
        title       VARCHAR(120) NOT NULL,
        company     VARCHAR(150) NOT NULL,
        period      VARCHAR(60),
        description TEXT,
        created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB
    """),

    ("skills", """
    CREATE TABLE IF NOT EXISTS skills (
        id         INT AUTO_INCREMENT PRIMARY KEY,
        user_id    INT NOT NULL,
        skill_name VARCHAR(100) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB
    """),

    ("certificates", """
    CREATE TABLE IF NOT EXISTS certificates (
        id         INT AUTO_INCREMENT PRIMARY KEY,
        user_id    INT NOT NULL,
        title      VARCHAR(200) NOT NULL,
        issuer     VARCHAR(150),
        issued_on  DATE,
        url        TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB
    """),

    ("job_preferences", """
    CREATE TABLE IF NOT EXISTS job_preferences (
        id              INT AUTO_INCREMENT PRIMARY KEY,
        user_id         INT NOT NULL UNIQUE,
        preferred_roles TEXT,
        preferred_locs  TEXT,
        salary_min      INT DEFAULT 0,
        salary_max      INT DEFAULT 0,
        job_type        VARCHAR(50),
        work_mode       VARCHAR(50),
        updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB
    """),

    ("jobs", """
    CREATE TABLE IF NOT EXISTS jobs (
        id              INT AUTO_INCREMENT PRIMARY KEY,
        title           VARCHAR(200) NOT NULL,
        company         VARCHAR(150) NOT NULL,
        location        VARCHAR(100),
        state           VARCHAR(80),
        salary_min      BIGINT DEFAULT 0,
        salary_max      BIGINT DEFAULT 0,
        job_type        VARCHAR(50),
        work_mode       VARCHAR(50),
        category        VARCHAR(80),
        experience      VARCHAR(60),
        description     TEXT,
        skills_required TEXT,
        is_verified     TINYINT(1) DEFAULT 1,
        posted_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
        expires_at      DATETIME,
        created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB
    """),

    ("saved_jobs", """
    CREATE TABLE IF NOT EXISTS saved_jobs (
        id         INT AUTO_INCREMENT PRIMARY KEY,
        user_id    INT NOT NULL,
        job_id     INT NOT NULL,
        saved_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_saved (user_id, job_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (job_id)  REFERENCES jobs(id)  ON DELETE CASCADE
    ) ENGINE=InnoDB
    """),

    ("applications", """
    CREATE TABLE IF NOT EXISTS applications (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        user_id     INT NOT NULL,
        job_id      INT NOT NULL,
        status      VARCHAR(40) DEFAULT 'applied',
        cover_note  TEXT,
        applied_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_apply (user_id, job_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (job_id)  REFERENCES jobs(id)  ON DELETE CASCADE
    ) ENGINE=InnoDB
    """),

    ("resumes", """
    CREATE TABLE IF NOT EXISTS resumes (
        id             INT AUTO_INCREMENT PRIMARY KEY,
        user_id        INT NOT NULL,
        filename       VARCHAR(200),
        ats_score      INT DEFAULT 0,
        grammar_score  INT DEFAULT 0,
        keywords_found TEXT,
        improvements   TEXT,
        uploaded_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB
    """),

    ("interview_scores", """
    CREATE TABLE IF NOT EXISTS interview_scores (
        id              INT AUTO_INCREMENT PRIMARY KEY,
        user_id         INT NOT NULL,
        role            VARCHAR(120),
        readiness_pct   INT DEFAULT 0,
        confidence_pct  INT DEFAULT 0,
        clarity_pct     INT DEFAULT 0,
        star_pct        INT DEFAULT 0,
        grammar_pct     INT DEFAULT 0,
        feedback        TEXT,
        taken_at        DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB
    """),

    ("placement_scores", """
    CREATE TABLE IF NOT EXISTS placement_scores (
        id         INT AUTO_INCREMENT PRIMARY KEY,
        user_id    INT NOT NULL,
        test_type  VARCHAR(60) DEFAULT 'aptitude',
        score_pct  INT DEFAULT 0,
        correct    INT DEFAULT 0,
        wrong      INT DEFAULT 0,
        skipped    INT DEFAULT 0,
        taken_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB
    """),

    ("schemes", """
    CREATE TABLE IF NOT EXISTS schemes (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        name        VARCHAR(200) NOT NULL,
        description TEXT,
        category    VARCHAR(80),
        ministry    VARCHAR(200),
        eligibility TEXT,
        benefits    TEXT,
        apply_url   TEXT,
        is_central  TINYINT(1) DEFAULT 1
    ) ENGINE=InnoDB
    """),

    ("support_tickets", """
    CREATE TABLE IF NOT EXISTS support_tickets (
        id         INT AUTO_INCREMENT PRIMARY KEY,
        user_id    INT,
        name       VARCHAR(120),
        email      VARCHAR(180),
        subject    VARCHAR(200),
        message    TEXT NOT NULL,
        status     VARCHAR(40) DEFAULT 'open',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB
    """),
]

for tname, tsql in TABLES:
    try:
        cur.execute(tsql)
        print(f"  ✅ {tname}")
    except pymysql.Error as e:
        print(f"  ⚠️  {tname}: {e}")

# ─── Step 3: Seed jobs & schemes ──────────────────────────────────────
print("\n[3/4] Seeding jobs and schemes...")

existing_jobs = cur.execute("SELECT COUNT(*) FROM jobs").fetchone() if False else None
cur.execute("SELECT COUNT(*) FROM jobs")
existing_jobs = cur.fetchone()[0]

if existing_jobs == 0:
    JOBS = [
        ("Full Stack Developer","TechNova Pvt. Ltd.","Bengaluru","Karnataka",600000,1200000,"Full-time","Hybrid","IT & Tech","2-4 years","Build scalable web apps using React, Node.js, MongoDB","React,Node.js,MongoDB"),
        ("Data Analyst","FinVeda Analytics","Mumbai","Maharashtra",500000,900000,"Full-time","Office","IT & Tech","1-3 years","Analyze financial data, build dashboards","Python,SQL,Power BI"),
        ("Digital Marketing Executive","BrandSphere India","Delhi","Delhi",300000,550000,"Full-time","Hybrid","Marketing","0-2 years","Run SEO, SEM, and social media campaigns","SEO,Google Ads,Canva"),
        ("Government Bank Officer (IBPS PO)","Bank of Maharashtra","Pune","Maharashtra",500000,700000,"Govt","Office","Banking","0-1 years","Handle banking operations and customer service","MS Office,Communication"),
        ("Machine Learning Engineer","AIQuant Labs","Hyderabad","Telangana",900000,1800000,"Full-time","Remote","IT & Tech","3-5 years","Build ML models for fintech applications","Python,TensorFlow,AWS"),
        ("ITI Electrician","PowerGrid Corporation","Chennai","Tamil Nadu",250000,420000,"Govt","Office","ITI/Diploma","1-2 years","Electrical maintenance and installation","Wiring,Safety,Tools"),
        ("Work From Home – Data Entry Operator","DigiData Services","Remote","All India",180000,300000,"Part-time","Remote","Data Entry","Fresher","Online data entry and form filling","MS Excel,Typing,Internet"),
        ("Nurse / Staff Nurse","Apollo Hospitals","Bengaluru","Karnataka",360000,600000,"Full-time","Office","Healthcare","1-3 years","Patient care and medical assistance","Nursing,Communication,EMR"),
        ("Rural Development Officer","NABARD","Multiple Locations","Maharashtra",550000,750000,"Govt","Office","Government","0-2 years","Promote rural development and agri-finance","Economics,Communication,MS Office"),
        ("React Native Developer","Appify Solutions","Pune","Maharashtra",700000,1300000,"Full-time","Hybrid","IT & Tech","2-3 years","Build cross-platform mobile apps","React Native,JavaScript,Redux"),
        ("HR Recruiter","TalentFirst HR","Delhi","Delhi",280000,480000,"Full-time","Office","HR","1-2 years","Sourcing, screening, and onboarding candidates","Recruitment,LinkedIn,MS Office"),
        ("Graphic Designer","PixelCraft Studio","Mumbai","Maharashtra",300000,550000,"Full-time","Hybrid","Design","1-3 years","Create brand visuals, social media content","Photoshop,Illustrator,Figma"),
        ("Civil Engineer","BuildIndia Infra","Ahmedabad","Gujarat",450000,800000,"Full-time","Office","Engineering","2-4 years","Manage construction projects and site supervision","AutoCAD,Project Management,Site Work"),
        ("Python Backend Developer","CodeCraft Technologies","Bengaluru","Karnataka",800000,1500000,"Full-time","Remote","IT & Tech","2-4 years","Build REST APIs with Django and Flask","Python,Django,PostgreSQL"),
        ("Sales Executive","GrowthForce Sales","Jaipur","Rajasthan",240000,420000,"Full-time","Field","Sales","0-2 years","B2B sales, lead generation, and client management","Communication,CRM,Target-driven"),
        ("Anganwadi Worker","Women & Child Development Dept","Rural Areas","Uttar Pradesh",150000,220000,"Govt","On-site","Government","10th Pass","Child nutrition and early education programs","Teaching,Community,Record Keeping"),
        ("Logistics & Supply Chain Executive","FastRoute Logistics","Chennai","Tamil Nadu",350000,600000,"Full-time","Office","Logistics","1-3 years","Manage inventory, shipping, and vendor coordination","SAP,Excel,Supply Chain"),
        ("UI/UX Designer","UseableTech","Remote","All India",600000,1100000,"Full-time","Remote","Design","2-4 years","Design intuitive user interfaces for web and mobile","Figma,Adobe XD,User Research"),
    ]
    for j in JOBS:
        cur.execute(
            "INSERT INTO jobs (title,company,location,state,salary_min,salary_max,job_type,work_mode,category,experience,description,skills_required) "
            "VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)", j
        )
    print(f"  ✅ Inserted {len(JOBS)} jobs")
else:
    print(f"  ℹ️  Jobs already exist ({existing_jobs} rows) — skipping")

cur.execute("SELECT COUNT(*) FROM schemes")
existing_schemes = cur.fetchone()[0]

if existing_schemes == 0:
    SCHEMES = [
        ("PMKVY 4.0","Pradhan Mantri Kaushal Vikas Yojana — free skill training in 300+ trades","skill","Ministry of Skill Development","18-35 years, Indian citizen","Free training + ₹8000 stipend + certificate","https://pmkvyofficial.org",1),
        ("Mudra Loan (PMMY)","Micro loans up to ₹10 lakh for small businesses without collateral","loan","Ministry of Finance","Business owner or aspiring entrepreneur","Shishu: up to ₹50K, Kishore: up to ₹5L, Tarun: up to ₹10L","https://www.mudra.org.in",1),
        ("Startup India","Support, mentoring, and tax benefits for registered startups","startup","DPIIT","DPIIT-registered startup < 10 years old","80% patent rebate, tax exemptions, ₹10000 Cr fund access","https://startupindia.gov.in",1),
        ("Skill India Mission","National mission to train 40 crore Indians by 2025","skill","NSDC","Any Indian 15-45 years","Free training across 30+ sectors","https://skillindia.gov.in",1),
        ("Stand Up India","Loans for SC/ST and Women entrepreneurs","women","Ministry of Finance","SC/ST or Women, 18+ years","₹10 lakh to ₹1 crore bank loan","https://standupmitra.in",1),
        ("PM SVANidhi","Working capital loans for street vendors","loan","Ministry of Housing & Urban Affairs","Urban street vendors","₹10,000 to ₹50,000 collateral-free loan","https://pmsvanidhi.mohua.gov.in",1),
        ("Jan Aushadhi Scheme","Open a generic medicine store with government support","startup","Ministry of Chemicals","Any Indian with pharmacy space","₹2.5 lakh grant + free medicines at 50-90% discount","https://janaushadhi.gov.in",1),
        ("PMEGP","Self-employment through micro enterprise loans","loan","KVIC / Ministry of MSME","18+ years, 8th pass minimum","Up to ₹50 lakh with 15-35% subsidy","https://kviconline.gov.in/pmegpeportal",1),
        ("NREGA / MGNREGS","100 days guaranteed wage employment in rural areas","rural","Ministry of Rural Development","Rural household adults","₹220-300/day wage, registered via gram panchayat","https://nrega.nic.in",1),
        ("PM Vishwakarma","Support traditional artisans with training and tools","skill","Ministry of MSME","Traditional craftsmen and artisans","₹15,000 toolkit grant + ₹1-2 lakh collateral-free loan","https://pmvishwakarma.gov.in",1),
    ]
    for s in SCHEMES:
        cur.execute(
            "INSERT INTO schemes (name,description,category,ministry,eligibility,benefits,apply_url,is_central) "
            "VALUES (%s,%s,%s,%s,%s,%s,%s,%s)", s
        )
    print(f"  ✅ Inserted {len(SCHEMES)} government schemes")
else:
    print(f"  ℹ️  Schemes already exist ({existing_schemes} rows) — skipping")

con.commit()

# ─── Step 4: Write config.env file ────────────────────────────────────
print("\n[4/4] Saving database configuration...")

env_content = f"""# ThiranMitra MySQL Configuration
# Generated by setup_mysql.py — DO NOT commit this file to Git

DB_TYPE=mysql
MYSQL_HOST={MYSQL_HOST}
MYSQL_PORT={MYSQL_PORT}
MYSQL_USER={MYSQL_USER}
MYSQL_PASSWORD={MYSQL_PASS}
MYSQL_DATABASE={DB_NAME}

# JWT Secret (change in production)
RS_SECRET=thiranmitra-super-secret-2026-change-in-prod
"""

env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '.env')
with open(env_path, 'w') as f:
    f.write(env_content)
print(f"  ✅ Saved credentials to: {os.path.abspath(env_path)}")

con.close()

print()
print("=" * 60)
print("  ✅  MYSQL SETUP COMPLETE!")
print(f"  Database : {DB_NAME}")
print(f"  Host     : {MYSQL_HOST}:{MYSQL_PORT}")
print(f"  Tables   : {len(TABLES)} created")
print()
print("  NEXT STEP: Restart the backend server.")
print("  Run: python app.py")
print("=" * 60)
print()
