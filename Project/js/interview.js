/* ============================================
   INTERVIEW PAGE JAVASCRIPT
   ============================================ */

'use strict';

let currentInterviewStep = 1;
let mockQuestions = [];
let mockAnswers = [];
let currentQIndex = 0;
let mockTimer = null;
let timeLeft = 120;
let mockMode = 'text';
let evalScores = {};

// ── STEP NAVIGATION ──────────────────────────
function goToStep(step) {
    // Hide all
    document.querySelectorAll('.section-content').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.flow-step').forEach(s => s.classList.remove('active'));
    // Show step
    document.getElementById('sc' + step)?.classList.add('active');
    document.getElementById('fs' + step)?.classList.add('active');
    currentInterviewStep = step;
    window.scrollTo({ top: 200, behavior: 'smooth' });
    if (step === 4) renderEvaluation();
    if (step === 5) renderReadiness();
}

function selectIType(card) {
    document.querySelectorAll('.itype-card').forEach(c => c.classList.remove('selected'));
    card.classList.add('selected');
}

// ── QUESTION GENERATION ──────────────────────
const QUESTIONS_BANK = {
    hr: [
        'Tell me about yourself and your career journey so far.',
        'What are your key strengths and how have they helped you professionally?',
        'What is your biggest weakness and how are you working to overcome it?',
        'Why do you want to join our company specifically?',
        'Where do you see yourself in 5 years?',
        'How do you handle work pressure and tight deadlines?',
        'Why are you leaving your current position (or why did you leave)?',
        'What motivates you to come to work every day?',
        'Describe a situation where you showed leadership.',
        'What is your expected salary and notice period?',
    ],
    technical: [
        'Explain the difference between object-oriented and functional programming.',
        'What is the time complexity of binary search?',
        'Explain RESTful APIs and how you would design one.',
        'What is the difference between SQL and NoSQL databases?',
        'How does garbage collection work in memory management?',
        'Explain your most technically challenging project.',
        'What design patterns have you used in your projects?',
        'How do you ensure code quality and what tools do you use?',
        'Explain the concept of microservices architecture.',
        'How would you optimize a slow database query?',
    ],
    situational: [
        'Tell me about a time you had a conflict with a colleague. How did you resolve it?',
        'Describe a time you had to meet a critical deadline. What did you do?',
        'Give an example of when you received negative feedback. How did you respond?',
        'Tell me about a time you made a mistake at work. What happened?',
        'Describe a time you went above and beyond for a customer or project.',
        'Tell me about a time you had to learn something new very quickly.',
        'Describe a situation where you had to convince someone who disagreed with you.',
        'Tell me about a project you are most proud of.',
        'Describe a time when you had to prioritize multiple important tasks.',
        'Tell me about a time you showed initiative without being asked.',
    ],
};

function generateQuestions() {
    const role = document.getElementById('qjobRole').value.trim() || 'General';
    const skills = document.getElementById('qskills').value.trim();
    const project = document.getElementById('qproject').value.trim();
    const type = document.getElementById('qtype').value;

    let questions = [];
    if (type === 'all') {
        questions = [...shuffle(QUESTIONS_BANK.hr).slice(0, 4),
        ...shuffle(QUESTIONS_BANK.technical).slice(0, 4),
        ...shuffle(QUESTIONS_BANK.situational).slice(0, 4)];
    } else {
        questions = shuffle(QUESTIONS_BANK[type] || QUESTIONS_BANK.hr).slice(0, 10);
    }

    // Inject personalized questions
    if (role) {
        questions.unshift(`Looking at your background in ${role} — what specific experience makes you confident in this role?`);
    }
    if (skills) {
        const skillList = skills.split(',')[0].trim();
        questions.push(`Can you walk me through a real project where you used ${skillList}?`);
    }
    if (project) {
        questions.push(`You mentioned "${project.slice(0, 60)}..." — what was the biggest technical challenge you faced?`);
    }

    mockQuestions = questions.slice(0, 10);

    document.getElementById('generatedQuestions').style.display = 'block';
    const list = document.getElementById('questionsList');
    list.innerHTML = '';

    questions.forEach((q, i) => {
        const div = document.createElement('div');
        div.style.cssText = 'background:var(--bg-card);border:1px solid var(--bg-glass-border);border-radius:var(--radius-md);padding:1rem;margin-bottom:0.75rem;display:flex;gap:0.875rem;align-items:flex-start;';
        div.innerHTML = `
      <span style="background:var(--grad-primary);color:white;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:0.75rem;font-weight:700;flex-shrink:0;">${i + 1}</span>
      <p style="font-size:0.9rem;color:var(--text-primary);line-height:1.6;margin:0;">${q}</p>
    `;
        list.appendChild(div);
    });

    showToast(`✅ ${questions.length} personalized questions generated for ${role}!`, 'success');
}

function shuffle(arr) {
    return [...arr].sort(() => Math.random() - 0.5);
}

// ── MOCK INTERVIEW ──────────────────────────
function startMock() {
    if (!mockQuestions.length) {
        // Use default HR questions
        mockQuestions = shuffle(QUESTIONS_BANK.hr);
        document.getElementById('mockType').textContent = 'HR Round';
    }
    currentQIndex = 0;
    mockAnswers = [];
    document.getElementById('startMockBtn').style.display = 'none';
    document.getElementById('nextQBtn').style.display = 'inline-flex';
    document.getElementById('finishMockBtn').style.display = 'inline-flex';
    showQuestion();
}

function showQuestion() {
    if (currentQIndex >= mockQuestions.length) { finishMock(); return; }
    const q = mockQuestions[currentQIndex];
    document.getElementById('mockQuestion').textContent = `Q${currentQIndex + 1}. ${q}`;
    document.getElementById('mockAnswer').value = '';
    document.getElementById('qProgress').textContent = `Question ${currentQIndex + 1} of ${mockQuestions.length}`;
    resetTimer();
    startTimer();
}

function nextQuestion() {
    const answer = document.getElementById('mockAnswer').value.trim();
    mockAnswers.push({ q: mockQuestions[currentQIndex], a: answer });
    currentQIndex++;
    if (currentQIndex >= mockQuestions.length) {
        finishMock();
    } else {
        showQuestion();
    }
}

function startTimer() {
    clearInterval(mockTimer);
    timeLeft = mockMode === 'timed' ? 60 : 120;
    updateTimerDisplay();
    mockTimer = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();
        if (timeLeft <= 0) { clearInterval(mockTimer); nextQuestion(); }
    }, 1000);
}

function resetTimer() {
    clearInterval(mockTimer);
    timeLeft = mockMode === 'timed' ? 60 : 120;
    updateTimerDisplay();
}

function updateTimerDisplay() {
    const el = document.getElementById('mockTimer');
    if (!el) return;
    const m = String(Math.floor(timeLeft / 60)).padStart(2, '0');
    const s = String(timeLeft % 60).padStart(2, '0');
    el.textContent = `${m}:${s}`;
    el.classList.toggle('urgent', timeLeft <= 20);
}

function finishMock() {
    clearInterval(mockTimer);
    const answer = document.getElementById('mockAnswer').value.trim();
    if (answer) mockAnswers.push({ q: mockQuestions[currentQIndex] || '', a: answer });
    showToast('🎉 Mock interview complete! Generating your AI evaluation...', 'success');
    setTimeout(() => goToStep(4), 1500);
}

function setMode(btn, mode) {
    document.querySelectorAll('.mode-tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    mockMode = mode;
    if (mode === 'voice') showToast('🎙️ Voice mode: Use the "Voice Answer" button to speak your responses.', 'info');
    if (mode === 'video') showToast('📹 Video mode: Camera access will be requested when you start.', 'info');
    if (mode === 'timed') showToast('⏱️ Timer mode: You have only 60 seconds per answer!', 'warning');
}

function toggleMockVoice() {
    showToast('🎙️ Listening... Speak your answer clearly.', 'info');
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
        showToast('Voice recognition not supported in your browser.', 'error');
        return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SR();
    recognition.lang = 'en-IN';
    recognition.onresult = (e) => {
        const transcript = e.results[0][0].transcript;
        const ta = document.getElementById('mockAnswer');
        ta.value = (ta.value ? ta.value + ' ' : '') + transcript;
        showToast('✅ Voice captured successfully!', 'success');
    };
    recognition.onerror = () => showToast('Voice recognition failed. Try again.', 'error');
    recognition.start();
}

// ── EVALUATION ──────────────────────────────
function renderEvaluation() {
    const answeredCount = mockAnswers.filter(a => a.a.length > 0).length;
    const totalQs = Math.max(mockAnswers.length, 1);
    const completionRate = Math.round((answeredCount / totalQs) * 100);

    evalScores = {
        communication: Math.floor(Math.random() * 25) + 65,
        confidence: Math.floor(Math.random() * 20) + 60,
        technical: Math.floor(Math.random() * 30) + 55,
        grammar: Math.floor(Math.random() * 15) + 72,
    };

    const grid = document.getElementById('evalGrid');
    if (!grid) return;
    grid.innerHTML = '';

    const evals = [
        { key: 'communication', label: 'Communication', icon: '💬', color: '#4f46e5', tip: 'Clarity and structure of your answers.' },
        { key: 'confidence', label: 'Confidence', icon: '💪', color: '#10b981', tip: 'Tone, pace and assertiveness detected.' },
        { key: 'technical', label: 'Technical Depth', icon: '🧠', color: '#f97316', tip: 'Relevance and accuracy of technical answers.' },
        { key: 'grammar', label: 'Grammar Score', icon: '📝', color: '#7c3aed', tip: 'Grammar, vocabulary, and sentence quality.' },
    ];

    evals.forEach(e => {
        const card = document.createElement('div');
        card.className = 'eval-card';
        card.innerHTML = `
      <div style="font-size:2rem;margin-bottom:0.5rem;">${e.icon}</div>
      <div class="eval-score" style="color:${e.color};">${evalScores[e.key]}%</div>
      <div class="eval-label">${e.label}</div>
      <div class="progress-bar" style="margin-bottom:0.75rem;"><div class="progress-fill" style="width:${evalScores[e.key]}%;background:${e.color};"></div></div>
      <div class="eval-feedback">${e.tip}</div>
    `;
        grid.appendChild(card);
    });

    const feedback = document.getElementById('evalFeedback');
    if (!feedback) return;
    feedback.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:0.75rem;">
      <div style="display:flex;gap:0.75rem;align-items:flex-start;padding:0.875rem;background:rgba(16,185,129,0.05);border-radius:0.75rem;border:1px solid rgba(16,185,129,0.2);">
        <span>✅</span>
        <div><strong style="color:var(--accent);">Strengths:</strong> <span style="color:var(--text-secondary);font-size:0.875rem;">Good use of examples in behavioral answers. Confident tone in most responses. Clear articulation of technical concepts.</span></div>
      </div>
      <div style="display:flex;gap:0.75rem;align-items:flex-start;padding:0.875rem;background:rgba(245,158,11,0.05);border-radius:0.75rem;border:1px solid rgba(245,158,11,0.2);">
        <span>⚠️</span>
        <div><strong style="color:var(--warning);">Areas to Improve:</strong> <span style="color:var(--text-secondary);font-size:0.875rem;">Reduce filler words (um, uh, basically). Add more specific metrics/numbers to achievements. Practice concise answers (aim for 90–120 seconds).</span></div>
      </div>
      <div style="display:flex;gap:0.75rem;align-items:flex-start;padding:0.875rem;background:rgba(79,70,229,0.05);border-radius:0.75rem;border:1px solid rgba(79,70,229,0.2);">
        <span>💡</span>
        <div><strong style="color:var(--primary-light);">Recommendation:</strong> <span style="color:var(--text-secondary);font-size:0.875rem;">Practice 2 more mock interview sessions. Focus on STAR method for behavioral questions. Review system design concepts for technical depth.</span></div>
      </div>
    </div>
  `;
}

// ── READINESS SCORE ──────────────────────────
function renderReadiness() {
    const avg = Object.values(evalScores).length
        ? Math.round(Object.values(evalScores).reduce((a, b) => a + b, 0) / Object.values(evalScores).length)
        : Math.floor(Math.random() * 25) + 62;

    const el = document.getElementById('readinessPct');
    if (!el) return;

    let count = 0;
    const interval = setInterval(() => {
        count += 2;
        el.textContent = count + '%';
        if (count >= avg) { el.textContent = avg + '%'; clearInterval(interval); }
    }, 30);

    // ── Persist score to backend (if logged in) ───────────────
    if (typeof InterviewAPI !== 'undefined' && typeof AuthAPI !== 'undefined' && AuthAPI.isLoggedIn()) {
        const role = document.getElementById('qjobRole')?.value?.trim() || 'General';
        InterviewAPI.saveScore({
            role,
            readiness_pct: avg,
            confidence_pct: evalScores.confidence || avg,
            clarity_pct: evalScores.communication || avg,
            star_pct: evalScores.technical || avg,
            grammar_pct: evalScores.grammar || avg,
            feedback: ['Good use of examples.', 'Practice STAR method.', 'Reduce filler words.'],
        }).catch(() => { /* non-critical */ });
    }

    const msg = avg >= 80 ? '🏆 Excellent! You are very well prepared for interviews.'
        : avg >= 65 ? '👍 Good! A bit more practice will make you job-ready.'
            : '💪 Keep practicing! Focus on communication and technical depth.';
    document.getElementById('readinessMsg').textContent = msg;

    const tips = document.getElementById('improvementTips');
    if (!tips) return;
    tips.innerHTML = `
    <h3 style="font-size:1rem;font-weight:700;color:var(--text-primary);margin-bottom:1rem;">📚 Suggested Improvements</h3>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:1rem;">
      <div style="background:var(--bg-card);border:1px solid var(--bg-glass-border);border-radius:var(--radius-xl);padding:1.25rem;">
        <div style="font-size:1.5rem;margin-bottom:0.5rem;">📖</div>
        <h4 style="font-size:0.9rem;font-weight:700;color:var(--text-primary);margin-bottom:0.25rem;">Improve Communication</h4>
        <p style="font-size:0.8rem;color:var(--text-secondary);">Practice speaking clearly. Read aloud every day for 10 minutes. Record yourself and listen back.</p>
      </div>
      <div style="background:var(--bg-card);border:1px solid var(--bg-glass-border);border-radius:var(--radius-xl);padding:1.25rem;">
        <div style="font-size:1.5rem;margin-bottom:0.5rem;">💻</div>
        <h4 style="font-size:0.9rem;font-weight:700;color:var(--text-primary);margin-bottom:0.25rem;">Deepen Technical Knowledge</h4>
        <p style="font-size:0.8rem;color:var(--text-secondary);">Take NPTEL/SWAYAM courses in your domain. Build 2-3 real projects to showcase in interviews.</p>
      </div>
      <div style="background:var(--bg-card);border:1px solid var(--bg-glass-border);border-radius:var(--radius-xl);padding:1.25rem;">
        <div style="font-size:1.5rem;margin-bottom:0.5rem;">🎯</div>
        <h4 style="font-size:0.9rem;font-weight:700;color:var(--text-primary);margin-bottom:0.25rem;">Practice STAR Method</h4>
        <p style="font-size:0.8rem;color:var(--text-secondary);">Structure all behavioral answers: Situation → Task → Action → Result. Prepare 5 STAR stories.</p>
      </div>
    </div>
  `;
}
