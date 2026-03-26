import io

try:
    with io.open('more_dummy_jobs_indented.txt', 'r', encoding='utf-16') as f:
        indented = f.read()
except:
    with io.open('more_dummy_jobs_indented.txt', 'r', encoding='utf-8') as f:
        indented = f.read()

with io.open('api.js', 'r', encoding='utf-8') as f:
    api_content = f.read()

pivot = "{ id: 605, category: 'HR', title: 'HR Intern', company: 'StartupSpace', location: 'Remote', job_type: 'Internship', work_mode: 'Remote', salary_min: 100000, salary_max: 150000, experience: 'Fresher', skills_required: ['Communication', 'Organization', 'MS Office'], description: 'Support the HR team in scheduling interviews and maintaining databases.' },"

if pivot in api_content:
    print("Pivot found")
    new_content = api_content.replace(pivot, pivot + '\n\n    // More Jobs\n' + indented)
    with io.open('api.js', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Injected successfully")
else:
    print("Pivot not found")
    # Try a partial pivot
    partial = "{ id: 605, category: 'HR'"
    if partial in api_content:
        print("Partial pivot found")
        # Find the line ending with },
        start_idx = api_content.find(partial)
        end_idx = api_content.find("},", start_idx) + 2
        full_line = api_content[start_idx:end_idx]
        new_content = api_content.replace(full_line, full_line + '\n\n    // More Jobs\n' + indented)
        with io.open('api.js', 'w', encoding='utf-8') as f:
            f.write(new_content)
        print("Injected via partial match")
    else:
        print("Even partial pivot not found")
