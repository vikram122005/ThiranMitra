/* ================================================================
   ThiranMitra — page-transition.js  (SPA-style Navigation Engine)
   ----------------------------------------------------------------
   Intercepts all internal navigation links across the site.
   Fetches new page content via XHR, swaps core content with
   smooth slide+fade animation, updates sidebar active state,
   re-executes page scripts, and caches recently-visited pages.

   NO React. NO build step. Pure vanilla JS.
   Works with existing multi-page HTML structure as-is.

   Key behaviors:
   - Same-domain links → intercepted and animated
   - Auth-only pages (login/register) → treated as full nav
   - Back/forward browser buttons → handled via History API
   - Active sidebar item updates instantly on click
   - Skeleton loader shows if fetch takes > 200ms
   - Page scripts in <body> re-fire after content swap
   ================================================================ */

'use strict';

(function () {

    /* ── CONFIG ─────────────────────────────────────────────────── */
    const TRANSITION_MS = 420;    // animation duration in ms
    const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minute page cache
    const SKELETON_DELAY_MS = 200;   // show skeleton if fetch > 200ms

    /* Pages that always do full navigation (auth + special pages) */
    const FULL_NAV_PAGES = new Set([
        'login.html', 'register.html', '404.html'
    ]);

    /* Selectors for swappable content regions (ordered by priority) */
    const MAIN_SELECTORS = [
        '.dash-main',        // dashboard page content
        '.jobs-layout',      // jobs page
        '.profile-layout',   // profile page
    ];

    /* Selector for page wrapper that receives exit animation (fullscreen fallback) */
    const WRAP_SELECTOR = 'body';

    /* Cache: { url → { html: string, timestamp: number } } */
    const pageCache = new Map();

    /* Track in-flight fetch to avoid double requests */
    let pendingFetch = null;
    let isNavigating = false;

    /* ── SKELETON TEMPLATE ───────────────────────────────────────── */
    function buildSkeleton() {
        return `
        <div class="wm-skeleton-wrap" aria-hidden="true">
            <div class="wm-skel wm-skel-title"></div>
            <div class="wm-skel wm-skel-sub"></div>
            <div class="wm-skel-cards">
                <div class="wm-skel wm-skel-card"></div>
                <div class="wm-skel wm-skel-card"></div>
                <div class="wm-skel wm-skel-card"></div>
                <div class="wm-skel wm-skel-card"></div>
            </div>
            <div class="wm-skel-row">
                <div class="wm-skel wm-skel-block"></div>
                <div class="wm-skel wm-skel-block"></div>
            </div>
            <div class="wm-skel-row">
                <div class="wm-skel wm-skel-block"></div>
                <div class="wm-skel wm-skel-block"></div>
            </div>
        </div>`;
    }

    /* ── INJECT CSS ─────────────────────────────────────────────── */
    function injectStyles() {
        if (document.getElementById('wm-spa-styles')) return;
        const style = document.createElement('style');
        style.id = 'wm-spa-styles';
        style.textContent = `

/* ── Page exit / entry transitions ─────────────────────────── */
.wm-page-exit {
    animation: wmExitLeft ${TRANSITION_MS}ms cubic-bezier(0.4, 0, 0.2, 1) forwards;
    pointer-events: none;
    will-change: opacity, transform;
}
.wm-page-enter {
    animation: wmEnterRight ${TRANSITION_MS}ms cubic-bezier(0.4, 0, 0.2, 1) forwards;
    will-change: opacity, transform;
}
.wm-page-enter-back {
    animation: wmEnterLeft ${TRANSITION_MS}ms cubic-bezier(0.4, 0, 0.2, 1) forwards;
    will-change: opacity, transform;
}
.wm-page-exit-back {
    animation: wmExitRight ${TRANSITION_MS}ms cubic-bezier(0.4, 0, 0.2, 1) forwards;
    pointer-events: none;
    will-change: opacity, transform;
}

@keyframes wmExitLeft {
    0%   { opacity: 1;   transform: translateX(0)    scale(1);    filter: blur(0px); }
    100% { opacity: 0;   transform: translateX(-28px) scale(0.98); filter: blur(3px); }
}
@keyframes wmEnterRight {
    0%   { opacity: 0;   transform: translateX(32px)  scale(0.98); filter: blur(3px); }
    100% { opacity: 1;   transform: translateX(0)     scale(1);    filter: blur(0px); }
}
@keyframes wmExitRight {
    0%   { opacity: 1;   transform: translateX(0)    scale(1);    filter: blur(0px); }
    100% { opacity: 0;   transform: translateX(28px)  scale(0.98); filter: blur(3px); }
}
@keyframes wmEnterLeft {
    0%   { opacity: 0;   transform: translateX(-32px) scale(0.98); filter: blur(3px); }
    100% { opacity: 1;   transform: translateX(0)     scale(1);    filter: blur(0px); }
}

/* ── Navigation progress bar at top ────────────────────────── */
#wm-progress-bar {
    position: fixed;
    top: 0;
    left: 0;
    height: 2.5px;
    width: 0%;
    z-index: 9999;
    background: linear-gradient(90deg, #00d4ff 0%, #818cf8 40%, #ff9933 100%);
    box-shadow: 0 0 10px rgba(0, 212, 255, 0.7);
    transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    pointer-events: none;
    border-radius: 0 2px 2px 0;
}
#wm-progress-bar.wm-pb-done {
    width: 100% !important;
    opacity: 0;
    transition: width 0.2s ease, opacity 0.3s ease 0.15s;
}

/* ── Sidebar active state upgrade ───────────────────────────── */
.dash-nav-item {
    position: relative;
    transition:
        background 0.22s ease,
        color 0.22s ease,
        padding-left 0.22s ease;
}
.dash-nav-item::before {
    content: '';
    position: absolute;
    left: 0;
    top: 8px;
    bottom: 8px;
    width: 3px;
    border-radius: 0 3px 3px 0;
    background: transparent;
    transition: background 0.25s ease, transform 0.25s ease;
    transform: scaleY(0);
    transform-origin: center;
}
.dash-nav-item.active::before {
    background: linear-gradient(180deg, #00d4ff, #818cf8);
    transform: scaleY(1);
    box-shadow: 0 0 8px rgba(0, 212, 255, 0.5);
}
.dash-nav-item.active {
    background: rgba(0, 212, 255, 0.08);
    color: #e8f4ff;
    padding-left: 1.25rem;
}
.dash-nav-item.wm-nav-activating {
    animation: wmNavPulse 0.35s ease;
}
@keyframes wmNavPulse {
    0%   { background: rgba(0, 212, 255, 0.02); }
    40%  { background: rgba(0, 212, 255, 0.18); }
    100% { background: rgba(0, 212, 255, 0.08); }
}

/* ── Header nav pills active state ─────────────────────────── */
.dash-nav-pill.active {
    background: rgba(0, 212, 255, 0.15);
    color: #e8f4ff;
    border: 1px solid rgba(0, 212, 255, 0.3);
    box-shadow: 0 0 12px rgba(0, 212, 255, 0.2);
}

/* ── Skeleton loader ────────────────────────────────────────── */
.wm-skeleton-wrap {
    padding: 1.5rem 0;
    animation: wmSkeletonFadeIn 0.25s ease;
}
@keyframes wmSkeletonFadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
}
.wm-skel {
    background: linear-gradient(
        90deg,
        rgba(255,255,255,0.04) 0%,
        rgba(255,255,255,0.09) 50%,
        rgba(255,255,255,0.04) 100%
    );
    background-size: 200% 100%;
    animation: wmSkelShimmer 1.5s ease-in-out infinite;
    border-radius: 8px;
}
@keyframes wmSkelShimmer {
    0%   { background-position: 200% 0; }
    100% { background-position: -200% 0; }
}
.wm-skel-title  { height: 32px; width: 45%; margin-bottom: 0.75rem; }
.wm-skel-sub    { height: 16px; width: 65%; margin-bottom: 1.75rem; opacity: 0.6; }
.wm-skel-cards  {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1rem;
    margin-bottom: 1.25rem;
}
@media (max-width: 900px) {
    .wm-skel-cards { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 600px) {
    .wm-skel-cards { grid-template-columns: 1fr; }
}
.wm-skel-card   { height: 160px; border-radius: 12px; }
.wm-skel-row    {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
    margin-bottom: 1.25rem;
}
@media (max-width: 700px) {
    .wm-skel-row { grid-template-columns: 1fr; }
}
.wm-skel-block  { height: 200px; border-radius: 12px; }

/* ── White-flash prevention ─────────────────────────────────── */
html {
    background-color: var(--bg-dark, #020918) !important;
}
body {
    background-color: var(--bg-dark, #020918) !important;
}
        `;
        document.head.appendChild(style);
    }

    /* ── PROGRESS BAR HELPERS ───────────────────────────────────── */
    let progressBar = null;
    let progressTimer = null;

    function getProgressBar() {
        if (!progressBar) {
            progressBar = document.createElement('div');
            progressBar.id = 'wm-progress-bar';
            document.body.appendChild(progressBar);
        }
        return progressBar;
    }

    function startProgress() {
        const pb = getProgressBar();
        pb.classList.remove('wm-pb-done');
        pb.style.width = '0%';
        pb.style.opacity = '1';
        pb.style.transition = `width 0.3s cubic-bezier(0.4,0,0.2,1)`;
        // Fake progress — jumps to 65% quickly then slows
        clearTimeout(progressTimer);
        requestAnimationFrame(() => {
            pb.style.width = '30%';
            progressTimer = setTimeout(() => { pb.style.width = '60%'; }, 200);
            progressTimer = setTimeout(() => { pb.style.width = '75%'; }, 500);
        });
    }

    function finishProgress() {
        clearTimeout(progressTimer);
        const pb = getProgressBar();
        pb.classList.add('wm-pb-done');
        setTimeout(() => {
            pb.style.width = '0%';
            pb.style.opacity = '0';
            pb.style.transition = 'none';
            pb.classList.remove('wm-pb-done');
        }, 500);
    }

    /* ── ACTIVE NAV UPDATER ──────────────────────────────────────── */
    function updateActiveNav(url) {
        const filename = url.split('/').pop().split('?')[0] || 'index.html';

        // Sidebar items
        document.querySelectorAll('.dash-nav-item').forEach(el => {
            const href = (el.getAttribute('href') || '').split('/').pop().split('?')[0];
            const isActive = href === filename;
            el.classList.toggle('active', isActive);
            if (isActive) {
                el.classList.add('wm-nav-activating');
                setTimeout(() => el.classList.remove('wm-nav-activating'), 400);
            }
        });

        // Header nav pills
        document.querySelectorAll('.dash-nav-pill').forEach(el => {
            const href = (el.getAttribute('href') || '').split('/').pop().split('?')[0];
            el.classList.toggle('active', href === filename);
        });
    }

    /* ── SCRIPT RE-EXECUTION ─────────────────────────────────────── */
    function executePageScripts(container) {
        // Find ALL scripts in the new content
        const scripts = Array.from(container.querySelectorAll('script'));

        scripts.forEach(oldScript => {
            const newScript = document.createElement('script');

            // Copy all attributes (src, type, etc.)
            Array.from(oldScript.attributes).forEach(attr => {
                newScript.setAttribute(attr.name, attr.value);
            });

            // For inline scripts, copy content
            if (!oldScript.src) {
                newScript.textContent = oldScript.textContent;
            }

            // Replace the old script with the new one to trigger execution
            oldScript.parentNode.replaceChild(newScript, oldScript);
        });
    }

    /* ── PAGE FETCH WITH CACHE ──────────────────────────────────── */
    async function fetchPage(url) {
        // Check cache
        const cached = pageCache.get(url);
        if (cached && (Date.now() - cached.timestamp) < CACHE_TTL_MS) {
            return cached.html;
        }

        const response = await fetch(url, {
            method: 'GET',
            headers: { 'X-Requested-With': 'ThiranMitraSPA' },
            cache: 'no-store'
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const html = await response.text();

        pageCache.set(url, { html, timestamp: Date.now() });
        return html;
    }

    /* ── FIND CONTENT CONTAINER ─────────────────────────────────── */
    function findContainer(doc) {
        for (const sel of MAIN_SELECTORS) {
            const el = doc.querySelector(sel);
            if (el) return { el, selector: sel };
        }
        return { el: doc.body, selector: 'body' };
    }

    /* ── FULL-PAGE OVERLAY TRANSITION ───────────────────────────── */
    // Used when navigating between pages with different layouts
    function overlayNavigate(url) {
        let overlay = document.getElementById('wm-nav-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'wm-nav-overlay';
            overlay.style.cssText = [
                'position:fixed', 'inset:0', 'z-index:99998',
                'background:#020918', 'opacity:0',
                'transition:opacity 0.28s cubic-bezier(0.4,0,0.2,1)',
                'pointer-events:all'
            ].join(';');
            document.body.appendChild(overlay);
        }
        // Fade to black, then navigate
        requestAnimationFrame(() => {
            overlay.style.opacity = '1';
            setTimeout(() => {
                window.location.href = url;
            }, 300);
        });
    }

    /* ── CORE NAVIGATE FUNCTION ─────────────────────────────────── */
    async function navigate(url, direction = 'forward', pushState = true) {
        if (isNavigating) return;

        // Resolve to absolute URL
        const absUrl = new URL(url, window.location.href).href;
        const filename = absUrl.split('/').pop().split('?')[0] || 'index.html';

        // Full reload for auth pages
        if (FULL_NAV_PAGES.has(filename)) {
            window.location.href = absUrl;
            return;
        }

        // Same page — no action
        if (absUrl === window.location.href) return;

        // Find current content container
        const currentResult = findContainer(document);
        const currentSelector = currentResult.selector;
        const currentMain = currentResult.el;

        // Determine if target page has the same layout by checking the cached
        // version or doing a quick prefetch, failing which use overlay.
        // For speed: if we can't match layouts, use smooth overlay + hard nav
        // (still no white flash). If same layout, swap in-place.

        isNavigating = true;
        startProgress();

        // Update sidebar immediately (feels instant)
        updateActiveNav(absUrl);

        // Start skeleton timer (only if same layout swap)
        let skeletonTimer = null;
        skeletonTimer = setTimeout(() => {
            if (isNavigating && currentMain) {
                currentMain.innerHTML = buildSkeleton();
            }
        }, SKELETON_DELAY_MS);

        try {
            // Fetch next page in parallel with exit animation
            const exitClass = direction === 'back' ? 'wm-page-exit-back' : 'wm-page-exit';
            currentMain.classList.add(exitClass);

            const [newHtml] = await Promise.all([
                fetchPage(absUrl),
                new Promise(resolve => setTimeout(resolve, TRANSITION_MS * 0.55))
            ]);

            clearTimeout(skeletonTimer);

            // Parse and find content zone in new page
            const parser = new DOMParser();
            const newDoc = parser.parseFromString(newHtml, 'text/html');
            const newResult = findContainer(newDoc);
            const newSelector = newResult.selector;
            const newMain = newResult.el;

            // Update page title
            if (newDoc.title) document.title = newDoc.title;

            // Same-layout in-place swap (fast path)
            if (newSelector === currentSelector && currentSelector !== 'body') {
                currentMain.classList.remove(exitClass);
                currentMain.innerHTML = newMain.innerHTML;

                const enterClass = direction === 'back' ? 'wm-page-enter-back' : 'wm-page-enter';
                currentMain.classList.add(enterClass);
                currentMain.addEventListener('animationend', () => {
                    currentMain.classList.remove(enterClass);
                }, { once: true });

                executePageScripts(currentMain);

                if (pushState) {
                    history.pushState({ url: absUrl, direction: 'forward' }, '', absUrl);
                }

                currentMain.scrollTop = 0;
                window.scrollTo({ top: 0, behavior: 'instant' });
                finishProgress();

            } else {
                // Cross-layout: use animated overlay then hard navigate
                // The overlay prevents white flash
                clearTimeout(skeletonTimer);
                currentMain.classList.remove(exitClass);
                finishProgress();
                overlayNavigate(absUrl);
            }

        } catch (err) {
            // Graceful fallback
            console.warn('[ThiranMitra SPA] Fetch failed, falling back:', err.message);
            clearTimeout(skeletonTimer);
            finishProgress();
            overlayNavigate(absUrl);
        } finally {
            isNavigating = false;
        }
    }

    /* ── LINK INTERCEPTOR ───────────────────────────────────────── */
    function shouldIntercept(anchor) {
        if (!anchor) return false;
        const href = anchor.getAttribute('href');
        if (!href) return false;

        // Skip: external, mailto, tel, hash-only, javascript:
        if (href.startsWith('http') && !href.includes(window.location.hostname)) return false;
        if (href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) return false;
        if (href === '#' || href.startsWith('#')) return false;

        // Skip: target="_blank"
        if (anchor.getAttribute('target') === '_blank') return false;

        // Skip: download links
        if (anchor.hasAttribute('download')) return false;

        // Skip: non-HTML files
        const filename = href.split('/').pop().split('?')[0];
        const ext = filename.includes('.') ? filename.split('.').pop().toLowerCase() : 'html';
        const allowedExts = ['html', 'htm', ''];
        if (!allowedExts.includes(ext)) return false;

        return true;
    }

    document.addEventListener('click', function (e) {
        // Walk up the DOM tree to find the anchor
        let target = e.target;
        while (target && target !== document.body) {
            if (target.tagName === 'A') break;
            target = target.parentElement;
        }
        if (!target || target.tagName !== 'A') return;
        if (!shouldIntercept(target)) return;

        e.preventDefault();
        e.stopPropagation();

        const href = target.getAttribute('href');
        navigate(href, 'forward', true);
    }, true); // capture phase

    /* ── BROWSER BACK/FORWARD ────────────────────────────────────── */
    window.addEventListener('popstate', function (e) {
        const state = e.state;
        const url = state?.url || window.location.href;
        const direction = state?.direction === 'forward' ? 'back' : 'forward';
        navigate(url, direction, false);
    });

    /* ── PRELOAD ON HOVER ────────────────────────────────────────── */
    // Silently fetch page content when user hovers over nav links
    let preloadTimer = null;
    document.addEventListener('mouseover', function (e) {
        const anchor = e.target.closest('a');
        if (!shouldIntercept(anchor)) return;

        const href = anchor.getAttribute('href');
        clearTimeout(preloadTimer);
        preloadTimer = setTimeout(() => {
            const absUrl = new URL(href, window.location.href).href;
            const filename = absUrl.split('/').pop();
            if (!FULL_NAV_PAGES.has(filename) && !pageCache.has(absUrl)) {
                fetchPage(absUrl).catch(() => { }); // silent preload
            }
        }, 120); // 120ms hover intent delay
    });

    document.addEventListener('mouseout', function () {
        clearTimeout(preloadTimer);
    });

    /* ── INITIAL SETUP ───────────────────────────────────────────── */
    function init() {
        injectStyles();

        // Record initial page state in history
        if (!history.state) {
            history.replaceState(
                { url: window.location.href, direction: 'forward' },
                '',
                window.location.href
            );
        }

        // Mark current page active in sidebar
        updateActiveNav(window.location.href);

        // Cache current page immediately (so back-nav is instant)
        pageCache.set(window.location.href, {
            html: document.documentElement.outerHTML,
            timestamp: Date.now()
        });
    }

    // Boot when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    /* ── EXPOSE PUBLIC API ───────────────────────────────────────── */
    window.WMNav = {
        go: navigate,
        preload: (url) => fetchPage(new URL(url, window.location.href).href).catch(() => { }),
        clearCache: () => pageCache.clear(),
        cache: pageCache
    };

})();
