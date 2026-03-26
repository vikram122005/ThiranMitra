/* ============================================
   ThiranMitra — main.js
   Core utilities shared across all pages
   ============================================ */

'use strict';

// ──────────────────────────────────────────────
//  NAVBAR SCROLL EFFECT + HAMBURGER
// ──────────────────────────────────────────────
(function initNavbar() {
  const navbar = document.getElementById('navbar');
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('navLinks');

  if (!navbar) return;

  const applyScroll = () => {
    if (window.scrollY > 30) navbar.classList.add('scrolled');
    else navbar.classList.remove('scrolled');
  };
  applyScroll();
  window.addEventListener('scroll', applyScroll, { passive: true });

  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      navLinks.classList.toggle('open');
      hamburger.classList.toggle('open');
    });
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('open');
        hamburger.classList.remove('open');
      });
    });
  }
})();

// ──────────────────────────────────────────────
//  SCROLL REVEAL (Intersection Observer)
// ──────────────────────────────────────────────
(function initScrollReveal() {
  const elements = document.querySelectorAll('.reveal');
  if (!elements.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

  elements.forEach(el => observer.observe(el));
})();

// ──────────────────────────────────────────────
//  CHATBOT
// ──────────────────────────────────────────────
function toggleChatbot() {
  const win = document.getElementById('chatbotWindow');
  const btn = document.getElementById('chatToggleBtn');
  if (!win) return;
  const isOpen = win.style.display !== 'none' && win.style.display !== '';
  win.style.display = isOpen ? 'none' : 'flex';
  if (!isOpen) win.style.flexDirection = 'column';
  if (btn) btn.textContent = isOpen ? '💬' : '✕';
}

function handleChatKey(e) {
  if (e.key === 'Enter') sendChat();
}

const chatResponses = {
  'job': '🔍 I can help you find jobs! Go to our <a href="jobs.html" style="color:#818cf8">Jobs Page</a> to search with filters for location, salary, experience, and more.',
  'resume': '📄 Improve your resume with our <a href="resume.html" style="color:#818cf8">AI Resume Analyzer</a>! Get ATS score, grammar check, and an auto-improved version.',
  'skill': '📊 Check your <a href="skills.html" style="color:#818cf8">Skill Gap Analysis</a> to see what skills you need to learn for your target job.',
  'interview': '🎤 Practice with our <a href="interview.html" style="color:#818cf8">AI Mock Interview Trainer</a>! Get communication scores and real-time feedback.',
  'government': '🏛️ Explore <a href="schemes.html" style="color:#818cf8">Government Schemes</a> like Skill India, PMKVY, and PMMY for skill and business loans.',
  'scheme': '🏛️ Explore <a href="schemes.html" style="color:#818cf8">Government Schemes</a> like Skill India, PMKVY, and PMMY for skill and business loans.',
  'startup': '🏭 Visit our <a href="entrepreneurship.html" style="color:#818cf8">Entrepreneurship Hub</a> for business ideas, investment estimates, and PMMY loan guidance.',
  'business': '🏭 Visit our <a href="entrepreneurship.html" style="color:#818cf8">Entrepreneurship Hub</a> for business ideas, investment estimates, and PMMY loan guidance.',
  'rural': '🌾 Check our <a href="rural.html" style="color:#818cf8">Rural Employment Mode</a> for local factory, driving, and ITI jobs near your village.',
  'women': '👩‍💼 Visit our <a href="women.html" style="color:#818cf8">Women Employment Support</a> for work-from-home and flexible job opportunities.',
  'salary': '💰 See our <a href="dashboard.html" style="color:#818cf8">AI Career Dashboard</a> for salary comparisons by role and region in India.',
  'register': '📝 <a href="register.html" style="color:#818cf8">Register here</a> — it\'s completely free! Create your profile and get AI-powered career recommendations.',
  'login': '🔐 Already registered? <a href="login.html" style="color:#818cf8">Login here</a> to access your personalized dashboard.',
  'placement': '🎓 Use our <a href="placement.html" style="color:#818cf8">Placement Readiness System</a> for aptitude tests, coding challenges, and mock interviews.',
  'aptitude': '🎓 Practice aptitude tests on our <a href="placement.html" style="color:#818cf8">Placement Readiness page</a>!',
  'scam': '🛡️ Never pay fees to apply for a job. All listings on ThiranMitra are verified. Report scams using the link in the footer.',
  'near': '📍 Our Smart Job Search finds jobs within 5-10km of your location! Visit <a href="jobs.html" style="color:#818cf8">Jobs page</a> to search by radius.',
  'loan': '💰 Explore <a href="schemes.html" style="color:#818cf8">Government Schemes</a> for PMMY loans up to ₹10 Lakh for your business!',
  'pmkvy': '🎓 PMKVY gives free skill training across 28 sectors with job placement support. Check <a href="schemes.html" style="color:#818cf8">Schemes</a> for enrollment.',
  'profile': '👤 Update your <a href="profile.html" style="color:#818cf8">Profile</a> to unlock better job matches and career predictions!',
  'help': '🙏 I can help with: job search, resume, interview prep, skill gap, government schemes, entrepreneurship, rural jobs, women\'s employment. What do you need?',
  'namaste': '🙏 Namaste! I\'m ThiranMitraBot. How can I help your career journey today? Type "help" to see all I can do!',
  'hello': '👋 Hello! I\'m ThiranMitraBot, your AI career assistant. How can I help you today?',
  'hi': '👋 Hi there! I\'m ThiranMitraBot. Ask me about jobs, skills, government schemes, or type "help".',
};

function sendChat() {
  const input = document.getElementById('chatInput');
  const messages = document.getElementById('chatMessages');
  if (!input || !messages) return;

  const text = input.value.trim();
  if (!text) return;

  const userMsg = document.createElement('div');
  userMsg.className = 'chat-msg user';
  userMsg.innerHTML = `<span>${escapeHtml(text)}</span>`;
  messages.appendChild(userMsg);
  input.value = '';

  const typing = document.createElement('div');
  typing.className = 'chat-msg bot';
  typing.innerHTML = `<span style="color:var(--text-muted);font-size:0.82rem;">⌛ ThiranMitraBot is typing...</span>`;
  messages.appendChild(typing);
  messages.scrollTop = messages.scrollHeight;

  setTimeout(() => {
    typing.remove();
    const reply = getBotReply(text.toLowerCase());
    const botMsg = document.createElement('div');
    botMsg.className = 'chat-msg bot';
    botMsg.innerHTML = `<span>${reply}</span>`;
    messages.appendChild(botMsg);
    messages.scrollTop = messages.scrollHeight;
  }, 700 + Math.random() * 400);
}

function getBotReply(text) {
  for (const [keyword, response] of Object.entries(chatResponses)) {
    if (text.includes(keyword)) return response;
  }
  return `🤔 I didn't quite get that. Try asking about: jobs, resume, interview, schemes, skills, rural jobs, women's jobs, or type <strong>"help"</strong> to see everything I can do!`;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(text));
  return div.innerHTML;
}

// ──────────────────────────────────────────────
//  TOAST NOTIFICATIONS
// ──────────────────────────────────────────────
function showToast(message, type = 'info', duration = 4000) {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const icons = { info: 'ℹ️', success: '✅', error: '❌', warning: '⚠️' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span style="flex-shrink:0;">${icons[type] || 'ℹ️'}</span>
    <span style="flex:1;">${message}</span>
    <button onclick="this.parentElement.remove()" style="margin-left:0.5rem;background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:0.9rem;flex-shrink:0;">✕</button>
  `;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'slideOutRight 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ──────────────────────────────────────────────
//  VOICE SEARCH
// ──────────────────────────────────────────────
function initVoiceSearch(inputId, btnId) {
  const btn = document.getElementById(btnId);
  const input = document.getElementById(inputId);
  if (!btn || !input) return;

  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    btn.title = 'Voice search not supported in this browser';
    btn.style.opacity = '0.4';
    return;
  }

  const SRClass = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SRClass();
  recognition.lang = 'en-IN';
  recognition.continuous = false;
  recognition.interimResults = false;

  let listening = false;

  recognition.onstart = () => { btn.classList.add('listening'); listening = true; btn.textContent = '🔴'; };
  recognition.onend = () => { btn.classList.remove('listening'); listening = false; btn.textContent = '🎙️'; };
  recognition.onresult = (e) => {
    const transcript = e.results[0][0].transcript;
    input.value = transcript;
    showToast(`🎙️ Heard: "${transcript}"`, 'success', 2500);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  };
  recognition.onerror = (e) => {
    btn.classList.remove('listening');
    listening = false;
    btn.textContent = '🎙️';
    if (e.error !== 'no-speech') showToast('Voice recognition failed. Please try again.', 'error');
  };

  btn.addEventListener('click', () => {
    if (listening) { recognition.stop(); return; }
    try { recognition.start(); } catch (e) { }
  });
}

// ──────────────────────────────────────────────
//  COUNTER ANIMATION
// ──────────────────────────────────────────────
function animateCounter(el, target, suffix = '', duration = 2200) {
  const startTime = performance.now();

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 4);
    const current = Math.floor(target * eased);

    if (target >= 1000000) {
      el.textContent = (current / 100000).toFixed(1) + 'L+';
    } else if (target >= 1000) {
      el.textContent = (current / 1000).toFixed(0) + 'K+';
    } else {
      el.textContent = current + suffix;
    }

    if (progress < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

// ──────────────────────────────────────────────
//  FORM VALIDATION HELPERS
// ──────────────────────────────────────────────
function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}
function validatePhone(phone) {
  return /^[6-9]\d{9}$/.test(phone.trim().replace(/\s/g, ''));
}
function validatePassword(pass) {
  return pass.length >= 8;
}

function showFieldError(inputEl, msg) {
  clearFieldError(inputEl);
  const err = document.createElement('div');
  err.className = 'field-error';
  err.style.cssText = 'color:var(--danger);font-size:0.75rem;margin-top:0.375rem;display:flex;align-items:center;gap:0.25rem;';
  err.innerHTML = `<span>⚠️</span><span>${msg}</span>`;
  inputEl.parentElement.appendChild(err);
  inputEl.style.borderColor = 'var(--danger)';
  inputEl.style.boxShadow = '0 0 0 3px rgba(239,68,68,0.1)';
}

function clearFieldError(inputEl) {
  const err = inputEl.parentElement.querySelector('.field-error');
  if (err) err.remove();
  inputEl.style.borderColor = '';
  inputEl.style.boxShadow = '';
}

// ──────────────────────────────────────────────
//  LOCAL STORAGE HELPERS
// ──────────────────────────────────────────────
const Storage = {
  set(key, val) {
    try { localStorage.setItem('wm_' + key, JSON.stringify(val)); } catch (e) { }
  },
  get(key, fallback = null) {
    try {
      const v = localStorage.getItem('wm_' + key);
      return v !== null ? JSON.parse(v) : fallback;
    } catch (e) { return fallback; }
  },
  remove(key) {
    try { localStorage.removeItem('wm_' + key); } catch (e) { }
  }
};

// ──────────────────────────────────────────────
//  AUTH STATE -- delegates to api.js AuthAPI when available
// ──────────────────────────────────────────────
function isLoggedIn() {
  if (typeof AuthAPI !== 'undefined') return AuthAPI.isLoggedIn();
  return !!localStorage.getItem('wm_token');
}

function getCurrentUser() {
  if (typeof AuthAPI !== 'undefined') return AuthAPI.currentUser() || { name: 'Guest User', email: '' };
  try { return JSON.parse(localStorage.getItem('wm_user') || 'null') || { name: 'Guest User', email: '' }; }
  catch { return { name: 'Guest User', email: '' }; }
}

function logout() {
  if (typeof AuthAPI !== 'undefined') { AuthAPI.logout(); return; }
  localStorage.removeItem('wm_token');
  localStorage.removeItem('wm_user');
  showToast('You\'ve been logged out. See you soon! 👋', 'info', 2000);
  setTimeout(() => { window.location.href = 'index.html'; }, 1800);
}

// ──────────────────────────────────────────────
//  SEARCH
// ──────────────────────────────────────────────
function searchFor(query) {
  window.location.href = `jobs.html?q=${encodeURIComponent(query)}`;
}

// ──────────────────────────────────────────────
//  SCROLL TO TOP BUTTON
// ──────────────────────────────────────────────
(function initScrollTop() {
  const btn = document.createElement('button');
  btn.id = 'scrollTopBtn';
  btn.innerHTML = '↑';
  btn.title = 'Back to top';
  btn.setAttribute('aria-label', 'Scroll to top');
  btn.style.cssText = `
    position:fixed;bottom:7rem;right:2rem;
    width:42px;height:42px;border-radius:50%;
    background:var(--bg-card2);border:1px solid var(--bg-glass-border);
    color:var(--text-secondary);font-size:1.1rem;cursor:pointer;
    z-index:400;opacity:0;pointer-events:none;
    transition:all 0.3s;
    display:flex;align-items:center;justify-content:center;
    box-shadow:var(--shadow-md);
  `;
  document.body.appendChild(btn);

  window.addEventListener('scroll', () => {
    const show = window.scrollY > 500;
    btn.style.opacity = show ? '1' : '0';
    btn.style.pointerEvents = show ? 'auto' : 'none';
  }, { passive: true });

  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
})();

// ──────────────────────────────────────────────
//  AUTO HIGHLIGHT ACTIVE NAV LINK
// ──────────────────────────────────────────────
(function highlightActiveNav() {
  const page = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link').forEach(link => {
    const href = link.getAttribute('href') || '';
    if (href === page || (page === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });
})();

// ──────────────────────────────────────────────
//  USER GREETING (show name if logged in)
// ──────────────────────────────────────────────
(function showUserGreeting() {
  // Try api.js user first, then fallback to old storage
  let user = null;
  try { user = JSON.parse(localStorage.getItem('wm_user') || 'null'); } catch { }
  const nameEl = document.getElementById('navUserName');
  if (nameEl && user && user.name) {
    nameEl.textContent = user.name;
  }
})();

// ──────────────────────────────────────────────
//  MODAL UTILITIES
// ──────────────────────────────────────────────
function openModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal(id);
  });
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.style.display = 'none';
  document.body.style.overflow = '';
}

// Close modal on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal[style*="flex"]').forEach(m => {
      m.style.display = 'none';
      document.body.style.overflow = '';
    });
  }
});

// ──────────────────────────────────────────────
//  LOADING OVERLAY
// ──────────────────────────────────────────────
function showLoadingOverlay(text = 'Processing...') {
  let overlay = document.getElementById('loadingOverlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'loadingOverlay';
    overlay.className = 'loading-overlay';
    overlay.innerHTML = `
      <div class="loading-spinner"></div>
      <div class="loading-text" id="loadingText">${text}</div>
    `;
    document.body.appendChild(overlay);
  } else {
    overlay.style.display = 'flex';
    const lt = document.getElementById('loadingText');
    if (lt) lt.textContent = text;
  }
}

function hideLoadingOverlay() {
  const overlay = document.getElementById('loadingOverlay');
  if (overlay) overlay.style.display = 'none';
}

// ──────────────────────────────────────────────
//  COPY TO CLIPBOARD
// ──────────────────────────────────────────────
function copyToClipboard(text, label = 'Text') {
  navigator.clipboard.writeText(text).then(() => {
    showToast(`${label} copied to clipboard! ✅`, 'success', 2000);
  }).catch(() => {
    showToast('Copy failed. Please copy manually.', 'error');
  });
}

// ──────────────────────────────────────────────
//  SHARE CONTENT (Web Share API with fallback)
// ──────────────────────────────────────────────
function shareContent(title, text, url = window.location.href) {
  if (navigator.share) {
    navigator.share({ title, text, url }).catch(() => { });
  } else {
    navigator.clipboard.writeText(url).then(() => {
      showToast('🔗 Link copied to clipboard!', 'success', 2000);
    }).catch(() => {
      showToast('Share: ' + url, 'info', 5000);
    });
  }
}

// ──────────────────────────────────────────────
//  PAGE TRANSITION (smooth fade-in)
// ──────────────────────────────────────────────
(function initPageTransition() {
  document.body.style.opacity = '0';
  document.body.style.transition = 'opacity 0.35s ease';
  window.addEventListener('load', () => {
    requestAnimationFrame(() => {
      document.body.style.opacity = '1';
    });
  });

  document.querySelectorAll('a[href]').forEach(link => {
    const href = link.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('tel:') || href.startsWith('mailto:')) return;
    link.addEventListener('click', (e) => {
      const isModified = e.ctrlKey || e.shiftKey || e.metaKey || e.altKey;
      if (isModified || link.target === '_blank') return;
      e.preventDefault();
      document.body.style.opacity = '0';
      setTimeout(() => window.location.href = href, 300);
    });
  });
})();

// ──────────────────────────────────────────────
//  TOAST KEYFRAME INJECTION
// ──────────────────────────────────────────────
(function addToastKeyframes() {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideOutRight {
      to { transform: translateX(120%); opacity: 0; }
    }
    @keyframes slideInRight {
      from { transform: translateX(120%); opacity: 0; }
      to   { transform: translateX(0); opacity: 1; }
    }
    .toast { animation: slideInRight 0.35s cubic-bezier(0.34,1.56,0.64,1); }
  `;
  document.head.appendChild(style);
})();
