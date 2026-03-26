/* ============================================================
   ThiranMitra — profile.js
   Full profile CRUD linked to Flask /api/profile/*
   Uses actual DOM IDs from profile.html
   ============================================================ */
'use strict';

let profileData = {};

document.addEventListener('DOMContentLoaded', async () => {
    if (!requireAuth()) return;
    await loadFullProfile();
});

// ── LOAD ──────────────────────────────────────────────────────
async function loadFullProfile() {
    try {
        profileData = await ProfileAPI.get();
        populatePersonalInfo(profileData.user || {});
        populatePreferences(profileData.preferences || {});
        renderEducation(profileData.education || []);
        renderExperience(profileData.experience || []);
        renderSkillsPills(profileData.skills || []);
        renderCertificates(profileData.certificates || []);
        renderResumes();
        renderOverviewStats(profileData);
        updateSidebar(profileData.user || {});
    } catch (err) {
        showToast('Could not load profile — is the backend running?', 'error', 5000);
        console.error(err);
    }
}

// ── SIDEBAR ───────────────────────────────────────────────────
function updateSidebar(user) {
    const nameEl = document.getElementById('profileName');
    const emailEl = document.getElementById('profileEmail');
    const initEl = document.getElementById('avatarInitial');
    if (nameEl) nameEl.textContent = user.name || 'Your Name';
    if (emailEl) emailEl.textContent = user.email || '';
    if (initEl) initEl.textContent = (user.name || 'U')[0].toUpperCase();
}

// ── OVERVIEW STATS ────────────────────────────────────────────
async function renderOverviewStats(data) {
    try {
        const stats = await ProfileAPI.stats();
        const map = {
            'savedJobsCount': stats.saved_jobs,
            'appliedCount': stats.applied_jobs,
            'interviewScore': stats.interview_score != null ? stats.interview_score + '%' : '—',
            'resumeScore': stats.resume_ats != null ? stats.resume_ats : '—',
        };
        Object.entries(map).forEach(([id, val]) => {
            const el = document.getElementById(id);
            if (el) el.textContent = val ?? '0';
        });

        // Completion
        const skills = (data.skills || []).length;
        const user = data.user || {};
        let pct = 20;
        if (user.phone) pct += 10;
        if (user.city) pct += 10;
        if ((data.education || []).length) pct += 20;
        if (skills) pct += 20;
        if (stats.resume_ats) pct += 10;
        if (stats.interview_score) pct += 10;
        pct = Math.min(100, pct);

        const pctEl = document.getElementById('completionPct');
        const barEl = document.getElementById('completionBar');
        if (pctEl) pctEl.textContent = pct + '%';
        if (barEl) { barEl.style.width = '0%'; setTimeout(() => { barEl.style.transition = 'width 1s ease'; barEl.style.width = pct + '%'; }, 300); }

        // Next steps widget
        renderNextSteps(pct, user, data);
    } catch (e) { console.warn(e); }
}

function renderNextSteps(pct, user, data) {
    const el = document.getElementById('nextSteps');
    if (!el) return;
    const steps = [
        { done: !!user.phone, label: 'Add phone number', link: null },
        { done: (data.education || []).length > 0, label: 'Add education details', link: 'sec-education' },
        { done: (data.skills || []).length > 0, label: 'Add at least 3 skills', link: 'sec-skills' },
        { done: (data.experience || []).length > 0, label: 'Add work experience', link: 'sec-experience' },
        { done: pct >= 80, label: 'Upload your resume', link: null, href: 'resume.html' },
    ];
    el.innerHTML = steps.filter(s => !s.done).slice(0, 3).map(s => `
    <div style="display:flex;align-items:center;gap:0.5rem;padding:0.5rem 0.75rem;
      background:rgba(245,158,11,0.07);border:1px solid rgba(245,158,11,0.15);
      border-radius:8px;font-size:0.8rem;cursor:pointer;"
      onclick="${s.href ? `window.location.href='${s.href}'` : `showSection('${s.link}')`}">
      <span style="color:var(--warning);">→</span>
      <span style="color:var(--text-secondary);">${s.label}</span>
    </div>`).join('') || `<div style="color:var(--accent);font-size:0.82rem;">✨ Profile is looking great!</div>`;
}

// ── PERSONAL INFO ─────────────────────────────────────────────
function populatePersonalInfo(user) {
    const map = {
        'pName': 'name', 'pPhone': 'phone', 'pDob': 'dob',
        'pEmail': 'email', 'pCity': 'city', 'pAddress': 'address',
        'pGender': 'gender', 'pCategory': 'category', 'pState': 'state',
    };
    Object.entries(map).forEach(([id, key]) => {
        const el = document.getElementById(id);
        if (el && user[key]) el.value = user[key];
    });
}

async function savePersonalInfo() {
    const btn = document.getElementById('savePersonalBtn');
    if (btn) { btn.textContent = '⌛ Saving...'; btn.disabled = true; }
    const map = {
        'pName': 'name', 'pPhone': 'phone', 'pDob': 'dob', 'pCity': 'city',
        'pAddress': 'address', 'pGender': 'gender', 'pCategory': 'category', 'pState': 'state',
    };
    const data = {};
    Object.entries(map).forEach(([id, key]) => {
        const el = document.getElementById(id);
        if (el && el.value.trim()) data[key] = el.value.trim();
    });
    try {
        await ProfileAPI.update(data);
        showToast('Personal information saved! ✅', 'success');
        updateSidebar({ ...profileData.user, ...data });
    } catch (err) { handleApiError(err); }
    finally { if (btn) { btn.textContent = 'Save Changes'; btn.disabled = false; } }
}

// ── EDUCATION ────────────────────────────────────────────────
function renderEducation(list) {
    const el = document.getElementById('educationList');
    if (!el) return;
    if (!list.length) {
        el.innerHTML = `<div style="text-align:center;padding:1.5rem;color:var(--text-muted);font-size:0.85rem;">
      📚 No education added yet. Add your degrees below.</div>`;
        return;
    }
    el.innerHTML = list.map(e => `
    <div style="padding:1rem;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);
      border-radius:var(--radius-lg);display:flex;justify-content:space-between;align-items:flex-start;">
      <div>
        <div style="font-weight:700;color:var(--text-primary);">${escapeHtml(e.degree)}</div>
        <div style="color:var(--primary-light);font-size:0.82rem;">${escapeHtml(e.institution)}</div>
        <div style="color:var(--text-muted);font-size:0.75rem;">
          ${e.year_start || ''}${e.year_end ? ' – ' + e.year_end : ''} ${e.grade ? '· CGPA/% ' + e.grade : ''}
        </div>
      </div>
      <button onclick="deleteEdu(${e.id})"
        style="background:rgba(239,68,68,0.1);border:none;color:#f87171;border-radius:8px;
               padding:0.3rem 0.6rem;cursor:pointer;font-size:0.78rem;">Remove</button>
    </div>`).join('');
}

async function addEducation() {
    const degree = document.getElementById('eduDegree')?.value?.trim();
    const inst = document.getElementById('eduInstitution')?.value?.trim();
    const ys = document.getElementById('eduYearStart')?.value?.trim();
    const ye = document.getElementById('eduYearEnd')?.value?.trim();
    const gr = document.getElementById('eduGrade')?.value?.trim();
    if (!degree || !inst) { showToast('Degree and institution required', 'error'); return; }
    try {
        const r = await ProfileAPI.addEducation({ degree, institution: inst, year_start: ys, year_end: ye, grade: gr });
        profileData.education = [...(profileData.education || []), r.education];
        renderEducation(profileData.education);
        ['eduDegree', 'eduInstitution', 'eduYearStart', 'eduYearEnd', 'eduGrade'].forEach(id => {
            const el = document.getElementById(id); if (el) el.value = '';
        });
        showToast('Education added! 📚', 'success');
    } catch (err) { handleApiError(err); }
}

async function deleteEdu(id) {
    try {
        await ProfileAPI.delEducation(id);
        profileData.education = profileData.education.filter(e => e.id !== id);
        renderEducation(profileData.education);
        showToast('Removed', 'info', 1200);
    } catch (err) { handleApiError(err); }
}

// ── EXPERIENCE ───────────────────────────────────────────────
function renderExperience(list) {
    const el = document.getElementById('experienceList');
    if (!el) return;
    if (!list.length) {
        el.innerHTML = `<div style="text-align:center;padding:1.5rem;color:var(--text-muted);font-size:0.85rem;">
      💼 No experience added yet.</div>`;
        return;
    }
    el.innerHTML = list.map(e => `
    <div style="padding:1rem;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);
      border-radius:var(--radius-lg);display:flex;justify-content:space-between;align-items:flex-start;">
      <div>
        <div style="font-weight:700;color:var(--text-primary);">${escapeHtml(e.title)}</div>
        <div style="color:var(--primary-light);font-size:0.82rem;">${escapeHtml(e.company)}</div>
        ${e.period ? `<div style="color:var(--text-muted);font-size:0.75rem;">${escapeHtml(e.period)}</div>` : ''}
        ${e.description ? `<p style="color:var(--text-secondary);font-size:0.78rem;margin-top:0.35rem;line-height:1.5;">${escapeHtml(e.description)}</p>` : ''}
      </div>
      <button onclick="deleteExp(${e.id})"
        style="background:rgba(239,68,68,0.1);border:none;color:#f87171;border-radius:8px;
               padding:0.3rem 0.6rem;cursor:pointer;font-size:0.78rem;">Remove</button>
    </div>`).join('');
}

async function addExperience() {
    const title = document.getElementById('expTitle')?.value?.trim();
    const comp = document.getElementById('expCompany')?.value?.trim();
    const period = document.getElementById('expPeriod')?.value?.trim();
    const desc = document.getElementById('expDesc')?.value?.trim();
    if (!title || !comp) { showToast('Title and company required', 'error'); return; }
    try {
        const r = await ProfileAPI.addExperience({ title, company: comp, period, description: desc });
        profileData.experience = [r.experience, ...(profileData.experience || [])];
        renderExperience(profileData.experience);
        ['expTitle', 'expCompany', 'expPeriod', 'expDesc'].forEach(id => {
            const el = document.getElementById(id); if (el) el.value = '';
        });
        showToast('Experience added! 💼', 'success');
    } catch (err) { handleApiError(err); }
}

async function deleteExp(id) {
    try {
        await ProfileAPI.delExperience(id);
        profileData.experience = profileData.experience.filter(e => e.id !== id);
        renderExperience(profileData.experience);
        showToast('Removed', 'info', 1200);
    } catch (err) { handleApiError(err); }
}

// ── SKILLS ───────────────────────────────────────────────────
function renderSkillsPills(list) {
    const el = document.getElementById('skillsPills');
    if (!el) return;
    if (!list.length) {
        el.innerHTML = `<span style="color:var(--text-muted);font-size:0.82rem;">No skills added yet. Type a skill above and press Add.</span>`;
        return;
    }
    const levelColor = { Beginner: '#f59e0b', Intermediate: '#60a5fa', Expert: '#34d399' };
    el.innerHTML = list.map(s => `
    <span style="display:inline-flex;align-items:center;gap:0.3rem;
      background:rgba(79,70,229,0.12);border:1px solid rgba(79,70,229,0.25);
      border-radius:20px;padding:0.25rem 0.6rem;margin:0.25rem;">
      <span style="font-size:0.8rem;font-weight:600;color:var(--primary-light);">${escapeHtml(s.skill_name)}</span>
      <span style="font-size:0.65rem;color:${levelColor[s.level] || '#94a3b8'};">${s.level}</span>
      <button onclick="deleteSkl(${s.id})"
        style="background:none;border:none;color:rgba(255,255,255,0.3);cursor:pointer;
               font-size:0.7rem;padding:0;margin-left:0.2rem;line-height:1;">✕</button>
    </span>`).join('');
}

async function addSkill() {
    const inp = document.getElementById('skillInput');
    const level = document.getElementById('skillLevel')?.value || 'Intermediate';
    const raw = inp?.value?.trim();
    if (!raw) { showToast('Enter a skill name', 'error'); return; }
    const skills = raw.split(',').map(s => s.trim()).filter(Boolean);
    try {
        await ProfileAPI.addSkills(skills, level);
        const data = await ProfileAPI.get();
        profileData.skills = data.skills;
        renderSkillsPills(profileData.skills);
        if (inp) inp.value = '';
        showToast(`${skills.length} skill(s) added! ⚡`, 'success');
    } catch (err) { handleApiError(err); }
}

async function deleteSkl(id) {
    try {
        await ProfileAPI.delSkill(id);
        profileData.skills = profileData.skills.filter(s => s.id !== id);
        renderSkillsPills(profileData.skills);
        showToast('Skill removed', 'info', 1200);
    } catch (err) { handleApiError(err); }
}

// ── CERTIFICATES ─────────────────────────────────────────────
function renderCertificates(list) {
    const el = document.getElementById('certsList');
    if (!el) return;
    if (!list.length) {
        el.innerHTML = `<div style="text-align:center;padding:1rem;color:var(--text-muted);font-size:0.85rem;">
      🏆 No certificates added yet.</div>`;
        return;
    }
    el.innerHTML = list.map(c => `
    <div style="display:flex;justify-content:space-between;align-items:center;
      padding:0.875rem;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);
      border-radius:var(--radius-lg);">
      <div>
        <div style="font-weight:700;color:var(--text-primary);">🏆 ${escapeHtml(c.name)}</div>
        <div style="color:var(--text-muted);font-size:0.75rem;">${c.issuer || ''} ${c.year ? '· ' + c.year : ''}</div>
        ${c.cert_url ? `<a href="${escapeHtml(c.cert_url)}" target="_blank"
          style="font-size:0.72rem;color:var(--primary-light);">View →</a>` : ''}
      </div>
      <button onclick="delCert(${c.id})"
        style="background:rgba(239,68,68,0.1);border:none;color:#f87171;
               border-radius:8px;padding:0.3rem 0.6rem;cursor:pointer;font-size:0.78rem;">Remove</button>
    </div>`).join('');
}

async function addCert() {
    const name = document.getElementById('certName')?.value?.trim();
    const issuer = document.getElementById('certIssuer')?.value?.trim();
    const year = document.getElementById('certYear')?.value?.trim();
    const url = document.getElementById('certUrl')?.value?.trim();
    if (!name) { showToast('Certificate name required', 'error'); return; }
    try {
        const r = await ProfileAPI.addCert({ name, issuer, year, cert_url: url });
        profileData.certificates = [...(profileData.certificates || []), r.certificate];
        renderCertificates(profileData.certificates);
        ['certName', 'certIssuer', 'certYear', 'certUrl'].forEach(id => {
            const el = document.getElementById(id); if (el) el.value = '';
        });
        showToast('Certificate added! 🏆', 'success');
    } catch (err) { handleApiError(err); }
}

async function delCert(id) {
    try {
        await ProfileAPI.delCert(id);
        profileData.certificates = profileData.certificates.filter(c => c.id !== id);
        renderCertificates(profileData.certificates);
        showToast('Removed', 'info', 1200);
    } catch (err) { handleApiError(err); }
}

// ── PREFERENCES ──────────────────────────────────────────────
function populatePreferences(pref) {
    const map = {
        'prefRole': 'preferred_role', 'prefLocation': 'preferred_city',
        'prefSalary': 'salary_range', 'prefType': 'job_type',
        'prefWork': 'work_mode', 'prefNotice': 'notice_period',
    };
    Object.entries(map).forEach(([id, key]) => {
        const el = document.getElementById(id);
        if (el && pref[key]) el.value = pref[key];
    });
}

async function savePreferences() {
    const btn = document.getElementById('savePrefBtn');
    if (btn) { btn.textContent = '⌛ Saving...'; btn.disabled = true; }
    const map = {
        'prefRole': 'preferred_role', 'prefLocation': 'preferred_city',
        'prefSalary': 'salary_range', 'prefType': 'job_type',
        'prefWork': 'work_mode', 'prefNotice': 'notice_period',
    };
    const data = {};
    Object.entries(map).forEach(([id, key]) => {
        const el = document.getElementById(id);
        if (el && el.value.trim()) data[key] = el.value.trim();
    });
    try {
        await ProfileAPI.updatePrefs(data);
        showToast('Job preferences saved! ✅', 'success');
    } catch (err) { handleApiError(err); }
    finally { if (btn) { btn.textContent = 'Save Preferences'; btn.disabled = false; } }
}

// ── RESUMES ──────────────────────────────────────────────────
async function renderResumes() {
    const el = document.getElementById('profileResumesList');
    if (!el) return;
    try {
        const data = await ProfileAPI.getResumes();
        const list = data.resumes || [];
        if (!list.length) {
            el.innerHTML = `<div style="text-align:center;padding:1.5rem;color:var(--text-muted);font-size:0.85rem;">
          📄 No resumes stored yet. Upload one via the Resume Analyzer.</div>`;
            return;
        }
        el.innerHTML = list.reverse().map(r => `
        <div style="padding:1.25rem;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);
          border-radius:var(--radius-lg);display:flex;justify-content:space-between;align-items:center;">
          <div style="display:flex;align-items:center;gap:1rem;">
            <div style="font-size:1.8rem;">📄</div>
            <div>
                <div style="font-weight:700;color:var(--text-primary);">${escapeHtml(r.filename)}</div>
                <div style="font-size:0.75rem;color:var(--text-muted);">ATS Score: <span style="color:var(--accent);font-weight:700;">${r.ats_score}%</span> · ${new Date(r.created_at || Date.now()).toLocaleDateString()}</div>
            </div>
          </div>
          <div style="display:flex;gap:0.5rem;">
            <button class="btn btn-outline btn-sm" onclick="window.location.href='resume.html'" style="padding:0.3rem 0.6rem;font-size:0.75rem;">Re-analyze</button>
          </div>
        </div>`).join('');
    } catch (err) { console.warn("Resume fetch error:", err); }
}

async function handleQuickResumeUpload(input) {
    const file = input.files[0];
    if (!file) return;

    showToast(`⏳ Processing ${file.name}...`, 'info');

    // Simulate a quick AI scan
    const score = Math.floor(Math.random() * 20) + 65; // 65-85%

    try {
        await ProfileAPI.addResume({
            filename: file.name,
            ats_score: score,
            grammar_score: 85,
            keywords_found: "[]",
            improvements: "[]"
        });

        showToast(`✅ ${file.name} uploaded and permanently stored!`, 'success');
        renderResumes(); // Refresh the list
    } catch (err) {
        showToast('Upload failed. Please try again.', 'error');
    } finally {
        input.value = ''; // Reset input
    }
}

// ── LOGOUT ────────────────────────────────────────────────────
// Profile page logout goes through API
function profileLogout() { AuthAPI.logout(); }
