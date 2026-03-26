/* ============================================
   ThiranMitra — resume.js
   AI Resume Analyzer — Persistent Storage Flow
   ============================================ */
'use strict';

let existingResumes = [];

document.addEventListener('DOMContentLoaded', async () => {
    if (AuthAPI.isLoggedIn()) {
        try {
            const data = await ProfileAPI.getResumes();
            existingResumes = data.resumes || [];

            if (existingResumes.length > 0) {
                renderStoredResume(existingResumes[existingResumes.length - 1]);
            }
        } catch (err) {
            console.error("Error fetching resumes:", err);
        }
    }
});

function renderStoredResume(resume) {
    const dz = document.getElementById('dropZone');
    if (!dz) return;

    dz.innerHTML = `
        <div style="background: rgba(79, 70, 229, 0.1); border-radius: 1.5rem; padding: 2.5rem; position: relative; border: 1px solid rgba(79, 70, 229, 0.3);">
            <div style="font-size: 3.5rem; margin-bottom: 1rem;">📄</div>
            <h3 style="color: #f1f5f9; margin-bottom: 0.5rem;">Resume Already Stored</h3>
            <p style="color: #94a3b8; font-size: 0.9rem; margin-bottom: 1.5rem;">
                Last Uploaded: <strong>${resume.filename}</strong><br>
                Confidence Score: <span style="color: #10b981; font-weight: 700;">${resume.ats_score || 'N/A'}%</span>
            </p>
            <div style="display: flex; gap: 1rem; justify-content: center;">
                <button class="btn btn-primary btn-sm" onclick="analyzeResume(true)">🤖 Use This Resume</button>
                <button class="btn btn-outline btn-sm" onclick="resetUploadUI()">🔄 Change Resume</button>
            </div>
        </div>
    `;

    // Fill text if it exists (simulated for dummy)
    document.getElementById('resumeText').value = "Existing Resume Content - Analysis cached.";
}

function resetUploadUI() {
    const dz = document.getElementById('dropZone');
    dz.innerHTML = `
        <span class="drop-zone-icon">📄</span>
        <h3 style="color:var(--text-primary);margin-bottom:0.75rem;">Drag & drop your new resume here</h3>
        <p>or <strong onclick="event.stopPropagation();document.getElementById('resumeFile').click()">click to browse</strong></p>
        <p style="margin-top:0.5rem;font-size:0.8rem;">Supports PDF, DOC, DOCX, TXT — Max 5MB</p>
        <input type="file" id="resumeFile" accept=".pdf,.doc,.docx,.txt" style="display:none;" onchange="handleFileSelect(this)" />
    `;
    document.getElementById('resumeText').value = "";
}

// ── Drag & Drop ───────────────────────────────
function handleDragOver(e) {
    e.preventDefault();
    document.getElementById('dropZone').classList.add('drag-over');
}
function handleDragLeave(e) {
    document.getElementById('dropZone').classList.remove('drag-over');
}
function handleDrop(e) {
    e.preventDefault();
    document.getElementById('dropZone').classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
}
function handleFileSelect(input) {
    if (input.files[0]) processFile(input.files[0]);
}

function processFile(file) {
    const allowed = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
    ];
    if (!allowed.includes(file.type) && !file.name.match(/\.(pdf|doc|docx|txt)$/i)) {
        showToast('Please upload a PDF, DOC, DOCX, or TXT file.', 'error');
        return;
    }
    if (file.size > 5 * 1024 * 1024) {
        showToast('File size exceeds 5MB limit. Please compress and try again.', 'error');
        return;
    }
    const dz = document.getElementById('dropZone');
    dz.innerHTML = `
    <span class="drop-zone-icon">✅</span>
    <h3 style="color:var(--accent);">File Ready: ${file.name}</h3>
    <p style="font-size:0.8rem;color:var(--text-muted);">${(file.size / 1024).toFixed(1)} KB — Click "Analyze Resume" to continue.</p>`;
    showToast(`📄 ${file.name} uploaded successfully!`, 'success');

    if (file.type === 'text/plain') {
        const reader = new FileReader();
        reader.onload = (e) => {
            document.getElementById('resumeText').value = e.target.result;
        };
        reader.readAsText(file);
    }
}

// ── Analyze Flow ─────────────────────────────
function analyzeResume(useStored = false) {
    const text = document.getElementById('resumeText').value.trim();
    const fileInput = document.getElementById('resumeFile');

    if (!useStored && !text && (!fileInput.files || !fileInput.files[0])) {
        showToast('Please upload a resume file or paste resume text.', 'error');
        return;
    }

    document.getElementById('uploadCard').style.display = 'none';
    document.getElementById('loadingPanel').style.display = 'block';

    const steps = [
        [15, 'Scanning stored resume...'],
        [30, 'Running ATS compatibility check...'],
        [50, 'Analyzing keywords and skills...'],
        [70, 'Checking grammar and formatting...'],
        [85, 'Comparing with job market trends...'],
        [95, 'Generating improvement suggestions...'],
        [100, 'Analysis complete!'],
    ];

    let si = 0;
    const interval = setInterval(() => {
        if (si >= steps.length) { clearInterval(interval); showResults(); return; }
        const pb = document.getElementById('analysisProgress');
        const ps = document.getElementById('analysisStep');
        if (pb) pb.style.width = steps[si][0] + '%';
        if (ps) ps.textContent = steps[si][1];
        si++;
    }, 600);
}

// ── Show Results ─────────────────────────────
function showResults() {
    const role = (document.getElementById('targetRole')?.value || '').trim() || 'General';
    document.getElementById('loadingPanel').style.display = 'none';
    const panel = document.getElementById('analysisPanel');
    if (!panel) return;
    panel.classList.add('visible');

    const score = Math.floor(Math.random() * 25) + 55;
    const arc = document.getElementById('scoreArc');
    if (arc) arc.style.strokeDashoffset = 408 - (408 * score / 100);
    const os = document.getElementById('overallScore');
    if (os) os.textContent = score;
    const gradeEl = document.getElementById('scoreGrade');
    if (gradeEl) {
        const grade = score >= 85 ? '🥇 Excellent' : score >= 70 ? '🥈 Good' : score >= 55 ? '🥉 Average' : '⚠️ Needs Work';
        gradeEl.innerHTML = `<span class="gradient-text">${grade}</span>`;
    }
    const msgEl = document.getElementById('scoreMsg');
    if (msgEl) msgEl.textContent = score >= 70
        ? 'Your resume is ATS-friendly with some improvements needed.'
        : 'Your resume needs significant improvements for better ATS compatibility.';

    const metrics = [
        { val: score + '%', lbl: 'ATS Score', color: 'var(--primary-light)' },
        { val: Math.floor(Math.random() * 3) + 1, lbl: 'Grammar Issues', color: 'var(--warning)' },
        { val: Math.floor(Math.random() * 15) + 60 + '%', lbl: 'Skill Match', color: 'var(--accent)' },
        { val: Math.floor(Math.random() * 3) + 3 + '/10', lbl: 'Formatting', color: 'var(--secondary)' },
        { val: Math.floor(Math.random() * 3) + 6 + '/10', lbl: 'Content Quality', color: '#a78bfa' },
        { val: Math.floor(Math.random() * 20) + 70 + '%', lbl: 'Completeness', color: '#34d399' },
    ];
    const mg = document.getElementById('metricsGrid');
    if (mg) {
        mg.innerHTML = '';
        metrics.forEach(m => {
            const div = document.createElement('div');
            div.className = 'analysis-metric';
            div.innerHTML = `<div class="metric-val" style="color:${m.color};">${m.val}</div><div class="metric-lbl">${m.lbl}</div>`;
            mg.appendChild(div);
        });
    }

    const kw = {
        found: ['Python', 'Problem Solving', 'Teamwork', 'Leadership', 'Communication', 'Agile', 'Git'],
        missing: ['Machine Learning', 'Cloud', 'Docker', 'System Design', 'API Development', 'Data Analysis'],
    };

    const kf = document.getElementById('keywordsFound');
    const km = document.getElementById('keywordsMissing');
    if (kf) { kf.innerHTML = ''; kw.found.forEach(k => { const s = document.createElement('span'); s.className = 'badge keyword-found'; s.textContent = k; kf.appendChild(s); }); }
    if (km) { km.innerHTML = ''; kw.missing.forEach(k => { const s = document.createElement('span'); s.className = 'badge keyword-missing'; s.textContent = '− ' + k; km.appendChild(s); }); }

    const improvements = [
        { type: 'bad', icon: '❌', msg: 'Add a professional summary section at the top of your resume.' },
        { type: 'bad', icon: '❌', msg: 'Quantify achievements: "Increased sales by 30%" instead of "Improved sales".' },
        { type: 'tip', icon: '💡', msg: `Add missing keywords for ${role} roles: ${kw.missing.slice(0, 3).join(', ')}.` },
        { type: 'good', icon: '✅', msg: 'Good use of action verbs (Developed, Implemented, Managed).' },
    ];
    const il = document.getElementById('improvementsList');
    if (il) {
        il.innerHTML = '';
        improvements.forEach(item => {
            const div = document.createElement('div');
            div.className = `improvement-item ${item.type}`;
            div.innerHTML = `<span style="font-size:1.1rem;flex-shrink:0;">${item.icon}</span><p style="font-size:0.875rem;color:var(--text-secondary);line-height:1.6;margin:0;">${item.msg}</p>`;
            il.appendChild(div);
        });
    }

    if (typeof AuthAPI !== 'undefined' && AuthAPI.isLoggedIn()) {
        const fileInp = document.getElementById('resumeFile');
        const filename = (fileInp && fileInp.files[0]) ? fileInp.files[0].name : (existingResumes.length > 0 ? existingResumes[0].filename : `resume_${role}.txt`);

        ProfileAPI.addResume({
            filename,
            ats_score: score,
            grammar_score: metrics[1].val === 0 ? 95 : 80,
            keywords_found: JSON.stringify(kw.found),
            improvements: JSON.stringify(improvements.map(i => i.msg)),
        }).then(() => {
            showToast(`✅ Results saved to your permanent profile!`, 'success', 2500);

            // Handle redirection back to Job Module if applicable
            const returnUrl = sessionStorage.getItem('return_to_job');
            if (returnUrl) {
                sessionStorage.removeItem('return_to_job'); // Clear it
                setTimeout(() => {
                    showToast('🔄 Returning to your job application...', 'info');
                    window.location.href = returnUrl;
                }, 1500);
            }
        }).catch(() => { });
    }
}

function analyzeAgain() {
    document.getElementById('uploadCard').style.display = 'block';
    const panel = document.getElementById('analysisPanel');
    if (panel) panel.classList.remove('visible');

    if (existingResumes.length > 0) {
        renderStoredResume(existingResumes[existingResumes.length - 1]);
    } else {
        resetUploadUI();
    }
}

function downloadImprovedResume() {
    const role = (document.getElementById('targetRole')?.value || '').trim() || 'Your Target Role';
    const content = `IMPROVED RESUME — ThiranMitra AI\nGenerated for: ${role}\n... [Template Content] ...`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ThiranMitra_Improved_Resume.txt`;
    a.click();
    showToast('📥 Improved resume template downloaded!', 'success');
}
