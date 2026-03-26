/* ============================================
   ThiranMitra — landing.js
   ============================================ */

'use strict';

// ── HERO COUNTER ANIMATION ─────────────────────
(function initHeroCounters() {
    const statNums = document.querySelectorAll('.stat-num[data-target]');
    if (!statNums.length) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            const el = entry.target;
            const target = parseInt(el.dataset.target);
            animateCounter(el, target, '', 2500);
            observer.unobserve(el);
        });
    }, { threshold: 0.5 });

    statNums.forEach(el => observer.observe(el));
})();

// ── SKILL DEMAND BARS ──────────────────────────
(function initSkillBars() {
    const container = document.getElementById('skillBars');
    if (!container) return;

    const skills = [
        { name: 'AI / Machine Learning', pct: 96, color: '#4f46e5' },
        { name: 'Full Stack Development', pct: 89, color: '#7c3aed' },
        { name: 'Data Analysis', pct: 84, color: '#3b82f6' },
        { name: 'Digital Marketing', pct: 78, color: '#06b6d4' },
        { name: 'Cloud Computing (AWS)', pct: 75, color: '#10b981' },
        { name: 'UI/UX Design', pct: 71, color: '#f97316' },
        { name: 'Cybersecurity', pct: 68, color: '#ec4899' },
        { name: 'ITI / Vocational Skills', pct: 65, color: '#f59e0b' },
    ];

    skills.forEach(s => {
        const item = document.createElement('div');
        item.className = 'skill-bar-item reveal';
        item.innerHTML = `
      <div class="skill-bar-header">
        <span class="skill-bar-name">${s.name}</span>
        <span class="skill-bar-val">${s.pct}%</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" style="width:0%;background:${s.color};transition:width 1.2s ease;" data-width="${s.pct}%"></div>
      </div>
    `;
        container.appendChild(item);
    });

    // Animate bars on scroll
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            entry.target.querySelectorAll('.progress-fill').forEach(bar => {
                setTimeout(() => { bar.style.width = bar.dataset.width; }, 200);
            });
        });
    }, { threshold: 0.3 });

    container.querySelectorAll('.skill-bar-item').forEach(el => observer.observe(el));
})();

// ── STATE HIRING TRENDS ────────────────────────
(function initStateTrends() {
    const container = document.getElementById('stateTrends');
    if (!container) return;

    const trends = [
        { state: 'Karnataka (Bengaluru)', growth: '+34%', trend: 'up' },
        { state: 'Maharashtra (Mumbai)', growth: '+27%', trend: 'up' },
        { state: 'Tamil Nadu (Chennai)', growth: '+24%', trend: 'up' },
        { state: 'Telangana (Hyderabad)', growth: '+22%', trend: 'up' },
        { state: 'Gujarat (Ahmedabad)', growth: '+19%', trend: 'up' },
        { state: 'Delhi NCR', growth: '+18%', trend: 'up' },
        { state: 'Uttar Pradesh', growth: '+15%', trend: 'up' },
        { state: 'Rajasthan', growth: '+12%', trend: 'up' },
    ];

    trends.forEach(t => {
        const el = document.createElement('div');
        el.className = 'state-trend-item';
        el.innerHTML = `
      <span class="state-name">📍 ${t.state}</span>
      <span class="state-growth">${t.growth}</span>
    `;
        container.appendChild(el);
    });
})();

// ── SALARY LIST ────────────────────────────────
(function initSalaryList() {
    const container = document.getElementById('salaryList');
    if (!container) return;

    const salaries = [
        { role: 'AI/ML Engineer', range: '₹15L–45L/yr' },
        { role: 'Full Stack Developer', range: '₹8L–25L/yr' },
        { role: 'Data Scientist', range: '₹10L–35L/yr' },
        { role: 'DevOps Engineer', range: '₹8L–28L/yr' },
        { role: 'Govt Officer (IAS)', range: '₹7L–30L/yr' },
        { role: 'Bank PO (SBI)', range: '₹5L–14L/yr' },
        { role: 'ITI Electrician', range: '₹2.4L–6L/yr' },
        { role: 'Digital Marketer', range: '₹3L–12L/yr' },
    ];

    salaries.forEach(s => {
        const el = document.createElement('div');
        el.className = 'salary-item';
        el.innerHTML = `
      <span class="salary-role">💼 ${s.role}</span>
      <span class="salary-amt">${s.range}</span>
    `;
        container.appendChild(el);
    });
})();

// ── TESTIMONIALS SLIDER ────────────────────────
(function initTestimonials() {
    const cards = document.querySelectorAll('.testimonial-card');
    const dotsEl = document.getElementById('testimonialDots');
    if (!cards.length || !dotsEl) return;

    let curr = 0;
    let autoTimer = null;

    // Build dots
    cards.forEach((_, i) => {
        const d = document.createElement('button');
        d.className = `testimonial-dot${i === 0 ? ' active' : ''}`;
        d.setAttribute('aria-label', `Testimonial ${i + 1}`);
        d.addEventListener('click', () => goTo(i));
        dotsEl.appendChild(d);
    });

    function goTo(idx) {
        cards[curr].classList.remove('active');
        dotsEl.children[curr].classList.remove('active');
        curr = (idx + cards.length) % cards.length;
        cards[curr].classList.add('active');
        dotsEl.children[curr].classList.add('active');
        resetAuto();
    }

    function resetAuto() {
        clearInterval(autoTimer);
        autoTimer = setInterval(() => goTo(curr + 1), 5000);
    }

    resetAuto();
})();

// ── TRUST TICKER ───────────────────────────────
(function initTicker() {
    const track = document.getElementById('tickerTrack');
    if (!track) return;

    const items = [
        '🏛️ Skill India',
        '🎓 PMKVY',
        '💼 PM Mudra Yojana',
        '🇮🇳 National Career Service',
        '🌐 Digital India',
        '🌾 MGNREGS',
        '🚀 Startup India',
        '📋 SSC Recruitment',
        '🚂 Indian Railways Jobs',
        '🏦 IBPS Banking',
        '📚 SWAYAM Courses',
        '🔬 NPTEL Certifications',
        '🏭 Make in India',
        '⚖️ UPSC Civil Services',
    ];

    const allItems = [...items, ...items]; // Duplicate for seamless loop
    allItems.forEach(text => {
        const span = document.createElement('span');
        span.className = 'ticker-item';
        span.innerHTML = `<span>${text}</span><span style="color:#1e293b;margin-left:2.5rem;">·</span>`;
        track.appendChild(span);
    });
})();

// ── VOICE SEARCH ON HERO ───────────────────────
document.addEventListener('DOMContentLoaded', () => {
    initVoiceSearch('heroSearch', 'voiceBtn');

    // Hero search on Enter key
    const heroSearch = document.getElementById('heroSearch');
    if (heroSearch) {
        heroSearch.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const q = heroSearch.value.trim();
                if (q) searchFor(q);
                else window.location.href = 'jobs.html';
            }
        });
    }

    // Search button
    const searchBtn = document.querySelector('.search-btn');
    if (searchBtn) {
        searchBtn.addEventListener('click', () => {
            const q = document.getElementById('heroSearch')?.value?.trim();
            if (q) searchFor(q);
            else window.location.href = 'jobs.html';
        });
    }
});
