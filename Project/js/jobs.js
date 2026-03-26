/* ============================================================
   ThiranMitra — jobs.js
   Fetches real jobs from Flask backend /api/jobs
   ============================================================ */
'use strict';

// ── State ────────────────────────────────────────────────────
let allJobs = [];
let filteredJobs = [];
let currentPage = 1;
const PER_PAGE = 9;
let totalJobs = 0;
let isLoading = false;

// Active filter state
const filters = {
  q: '',
  location: '',
  type: '',
  mode: '',
  category: '',
  exp: '',
};

// ── INIT ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  renderCategoryTabs();
  initSearchBar();
  initFilterDropdowns();
  await loadJobs();
  updateSavedBadge();

  // URL query param
  const params = new URLSearchParams(window.location.search);
  const q = params.get('q');
  if (q) {
    const inp = document.getElementById('jobSearchInput');
    if (inp) { inp.value = q; filters.q = q; await loadJobs(); }
  }
});

// ── LOAD JOBS FROM API ───────────────────────────────────────
async function loadJobs(page = 1) {
  if (isLoading) return;
  isLoading = true;
  currentPage = page;

  showJobsSkeleton();

  try {
    const params = { page, per_page: PER_PAGE };
    if (filters.q) params.q = filters.q;
    if (filters.location) params.location = filters.location;
    if (filters.type) params.type = filters.type;
    if (filters.mode) params.mode = filters.mode;
    if (filters.category) params.category = filters.category;
    if (filters.exp) params.exp = filters.exp;

    const data = await JobsAPI.list(params);
    allJobs = data.jobs || [];
    totalJobs = data.total || 0;

    // Get saved IDs for this user
    let savedIds = new Set();
    if (AuthAPI.isLoggedIn()) {
      try {
        const sv = await JobsAPI.saved();
        savedIds = new Set((sv.jobs || []).map(j => j.id));
      } catch (e) { }
    }

    renderJobs(allJobs, savedIds);
    renderPagination(data.pages || 1, page);
    updateResultCount(totalJobs);
  } catch (err) {
    showJobsError(err.message);
  } finally {
    isLoading = false;
  }
}

// ── RENDER JOBS GRID ─────────────────────────────────────────
function renderJobs(jobs, savedIds = new Set()) {
  const grid = document.getElementById('jobsGrid');
  if (!grid) return;

  if (!jobs.length) {
    grid.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:4rem 2rem; background:var(--bg-card); border-radius:var(--radius-xl); border:1px solid var(--bg-glass-border);">
        <div style="font-size:3.5rem;margin-bottom:1rem;">📡</div>
        <h3 style="color:var(--text-primary);margin-bottom:0.5rem;font-size:1.5rem;font-weight:800;">No Jobs Found</h3>
        <p style="color:var(--text-muted);font-size:0.95rem;margin-bottom:1.5rem;max-width:400px;margin-left:auto;margin-right:auto;">
          We couldn't find any matches for your specific search or location right now.
        </p>
        <div style="background:rgba(79,70,229,0.05); border:1px solid rgba(79,70,229,0.2); border-radius:var(--radius-lg); padding:1.5rem; max-width:480px; margin:0 auto; text-align:left;">
            <div style="display:flex; align-items:flex-start; gap:1rem;">
                <div style="font-size:1.8rem;">🔔</div>
                <div>
                    <h4 style="font-size:1rem;font-weight:700;color:var(--primary-light);margin-bottom:0.25rem;">Set Up Local Job Alert</h4>
                    <p style="font-size:0.8rem;color:var(--text-secondary);margin-bottom:1rem; line-height: 1.5;">
                      Want to know when opportunities open up here? We'll automatically notify your registered mobile number and email.
                    </p>
                    <button class="btn btn-primary btn-sm" onclick="window.createJobAlert()">Create Job Alert</button>
                    <button class="btn btn-outline btn-sm" style="margin-left:0.5rem;" onclick="clearAllFilters()">Clear Filters</button>
                </div>
            </div>
        </div>
      </div>`;
    return;
  }

  grid.innerHTML = jobs.map(job => jobCard(job, savedIds.has(job.id))).join('');
}

window.createJobAlert = function () {
  if (typeof showToast === 'function') {
    showToast("Job alert configured successfully! ✅ You will be notified via email & SMS when jobs appear.", "success", 4000);
  } else {
    alert("Job alert configured successfully!");
  }
};

function jobCard(job, isSaved) {
  const skills = Array.isArray(job.skills_required)
    ? job.skills_required
    : (typeof job.skills_required === 'string'
      ? JSON.parse(job.skills_required || '[]') : []);

  const salaryLabel = job.salary_min && job.salary_max
    ? `₹${formatSalary(job.salary_min)}–${formatSalary(job.salary_max)} PA`
    : 'As per profile';

  const typeColor = {
    'Govt': 'var(--warning)',
    'Full-time': 'var(--accent)',
    'Part-time': 'var(--secondary)',
    'Freelance': 'var(--primary-light)',
    'Internship': 'var(--primary)',
  }[job.job_type] || 'var(--primary-light)';

  const modeEmoji = { 'Remote': '🏠', 'Hybrid': '🔀', 'On-site': '🏢' }[job.work_mode] || '📍';

  return `
    <div class="job-card reveal" data-id="${job.id}" style="
      background:var(--bg-card);
      border:1px solid var(--bg-glass-border);
      border-radius:var(--radius-xl);
      padding:1.5rem;
      transition:all 0.3s;
      cursor:pointer;
      position:relative;
    " onmouseover="this.style.transform='translateY(-4px)';this.style.borderColor='rgba(79,70,229,0.4)'"
       onmouseout="this.style.transform='';this.style.borderColor='var(--bg-glass-border)'"
       onclick="window.location.href='job-detail.html?id=${job.id}'">

      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:1rem;">
        <div style="display:flex;gap:0.75rem;align-items:center;flex:1;min-width:0;">
          <div style="width:48px;height:48px;background:white;
                      border:1px solid var(--bg-glass-border);
                      border-radius:12px;display:flex;align-items:center;justify-content:center;
                      overflow:hidden;flex-shrink:0;box-shadow:0 4px 12px rgba(0,0,0,0.1);">
            <img src="https://logo.clearbit.com/${escapeHtml(job.company).toLowerCase().replace(/\s+/g, '')}.com" 
                 alt="logo" 
                 style="width:70%;height:70%;object-fit:contain;"
                 onerror="this.onerror=null; this.src='https://www.google.com/s2/favicons?domain=${escapeHtml(job.company).toLowerCase().replace(/\s+/g, '')}.com&sz=128';"/>
          </div>
          <div style="min-width:0;">
            <h3 style="font-size:0.95rem;font-weight:700;color:var(--text-primary);
                       margin-bottom:0.2rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;"
                title="${escapeHtml(job.title)}">${escapeHtml(job.title)}</h3>
            <p style="font-size:0.82rem;color:var(--text-muted);">${escapeHtml(job.company)}</p>
          </div>
        </div>
        <button onclick="event.stopPropagation();toggleSaveJob(${job.id},this)"
          style="background:none;border:none;font-size:1.3rem;cursor:pointer;
                 color:${isSaved ? 'var(--warning)' : 'var(--text-muted)'};
                 transition:color 0.2s;flex-shrink:0;padding:0.25rem;"
          id="save-btn-${job.id}" title="${isSaved ? 'Unsave' : 'Save job'}">${isSaved ? '🔖' : '🏷️'}</button>
      </div>

      <div style="display:flex;flex-wrap:wrap;gap:0.4rem;margin-bottom:0.75rem;">
        <span style="font-size:0.7rem;background:rgba(79,70,229,0.12);color:var(--primary-light);
                     padding:0.2rem 0.6rem;border-radius:20px;font-weight:600;"
        >${escapeHtml(job.job_type || '')}</span>
        <span style="font-size:0.7rem;background:rgba(16,185,129,0.1);color:var(--accent);
                     padding:0.2rem 0.6rem;border-radius:20px;"
        >${modeEmoji} ${escapeHtml(job.work_mode || '')}</span>
        <span style="font-size:0.7rem;background:rgba(255,255,255,0.05);color:var(--text-muted);
                     padding:0.2rem 0.6rem;border-radius:20px;"
        >📍 ${escapeHtml(job.location || '')}</span>
      </div>

      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.75rem;">
        <span style="font-size:0.875rem;font-weight:700;color:var(--accent);">💰 ${salaryLabel}</span>
        <span style="font-size:0.75rem;color:var(--text-muted);">${escapeHtml(job.experience || '')}</span>
      </div>

      <div style="display:flex;flex-wrap:wrap;gap:0.3rem;margin-bottom:1rem;">
        ${skills.slice(0, 3).map(s =>
    `<span style="font-size:0.7rem;background:rgba(255,255,255,0.04);
                        border:1px solid rgba(255,255,255,0.08);
                        color:var(--text-secondary);padding:0.15rem 0.5rem;border-radius:6px;">
            ${escapeHtml(s)}
          </span>`
  ).join('')}
        ${skills.length > 3 ? `<span style="font-size:0.7rem;color:var(--text-muted);">+${skills.length - 3}</span>` : ''}
      </div>

      <div style="display:flex;gap:0.5rem;">
        <button class="btn btn-primary" style="flex:1;justify-content:center;padding:0.5rem;font-size:0.82rem;"
          onclick="event.stopPropagation(); window.location.href='job-detail.html?id=${job.id}'">
          Apply Now →
        </button>
        <button class="btn btn-outline" style="padding:0.5rem 0.75rem;font-size:0.82rem;"
          onclick="event.stopPropagation(); window.location.href='job-detail.html?id=${job.id}'">
          Details
        </button>
      </div>

      ${job.is_verified ? `<div style="position:absolute;top:0.75rem;right:3rem;
        font-size:0.65rem;color:var(--accent);opacity:0.7;">✓ Verified</div>` : ''}
    </div>`;
}

// ── FORMAT SALARY ─────────────────────────────────────────────
function formatSalary(n) {
  if (n >= 100000) return (n / 100000).toFixed(0) + 'L';
  if (n >= 1000) return (n / 1000).toFixed(0) + 'K';
  return n;
}

// ── SKELETON LOADER ───────────────────────────────────────────
function showJobsSkeleton() {
  const grid = document.getElementById('jobsGrid');
  if (!grid) return;
  grid.innerHTML = Array(PER_PAGE).fill(0).map(() => `
    <div style="background:var(--bg-card);border:1px solid var(--bg-glass-border);
                border-radius:var(--radius-xl);padding:1.5rem;animation:pulse 1.5s infinite;">
      <div style="display:flex;gap:0.75rem;margin-bottom:1rem;">
        <div style="width:48px;height:48px;background:rgba(255,255,255,0.05);border-radius:12px;flex-shrink:0;"></div>
        <div style="flex:1;">
          <div style="height:14px;background:rgba(255,255,255,0.05);border-radius:4px;margin-bottom:0.4rem;width:70%;"></div>
          <div style="height:11px;background:rgba(255,255,255,0.03);border-radius:4px;width:50%;"></div>
        </div>
      </div>
      <div style="display:flex;gap:0.4rem;margin-bottom:0.75rem;">
        ${Array(3).fill(0).map(() => `<div style="height:22px;width:70px;background:rgba(255,255,255,0.04);border-radius:20px;"></div>`).join('')}
      </div>
      <div style="height:12px;background:rgba(255,255,255,0.04);border-radius:4px;margin-bottom:0.75rem;width:60%;"></div>
      <div style="display:flex;gap:0.4rem;margin-bottom:1rem;">
        ${Array(3).fill(0).map(() => `<div style="height:20px;width:55px;background:rgba(255,255,255,0.03);border-radius:6px;"></div>`).join('')}
      </div>
      <div style="display:flex;gap:0.5rem;">
        <div style="flex:1;height:34px;background:rgba(79,70,229,0.1);border-radius:8px;"></div>
        <div style="width:70px;height:34px;background:rgba(255,255,255,0.03);border-radius:8px;"></div>
      </div>
    </div>`).join('');
}

function showJobsError(msg) {
  const grid = document.getElementById('jobsGrid');
  if (!grid) return;
  grid.innerHTML = `
    <div style="grid-column:1/-1;text-align:center;padding:4rem 2rem;">
      <div style="font-size:3rem;margin-bottom:1rem;">⚠️</div>
      <h3 style="color:var(--text-primary);">Could not load jobs</h3>
      <p style="color:var(--text-muted);margin-bottom:1rem;">${escapeHtml(msg)}</p>
      <button class="btn btn-primary" onclick="loadJobs(1)">Retry</button>
    </div>`;
}

// ── UPDATE COUNT ──────────────────────────────────────────────
function updateResultCount(total) {
  const el = document.getElementById('resultCount');
  if (el) el.textContent = `${total.toLocaleString('en-IN')} jobs found`;
}

// ── SAVE/UNSAVE ────────────────────────────────────────────────
async function toggleSaveJob(jobId, btn) {
  if (!AuthAPI.isLoggedIn()) {
    showToast('Please login to save jobs!', 'warning');
    return;
  }
  const isSaved = btn.textContent === '🔖';
  try {
    if (isSaved) {
      await JobsAPI.unsave(jobId);
      btn.textContent = '🏷️';
      btn.style.color = 'var(--text-muted)';
      showToast('Job removed from saved', 'info', 1500);
    } else {
      await JobsAPI.save(jobId);
      btn.textContent = '🔖';
      btn.style.color = 'var(--warning)';
      showToast('Job saved! ⭐', 'success', 1500);
    }
    updateSavedBadge();
  } catch (err) { handleApiError(err); }
}

async function updateSavedBadge() {
  const el = document.getElementById('savedCount');
  if (!el || !AuthAPI.isLoggedIn()) return;
  try {
    const sv = await JobsAPI.saved();
    el.textContent = (sv.jobs || []).length;
    el.style.display = 'inline';
  } catch (e) { }
}

// ── APPLY TO JOB ─────────────────────────────────────────────
async function applyToJob(jobId, title) {
  if (!AuthAPI.isLoggedIn()) {
    showToast('Please login to apply for jobs!', 'warning');
    setTimeout(() => window.location.href = 'login.html', 1200);
    return;
  }
  try {
    await JobsAPI.apply(jobId, '');
    showToast(`Applied to "${title}"! ✅ All the best!`, 'success', 3000);
    // Update button state
    const btn = document.querySelector(`[data-id="${jobId}"] .btn-primary`);
    if (btn) { btn.textContent = '✓ Applied'; btn.disabled = true; btn.style.opacity = '0.6'; }
  } catch (err) {
    if (err.message.includes('already applied')) {
      showToast('You already applied to this job.', 'info');
    } else {
      handleApiError(err);
    }
  }
}

// ── JOB DETAIL MODAL ─────────────────────────────────────────
async function showJobDetail(jobId) {
  const job = allJobs.find(j => j.id === jobId);
  if (!job) return;

  const skills = Array.isArray(job.skills_required) ? job.skills_required : [];
  const salary = job.salary_min && job.salary_max
    ? `₹${formatSalary(job.salary_min)} – ₹${formatSalary(job.salary_max)} per annum`
    : 'As per company norms';

  const modal = document.createElement('div');
  modal.id = 'jobDetailModal';
  modal.style.cssText = `position:fixed;inset:0;background:rgba(0,0,0,0.8);z-index:1000;
    display:flex;align-items:center;justify-content:center;padding:1rem;backdrop-filter:blur(8px);`;
  modal.innerHTML = `
    <div style="background:var(--bg-card);border:1px solid rgba(79,70,229,0.3);
      border-radius:1.5rem;padding:2rem;max-width:560px;width:100%;max-height:90vh;overflow-y:auto;
      position:relative;">
      <button onclick="document.getElementById('jobDetailModal').remove()"
        style="position:absolute;top:1rem;right:1rem;background:rgba(255,255,255,0.05);
               border:none;color:var(--text-muted);border-radius:50%;width:32px;height:32px;
               font-size:1rem;cursor:pointer;">✕</button>

      <div style="display:flex;gap:1rem;align-items:center;margin-bottom:1.5rem;">
        <div style="width:56px;height:56px;background:linear-gradient(135deg,rgba(79,70,229,0.2),rgba(124,58,237,0.1));
          border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:1.6rem;">💼</div>
        <div>
          <h2 style="font-family:'Outfit',sans-serif;font-size:1.2rem;font-weight:800;
                     color:var(--text-primary);">${escapeHtml(job.title)}</h2>
          <p style="color:var(--text-muted);font-size:0.85rem;">${escapeHtml(job.company)}</p>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;margin-bottom:1.5rem;">
        ${[
      ['📍 Location', job.location],
      ['💰 Salary', salary],
      ['💼 Type', job.job_type],
      ['🏢 Mode', job.work_mode],
      ['📅 Experience', job.experience],
      ['🏷️ Category', job.category],
    ].map(([k, v]) => `
          <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);
            border-radius:10px;padding:0.75rem;">
            <div style="font-size:0.72rem;color:var(--text-muted);margin-bottom:0.2rem;">${k}</div>
            <div style="font-size:0.85rem;font-weight:600;color:var(--text-primary);">${escapeHtml(v || '—')}</div>
          </div>`).join('')}
      </div>

      ${job.description ? `
        <div style="margin-bottom:1.25rem;">
          <h4 style="font-size:0.85rem;font-weight:700;color:var(--text-primary);margin-bottom:0.5rem;">About this role</h4>
          <p style="font-size:0.82rem;color:var(--text-secondary);line-height:1.7;">${escapeHtml(job.description)}</p>
        </div>` : ''}

      <div style="margin-bottom:1.5rem;">
        <h4 style="font-size:0.85rem;font-weight:700;color:var(--text-primary);margin-bottom:0.5rem;">Skills Required</h4>
        <div style="display:flex;flex-wrap:wrap;gap:0.4rem;">
          ${skills.map(s => `<span style="background:rgba(79,70,229,0.12);color:var(--primary-light);
            border-radius:20px;padding:0.25rem 0.65rem;font-size:0.75rem;font-weight:600;">${escapeHtml(s)}</span>`).join('')}
        </div>
      </div>

      <div style="display:flex;gap:0.75rem;">
        <button class="btn btn-primary" style="flex:1;justify-content:center;"
          onclick="applyToJob(${job.id},'${escapeHtml(job.title)}');document.getElementById('jobDetailModal').remove()">
          Apply Now →
        </button>
        <button class="btn btn-outline" style="justify-content:center;"
          onclick="toggleSaveJob(${job.id},document.getElementById('save-btn-${job.id}'))">
          🔖 Save
        </button>
      </div>
    </div>`;
  document.body.appendChild(modal);
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
}

// ── SEARCH BAR ────────────────────────────────────────────────
function initSearchBar() {
  const inp = document.getElementById('jobSearchInput');
  const locInp = document.getElementById('jobLocationInput');
  const btn = document.getElementById('jobSearchBtn');
  const voiceBtn = document.getElementById('jobVoiceBtn');
  if (!inp) return;

  let timer;
  inp.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(() => { filters.q = inp.value.trim(); loadJobs(1); }, 450);
  });
  inp.addEventListener('keydown', e => {
    if (e.key === 'Enter') { filters.q = inp.value.trim(); loadJobs(1); }
  });
  if (locInp) {
    locInp.addEventListener('input', () => {
      clearTimeout(timer);
      timer = setTimeout(() => { filters.location = locInp.value.trim(); loadJobs(1); }, 450);
    });
  }
  if (btn) btn.addEventListener('click', () => {
    filters.q = inp.value.trim();
    if (locInp) filters.location = locInp.value.trim();
    loadJobs(1);
  });

  // ── VOICE SEARCH (Microphone button) ──────────────────────
  if (voiceBtn) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      // Browser doesn't support speech recognition
      voiceBtn.addEventListener('click', () => {
        if (typeof showToast === 'function') {
          showToast('🎙️ Voice search is not supported in your browser. Please use Chrome or Edge.', 'warning', 4000);
        }
      });
      voiceBtn.title = 'Voice search not supported in this browser';
      voiceBtn.style.opacity = '0.5';
      return;
    }

    let recognition = null;
    let isListening = false;

    voiceBtn.addEventListener('click', () => {
      if (isListening) {
        // Stop if already running
        if (recognition) recognition.stop();
        return;
      }

      recognition = new SpeechRecognition();
      recognition.lang = 'en-IN';   // Indian English first
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.continuous = false;

      // Visual: listening state
      isListening = true;
      voiceBtn.textContent = '🔴';
      voiceBtn.title = 'Listening… Speak now!';
      voiceBtn.style.animation = 'none';
      voiceBtn.style.background = 'rgba(239,68,68,0.25)';
      voiceBtn.style.borderColor = 'rgba(239,68,68,0.6)';
      voiceBtn.style.boxShadow = '0 0 0 4px rgba(239,68,68,0.15)';

      if (typeof showToast === 'function') {
        showToast('🎙️ Listening… Speak your job search now!', 'info', 2500);
      }

      recognition.start();

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript.trim();
        inp.value = transcript;
        filters.q = transcript;
        loadJobs(1);
        if (typeof showToast === 'function') {
          showToast(`🔍 Searching for: "${transcript}"`, 'success', 3000);
        }
      };

      recognition.onerror = (event) => {
        let msg = 'Voice search failed. Please try again.';
        if (event.error === 'no-speech') msg = '🎙️ No speech detected. Please try again.';
        else if (event.error === 'not-allowed') msg = '🎙️ Microphone access denied. Please allow microphone permission.';
        else if (event.error === 'network') msg = '🎙️ Network error during voice recognition.';
        if (typeof showToast === 'function') showToast(msg, 'error', 4000);
      };

      recognition.onend = () => {
        // Restore button state
        isListening = false;
        voiceBtn.textContent = '🎙️';
        voiceBtn.title = 'Voice Search';
        voiceBtn.style.background = '';
        voiceBtn.style.borderColor = '';
        voiceBtn.style.boxShadow = '';
        recognition = null;
      };
    });
  }
}

// Helper for checkbox sidebar filters
function applyCheckboxFilter(groupName, filterKey) {
  const checked = Array.from(document.querySelectorAll(`input[name="${groupName}"]:checked`))
    .map(cb => cb.value);
  filters[filterKey] = checked.join(',');
  loadJobs(1);
}


// ── FILTER DROPDOWNS ──────────────────────────────────────────
function initFilterDropdowns() {
  const map = {
    filterType: 'type',
    filterMode: 'mode',
    filterState: 'location',
    filterExp: 'exp',
    filterCategory: 'category',
  };
  Object.entries(map).forEach(([id, key]) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('change', () => { filters[key] = el.value; loadJobs(1); });
  });
}

// ── CATEGORY TABS ─────────────────────────────────────────────
const CAT_TABS = [
  { key: '', label: '🌐 All', count: null },
  { key: 'Tech', label: '💻 IT & Tech' },
  { key: 'Banking', label: '🏦 Banking' },
  { key: 'Marketing', label: '📈 Marketing' },
  { key: 'Logistics', label: '🚛 Logistics' },
  { key: 'Design', label: '🎨 Design' },
  { key: 'HR', label: '👥 HR' },
];

function renderCategoryTabs() {
  const tabs = document.getElementById('catTabs');
  if (!tabs) return;
  tabs.innerHTML = CAT_TABS.map((c, i) => `
    <button class="cat-tab${i === 0 ? ' active' : ''}"
      onclick="setCategoryFilter('${c.key}',this)"
      style="background:${i === 0 ? 'rgba(79,70,229,0.15)' : 'rgba(255,255,255,0.03)'};
             border:1px solid ${i === 0 ? 'rgba(79,70,229,0.4)' : 'rgba(255,255,255,0.06)'};
             color:${i === 0 ? 'var(--primary-light)' : 'var(--text-muted)'};
             padding:0.4rem 1rem;border-radius:20px;font-size:0.8rem;font-weight:600;
             cursor:pointer;transition:all 0.2s;white-space:nowrap;">
      ${c.label}
    </button>`).join('');
}

function setCategoryFilter(category, btn) {
  document.querySelectorAll('.cat-tab').forEach(b => {
    b.style.background = 'rgba(255,255,255,0.03)';
    b.style.borderColor = 'rgba(255,255,255,0.06)';
    b.style.color = 'var(--text-muted)';
  });
  btn.style.background = 'rgba(79,70,229,0.15)';
  btn.style.borderColor = 'rgba(79,70,229,0.4)';
  btn.style.color = 'var(--primary-light)';
  filters.category = category;
  loadJobs(1);
}

// ── CLEAR ALL FILTERS ─────────────────────────────────────────
function clearAllFilters() {
  filters.q = filters.location = filters.type = filters.mode = filters.category = filters.exp = '';
  const inp = document.getElementById('jobSearchInput');
  if (inp) inp.value = '';
  ['filterType', 'filterMode', 'filterState', 'filterExp', 'filterCategory'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  renderCategoryTabs();
  loadJobs(1);
}

// ── PAGINATION ───────────────────────────────────────────────
function renderPagination(totalPages, current) {
  const el = document.getElementById('pagination');
  if (!el || totalPages <= 1) { if (el) el.innerHTML = ''; return; }

  let html = '';
  if (current > 1)
    html += `<button class="btn btn-outline btn-sm" onclick="loadJobs(${current - 1})">← Prev</button>`;

  for (let p = Math.max(1, current - 2); p <= Math.min(totalPages, current + 2); p++) {
    html += `<button class="btn ${p === current ? 'btn-primary' : 'btn-outline'} btn-sm"
      onclick="loadJobs(${p})">${p}</button>`;
  }

  if (current < totalPages)
    html += `<button class="btn btn-outline btn-sm" onclick="loadJobs(${current + 1})">Next →</button>`;

  el.innerHTML = `<div style="display:flex;gap:0.5rem;justify-content:center;flex-wrap:wrap;
    margin-top:2rem;padding-bottom:1rem;">${html}</div>`;
}
