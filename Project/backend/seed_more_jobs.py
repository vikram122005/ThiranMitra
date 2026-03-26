import sqlite3
import random
import json
import os

db_path = r'c:\Users\VIKRAM\OneDrive\Desktop\Employing\EasyWayToGetEmployed\Project\backend\thiranmitra.db'

titles = [
    'Junior Python Developer', 'React Frontend Specialist', 'Backend Node.js Engineer', 
    'Data Science Associate', 'UI Designer', 'Machine Learning Research Intern', 
    'Cloud Architect', 'DevOps Specialist', 'QA Automation Tester', 'Mobile App Developer (iOS)', 
    'Flutter Developer', 'PHP/Laravel Developer', 'Java Spring Boot Architect', 
    'SQL Database Administrator', 'Cybersecurity Analyst', 'Product Manager Intern', 
    'Marketing Strategist', 'SEO Consultant', 'HR Transformation Specialist', 
    'Content Marketing Manager', 'Logistics Operations Lead', 'Supply Chain Analyst', 
    'Warehouse Floor Supervisor', 'Bank Relations Manager', 'Financial Risk Analyst', 
    'Equity Research Associate', 'Tax Consultant', 'Legal Compliance Associate', 
    'Civil Engineer', 'Mechanical Design Engineer', 'Electrical Maintenance Technician', 
    'Solar Energy Consultant', 'Construction Site Manager', 'Hotel Operations Assistant', 
    'Guest Relations Executive', 'Chef de Partie', 'E-commerce Specialist', 
    'Customer Success Associate', 'Inside Sales Rep', 'BPO Team Lead', 'VFX Artist', 
    'Unity Game Developer', 'Motion Graphics Designer', 'Copywriter', 
    'Public Relations Specialist', 'Event Coordinator', 'Travel Operations Consultant', 
    'NGO Program Officer', 'Primary School Teacher', 'Yoga Instructor', 
    'Physical Education Trainer', 'Dietician/Nutritionist', 'Pharmacist', 
    'Lab Technician', 'Nursing Associate', 'Medical Coding Specialist', 'R&D Chemist', 
    'Quality Control Inspector', 'Textile Designer', 'Fashion Merchandiser', 
    'Interior Design Consultant', 'Real Estate Sales Executive', 'Property Manager', 
    'Auto Mechanic (Trainee)', 'Assembly Line Operator', 'Heavy Vehicle Driver', 
    'Delivery Partner (Local)', 'Retail Store Manager', 'Floor Sales Executive', 
    'Cashier', 'Security Guard (Verified)', 'Housekeeping Supervisor', 'Receptionist', 
    'Office Assistant', 'Personal Secretary', 'Corporate Trainer', 
    'Business Development Associate', 'Key Account Manager', 'Territory Sales Lead', 
    'Branch Operations Head', 'Inventory Controller', 'Export-Import Coordinator', 
    'Customs Clearance Agent', 'Insurance Advisor', 'Mutual Fund Consultant', 
    'Loan Processing Executive', 'Apprentice (Various Trades)', 'Trainee Engineer', 
    'Vocational Instructor', 'Community Health Worker', 'Anganwadi Supervisor', 
    'Rural Development Officer', 'Post Office Assistant', 'Clerk (Govt Dept)', 
    'Forest Guard (Recruitment)', 'Police Constable (Trainee)', 'Library Assistant', 
    'Content Moderator (Hindi)', 'Graphic Design Intern', 'Web Design Associate'
]

companies = [
    'TechSolution India', 'InnovateSoft', 'GlobalData Systems', 'FutureAI', 'PixelStream', 
    'CloudVerse', 'SecureNet', 'NexusIT', 'AlphaCode', 'BetaSystems', 'ZenithAnalytics', 
    'BlueChip Banking', 'FirstCapital Finance', 'WealthWave', 'ApexMarketing', 
    'TopTier Branding', 'RapidLogistics', 'SwiftShipping', 'PrimeFoods', 'GreenEnergy India', 
    'ModernHousing', 'MedLife Healthcare', 'PharmaLink', 'EduSpark', 'SkillRise', 
    'ThiranMitra Partner', 'TCS', 'Infosys', 'Wipro', 'HCL Technologies', 'Amazon', 
    'Flipkart', 'Zomato', 'Swiggy', 'Reliance', 'Adani', 'Tata Motors', 'Mahindra', 
    'Larsen & Toubro', 'DLF', 'ITC', 'Dabur', 'Amul', 'HDFC Bank', 'ICICI Bank', 
    'State Bank of India', 'Axis Bank', 'LIC', 'Bata', 'Titan'
]

locations = [
    'Mumbai', 'Delhi', 'Bengaluru', 'Pune', 'Hyderabad', 'Chennai', 'Kolkata', 
    'Ahmedabad', 'Jaipur', 'Lucknow', 'Chandigarh', 'Indore', 'Kochi', 'Nagpur', 
    'Goa', 'Patna', 'Ranchi', 'Bhopal', 'Guwahati', 'Surat'
]

types = ['Full-time', 'Part-time', 'Internship', 'Freelance', 'Govt']
modes = ['On-site', 'Remote', 'Hybrid']
cats = ['Tech', 'Banking', 'Marketing', 'Logistics', 'Design', 'HR', 'Manufacturing', 'Retail', 'Healthcare', 'Education']
exps = ['Fresher', '1-3 yrs', '3-6 yrs', '6+ yrs']
tech_skills = ['React', 'Python', 'Java', 'SQL', 'Node.js', 'AWS', 'Docker', 'Kubernetes', 'Figma', 'MongoDB']
soft_skills = ['Communication', 'Management', 'Excel', 'English', 'Hindi', 'Teamwork', 'Leadership']

def seed():
    if not os.path.exists(db_path):
        print(f"Error: DB not found at {db_path}")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Check current count
    cursor.execute("SELECT COUNT(*) FROM jobs")
    count = cursor.fetchone()[0]
    print(f"Current job count: {count}")
    
    new_jobs = []
    for i in range(120): # Adding 120 more to exceed 100+
        t = random.choice(titles)
        c = random.choice(companies)
        l = random.choice(locations)
        ty = random.choice(types)
        m = random.choice(modes)
        cat = random.choice(cats)
        e = random.choice(exps)
        sm = random.randint(3, 12) * 100000
        sx = sm + random.randint(2, 8) * 100000
        
        # Build skills list
        s_list = random.sample(tech_skills, 2) + random.sample(soft_skills, 1)
        sk = json.dumps(s_list)
        
        desc = f"Exciting opportunity to join {c} in {l} as a {t}. We are looking for candidates with experience in {', '.join(s_list)}. Join our growing team and build your career."
        
        new_jobs.append((
            t, c, l, l, sm, sx, ty, m, cat, e, desc, sk, 1
        ))

    cursor.executemany('''
        INSERT INTO jobs (title, company, location, state, salary_min, salary_max, 
                          job_type, work_mode, category, experience, description, 
                          skills_required, is_verified) 
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
    ''', new_jobs)
    
    conn.commit()
    cursor.execute("SELECT COUNT(*) FROM jobs")
    final_count = cursor.fetchone()[0]
    print(f"Final job count: {final_count}")
    conn.close()

if __name__ == "__main__":
    seed()
