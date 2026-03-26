/* ============================================================
   ThiranMitra — schemes.js
   Fetches real government scheme data from /api/schemes
   ============================================================ */
'use strict';

document.addEventListener('DOMContentLoaded', async () => {
    await loadSchemes();
});

let allSchemes = [];

async function loadSchemes(category = '') {
    const grid = document.getElementById('schemesGrid');
    if (!grid) return;
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--text-muted);">
    ⌛ Loading government schemes...</div>`;
    try {
        const params = category ? { category } : {};
        const data = await SchemesAPI.list(params);
        allSchemes = data.schemes || [];
        renderSchemes(allSchemes);
    } catch (err) {
        grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--text-muted);">
      ⚠️ Could not load schemes. Is the backend running?<br>
      <button class="btn btn-outline" style="margin-top:1rem;" onclick="loadSchemes()">Retry</button>
    </div>`;
    }
}

function renderSchemes(schemes) {
    const grid = document.getElementById('schemesGrid');
    if (!grid) return;
    if (!schemes.length) {
        grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--text-muted);">
      No schemes found for this category.</div>`;
        return;
    }

    const catEmoji = { skill: '🎓', loan: '💰', startup: '🚀', rural: '🌾', women: '👩‍💼' };
    const catColor = {
        skill: 'rgba(79,70,229,0.1)', loan: 'rgba(245,158,11,0.1)',
        startup: 'rgba(124,58,237,0.1)', rural: 'rgba(16,185,129,0.1)',
        women: 'rgba(236,72,153,0.1)',
    };

    grid.innerHTML = schemes.map(s => `
    <div class="reveal" style="
      background:var(--bg-card);
      border:1px solid var(--bg-glass-border);
      border-radius:var(--radius-xl);
      padding:1.5rem;
      transition:all 0.3s;
      display:flex;flex-direction:column;gap:0.75rem;"
      onmouseover="this.style.transform='translateY(-4px)';this.style.borderColor='rgba(79,70,229,0.3)'"
      onmouseout="this.style.transform='';this.style.borderColor='var(--bg-glass-border)'">

      <div style="display:flex;align-items:flex-start;gap:0.75rem;">
        <div style="font-size:2rem;">${catEmoji[s.category] || '🏛️'}</div>
        <div style="flex:1;min-width:0;">
          <h3 style="font-size:0.95rem;font-weight:800;color:var(--text-primary);margin-bottom:0.2rem;">${escapeHtml(s.name)}</h3>
          <span style="font-size:0.7rem;background:${catColor[s.category] || 'rgba(79,70,229,0.08)'};
            color:var(--primary-light);padding:0.15rem 0.5rem;border-radius:20px;font-weight:600;">
            ${s.ministry || 'Central Govt'}
          </span>
        </div>
      </div>

      <p style="font-size:0.82rem;color:var(--text-secondary);line-height:1.6;flex:1;">${escapeHtml(s.description)}</p>

      <div style="background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.15);
        border-radius:var(--radius-lg);padding:0.75rem;">
        <div style="font-size:0.72rem;color:var(--text-muted);margin-bottom:0.2rem;">BENEFIT</div>
        <div style="font-size:0.82rem;font-weight:700;color:var(--accent);">✅ ${escapeHtml(s.benefit || '')}</div>
      </div>

      <div style="font-size:0.75rem;color:var(--text-muted);">
        <strong style="color:var(--text-secondary);">Eligibility:</strong> ${escapeHtml(s.eligibility || 'All Indian citizens')}
      </div>

      <a href="${escapeHtml(s.apply_url || '#')}" target="_blank"
        class="btn btn-primary" style="justify-content:center;font-size:0.82rem;padding:0.6rem;">
        Apply / Learn More →
      </a>
    </div>`).join('');
}

function filterSchemesByCategory(cat, btn) {
    document.querySelectorAll('.scheme-cat-btn').forEach(b => {
        b.style.background = 'rgba(255,255,255,0.03)';
        b.style.borderColor = 'rgba(255,255,255,0.07)';
        b.style.color = 'var(--text-muted)';
    });
    btn.style.background = 'rgba(79,70,229,0.15)';
    btn.style.borderColor = 'rgba(79,70,229,0.4)';
    btn.style.color = 'var(--primary-light)';
    loadSchemes(cat);
}

function searchSchemes() {
    const q = (document.getElementById('schemeSearch')?.value || '').toLowerCase();
    const filtered = allSchemes.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        (s.ministry || '').toLowerCase().includes(q)
    );
    renderSchemes(filtered);
}
