/* ============================================================
   ThiranMitra — dashboard.js
   Powers the AI Career Dashboard with real backend data
   ============================================================ */
'use strict';

const initDashboard = async () => {
  if (!requireAuth()) return;
  await loadDashboard();
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDashboard);
} else {
  initDashboard();
}

async function loadDashboard() {
  try {
    const data = await DashboardAPI.get();
    renderWelcome(data);
    renderScoreBars(data);
    renderProfileSidebar(data);
    renderPredictions(data.career_predictions || []);
    renderSkillGap(data.skill_gap || []);
    renderTimeline();
    await renderRecommendedJobs();
    await renderNotifications();
  } catch (err) {
    showToast('Could not load dashboard — is the backend running? (python backend/app.py)', 'error', 6000);
    console.error(err);
    // Fallback: show guest state
    const greet = document.getElementById('dashGreeting');
    if (greet) greet.textContent = 'Welcome to ThiranMitra! 👋';
    const sub = document.getElementById('dashSubtitle');
    if (sub) sub.textContent = 'Start your career journey by completing your profile.';
  }
}

// ── WELCOME ───────────────────────────────────────────────────
function renderWelcome(data) {
  const user = data.user || {};
  const name = (user.name || 'User').split(' ')[0];
  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  const el = document.getElementById('dashGreeting');
  if (el) el.innerHTML = `${greet}, <span class="gradient-text">${escapeHtml(name)}!</span> 👋`;
  const sub = document.getElementById('dashSubtitle');
  if (sub) sub.textContent = `Here's your AI-powered career snapshot · ${new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}`;
  const nav = document.getElementById('navUserName');
  if (nav) nav.textContent = name;
  const hAvEl = document.getElementById('headerAvatar');
  const initial = (user.name || 'U').charAt(0).toUpperCase();
  if (hAvEl) hAvEl.innerHTML = `<div style="width:100%;height:100%;background:linear-gradient(135deg, var(--primary), var(--secondary));display:flex;align-items:center;justify-content:center;font-size:0.9rem;font-weight:800;color:white;border-radius:50%;">${initial}</div>`;
}

// ── SCORE PROGRESS BARS ───────────────────────────────────────
function renderScoreBars(data) {
  const slots = [
    { val: 'resumeScoreVal', bar: 'resumeBar', v: data.resume_ats },
    { val: 'skillScoreVal', bar: 'skillBar', v: (data.skills || []).length * 5 },
    { val: 'placementScoreVal', bar: 'placementBar', v: data.placement_score },
    { val: 'interviewScoreVal', bar: 'interviewBar', v: data.interview_score },
  ];
  slots.forEach(({ val, bar, v }) => {
    const numEl = document.getElementById(val);
    const barEl = document.getElementById(bar);
    const display = v != null ? Math.min(100, v) : 0;
    if (numEl) numEl.textContent = v != null ? Math.min(100, v) : '—';
    if (barEl) {
      barEl.style.width = '0%';
      setTimeout(() => { barEl.style.transition = 'width 1.2s ease'; barEl.style.width = display + '%'; }, 300);
    }
  });

  // Sidebar stats
  const pct = document.getElementById('profilePct');
  const pBar = document.getElementById('profileBar');
  const pc = data.profile_completion || 0;
  if (pct) pct.textContent = pc + '%';
  if (pBar) { pBar.style.width = '0%'; setTimeout(() => { pBar.style.transition = 'width 1s ease'; pBar.style.width = pc + '%'; }, 400); }
}

// ── SIDEBAR ───────────────────────────────────────────────────
function renderProfileSidebar(data) {
  const user = data.user || {};
  const name = document.getElementById('sidebarName');
  const sub = document.getElementById('sidebarSub');
  const avEl = document.getElementById('sidebarAvatar');
  
  const displayName = user.name || 'User';
  const initial = displayName.charAt(0).toUpperCase();
  const subtitle = user.city ? `📍 ${user.city}` : 'Career Enthusiast';

  if (name) name.textContent = displayName;
  if (sub) sub.textContent = subtitle;
  if (avEl) avEl.innerHTML = `<div style="width:100%;height:100%;background:linear-gradient(135deg, var(--primary), var(--secondary));display:flex;align-items:center;justify-content:center;font-size:2rem;font-weight:800;color:white;border-radius:50%;">${initial}</div>`;
}

// ── CAREER PREDICTIONS ────────────────────────────────────────
function renderPredictions(predictions) {
  const el = document.getElementById('predictionItems');
  if (!el) return;
  if (!predictions.length) {
    el.innerHTML = `<p style="color:var(--text-muted);font-size:0.82rem;text-align:center;padding:1rem;">
      Add skills to your profile to get AI career predictions! 🤖</p>`;
    return;
  }
  el.innerHTML = predictions.map(p => `
    <div style="margin-bottom:0.75rem;">
      <div style="display:flex;justify-content:space-between;margin-bottom:0.3rem;">
        <span style="font-size:0.85rem;font-weight:600;color:var(--text-primary);">
          ${p.icon || '💼'} ${escapeHtml(p.role)}</span>
        <span style="font-size:0.78rem;font-weight:700;color:var(--primary-light);">${p.match}%</span>
      </div>
      <div style="height:6px;background:rgba(255,255,255,0.06);border-radius:3px;overflow:hidden;">
        <div style="width:0%;height:100%;background:linear-gradient(135deg,#4f46e5,#7c3aed);
          border-radius:3px;transition:width 1.2s ease;" data-w="${p.match}"></div>
      </div>
      <a href="jobs.html?q=${encodeURIComponent(p.role)}"
        style="font-size:0.72rem;color:var(--primary-light);text-decoration:none;">Find Jobs →</a>
    </div>`).join('');

  // Animate bars after paint
  setTimeout(() => {
    el.querySelectorAll('[data-w]').forEach(b => b.style.width = b.dataset.w + '%');
  }, 400);
}

// ── SKILL GAP ─────────────────────────────────────────────────
function renderSkillGap(gaps) {
  const el = document.getElementById('skillGapWidget');
  if (!el) return;
  if (!gaps.length) {
    el.innerHTML = `<p style="color:var(--accent);font-size:0.82rem;">✨ Your skills are well-rounded!</p>`;
    return;
  }
  el.innerHTML = `
    <p style="font-size:0.78rem;color:var(--text-muted);margin-bottom:0.5rem;">Skills to learn for better matches:</p>
    <div style="display:flex;flex-wrap:wrap;gap:0.4rem;">
      ${gaps.map(s => `
        <a href="skills.html" style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);
          color:#f87171;border-radius:20px;padding:0.25rem 0.6rem;font-size:0.75rem;
          font-weight:600;text-decoration:none;">+ ${escapeHtml(s)}</a>`).join('')}
    </div>`;
}

// ── CAREER TIMELINE ───────────────────────────────────────────
function renderTimeline() {
  const el = document.getElementById('careerTimeline');
  if (!el) return;
  const steps = [
    { done: true, icon: '✅', label: 'Account Created', sub: 'Welcome to ThiranMitra!' },
    { done: false, icon: '📄', label: 'Upload Your Resume', sub: 'Get ATS score & improvements' },
    { done: false, icon: '⚡', label: 'Complete Skills Profile', sub: 'Get AI job recommendations' },
    { done: false, icon: '🎤', label: 'Take Mock Interview', sub: 'Score your readiness' },
    { done: false, icon: '🚀', label: 'Apply to 5 Jobs', sub: 'Your career launch begins' },
  ];
  el.innerHTML = steps.map(s => `
    <div style="display:flex;gap:0.75rem;align-items:flex-start;margin-bottom:0.875rem;">
      <div style="width:32px;height:32px;border-radius:50%;
        background:${s.done ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.05)'};
        border:2px solid ${s.done ? 'var(--accent)' : 'rgba(255,255,255,0.1)'};
        display:flex;align-items:center;justify-content:center;font-size:0.85rem;flex-shrink:0;">${s.icon}</div>
      <div>
        <div style="font-size:0.85rem;font-weight:700;color:${s.done ? 'var(--accent)' : 'var(--text-primary)'};">${s.label}</div>
        <div style="font-size:0.75rem;color:var(--text-muted);">${s.sub}</div>
      </div>
    </div>`).join('');
}

// ── RECOMMENDED JOBS ─────────────────────────────────────────
async function renderRecommendedJobs() {
  const el = document.getElementById('recommendedJobs');
  if (!el) return;
  el.innerHTML = `<p style="color:var(--text-muted);font-size:0.82rem;text-align:center;padding:1.5rem;">⌛ Loading...</p>`;
  try {
    const data = await JobsAPI.recommended();
    const jobs = (data.jobs || []).slice(0, 5);
    if (!jobs.length) {
      el.innerHTML = `<p style="color:var(--text-muted);font-size:0.82rem;text-align:center;padding:1rem;">
        Add skills to get personalised recommendations!</p>
        <a href="profile.html" class="btn btn-outline" style="width:100%;justify-content:center;font-size:0.8rem;">Add Skills →</a>`;
      return;
    }
    el.innerHTML = jobs.map(job => {
      const sal = job.salary_min && job.salary_max
        ? `₹${Math.round(job.salary_min / 100000)}–${Math.round(job.salary_max / 100000)}L`
        : 'Competitive';
      const domain = job.company.toLowerCase().replace(/\s+/g, '') + '.com';
      return `
        <div style="display:flex;align-items:center;justify-content:space-between;
          padding:0.75rem;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.05);
          border-radius:var(--radius-lg);margin-bottom:0.4rem;gap:0.75rem;transition:all 0.2s;"
          onmouseover="this.style.borderColor='rgba(79,70,229,0.3)'"
          onmouseout="this.style.borderColor='rgba(255,255,255,0.05)'">
          <div style="width:36px;height:36px;background:white;border-radius:8px;display:flex;align-items:center;justify-content:center;overflow:hidden;flex-shrink:0;">
            <img src="https://logo.clearbit.com/${domain}" onerror="this.onerror=null; this.src='https://www.google.com/s2/favicons?domain=${domain}&sz=64';" style="width:70%;height:70%;object-fit:contain;">
          </div>
          <div style="min-width:0;flex:1;">
            <div style="font-size:0.82rem;font-weight:700;color:var(--text-primary);
              overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(job.title)}</div>
            <div style="font-size:0.72rem;color:var(--text-muted);">${escapeHtml(job.company)} · ${sal}</div>
          </div>
          <button onclick="quickApply(${job.id},'${escapeHtml(job.title)}',this)"
            style="background:rgba(79,70,229,0.15);border:1px solid rgba(79,70,229,0.3);
              color:var(--primary-light);border-radius:8px;padding:0.25rem 0.6rem;
              font-size:0.7rem;cursor:pointer;white-space:nowrap;flex-shrink:0;">Apply →</button>
        </div>`;
    }).join('') + `<a href="jobs.html" class="btn btn-outline" style="width:100%;justify-content:center;margin-top:0.5rem;font-size:0.8rem;">View All Jobs</a>`;
  } catch (e) {
    el.innerHTML = `<p style="color:var(--text-muted);font-size:0.82rem;text-align:center;">Could not load recommendations.</p>`;
  }
}

async function quickApply(id, title, btn) {
  try {
    await JobsAPI.apply(id, '');
    btn.textContent = '✓ Applied';
    btn.disabled = true;
    btn.style.opacity = '0.6';
    showToast(`Applied to "${title}"! ✅`, 'success', 2500);
  } catch (err) {
    if (err.message.includes('already')) showToast('Already applied!', 'info');
    else handleApiError(err);
  }
}

// ── NOTIFICATIONS FEED ────────────────────────────────────────
async function renderNotifications() {
  const el = document.getElementById('notificationsFeed');
  if (!el) return;
  const items = [
    { icon: '🆕', text: '18 new jobs matching your profile', time: '2h ago', color: 'var(--primary-light)' },
    { icon: '📊', text: 'Skill gap detected: Learn Docker & AWS', time: '1d ago', color: 'var(--warning)' },
    { icon: '🎯', text: 'Resume score can be improved by 20 pts', time: '2d ago', color: 'var(--accent)' },
    { icon: '🏛️', text: 'PMKVY free training registration open', time: '3d ago', color: 'var(--secondary)' },
  ];
  el.innerHTML = items.map(n => `
    <div style="display:flex;gap:0.75rem;padding:0.75rem;border-bottom:1px solid rgba(255,255,255,0.04);">
      <div style="font-size:1.25rem;">${n.icon}</div>
      <div>
        <div style="font-size:0.8rem;color:var(--text-primary);line-height:1.4;">${n.text}</div>
        <div style="font-size:0.7rem;color:var(--text-muted);margin-top:0.2rem;">${n.time}</div>
      </div>
    </div>`).join('');
}

// ── SIDEBAR INTERACTIONS ──────────────────────────────────────
document.addEventListener('click', e => {
  if (e.target.closest('#notifSidebarLink')) {
    const panel = document.getElementById('notificationsPanel');
    if (panel) {
      panel.style.transition = 'all 0.4s ease';
      panel.style.boxShadow = '0 0 30px rgba(79, 70, 229, 0.4)';
      panel.style.borderColor = 'var(--primary-light)';
      setTimeout(() => {
        panel.style.boxShadow = '';
        panel.style.borderColor = '';
      }, 2000);
    }
  }
});
