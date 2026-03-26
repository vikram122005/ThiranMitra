import random
import json

titles = ['Assistant Manager', 'Field Engineer', 'Project Coordinator', 'Office Admin', 'Business Analyst', 'Technical Lead', 'Associate Partner', 'Customer Support', 'Production Specialist', 'Quality Analyst']
companies = ['Amazon', 'Flipkart', 'TATA', 'Reliance', 'Wipro', 'Infosys', 'Tech Mahindra', 'HDFC Bank', 'ICICI Bank', 'TCS']
locs = ['Mumbai', 'Delhi', 'Bengaluru', 'Pune', 'Hyderabad', 'Chennai', 'Kolkata', 'Ahmedabad', 'Jaipur', 'Lucknow']
cats = ['Tech', 'Banking', 'Marketing', 'Logistics', 'Design', 'HR']
types = ['Full-time', 'Part-time', 'Internship', 'Freelance', 'Govt']
modes = ['On-site', 'Remote', 'Hybrid']
exps = ['Fresher', '1-3 Years', '3-6 Years', '6+ Years']

output = []
for i in range(100):
    job = {
        'id': 1000 + i,
        'category': random.choice(cats),
        'title': random.choice(titles),
        'company': random.choice(companies),
        'location': random.choice(locs),
        'job_type': random.choice(types),
        'work_mode': random.choice(modes),
        'salary_min': random.randint(3, 12) * 100000,
        'salary_max': random.randint(14, 20) * 100000,
        'experience': random.choice(exps),
        'skills_required': ['Skill A', 'Skill B'],
        'description': 'Job description.'
    }
    output.append(job)

with open('more_dummy_jobs.json', 'w') as f:
    json.dump(output, f, indent=4)
