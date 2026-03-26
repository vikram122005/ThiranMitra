/* ============================================================
   ThiranMitra — api.js
   Universal frontend API client.
   ► Tries Flask backend first (http://localhost:5000/api)
   ► Falls back to localStorage if backend is unreachable
   ============================================================ */

'use strict';

const API_BASE = 'http://localhost:5000/api';

/* ── Backend availability cache ───────────────────────────── */
let _backendAvailable = null;   // null = unknown, true/false after first ping
let _checkingBackend = false;

async function _checkBackend() {
    if (_backendAvailable !== null) return _backendAvailable;
    if (_checkingBackend) return false;
    _checkingBackend = true;
    try {
        const res = await fetch(`${API_BASE}/health`, {
            method: 'GET',
            signal: AbortSignal.timeout(2500)   // 2.5 s timeout
        });
        _backendAvailable = res.ok;
    } catch {
        _backendAvailable = false;
    }
    _checkingBackend = false;
    return _backendAvailable;
}

/* ── Token helpers ────────────────────────────────────────── */
const Token = {
    get() { return localStorage.getItem('wm_token'); },
    set(t) { localStorage.setItem('wm_token', t); },
    remove() { localStorage.removeItem('wm_token'); localStorage.removeItem('wm_user'); },
    headers() {
        const h = { 'Content-Type': 'application/json' };
        const t = Token.get();
        if (t) h['Authorization'] = `Bearer ${t}`;
        return h;
    }
};

/* ── Core fetch wrapper ───────────────────────────────────── */
async function apiFetch(path, options = {}) {
    const url = `${API_BASE}${path}`;
    const res = await fetch(url, {
        headers: Token.headers(),
        signal: AbortSignal.timeout(8000),  // 8 s per request
        ...options,
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
    return json;
}

/* ──────────────────────────────────────────────────────────
   LOCAL STORAGE FALLBACK ENGINE
   Simulates a backend when Flask is not running.
   Data is stored in localStorage under key 'wm_local_users'.
   ────────────────────────────────────────────────────────── */
const LocalDB = {
    _key: 'wm_local_users',

    _getUsers() {
        try { return JSON.parse(localStorage.getItem(this._key) || '[]'); }
        catch { return []; }
    },
    _saveUsers(users) {
        localStorage.setItem(this._key, JSON.stringify(users));
    },
    _makeToken(userId) {
        // Simple base64 pseudo-token (not real JWT — fine for local-only mode)
        return btoa(JSON.stringify({ sub: String(userId), local: true, ts: Date.now() }));
    },
    _isLocalToken(t) {
        try { return !!JSON.parse(atob(t)).local; } catch { return false; }
    },
    _decodeToken(t) {
        try { return JSON.parse(atob(t)); } catch { return null; }
    },

    register(data) {
        const users = this._getUsers();
        const email = (data.email || '').toLowerCase().trim();
        if (!data.name || !email || !data.password)
            throw new Error('Name, email and password are required');
        if (users.find(u => u.email === email))
            throw new Error('An account with this email already exists');
        const user = {
            id: Date.now(),
            name: data.name,
            email,
            password: data.password,   // plain — local only, never sent anywhere
            phone: data.phone || '',
            state: data.state || '',
            city: data.city || '',
        };
        users.push(user);
        this._saveUsers(users);
        const token = this._makeToken(user.id);
        const safe = {
            id: user.id, name: user.name, email: user.email,
            phone: user.phone, state: user.state, city: user.city
        };
        return { token, user: safe };
    },

    login(email, password) {
        const users = this._getUsers();
        const em = (email || '').toLowerCase().trim();
        const user = users.find(u => u.email === em);
        if (!user) throw new Error('No account found with this email');
        if (user.password !== password) throw new Error('Incorrect password');
        const token = this._makeToken(user.id);
        const safe = {
            id: user.id, name: user.name, email: user.email,
            phone: user.phone, state: user.state, city: user.city
        };
        return { token, user: safe };
    },

    me(token) {
        const decoded = this._decodeToken(token);
        if (!decoded) throw new Error('Invalid token');
        const users = this._getUsers();
        const user = users.find(u => String(u.id) === String(decoded.sub));
        if (!user) throw new Error('User not found');
        return Object.assign({}, user);
    },

    updateUser(token, data) {
        const decoded = this._decodeToken(token);
        if (!decoded) throw new Error('Invalid token');
        const users = this._getUsers();
        const idx = users.findIndex(u => String(u.id) === String(decoded.sub));
        if (idx === -1) throw new Error('User not found');

        const user = users[idx];
        const allowed = ['name', 'phone', 'gender', 'category', 'state', 'city', 'dob', 'address', 'avatar_url'];
        for (let k of allowed) {
            if (data[k] !== undefined) user[k] = data[k];
        }

        this._saveUsers(users);
        return Object.assign({}, user);
    },

    // Resumes
    resumes: {
        _key(uid) { return `wm_local_resumes_${uid}`; },
        get(uid) {
            try { return JSON.parse(localStorage.getItem(this._key(uid)) || '[]'); }
            catch { return []; }
        },
        add(uid, resume) {
            const list = this.get(uid);
            const newItem = { id: Date.now(), created_at: new Date().toISOString(), ...resume };
            list.push(newItem);
            localStorage.setItem(this._key(uid), JSON.stringify(list));
            return newItem;
        }
    }
};

/* ═══════════════════════════════════════════════════════════
   AUTH API
   Tries backend → falls back to LocalDB automatically
═════════════════════════════════════════════════════════════ */
const AuthAPI = {
    async register(data) {
        const online = await _checkBackend();
        if (online) {
            try {
                const resp = await apiFetch('/auth/register', {
                    method: 'POST', body: JSON.stringify(data)
                });
                Token.set(resp.token);
                localStorage.setItem('wm_user', JSON.stringify(resp.user));
                return resp;
            } catch (err) {
                // If it's a real server error (409 duplicate etc.), re-throw
                if (!_isNetworkError(err)) throw err;
                // Otherwise fall through to local
            }
        }
        // ─ Offline fallback ─
        _showOfflineBanner();
        const resp = LocalDB.register(data);
        Token.set(resp.token);
        localStorage.setItem('wm_user', JSON.stringify(resp.user));
        return resp;
    },

    async login(email, password) {
        const online = await _checkBackend();
        if (online) {
            try {
                const resp = await apiFetch('/auth/login', {
                    method: 'POST', body: JSON.stringify({ email, password })
                });
                Token.set(resp.token);
                localStorage.setItem('wm_user', JSON.stringify(resp.user));
                return resp;
            } catch (err) {
                if (!_isNetworkError(err)) throw err;
            }
        }
        // ─ Offline fallback ─
        _showOfflineBanner();
        const resp = LocalDB.login(email, password);
        Token.set(resp.token);
        localStorage.setItem('wm_user', JSON.stringify(resp.user));
        return resp;
    },

    async me() {
        const token = Token.get();
        if (token && LocalDB._isLocalToken(token)) {
            return { user: LocalDB.me(token) };
        }
        return apiFetch('/auth/me');
    },

    async logout() {
        const token = Token.get();
        if (token && !LocalDB._isLocalToken(token)) {
            await apiFetch('/auth/logout', { method: 'POST' }).catch(() => { });
        }
        Token.remove();
        window.location.href = 'login.html';
    },

    isLoggedIn() { return !!Token.get(); },

    currentUser() {
        try { return JSON.parse(localStorage.getItem('wm_user') || 'null'); }
        catch { return null; }
    }
};

/* ── network error detector ──────────────────────────────── */
function _isNetworkError(err) {
    const msg = (err?.message || '').toLowerCase();
    return msg.includes('failed to fetch') ||
        msg.includes('networkerror') ||
        msg.includes('load failed') ||
        msg.includes('aborted') ||
        msg.includes('timeout');
}

/* ── Offline banner (shown once per session) ─────────────── */
let _bannerShown = false;
function _showOfflineBanner() {
    if (_bannerShown) return;
    _bannerShown = true;
    const div = document.createElement('div');
    div.id = 'offlineBanner';
    div.style.cssText = [
        'position:fixed;top:70px;left:50%;transform:translateX(-50%)',
        'background:linear-gradient(135deg,#f97316,#ef4444)',
        'color:white;padding:.625rem 1.5rem;border-radius:2rem',
        'font-size:.8rem;font-weight:700;z-index:9999',
        'box-shadow:0 4px 20px rgba(239,68,68,.4)',
        'display:flex;align-items:center;gap:.5rem;animation:fadeIn .3s ease'
    ].join(';');
    div.innerHTML = '⚡ Offline Mode — data stored locally. <a href="#" onclick="document.getElementById(\'offlineBanner\').remove();return false;" style="color:rgba(255,255,255,.7);margin-left:.5rem;">✕</a>';
    document.body.appendChild(div);
    setTimeout(() => div.remove?.(), 8000);
}

/* ═══════════════════════════════════════════════════════════
   JOBS API
═════════════════════════════════════════════════════════════ */
const DUMMY_JOBS = [
    // Tech / IT & Tech
    { id: 101, category: 'Tech', title: 'Full Stack React Developer', company: 'TCS Innovation', location: 'Bangalore', job_type: 'Full-time', work_mode: 'Hybrid', salary_min: 800000, salary_max: 1400000, experience: '3+ Years', skills_required: ['React', 'Node.js', 'AWS'], description: 'Work on cutting edge React and Node.js solutions for global clients.' },
    { id: 102, category: 'Tech', title: 'Data Science Intern', company: 'Analytics India', location: 'Pune', job_type: 'Internship', work_mode: 'On-site', salary_min: 250000, salary_max: 350000, experience: 'Fresher', skills_required: ['Python', 'SQL', 'Pandas'], description: 'Great start for freshers willing to learn data extraction.' },
    { id: 103, category: 'Tech', title: 'AWS Cloud Architect', company: 'CloudFront Systems', location: 'Hyderabad', job_type: 'Full-time', work_mode: 'Remote', salary_min: 1500000, salary_max: 2200000, experience: '5+ Years', skills_required: ['AWS', 'Docker', 'Kubernetes'], description: 'Lead the migration of monolithic apps to cloud microservices.' },
    { id: 104, category: 'Tech', title: 'Government IT Officer', company: 'Ministry of IT', location: 'New Delhi', job_type: 'Govt', work_mode: 'On-site', salary_min: 750000, salary_max: 1050000, experience: 'Fresher', skills_required: ['Python', 'Network Sec', 'Linux'], description: 'Central govt IT role with high stability.' },
    { id: 105, category: 'Tech', title: 'Frontend Developer', company: 'WebTech', location: 'Chennai', job_type: 'Full-time', work_mode: 'Hybrid', salary_min: 600000, salary_max: 1000000, experience: '2+ Years', skills_required: ['Vue.js', 'JavaScript', 'Tailwind'], description: 'Develop performant client-side applications for enterprise customers.' },
    { id: 106, category: 'Tech', title: 'Backend Software Engineer', company: 'Global Solutions', location: 'Remote', job_type: 'Full-time', work_mode: 'Remote', salary_min: 900000, salary_max: 1500000, experience: '4+ Years', skills_required: ['Java', 'Spring Boot', 'MySQL'], description: 'Design and build resilient, highly scalable backend services.' },

    // Banking
    { id: 201, category: 'Banking', title: 'Bank Probationary Officer', company: 'State Bank of India', location: 'Mumbai', job_type: 'Govt', work_mode: 'On-site', salary_min: 700000, salary_max: 1000000, experience: 'Fresher', skills_required: ['Aptitude', 'Banking', 'Finance'], description: 'Join as a PO after cracking the competitive examination.' },
    { id: 202, category: 'Banking', title: 'Investment Analyst', company: 'HDFC Securities', location: 'Mumbai', job_type: 'Full-time', work_mode: 'Hybrid', salary_min: 800000, salary_max: 1400000, experience: '2-4 Years', skills_required: ['Equity Research', 'Valuation', 'Excel'], description: 'Analyze market trends and offer actionable investment ideas.' },
    { id: 203, category: 'Banking', title: 'Loan Officer', company: 'ICICI Bank', location: 'Delhi', job_type: 'Full-time', work_mode: 'On-site', salary_min: 400000, salary_max: 600000, experience: 'Fresher', skills_required: ['Sales', 'Customer Service', 'Credit'], description: 'Evaluate loan applications and guide customers through the lending process.' },
    { id: 204, category: 'Banking', title: 'Risk Management Specialist', company: 'Axis Bank', location: 'Bangalore', job_type: 'Full-time', work_mode: 'Hybrid', salary_min: 1200000, salary_max: 1800000, experience: '5+ Years', skills_required: ['Risk Analysis', 'Basel III', 'Auditing'], description: 'Identify, assess and mitigate financial risks across banking operations.' },
    { id: 205, category: 'Banking', title: 'Branch Assistant (Clerk)', company: 'Punjab National Bank', location: 'Kolkata', job_type: 'Govt', work_mode: 'On-site', salary_min: 350000, salary_max: 500000, experience: 'Fresher', skills_required: ['Communication', 'Data Entry', 'Accounting'], description: 'Handle front-desk customer inquiries, deposits, and documentation.' },

    // Marketing
    { id: 301, category: 'Marketing', title: 'Senior SEO Analyst', company: 'MarketBox', location: 'Chennai', job_type: 'Full-time', work_mode: 'Remote', salary_min: 500000, salary_max: 950000, experience: '2+ Years', skills_required: ['SEO', 'Google Analytics', 'Content'], description: 'Drive organic traffic for top e-commerce brands.' },
    { id: 302, category: 'Marketing', title: 'Digital Marketing Manager', company: 'AdVantage Agency', location: 'Pune', job_type: 'Full-time', work_mode: 'Hybrid', salary_min: 800000, salary_max: 1400000, experience: '4-6 Years', skills_required: ['PPC', 'SMM', 'Campaigns'], description: 'Lead end-to-end digital advertising campaigns across channels.' },
    { id: 303, category: 'Marketing', title: 'Content Writer Intern', company: 'BloggerHub', location: 'Remote', job_type: 'Internship', work_mode: 'Remote', salary_min: 150000, salary_max: 250000, experience: 'Fresher', skills_required: ['Writing', 'SEO', 'Creativity'], description: 'Create engaging content for blogs and social media platforms.' },
    { id: 304, category: 'Marketing', title: 'Brand Strategist', company: 'CreativeMinds', location: 'Delhi', job_type: 'Part-time', work_mode: 'Hybrid', salary_min: 600000, salary_max: 900000, experience: '3+ Years', skills_required: ['Brand Positioning', 'Market Research'], description: 'Shape brand narratives and align marketing efforts with core identity.' },
    { id: 305, category: 'Marketing', title: 'Social Media Executive', company: 'ViralBoost', location: 'Bangalore', job_type: 'Full-time', work_mode: 'On-site', salary_min: 300000, salary_max: 500000, experience: 'Fresher', skills_required: ['Instagram', 'Canva', 'Copywriting'], description: 'Manage daily social media posts and interact with online communities.' },

    // Logistics
    { id: 401, category: 'Logistics', title: 'Supply Chain Manager', company: 'Delhivery', location: 'Gurgaon', job_type: 'Full-time', work_mode: 'On-site', salary_min: 1000000, salary_max: 1600000, experience: '5+ Years', skills_required: ['Operations', 'Inventory', 'Planning'], description: 'Optimize supply chain processes and lead massive warehousing teams.' },
    { id: 402, category: 'Logistics', title: 'Fleet Coordinator', company: 'Blue Dart', location: 'Mumbai', job_type: 'Full-time', work_mode: 'On-site', salary_min: 400000, salary_max: 600000, experience: '1-3 Years', skills_required: ['Routing', 'Tracking', 'Communication'], description: 'Monitor daily fleet operations and coordinate between drivers & hubs.' },
    { id: 403, category: 'Logistics', title: 'Warehouse Associate', company: 'Amazon', location: 'Hyderabad', job_type: 'Part-time', work_mode: 'On-site', salary_min: 200000, salary_max: 300000, experience: 'Fresher', skills_required: ['Sorting', 'Packaging', 'Scanning'], description: 'Assist in daily warehouse sorting, packing, and dispatch tasks.' },
    { id: 404, category: 'Logistics', title: 'Procurement Executive', company: 'Flipkart', location: 'Bangalore', job_type: 'Full-time', work_mode: 'Hybrid', salary_min: 500000, salary_max: 800000, experience: '2+ Years', skills_required: ['Vendor Management', 'Negotiation', 'Excel'], description: 'Source materials efficiently and manage vendor relationships.' },
    { id: 405, category: 'Logistics', title: 'Last Mile Delivery Partner', company: 'Zomato/Swiggy', location: 'Anywhere', job_type: 'Freelance', work_mode: 'On-site', salary_min: 300000, salary_max: 450000, experience: 'Fresher', skills_required: ['Driving', 'Time Management', 'Maps'], description: 'Flexible delivery partner role requiring 2-wheeler and smartphone.' },

    // Design
    { id: 501, category: 'Design', title: 'UI/UX Lead Product Designer', company: 'DesignStudio', location: 'Mumbai', job_type: 'Full-time', work_mode: 'Hybrid', salary_min: 900000, salary_max: 1600000, experience: '4+ Years', skills_required: ['Figma', 'Prototyping', 'User Research'], description: 'Lead the design of consumer-facing FinTech apps.' },
    { id: 502, category: 'Design', title: 'Graphic Designer', company: 'PixelCraft', location: 'Chennai', job_type: 'Full-time', work_mode: 'Remote', salary_min: 350000, salary_max: 600000, experience: '1-3 Years', skills_required: ['Photoshop', 'Illustrator', 'Branding'], description: 'Create visually stunning graphics for digital and print media.' },
    { id: 503, category: 'Design', title: 'Motion Graphics Animator', company: 'AniCorp', location: 'Pune', job_type: 'Full-time', work_mode: 'Hybrid', salary_min: 600000, salary_max: 1000000, experience: '2+ Years', skills_required: ['After Effects', 'Premiere Pro', 'Animation'], description: 'Design engaging video content and dynamic UI animations.' },
    { id: 504, category: 'Design', title: 'Product Design Intern', company: 'InnovateX', location: 'Remote', job_type: 'Internship', work_mode: 'Remote', salary_min: 180000, salary_max: 240000, experience: 'Fresher', skills_required: ['Figma', 'Wireframing', 'UI Design'], description: 'Assist senior designers with wireframing and user flow diagrams.' },
    { id: 505, category: 'Design', title: '3D Artist', company: 'GameSpace', location: 'Bangalore', job_type: 'Full-time', work_mode: 'On-site', salary_min: 700000, salary_max: 1200000, experience: '3+ Years', skills_required: ['Blender', 'Maya', 'Texturing'], description: 'Create high-quality 3D assets for next-gen mobile gaming environments.' },

    // HR
    { id: 601, category: 'HR', title: 'Human Resources Manager', company: 'PeopleFirst', location: 'Delhi', job_type: 'Full-time', work_mode: 'Hybrid', salary_min: 800000, salary_max: 1300000, experience: '5+ Years', skills_required: ['Employee Relations', 'Compliance', 'Talent'], description: 'Manage comprehensive HR operations and cultivate company culture.' },
    { id: 602, category: 'HR', title: 'Technical Recruiter', company: 'TechHire Solutions', location: 'Remote', job_type: 'Full-time', work_mode: 'Remote', salary_min: 450000, salary_max: 800000, experience: '2-4 Years', skills_required: ['Sourcing', 'Screening', 'Negotiation'], description: 'Identify and hire top-tier engineering talent across the globe.' },
    { id: 603, category: 'HR', title: 'HR Executive', company: 'Retail Hub', location: 'Kolkata', job_type: 'Full-time', work_mode: 'On-site', salary_min: 300000, salary_max: 450000, experience: '1-2 Years', skills_required: ['Onboarding', 'Payroll', 'Grievance Handling'], description: 'Facilitate day-to-day HR tasks including joining formalities and payroll.' },
    { id: 604, category: 'HR', title: 'Learning & Development Specialist', company: 'Edutech Global', location: 'Bangalore', job_type: 'Full-time', work_mode: 'Hybrid', salary_min: 600000, salary_max: 1000000, experience: '3+ Years', skills_required: ['Training', 'Content Dev', 'Upskilling'], description: 'Design and implement internal training programs to boost employee skills.' },
    { id: 605, category: 'HR', title: 'HR Intern', company: 'StartupSpace', location: 'Remote', job_type: 'Internship', work_mode: 'Remote', salary_min: 100000, salary_max: 150000, experience: 'Fresher', skills_required: ['Communication', 'Organization', 'MS Office'], description: 'Support the HR team in scheduling interviews and maintaining databases.' },

    // More Jobs
    { "id": 1000, "category": "Logistics", "title": "Customer Support", "company": "HDFC Bank", "location": "Bengaluru", "job_type": "Part-time", "work_mode": "Hybrid", "salary_min": 400000, "salary_max": 1900000, "experience": "Fresher", "skills_required": ["Skill A", "Skill B"], "description": "Job description." },
    { "id": 1001, "category": "HR", "title": "Business Analyst", "company": "TATA", "location": "Delhi", "job_type": "Full-time", "work_mode": "On-site", "salary_min": 500000, "salary_max": 1400000, "experience": "1-3 Years", "skills_required": ["Skill A", "Skill B"], "description": "Job description." },
    { "id": 1002, "category": "Design", "title": "Field Engineer", "company": "Amazon", "location": "Bengaluru", "job_type": "Internship", "work_mode": "On-site", "salary_min": 900000, "salary_max": 1800000, "experience": "1-3 Years", "skills_required": ["Skill A", "Skill B"], "description": "Job description." },
    { "id": 1003, "category": "Banking", "title": "Assistant Manager", "company": "Amazon", "location": "Kolkata", "job_type": "Full-time", "work_mode": "Remote", "salary_min": 500000, "salary_max": 1600000, "experience": "6+ Years", "skills_required": ["Skill A", "Skill B"], "description": "Job description." },
    { "id": 1004, "category": "HR", "title": "Assistant Manager", "company": "TCS", "location": "Hyderabad", "job_type": "Internship", "work_mode": "Remote", "salary_min": 700000, "salary_max": 2000000, "experience": "6+ Years", "skills_required": ["Skill A", "Skill B"], "description": "Job description." },
    { "id": 1005, "category": "Tech", "title": "Production Specialist", "company": "Flipkart", "location": "Kolkata", "job_type": "Part-time", "work_mode": "On-site", "salary_min": 600000, "salary_max": 1400000, "experience": "Fresher", "skills_required": ["Skill A", "Skill B"], "description": "Job description." },
    { "id": 1006, "category": "Banking", "title": "Assistant Manager", "company": "Reliance", "location": "Jaipur", "job_type": "Govt", "work_mode": "Remote", "salary_min": 700000, "salary_max": 1500000, "experience": "1-3 Years", "skills_required": ["Skill A", "Skill B"], "description": "Job description." },
    { "id": 1007, "category": "Marketing", "title": "Quality Analyst", "company": "TATA", "location": "Jaipur", "job_type": "Freelance", "work_mode": "Hybrid", "salary_min": 600000, "salary_max": 1600000, "experience": "Fresher", "skills_required": ["Skill A", "Skill B"], "description": "Job description." },
    { "id": 1008, "category": "Marketing", "title": "Production Specialist", "company": "ICICI Bank", "location": "Bengaluru", "job_type": "Freelance", "work_mode": "Hybrid", "salary_min": 900000, "salary_max": 1700000, "experience": "3-6 Years", "skills_required": ["Skill A", "Skill B"], "description": "Job description." },
    { "id": 1009, "category": "Logistics", "title": "Technical Lead", "company": "ICICI Bank", "location": "Kolkata", "job_type": "Full-time", "work_mode": "Hybrid", "salary_min": 900000, "salary_max": 1700000, "experience": "1-3 Years", "skills_required": ["Skill A", "Skill B"], "description": "Job description." },
    { "id": 1010, "category": "HR", "title": "Technical Lead", "company": "ICICI Bank", "location": "Hyderabad", "job_type": "Internship", "work_mode": "On-site", "salary_min": 1000000, "salary_max": 2000000, "experience": "Fresher", "skills_required": ["Skill A", "Skill B"], "description": "Job description." },
    { "id": 1011, "category": "Tech", "title": "Production Specialist", "company": "Wipro", "location": "Chennai", "job_type": "Freelance", "work_mode": "Remote", "salary_min": 600000, "salary_max": 1800000, "experience": "Fresher", "skills_required": ["Skill A", "Skill B"], "description": "Job description." },
    { "id": 1012, "category": "Logistics", "title": "Quality Analyst", "company": "Wipro", "location": "Ahmedabad", "job_type": "Govt", "work_mode": "Remote", "salary_min": 300000, "salary_max": 1400000, "experience": "6+ Years", "skills_required": ["Skill A", "Skill B"], "description": "Job description." },
    { "id": 1013, "category": "Marketing", "title": "Customer Support", "company": "Amazon", "location": "Hyderabad", "job_type": "Full-time", "work_mode": "Hybrid", "salary_min": 600000, "salary_max": 2000000, "experience": "3-6 Years", "skills_required": ["Skill A", "Skill B"], "description": "Job description." },
    { "id": 1014, "category": "Banking", "title": "Associate Partner", "company": "HDFC Bank", "location": "Lucknow", "job_type": "Govt", "work_mode": "Remote", "salary_min": 600000, "salary_max": 1500000, "experience": "3-6 Years", "skills_required": ["Skill A", "Skill B"], "description": "Job description." },
    { "id": 1015, "category": "Marketing", "title": "Production Specialist", "company": "TATA", "location": "Mumbai", "job_type": "Full-time", "work_mode": "On-site", "salary_min": 700000, "salary_max": 2000000, "experience": "3-6 Years", "skills_required": ["Skill A", "Skill B"], "description": "Job description." },
    { "id": 1016, "category": "Banking", "title": "Quality Analyst", "company": "ICICI Bank", "location": "Mumbai", "job_type": "Full-time", "work_mode": "On-site", "salary_min": 1100000, "salary_max": 2000000, "experience": "Fresher", "skills_required": ["Skill A", "Skill B"], "description": "Job description." },
    { "id": 1017, "category": "Logistics", "title": "Office Admin", "company": "TCS", "location": "Mumbai", "job_type": "Internship", "work_mode": "Hybrid", "salary_min": 700000, "salary_max": 1400000, "experience": "1-3 Years", "skills_required": ["Skill A", "Skill B"], "description": "Job description." },
    { "id": 1018, "category": "HR", "title": "Technical Lead", "company": "HDFC Bank", "location": "Lucknow", "job_type": "Internship", "work_mode": "On-site", "salary_min": 700000, "salary_max": 1400000, "experience": "3-6 Years", "skills_required": ["Skill A", "Skill B"], "description": "Job description." },
    { "id": 1019, "category": "Marketing", "title": "Assistant Manager", "company": "TCS", "location": "Mumbai", "job_type": "Internship", "work_mode": "On-site", "salary_min": 600000, "salary_max": 2000000, "experience": "6+ Years", "skills_required": ["Skill A", "Skill B"], "description": "Job description." },
    { "id": 1020, "category": "Logistics", "title": "Production Specialist", "company": "Infosys", "location": "Kolkata", "job_type": "Full-time", "work_mode": "On-site", "salary_min": 600000, "salary_max": 1500000, "experience": "6+ Years", "skills_required": ["Skill A", "Skill B"], "description": "Job description." },
    { "id": 1021, "category": "Logistics", "title": "Technical Lead", "company": "Flipkart", "location": "Kolkata", "job_type": "Internship", "work_mode": "Remote", "salary_min": 1100000, "salary_max": 1700000, "experience": "6+ Years", "skills_required": ["Skill A", "Skill B"], "description": "Job description." },
    { "id": 1022, "category": "Design", "title": "Quality Analyst", "company": "Tech Mahindra", "location": "Bengaluru", "job_type": "Internship", "work_mode": "On-site", "salary_min": 300000, "salary_max": 1700000, "experience": "3-6 Years", "skills_required": ["Skill A", "Skill B"], "description": "Job description." },
    { "id": 1023, "category": "Banking", "title": "Quality Analyst", "company": "TCS", "location": "Lucknow", "job_type": "Govt", "work_mode": "Remote", "salary_min": 400000, "salary_max": 1800000, "experience": "3-6 Years", "skills_required": ["Skill A", "Skill B"], "description": "Job description." },
    { "id": 1024, "category": "HR", "title": "Quality Analyst", "company": "TCS", "location": "Jaipur", "job_type": "Part-time", "work_mode": "Remote", "salary_min": 600000, "salary_max": 2000000, "experience": "3-6 Years", "skills_required": ["Skill A", "Skill B"], "description": "Job description." },
    { "id": 1025, "category": "HR", "title": "Office Admin", "company": "TCS", "location": "Ahmedabad", "job_type": "Govt", "work_mode": "Remote", "salary_min": 1100000, "salary_max": 1700000, "experience": "Fresher", "skills_required": ["Skill A", "Skill B"], "description": "Job description." },
    { "id": 1026, "category": "Design", "title": "Business Analyst", "company": "Tech Mahindra", "location": "Delhi", "job_type": "Govt", "work_mode": "On-site", "salary_min": 600000, "salary_max": 1600000, "experience": "Fresher", "skills_required": ["Skill A", "Skill B"], "description": "Job description." },
    { "id": 1027, "category": "Logistics", "title": "Project Coordinator", "company": "Infosys", "location": "Pune", "job_type": "Freelance", "work_mode": "On-site", "salary_min": 500000, "salary_max": 1700000, "experience": "Fresher", "skills_required": ["Skill A", "Skill B"], "description": "Job description." },
    { "id": 1028, "category": "Marketing", "title": "Technical Lead", "company": "Tech Mahindra", "location": "Chennai", "job_type": "Part-time", "work_mode": "Remote", "salary_min": 800000, "salary_max": 2000000, "experience": "Fresher", "skills_required": ["Skill A", "Skill B"], "description": "Job description." },
    { "id": 1029, "category": "Marketing", "title": "Production Specialist", "company": "ICICI Bank", "location": "Lucknow", "job_type": "Part-time", "work_mode": "On-site", "salary_min": 1200000, "salary_max": 1400000, "experience": "6+ Years", "skills_required": ["Skill A", "Skill B"], "description": "Job description." },
    { "id": 1030, "category": "HR", "title": "Quality Analyst", "company": "ICICI Bank", "location": "Chennai", "job_type": "Freelance", "work_mode": "On-site", "salary_min": 1100000, "salary_max": 1800000, "experience": "3-6 Years", "skills_required": ["Skill A", "Skill B"], "description": "Job description." },
    { "id": 1031, "category": "Tech", "title": "Technical Lead", "company": "Tech Mahindra", "location": "Delhi", "job_type": "Part-time", "work_mode": "On-site", "salary_min": 1000000, "salary_max": 2000000, "experience": "1-3 Years", "skills_required": ["Skill A", "Skill B"], "description": "Job description." },
    { "id": 1032, "category": "Design", "title": "Assistant Manager", "company": "TATA", "location": "Ahmedabad", "job_type": "Freelance", "work_mode": "On-site", "salary_min": 500000, "salary_max": 1500000, "experience": "1-3 Years", "skills_required": ["Skill A", "Skill B"], "description": "Job description." },
    { "id": 1033, "category": "HR", "title": "Business Analyst", "company": "Infosys", "location": "Mumbai", "job_type": "Full-time", "work_mode": "Hybrid", "salary_min": 1100000, "salary_max": 1800000, "experience": "3-6 Years", "skills_required": ["Skill A", "Skill B"], "description": "Job description." },
    { "id": 1034, "category": "Banking", "title": "Technical Lead", "company": "Infosys", "location": "Ahmedabad", "job_type": "Govt", "work_mode": "Remote", "salary_min": 400000, "salary_max": 1600000, "experience": "Fresher", "skills_required": ["Skill A", "Skill B"], "description": "Job description." },
    { "id": 1035, "category": "Marketing", "title": "Associate Partner", "company": "Amazon", "location": "Delhi", "job_type": "Freelance", "work_mode": "Remote", "salary_min": 1200000, "salary_max": 2000000, "experience": "6+ Years", "skills_required": ["Skill A", "Skill B"], "description": "Job description." },
    { "id": 1036, "category": "Banking", "title": "Technical Lead", "company": "TCS", "location": "Ahmedabad", "job_type": "Freelance", "work_mode": "On-site", "salary_min": 900000, "salary_max": 1500000, "experience": "1-3 Years", "skills_required": ["Skill A", "Skill B"], "description": "Job description." },
    { "id": 1037, "category": "Tech", "title": "Customer Support", "company": "HDFC Bank", "location": "Bengaluru", "job_type": "Freelance", "work_mode": "Hybrid", "salary_min": 400000, "salary_max": 1400000, "experience": "3-6 Years", "skills_required": ["Skill A", "Skill B"], "description": "Job description." },
    { "id": 1038, "category": "Marketing", "title": "Field Engineer", "company": "TATA", "location": "Lucknow", "job_type": "Internship", "work_mode": "Hybrid", "salary_min": 800000, "salary_max": 1500000, "experience": "Fresher", "skills_required": ["Skill A", "Skill B"], "description": "Job description." },
    { "id": 1039, "category": "Marketing", "title": "Associate Partner", "company": "Infosys", "location": "Bengaluru", "job_type": "Full-time", "work_mode": "Hybrid", "salary_min": 1200000, "salary_max": 1400000, "experience": "3-6 Years", "skills_required": ["Skill A", "Skill B"], "description": "Job description." },
    { "id": 1040, "category": "HR", "title": "Customer Support", "company": "Amazon", "location": "Lucknow", "job_type": "Internship", "work_mode": "On-site", "salary_min": 1000000, "salary_max": 1700000, "experience": "1-3 Years", "skills_required": ["Skill A", "Skill B"], "description": "Job description." },
    { "id": 1041, "category": "Tech", "title": "Business Analyst", "company": "Flipkart", "location": "Ahmedabad", "job_type": "Full-time", "work_mode": "Hybrid", "salary_min": 600000, "salary_max": 2000000, "experience": "Fresher", "skills_required": ["Skill A", "Skill B"], "description": "Job description." },
    { "id": 1042, "category": "Tech", "title": "Business Analyst", "company": "Flipkart", "location": "Lucknow", "job_type": "Part-time", "work_mode": "Hybrid", "salary_min": 1100000, "salary_max": 1400000, "experience": "Fresher", "skills_required": ["Skill A", "Skill B"], "description": "Job description." },
    { "id": 1043, "category": "Banking", "title": "Associate Partner", "company": "TCS", "location": "Bengaluru", "job_type": "Freelance", "work_mode": "Hybrid", "salary_min": 400000, "salary_max": 2000000, "experience": "6+ Years", "skills_required": ["Skill A", "Skill B"], "description": "Job description." },
    { "id": 1044, "category": "Banking", "title": "Technical Lead", "company": "Tech Mahindra", "location": "Hyderabad", "job_type": "Govt", "work_mode": "Hybrid", "salary_min": 1000000, "salary_max": 1700000, "experience": "1-3 Years", "skills_required": ["Skill A", "Skill B"], "description": "Job description." },
    { "id": 1045, "category": "Tech", "title": "Production Specialist", "company": "Tech Mahindra", "location": "Delhi", "job_type": "Govt", "work_mode": "Hybrid", "salary_min": 400000, "salary_max": 1800000, "experience": "6+ Years", "skills_required": ["Skill A", "Skill B"], "description": "Job description." },
    { "id": 1046, "category": "Tech", "title": "Project Coordinator", "company": "TCS", "location": "Delhi", "job_type": "Part-time", "work_mode": "Hybrid", "salary_min": 1000000, "salary_max": 1600000, "experience": "6+ Years", "skills_required": ["Skill A", "Skill B"], "description": "Job description." },
    { "id": 1047, "category": "Marketing", "title": "Customer Support", "company": "Reliance", "location": "Delhi", "job_type": "Full-time", "work_mode": "On-site", "salary_min": 400000, "salary_max": 2000000, "experience": "3-6 Years", "skills_required": ["Skill A", "Skill B"], "description": "Job description." },
    { "id": 1048, "category": "Marketing", "title": "Business Analyst", "company": "Infosys", "location": "Chennai", "job_type": "Part-time", "work_mode": "On-site", "salary_min": 600000, "salary_max": 1500000, "experience": "6+ Years", "skills_required": ["Skill A", "Skill B"], "description": "Job description." },
    { "id": 1049, "category": "Banking", "title": "Associate Partner", "company": "Infosys", "location": "Delhi", "job_type": "Govt", "work_mode": "Hybrid", "salary_min": 900000, "salary_max": 1900000, "experience": "3-6 Years", "skills_required": ["Skill A", "Skill B"], "description": "Job description." },
    { "id": 1050, "category": "Design", "title": "Field Engineer", "company": "Infosys", "location": "Chennai", "job_type": "Freelance", "work_mode": "Hybrid", "salary_min": 300000, "salary_max": 1600000, "experience": "Fresher", "skills_required": ["Skill A", "Skill B"], "description": "Job description." },
    { "id": 1051, "category": "Banking", "title": "Associate Partner", "company": "Infosys", "location": "Bengaluru", "job_type": "Internship", "work_mode": "On-site", "salary_min": 600000, "salary_max": 1500000, "experience": "1-3 Years", "skills_required": ["Skill A", "Skill B"], "description": "Job description." },
    { "id": 1052, "category": "Tech", "title": "Assistant Manager", "company": "Amazon", "location": "Hyderabad", "job_type": "Internship", "work_mode": "On-site", "salary_min": 400000, "salary_max": 1500000, "experience": "1-3 Years", "skills_required": ["Skill A", "Skill B"], "description": "Job description." },
    { "id": 1053, "category": "Banking", "title": "Business Analyst", "company": "Wipro", "location": "Kolkata", "job_type": "Govt", "work_mode": "Hybrid", "salary_min": 1200000, "salary_max": 1800000, "experience": "1-3 Years", "skills_required": ["Skill A", "Skill B"], "description": "Job description." },
    { "id": 1054, "category": "HR", "title": "Production Specialist", "company": "TATA", "location": "Ahmedabad", "job_type": "Part-time", "work_mode": "On-site", "salary_min": 500000, "salary_max": 1700000, "experience": "6+ Years", "skills_required": ["Skill A", "Skill B"], "description": "Job description." },
    { "id": 1055, "category": "Tech", "title": "Office Admin", "company": "ICICI Bank", "location": "Pune", "job_type": "Internship", "work_mode": "Hybrid", "salary_min": 900000, "salary_max": 2000000, "experience": "6+ Years", "skills_required": ["Skill A", "Skill B"], "description": "Job description." },
    { "id": 1056, "category": "Logistics", "title": "Quality Analyst", "company": "Reliance", "location": "Ahmedabad", "job_type": "Part-time", "work_mode": "On-site", "salary_min": 500000, "salary_max": 1700000, "experience": "3-6 Years", "skills_required": ["Skill A", "Skill B"], "description": "Job description." },
    { "id": 1057, "category": "Marketing", "title": "Associate Partner", "company": "Flipkart", "location": "Pune", "job_type": "Internship", "work_mode": "Hybrid", "salary_min": 600000, "salary_max": 1800000, "experience": "Fresher", "skills_required": ["Skill A", "Skill B"], "description": "Job description." },
    { "id": 1058, "category": "Banking", "title": "Associate Partner", "company": "ICICI Bank", "location": "Hyderabad", "job_type": "Freelance", "work_mode": "On-site", "salary_min": 400000, "salary_max": 1800000, "experience": "3-6 Years", "skills_required": ["Skill A", "Skill B"], "description": "Job description." },
    { "id": 1059, "category": "Tech", "title": "Office Admin", "company": "ICICI Bank", "location": "Delhi", "job_type": "Freelance", "work_mode": "On-site", "salary_min": 600000, "salary_max": 1700000, "experience": "1-3 Years", "skills_required": ["Skill A", "Skill B"], "description": "Job description." },
    { "id": 1060, "category": "Marketing", "title": "Production Specialist", "company": "TATA", "location": "Bengaluru", "job_type": "Internship", "work_mode": "Hybrid", "salary_min": 600000, "salary_max": 1500000, "experience": "6+ Years", "skills_required": ["Skill A", "Skill B"], "description": "Job description." },
    { "id": 1061, "category": "Banking", "title": "Business Analyst", "company": "Infosys", "location": "Kolkata", "job_type": "Part-time", "work_mode": "Hybrid", "salary_min": 400000, "salary_max": 1600000, "experience": "6+ Years", "skills_required": ["Skill A", "Skill B"], "description": "Job description." },
    { "id": 1062, "category": "Marketing", "title": "Assistant Manager", "company": "Infosys", "location": "Kolkata", "job_type": "Freelance", "work_mode": "On-site", "salary_min": 600000, "salary_max": 1900000, "experience": "1-3 Years", "skills_required": ["Skill A", "Skill B"], "description": "Job description." },
    { "id": 1063, "category": "HR", "title": "Business Analyst", "company": "ICICI Bank", "location": "Delhi", "job_type": "Freelance", "work_mode": "Hybrid", "salary_min": 800000, "salary_max": 1500000, "experience": "6+ Years", "skills_required": ["Skill A", "Skill B"], "description": "Job description." },
    { "id": 1064, "category": "Design", "title": "Business Analyst", "company": "Flipkart", "location": "Jaipur", "job_type": "Freelance", "work_mode": "Remote", "salary_min": 800000, "salary_max": 1600000, "experience": "6+ Years", "skills_required": ["Skill A", "Skill B"], "description": "Job description." },
    { "id": 1065, "category": "Banking", "title": "Technical Lead", "company": "ICICI Bank", "location": "Bengaluru", "job_type": "Internship", "work_mode": "Hybrid", "salary_min": 900000, "salary_max": 1700000, "experience": "1-3 Years", "skills_required": ["Skill A", "Skill B"], "description": "Job description." },
    { "id": 1066, "category": "Banking", "title": "Production Specialist", "company": "Reliance", "location": "Jaipur", "job_type": "Internship", "work_mode": "Remote", "salary_min": 1200000, "salary_max": 1800000, "experience": "1-3 Years", "skills_required": ["Skill A", "Skill B"], "description": "Job description." },
    { "id": 1067, "category": "Logistics", "title": "Business Analyst", "company": "TCS", "location": "Chennai", "job_type": "Part-time", "work_mode": "Hybrid", "salary_min": 1100000, "salary_max": 1400000, "experience": "3-6 Years", "skills_required": ["Skill A", "Skill B"], "description": "Job description." },
    { "id": 1068, "category": "Tech", "title": "Assistant Manager", "company": "TATA", "location": "Kolkata", "job_type": "Govt", "work_mode": "Hybrid", "salary_min": 1200000, "salary_max": 1400000, "experience": "1-3 Years", "skills_required": ["Skill A", "Skill B"], "description": "Job description." },
    { "id": 1069, "category": "Marketing", "title": "Office Admin", "company": "Flipkart", "location": "Chennai", "job_type": "Full-time", "work_mode": "Remote", "salary_min": 500000, "salary_max": 1800000, "experience": "1-3 Years", "skills_required": ["Skill A", "Skill B"], "description": "Job description." },
    { "id": 1070, "category": "Tech", "title": "Technical Lead", "company": "HDFC Bank", "location": "Ahmedabad", "job_type": "Part-time", "work_mode": "Remote", "salary_min": 500000, "salary_max": 1600000, "experience": "1-3 Years", "skills_required": ["Skill A", "Skill B"], "description": "Job description." },
    { "id": 1071, "category": "Marketing", "title": "Field Engineer", "company": "Reliance", "location": "Ahmedabad", "job_type": "Govt", "work_mode": "Hybrid", "salary_min": 800000, "salary_max": 1900000, "experience": "3-6 Years", "skills_required": ["Skill A", "Skill B"], "description": "Job description." },
    { "id": 1072, "category": "Marketing", "title": "Quality Analyst", "company": "ICICI Bank", "location": "Chennai", "job_type": "Govt", "work_mode": "On-site", "salary_min": 300000, "salary_max": 1700000, "experience": "Fresher", "skills_required": ["Skill A", "Skill B"], "description": "Job description." },
    { "id": 1073, "category": "HR", "title": "Business Analyst", "company": "Infosys", "location": "Lucknow", "job_type": "Govt", "work_mode": "Remote", "salary_min": 400000, "salary_max": 2000000, "experience": "6+ Years", "skills_required": ["Skill A", "Skill B"], "description": "Job description." },
    { "id": 1074, "category": "Marketing", "title": "Business Analyst", "company": "TCS", "location": "Kolkata", "job_type": "Part-time", "work_mode": "Hybrid", "salary_min": 500000, "salary_max": 1700000, "experience": "3-6 Years", "skills_required": ["Skill A", "Skill B"], "description": "Job description." },
    { "id": 1075, "category": "Tech", "title": "Business Analyst", "company": "ICICI Bank", "location": "Ahmedabad", "job_type": "Full-time", "work_mode": "Hybrid", "salary_min": 800000, "salary_max": 1400000, "experience": "3-6 Years", "skills_required": ["Skill A", "Skill B"], "description": "Job description." },
    { "id": 1076, "category": "Tech", "title": "Project Coordinator", "company": "Reliance", "location": "Hyderabad", "job_type": "Part-time", "work_mode": "Remote", "salary_min": 1000000, "salary_max": 1600000, "experience": "6+ Years", "skills_required": ["Skill A", "Skill B"], "description": "Job description." },
    { "id": 1077, "category": "Design", "title": "Assistant Manager", "company": "Tech Mahindra", "location": "Delhi", "job_type": "Govt", "work_mode": "Remote", "salary_min": 500000, "salary_max": 1600000, "experience": "6+ Years", "skills_required": ["Skill A", "Skill B"], "description": "Job description." },
    { "id": 1078, "category": "Logistics", "title": "Technical Lead", "company": "Infosys", "location": "Chennai", "job_type": "Internship", "work_mode": "Hybrid", "salary_min": 600000, "salary_max": 2000000, "experience": "Fresher", "skills_required": ["Skill A", "Skill B"], "description": "Job description." },
    { "id": 1079, "category": "Design", "title": "Field Engineer", "company": "Tech Mahindra", "location": "Jaipur", "job_type": "Internship", "work_mode": "Remote", "salary_min": 1200000, "salary_max": 1500000, "experience": "3-6 Years", "skills_required": ["Skill A", "Skill B"], "description": "Job description." },
    { "id": 1080, "category": "Logistics", "title": "Project Coordinator", "company": "TCS", "location": "Delhi", "job_type": "Full-time", "work_mode": "On-site", "salary_min": 800000, "salary_max": 1700000, "experience": "Fresher", "skills_required": ["Skill A", "Skill B"], "description": "Job description." },
    { "id": 1081, "category": "Tech", "title": "Quality Analyst", "company": "TCS", "location": "Mumbai", "job_type": "Freelance", "work_mode": "Hybrid", "salary_min": 500000, "salary_max": 1400000, "experience": "6+ Years", "skills_required": ["Skill A", "Skill B"], "description": "Job description." },
    { "id": 1082, "category": "Tech", "title": "Project Coordinator", "company": "Reliance", "location": "Chennai", "job_type": "Internship", "work_mode": "On-site", "salary_min": 1200000, "salary_max": 1400000, "experience": "1-3 Years", "skills_required": ["Skill A", "Skill B"], "description": "Job description." },
    { "id": 1083, "category": "HR", "title": "Assistant Manager", "company": "Reliance", "location": "Delhi", "job_type": "Freelance", "work_mode": "Remote", "salary_min": 800000, "salary_max": 1600000, "experience": "6+ Years", "skills_required": ["Skill A", "Skill B"], "description": "Job description." },
    { "id": 1084, "category": "Logistics", "title": "Associate Partner", "company": "TCS", "location": "Lucknow", "job_type": "Freelance", "work_mode": "Remote", "salary_min": 500000, "salary_max": 2000000, "experience": "6+ Years", "skills_required": ["Skill A", "Skill B"], "description": "Job description." },
    { "id": 1085, "category": "Design", "title": "Customer Support", "company": "Infosys", "location": "Delhi", "job_type": "Freelance", "work_mode": "Hybrid", "salary_min": 600000, "salary_max": 1500000, "experience": "Fresher", "skills_required": ["Skill A", "Skill B"], "description": "Job description." },
    { "id": 1086, "category": "Logistics", "title": "Office Admin", "company": "Wipro", "location": "Bengaluru", "job_type": "Part-time", "work_mode": "Hybrid", "salary_min": 1000000, "salary_max": 1800000, "experience": "6+ Years", "skills_required": ["Skill A", "Skill B"], "description": "Job description." },
    { "id": 1087, "category": "Banking", "title": "Assistant Manager", "company": "Flipkart", "location": "Hyderabad", "job_type": "Part-time", "work_mode": "On-site", "salary_min": 700000, "salary_max": 1700000, "experience": "Fresher", "skills_required": ["Skill A", "Skill B"], "description": "Job description." },
    { "id": 1088, "category": "Marketing", "title": "Field Engineer", "company": "Amazon", "location": "Hyderabad", "job_type": "Full-time", "work_mode": "Remote", "salary_min": 400000, "salary_max": 1900000, "experience": "Fresher", "skills_required": ["Skill A", "Skill B"], "description": "Job description." },
    { "id": 1089, "category": "Tech", "title": "Associate Partner", "company": "TCS", "location": "Pune", "job_type": "Internship", "work_mode": "Remote", "salary_min": 1200000, "salary_max": 1900000, "experience": "1-3 Years", "skills_required": ["Skill A", "Skill B"], "description": "Job description." },
    { "id": 1090, "category": "Logistics", "title": "Production Specialist", "company": "Wipro", "location": "Jaipur", "job_type": "Freelance", "work_mode": "Hybrid", "salary_min": 900000, "salary_max": 1800000, "experience": "1-3 Years", "skills_required": ["Skill A", "Skill B"], "description": "Job description." },
    { "id": 1091, "category": "HR", "title": "Associate Partner", "company": "Tech Mahindra", "location": "Mumbai", "job_type": "Part-time", "work_mode": "Hybrid", "salary_min": 600000, "salary_max": 1400000, "experience": "6+ Years", "skills_required": ["Skill A", "Skill B"], "description": "Job description." },
    { "id": 1092, "category": "Marketing", "title": "Field Engineer", "company": "Infosys", "location": "Ahmedabad", "job_type": "Part-time", "work_mode": "On-site", "salary_min": 300000, "salary_max": 1700000, "experience": "1-3 Years", "skills_required": ["Skill A", "Skill B"], "description": "Job description." },
    { "id": 1093, "category": "Design", "title": "Production Specialist", "company": "Amazon", "location": "Ahmedabad", "job_type": "Full-time", "work_mode": "On-site", "salary_min": 1100000, "salary_max": 1600000, "experience": "6+ Years", "skills_required": ["Skill A", "Skill B"], "description": "Job description." },
    { "id": 1094, "category": "HR", "title": "Technical Lead", "company": "Amazon", "location": "Lucknow", "job_type": "Govt", "work_mode": "On-site", "salary_min": 1100000, "salary_max": 1800000, "experience": "6+ Years", "skills_required": ["Skill A", "Skill B"], "description": "Job description." },
    { "id": 1095, "category": "Logistics", "title": "Assistant Manager", "company": "TCS", "location": "Kolkata", "job_type": "Freelance", "work_mode": "Hybrid", "salary_min": 1000000, "salary_max": 1600000, "experience": "3-6 Years", "skills_required": ["Skill A", "Skill B"], "description": "Job description." },
    { "id": 1096, "category": "Design", "title": "Technical Lead", "company": "TATA", "location": "Ahmedabad", "job_type": "Internship", "work_mode": "Remote", "salary_min": 1000000, "salary_max": 2000000, "experience": "1-3 Years", "skills_required": ["Skill A", "Skill B"], "description": "Job description." },
    { "id": 1097, "category": "Logistics", "title": "Customer Support", "company": "Reliance", "location": "Lucknow", "job_type": "Part-time", "work_mode": "Remote", "salary_min": 1200000, "salary_max": 1800000, "experience": "6+ Years", "skills_required": ["Skill A", "Skill B"], "description": "Job description." },
    { "id": 1098, "category": "Design", "title": "Quality Analyst", "company": "TCS", "location": "Kolkata", "job_type": "Freelance", "work_mode": "Hybrid", "salary_min": 1000000, "salary_max": 1500000, "experience": "1-3 Years", "skills_required": ["Skill A", "Skill B"], "description": "Job description." },
    { "id": 1099, "category": "Logistics", "title": "Production Specialist", "company": "Wipro", "location": "Delhi", "job_type": "Full-time", "work_mode": "On-site", "salary_min": 700000, "salary_max": 1700000, "experience": "6+ Years", "skills_required": ["Skill A", "Skill B"], "description": "Job description." }

];

const JobsAPI = {
    list(params = {}) {
        const qs = new URLSearchParams(params).toString();
        return apiFetch(`/jobs${qs ? '?' + qs : ''}`).catch(() => {
            let filtered = [...DUMMY_JOBS];

            // Text search
            if (params.q) {
                const qLower = params.q.toLowerCase();
                filtered = filtered.filter(j =>
                    j.title.toLowerCase().includes(qLower) ||
                    j.company.toLowerCase().includes(qLower) ||
                    (j.skills_required && j.skills_required.some(s => s.toLowerCase().includes(qLower)))
                );
            }
            // Location
            if (params.location) {
                const lLower = params.location.toLowerCase();
                filtered = filtered.filter(j => j.location.toLowerCase().includes(lLower));
            }
            // Category exact match
            if (params.category && params.category !== '') {
                filtered = filtered.filter(j => j.category === params.category);
            }
            // Job Type (checkboxes handle comma separated strings)
            if (params.type) {
                const validTypes = params.type.split(',').map(t => t.trim());
                if (validTypes.length > 0 && validTypes[0] !== '') {
                    filtered = filtered.filter(j => validTypes.includes(j.job_type));
                }
            }
            // Work Mode
            if (params.mode) {
                const validModes = params.mode.split(',').map(t => t.trim());
                if (validModes.length > 0 && validModes[0] !== '') {
                    filtered = filtered.filter(j => validModes.includes(j.work_mode));
                }
            }

            const total = filtered.length;
            const perPage = params.per_page || 9;
            const page = params.page || 1;

            // Pagination
            const paged = filtered.slice((page - 1) * perPage, page * perPage);

            return { jobs: paged, total, pages: Math.ceil(total / perPage) || 1 };
        });
    },
    detail(id) {
        return apiFetch(`/jobs/${id}`).catch(() => {
            const found = DUMMY_JOBS.find(j => String(j.id) === String(id));
            if (found) return { job: found };
            return { job: DUMMY_JOBS[0] }; // default fallback
        });
    },
    save(id) {
        return apiFetch(`/jobs/${id}/save`, { method: 'POST' }).catch(err => {
            if (!_isNetworkError(err)) throw err;
            const saved = JSON.parse(localStorage.getItem('wm_local_saved_jobs') || '[]');
            if (!saved.includes(id)) {
                saved.push(id);
                localStorage.setItem('wm_local_saved_jobs', JSON.stringify(saved));
            }
            return { success: true };
        });
    },
    unsave(id) {
        return apiFetch(`/jobs/${id}/save`, { method: 'DELETE' }).catch(err => {
            if (!_isNetworkError(err)) throw err;
            let saved = JSON.parse(localStorage.getItem('wm_local_saved_jobs') || '[]');
            saved = saved.filter(x => x !== id);
            localStorage.setItem('wm_local_saved_jobs', JSON.stringify(saved));
            return { success: true };
        });
    },
    saved() {
        return apiFetch('/jobs/saved').catch(() => {
            const ids = JSON.parse(localStorage.getItem('wm_local_saved_jobs') || '[]');
            const jobs = DUMMY_JOBS.filter(j => ids.includes(j.id));
            return { jobs };
        });
    },
    apply(id, note = '') {
        return apiFetch(`/jobs/${id}/apply`, {
            method: 'POST', body: JSON.stringify({ cover_note: note })
        }).catch(err => {
            // If it's a real API error (e.g. 400 Bad Request), re-throw it
            if (!_isNetworkError(err)) throw err;

            // Offline fallback: simulate success and store locally
            const user = AuthAPI.currentUser();
            const uid = user ? user.id : 'guest';
            const apps = JSON.parse(localStorage.getItem('wm_local_applications') || '[]');

            // Simulating "already applied" check
            if (apps.find(a => String(a.job_id) === String(id) && String(a.user_id) === String(uid))) {
                throw new Error('You already applied to this job.');
            }

            apps.push({
                id: Date.now(),
                job_id: id,
                user_id: uid,
                note,
                applied_at: new Date().toISOString()
            });
            localStorage.setItem('wm_local_applications', JSON.stringify(apps));

            // Show the offline banner to notify user
            _showOfflineBanner();
            return { success: true, message: 'Applied successfully (Local)' };
        });
    },
    applied() {
        return apiFetch('/jobs/applied').catch(() => {
            const apps = JSON.parse(localStorage.getItem('wm_local_applications') || '[]');
            // Merge with dummy job details for UI display
            const filtered = apps.map(app => {
                const job = DUMMY_JOBS.find(j => String(j.id) === String(app.job_id)) || DUMMY_JOBS[0];
                return { ...app, job };
            });
            return { applications: filtered };
        });
    },
    recommended() { return apiFetch('/jobs/recommended').catch(() => ({ jobs: [] })); },
};

/* ═══════════════════════════════════════════════════════════
   PROFILE API
═════════════════════════════════════════════════════════════ */
const ProfileAPI = {
    get() { return apiFetch('/profile').catch(() => ({ profile: AuthAPI.currentUser() })); },
    update(data) {
        return apiFetch('/profile', { method: 'PUT', body: JSON.stringify(data) }).catch(() => {
            const token = Token.get();
            let updatedUser = { ...AuthAPI.currentUser(), ...data };

            if (token && LocalDB._isLocalToken(token)) {
                try {
                    updatedUser = LocalDB.updateUser(token, data);
                    // Preserve any local state that is not in LocalDB keys (like token stuff, or non-persisted local UI keys)
                } catch (e) {
                    console.error("LocalDB Update Error:", e);
                }
            }
            localStorage.setItem('wm_user', JSON.stringify(updatedUser));
            return { user: updatedUser };
        });
    },
    async stats() {
        try { return await apiFetch('/profile/stats'); }
        catch (err) {
            const user = AuthAPI.currentUser();
            if (!user || !user.id) return { saved_jobs: 0, applied_jobs: 0, resume_ats: null, interview_score: null };
            const resumes = LocalDB.resumes.get(user.id);
            const lastResume = resumes.length > 0 ? resumes[resumes.length - 1] : null;
            return {
                saved_jobs: 0,
                applied_jobs: 0,
                resume_ats: lastResume ? lastResume.ats_score : null,
                interview_score: null
            };
        }
    },

    getEducation() { return apiFetch('/profile/education').catch(() => ({ education: [] })); },
    addEducation(d) { return apiFetch('/profile/education', { method: 'POST', body: JSON.stringify(d) }).catch(() => ({})); },
    delEducation(id) { return apiFetch(`/profile/education/${id}`, { method: 'DELETE' }).catch(() => ({})); },

    getExperience() { return apiFetch('/profile/experience').catch(() => ({ experience: [] })); },
    addExperience(d) { return apiFetch('/profile/experience', { method: 'POST', body: JSON.stringify(d) }).catch(() => ({})); },
    delExperience(id) { return apiFetch(`/profile/experience/${id}`, { method: 'DELETE' }).catch(() => ({})); },

    getSkills() { return apiFetch('/profile/skills').catch(() => ({ skills: [] })); },
    addSkills(skills, level = 'Intermediate') {
        return apiFetch('/profile/skills', {
            method: 'POST', body: JSON.stringify({ skills, level })
        }).catch(() => ({}));
    },
    delSkill(id) { return apiFetch(`/profile/skills/${id}`, { method: 'DELETE' }).catch(() => ({})); },

    getCerts() { return apiFetch('/profile/certificates').catch(() => ({ certificates: [] })); },
    addCert(d) { return apiFetch('/profile/certificates', { method: 'POST', body: JSON.stringify(d) }).catch(() => ({})); },
    delCert(id) { return apiFetch(`/profile/certificates/${id}`, { method: 'DELETE' }).catch(() => ({})); },

    getPrefs() { return apiFetch('/profile/preferences').catch(() => ({})); },
    updatePrefs(d) { return apiFetch('/profile/preferences', { method: 'PUT', body: JSON.stringify(d) }).catch(() => ({})); },

    async getResumes() {
        try { return await apiFetch('/profile/resumes'); }
        catch (err) {
            const user = AuthAPI.currentUser();
            if (user && user.id) return { resumes: LocalDB.resumes.get(user.id) };
            return { resumes: [] };
        }
    },
    async addResume(d) {
        try { return await apiFetch('/profile/resumes', { method: 'POST', body: JSON.stringify(d) }); }
        catch (err) {
            const user = AuthAPI.currentUser();
            if (user && user.id) return { resume: LocalDB.resumes.add(user.id, d) };
            return {};
        }
    },
};

/* ═══════════════════════════════════════════════════════════
   DASHBOARD API
═════════════════════════════════════════════════════════════ */
const DashboardAPI = {
    get() { return apiFetch('/dashboard').catch(() => ({})); }
};

/* ═══════════════════════════════════════════════════════════
   INTERVIEW API
═════════════════════════════════════════════════════════════ */
const InterviewAPI = {
    getScores() { return apiFetch('/interview/scores').catch(() => ({ scores: [] })); },
    saveScore(d) {
        return apiFetch('/interview/scores', {
            method: 'POST', body: JSON.stringify(d)
        }).catch(() => ({}));
    }
};

/* ═══════════════════════════════════════════════════════════
   PLACEMENT API
═════════════════════════════════════════════════════════════ */
const PlacementAPI = {
    getScores() { return apiFetch('/placement/scores').catch(() => ({ scores: [] })); },
    saveScore(d) {
        return apiFetch('/placement/scores', {
            method: 'POST', body: JSON.stringify(d)
        }).catch(() => ({}));
    }
};

/* ═══════════════════════════════════════════════════════════
   SCHEMES API
═════════════════════════════════════════════════════════════ */
const SchemesAPI = {
    list(params = {}) {
        const qs = new URLSearchParams(params).toString();
        return apiFetch(`/schemes${qs ? '?' + qs : ''}`).catch(() => {
            const dummySchemes = [
                // Skill Development
                { id: 1, category: 'skill', name: 'Pradhan Mantri Kaushal Vikas Yojana', ministry: 'Ministry of Skill Development', description: 'Flagship scheme for skill training of youth to be implement by NSDC.', benefit: 'Free Skill Training & Certification', eligibility: 'Unemployed Youth', apply_url: 'https://www.pmkvyofficial.org' },
                { id: 2, category: 'skill', name: 'Deen Dayal Upadhyaya Grameen Kaushalya Yojana', ministry: 'Ministry of Rural Development', description: 'Skill training for rural youth to ensure placement in wage employment.', benefit: 'Free Placement Linked Skill Training', eligibility: 'Rural Youth (15-35 yrs)', apply_url: 'https://ddugky.gov.in' },
                { id: 3, category: 'skill', name: 'Skill India Digital Hub', ministry: 'Ministry of Skill Development', description: 'Digital platform bringing all skill development initiatives under one umbrella.', benefit: 'Online Courses & Job Opportunities', eligibility: 'All Citizens', apply_url: 'https://www.skillindiadigital.gov.in' },
                { id: 4, category: 'skill', name: 'Pradhan Mantri Vishwakarma Yojana', ministry: 'MSME', description: 'Support for artisans and craftspeople to improve quality, scale and reach of their products.', benefit: 'Skill Upgradation & Toolkit Incentive', eligibility: 'Artisans/Craftspeople', apply_url: 'https://pmvishwakarma.gov.in' },
                { id: 5, category: 'skill', name: 'Jan Shikshan Sansthan', ministry: 'Ministry of Skill Development', description: 'Vocational training to non-literates, neo-literates and school dropouts.', benefit: 'Vocational Skills at Doorstep', eligibility: 'Dropouts (15-45 yrs)', apply_url: 'https://jss.gov.in' },

                // Employment
                { id: 6, category: 'employment', name: 'Prime Minister Employment Generation Programme', ministry: 'MSME', description: 'Credit-linked subsidy program aimed at generating self-employment opportunities.', benefit: 'Subsidized Business Loans', eligibility: 'School Dropout/Unemployed', apply_url: 'https://www.kviconline.gov.in' },
                { id: 7, category: 'employment', name: 'National Career Service', ministry: 'Ministry of Labour & Employment', description: 'Bridging the gap between job seekers and employers through a digital portal.', benefit: 'Job Matching & Career Counseling', eligibility: 'Job Seekers', apply_url: 'https://www.ncs.gov.in' },
                { id: 8, category: 'employment', name: 'Aatmanirbhar Bharat Rojgar Yojana', ministry: 'Ministry of Labour & Employment', description: 'Incentivizing employers to create new employment along with social security benefits.', benefit: 'EPF Subsidy for Employers/Employees', eligibility: 'New Employees', apply_url: 'https://www.epfindia.gov.in' },
                { id: 9, category: 'employment', name: 'Rozgar Mela', ministry: 'Government of India', description: 'Employment fair for providing massive jobs in government and private sectors.', benefit: 'Direct Recruitment', eligibility: 'As per job role', apply_url: 'https://www.india.gov.in' },
                { id: 10, category: 'employment', name: 'Garib Kalyan Rojgar Abhiyaan', ministry: 'Ministry of Rural Development', description: 'Employment campaign to boost livelihood opportunities in rural India.', benefit: 'Immediate Employment', eligibility: 'Migrant Workers', apply_url: 'https://rural.nic.in' },

                // Business Loans
                { id: 11, category: 'loan', name: 'Pradhan Mantri Mudra Yojana', ministry: 'Ministry of Finance', description: 'Loans up to 10 lakhs to the non-corporate, non-farm small/micro enterprises.', benefit: 'Collateral-free Loans', eligibility: 'Small Business Owners', apply_url: 'https://www.mudra.org.in' },
                { id: 12, category: 'loan', name: 'Stand-Up India', ministry: 'Ministry of Finance', description: 'Bank loans between 10L - 1Cr to at least one SC/ST and one woman borrower.', benefit: 'Bank Loans for Enterprises', eligibility: 'SC/ST & Women', apply_url: 'https://www.standupmitra.in' },
                { id: 13, category: 'loan', name: 'PM SVANidhi', ministry: 'MoHUA', description: 'Micro-credit facility to street vendors to resume their livelihoods.', benefit: 'Working Capital Loan', eligibility: 'Street Vendors', apply_url: 'https://pmsvanidhi.mohua.gov.in' },
                { id: 14, category: 'loan', name: 'CGTMSE', ministry: 'MSME', description: 'Guarantees bank loans given to Micro and Small Enterprises without collateral.', benefit: 'Loan Guarantee', eligibility: 'MSMEs', apply_url: 'https://www.cgtmse.in' },
                { id: 15, category: 'loan', name: 'Startup India Seed Fund', ministry: 'DPIIT', description: 'Financial assistance to startups for proof of concept and product trials.', benefit: 'Seed Funding', eligibility: 'Recognized Startups', apply_url: 'https://seedfund.startupindia.gov.in' },

                // Women
                { id: 16, category: 'women', name: 'Mahila Samman Savings Certificate', ministry: 'Ministry of Finance', description: 'Small savings scheme specifically designed for women with fixed interest rate.', benefit: 'High Interest Rate', eligibility: 'Women & Girls', apply_url: 'https://www.indiapost.gov.in' },
                { id: 17, category: 'women', name: 'Beti Bachao Beti Padhao', ministry: 'MWCD', description: 'Addressing declining Child Sex Ratio and women empowerment issues.', benefit: 'Education & Welfare', eligibility: 'Girl Child', apply_url: 'https://wcd.nic.in/bbbp-schemes' },
                { id: 18, category: 'women', name: 'Pradhan Mantri Matru Vandana Yojana', ministry: 'MWCD', description: 'Maternity benefit program providing cash incentives for health.', benefit: 'Cash Incentive', eligibility: 'Pregnant Women', apply_url: 'https://pmmvy.wcd.gov.in' },
                { id: 19, category: 'women', name: 'Sukanya Samriddhi Yojana', ministry: 'Ministry of Finance', description: 'Government-backed savings scheme targeted at parents of girl children.', benefit: 'High Return Savings', eligibility: 'Girl Child (<10 yrs)', apply_url: 'https://www.indiapost.gov.in' },
                { id: 20, category: 'women', name: 'STEP', ministry: 'MWCD', description: 'Provide skills that give employability to women.', benefit: 'Skill Training', eligibility: 'Women (16+ yrs)', apply_url: 'https://wcd.nic.in' },

                // Rural
                { id: 21, category: 'rural', name: 'MGNREGA', ministry: 'Ministry of Rural Development', description: 'Guarantees 100 days of wage employment in a financial year to a rural household.', benefit: 'Guaranteed Wage Employment', eligibility: 'Rural Adults', apply_url: 'https://nrega.nic.in' },
                { id: 22, category: 'rural', name: 'PMAY-G', ministry: 'Ministry of Rural Development', description: 'Housing for all scheme providing financial assistance for pucca house.', benefit: 'Housing Assistance', eligibility: 'Rural Homeless', apply_url: 'https://pmayg.nic.in' },
                { id: 23, category: 'rural', name: 'PM-KISAN', ministry: 'Ministry of Agriculture', description: 'Income support to all landholding farmers families in the country.', benefit: 'Rs. 6000/year', eligibility: 'Farmer Families', apply_url: 'https://pmkisan.gov.in' },
                { id: 24, category: 'rural', name: 'DAY-NRLM', ministry: 'Ministry of Rural Development', description: 'Organizing rural poor into Self Help Groups and providing capacity building.', benefit: 'SHG Support', eligibility: 'Rural Poor', apply_url: 'https://aajeevika.gov.in' },
                { id: 25, category: 'rural', name: 'PMGSY', ministry: 'Ministry of Rural Development', description: 'Providing good all-weather road connectivity to unconnected habitations.', benefit: 'Infrastructure Development', eligibility: 'Rural Communities', apply_url: 'https://omms.nic.in' },

                // Students
                { id: 26, category: 'student', name: 'National Scholarship Portal', ministry: 'MeitY', description: 'One-stop solution for various scholarship schemes offered by Govt of India.', benefit: 'Education Scholarships', eligibility: 'Students', apply_url: 'https://scholarships.gov.in' },
                { id: 27, category: 'student', name: 'Pragati Scholarship Scheme', ministry: 'AICTE', description: 'Scholarship for girl students taking admission in technical institutions.', benefit: 'Rs. 50k/annum for girls', eligibility: 'Girl Tech Students', apply_url: 'https://www.aicte-india.org' },
                { id: 28, category: 'student', name: 'Saksham Scholarship Scheme', ministry: 'AICTE', description: 'Empowering specially-abled students to pursue technical education.', benefit: 'Financial Assistance', eligibility: 'Differently Abled Students', apply_url: 'https://www.aicte-india.org' },
                { id: 29, category: 'student', name: 'CSSS for College & University', ministry: 'Ministry of Education', description: 'Financial assistance to meritorious students from low-income families.', benefit: 'Higher Ed Scholarship', eligibility: 'Meritorious Students', apply_url: 'https://scholarships.gov.in' },
                { id: 30, category: 'student', name: 'SWAYAM', ministry: 'Ministry of Education', description: 'Free online courses for everyone, from 9th class till post-graduation.', benefit: 'Free Access to Courses', eligibility: 'All Learners', apply_url: 'https://swayam.gov.in' }
            ];
            return { schemes: dummySchemes, total: dummySchemes.length };
        });
    },
    detail(id) {
        return apiFetch(`/schemes/${id}`).catch(() => ({
            scheme: { id, name: 'Sample Scheme', apply_url: 'https://www.india.gov.in' }
        }));
    }
};

/* ═══════════════════════════════════════════════════════════
   SUPPORT API
═════════════════════════════════════════════════════════════ */
const SupportAPI = {
    submit(data) {
        return apiFetch('/support', { method: 'POST', body: JSON.stringify(data) }).catch(() => ({}));
    }
};

/* ═══════════════════════════════════════════════════════════
   RESUME API
═════════════════════════════════════════════════════════════ */
const ResumeAPI = {
    analyze(text, filename = 'resume.txt', targetRole = 'General') {
        return apiFetch('/resume/analyze', {
            method: 'POST',
            body: JSON.stringify({ text, filename, target_role: targetRole })
        });
    },
    getHistory() { return apiFetch('/profile/resumes').catch(() => ({ resumes: [] })); },
    saveResult(d) {
        return apiFetch('/profile/resumes', {
            method: 'POST', body: JSON.stringify(d)
        }).catch(() => ({}));
    }
};

/* ═══════════════════════════════════════════════════════════
   NOTIFICATIONS API
═════════════════════════════════════════════════════════════ */
const NotificationsAPI = {
    get() { return apiFetch('/notifications').catch(() => ({ notifications: [] })); }
};

/* ── UI Helpers ───────────────────────────────────────────── */

function initAuthUI() {
    const user = AuthAPI.currentUser();
    const loginBtn = document.querySelector('a[href="login.html"]');
    const regBtn = document.querySelector('a[href="register.html"]');
    const navActions = document.querySelector('.nav-actions');

    if (AuthAPI.isLoggedIn() && user && navActions) {
        if (loginBtn) loginBtn.style.display = 'none';
        if (regBtn) regBtn.style.display = 'none';

        if (!document.getElementById('navUserMenu')) {
            const firstName = (user.name || 'User').split(' ')[0];
            const initial = (user.name || 'U').charAt(0).toUpperCase();

            const menuEl = document.createElement('div');
            menuEl.id = 'navUserMenu';
            menuEl.style.cssText = 'position:relative;display:inline-flex;align-items:center;gap:0.5rem;';
            menuEl.innerHTML = `
                <div style="display:flex;align-items:center;gap:0.625rem;cursor:pointer;padding:0.375rem 0.875rem 0.375rem 0.375rem;background:rgba(79,70,229,0.12);border:1px solid rgba(79,70,229,0.25);border-radius:2rem;transition:all 0.2s;"
                     onmouseenter="this.style.background='rgba(79,70,229,0.2)'" onmouseleave="this.style.background='rgba(79,70,229,0.12)'"
                     onclick="document.getElementById('navUserDropdown').classList.toggle('hidden')">
                    <div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg, var(--primary), var(--secondary));display:flex;align-items:center;justify-content:center;font-size:0.85rem;font-weight:800;color:white;border:2px solid rgba(0, 212, 255, 0.4);">${initial}</div>
                    <span style="font-size:0.82rem;font-weight:600;color:var(--text-primary);max-width:80px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${firstName}</span>
                    <span style="color:var(--text-muted);font-size:0.7rem;">▼</span>
                </div>
                <div id="navUserDropdown" class="hidden" style="position:absolute;top:calc(100% + 8px);right:0;background:var(--bg-card);border:1px solid var(--bg-glass-border);border-radius:var(--radius-lg);padding:0.5rem;min-width:160px;box-shadow:var(--shadow-lg);z-index:999;">
                    <a href="index.html"     style="display:flex;align-items:center;gap:0.625rem;padding:0.625rem 0.875rem;border-radius:var(--radius-md);font-size:0.83rem;color:var(--text-secondary);text-decoration:none;transition:all 0.15s;" onmouseenter="this.style.background='rgba(79,70,229,0.1)'" onmouseleave="this.style.background=''">🏠 Home</a>
                    <a href="dashboard.html" style="display:flex;align-items:center;gap:0.625rem;padding:0.625rem 0.875rem;border-radius:var(--radius-md);font-size:0.83rem;color:var(--text-secondary);text-decoration:none;transition:all 0.15s;" onmouseenter="this.style.background='rgba(79,70,229,0.1)'" onmouseleave="this.style.background=''">📊 Dashboard</a>
                    <a href="profile.html"   style="display:flex;align-items:center;gap:0.625rem;padding:0.625rem 0.875rem;border-radius:var(--radius-md);font-size:0.83rem;color:var(--text-secondary);text-decoration:none;transition:all 0.15s;" onmouseenter="this.style.background='rgba(79,70,229,0.1)'" onmouseleave="this.style.background=''">👤 My Profile</a>
                    <a href="resume.html"    style="display:flex;align-items:center;gap:0.625rem;padding:0.625rem 0.875rem;border-radius:var(--radius-md);font-size:0.83rem;color:var(--text-secondary);text-decoration:none;transition:all 0.15s;" onmouseenter="this.style.background='rgba(79,70,229,0.1)'" onmouseleave="this.style.background=''">📄 Resume</a>
                    <hr style="border:none;border-top:1px solid var(--bg-glass-border);margin:0.375rem 0;">
                    <button onclick="AuthAPI.logout()" style="display:flex;align-items:center;gap:0.625rem;width:100%;padding:0.625rem 0.875rem;border-radius:var(--radius-md);font-size:0.83rem;color:var(--danger);background:transparent;border:none;cursor:pointer;transition:all 0.15s;" onmouseenter="this.style.background='rgba(239,68,68,0.08)'" onmouseleave="this.style.background=''">🚪 Logout</button>
                </div>`;
            const hamburger = navActions.querySelector('.hamburger');
            if (hamburger) navActions.insertBefore(menuEl, hamburger);
            else navActions.appendChild(menuEl);
        }
    }
}

function requireAuth(redirectTo = 'login.html') {
    if (!AuthAPI.isLoggedIn()) {
        if (typeof showToast === 'function') {
            showToast('Please login to access this page.', 'warning');
        }
        setTimeout(() => window.location.href = redirectTo, 1000);
        return false;
    }
    return true;
}

function handleApiError(err, fallbackMsg = 'Something went wrong. Please try again.') {
    const msg = err?.message || fallbackMsg;
    if (typeof showToast === 'function') showToast(`❌ ${msg}`, 'error', 4000);
    console.error('[API Error]', err);
}

/* ── Backwards compatibility ──────────────────────────────── */
function getCurrentUser() { return AuthAPI.currentUser() || { name: 'Guest', email: '' }; }
function isLoggedIn() { return AuthAPI.isLoggedIn(); }
function logout() { AuthAPI.logout(); }
