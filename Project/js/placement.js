/* ThiranMitra — placement.js v3 (Company-Aware) */
'use strict';

/* ── USER CONTEXT ─────────────────────────── */
let userRole = '', userExp = '', userDomain = 'tech', userCompany = null;
let activeFilter = 'all', companySearchVal = '';

/* ══════════════════════════════════════════
   COMPANY DATABASE
══════════════════════════════════════════ */
const iconUrl = (domain) => `https://logo.clearbit.com/${domain}`;
const fallback = (domain) => `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
const icon = (domain) => `<div style="width:48px;height:48px;background:white;border-radius:12px;margin:0 auto;display:flex;align-items:center;justify-content:center;overflow:hidden;box-shadow:0 6px 15px rgba(0,0,0,0.2);"><img src="${iconUrl(domain)}" onerror="this.onerror=null; this.src='${fallback(domain)}';" alt="logo" style="width:70%;height:70%;object-fit:contain;"></div>`;
const microIcon = (domain) => `<img src="${iconUrl(domain)}" onerror="this.onerror=null; this.src='${fallback(domain)}';" alt="logo" style="width:20px;height:20px;border-radius:4px;object-fit:contain;background:white;padding:1px;vertical-align:-5px;margin-right:6px;box-shadow:0 2px 4px rgba(0,0,0,0.1);">`;

const COMPANIES = [
    // IT Services
    { id: 'tcs', logo: icon('tcs.com'), microLogo: microIcon('tcs.com'), name: 'TCS', type: 'service', diff: 'medium', pkg: '₹3.5–7 LPA', rounds: 'Aptitude + Coding + Technical + HR', style: 'verbal_heavy', culture: 'Values integrity, learning agility, and long-term commitment.' },
    { id: 'infy', logo: icon('infosys.com'), microLogo: microIcon('infosys.com'), name: 'Infosys', type: 'service', diff: 'easy', pkg: '₹3.6–6 LPA', rounds: 'Aptitude + Technical + HR', style: 'aptitude_heavy', culture: 'Values innovation, client-first mindset, and continuous learning.' },
    { id: 'wipro', logo: icon('wipro.com'), microLogo: microIcon('wipro.com'), name: 'Wipro', type: 'service', diff: 'easy', pkg: '₹3.5–5 LPA', rounds: 'WILP Test + Technical + HR', style: 'balanced', culture: 'Values integrity, teamwork, and customer success.' },
    { id: 'hcl', logo: icon('hcltech.com'), microLogo: microIcon('hcltech.com'), name: 'HCL Tech', type: 'service', diff: 'easy', pkg: '₹3.2–5 LPA', rounds: 'Aptitude + Technical + HR', style: 'balanced', culture: 'Values employee-first culture and entrepreneurship.' },
    { id: 'tech_m', logo: icon('techmahindra.com'), microLogo: microIcon('techmahindra.com'), name: 'Tech Mahindra', type: 'service', diff: 'medium', pkg: '₹3.5–6 LPA', rounds: 'Aptitude + Technical + HR + GD', style: 'balanced', culture: 'Values digital transformation and innovation.' },
    { id: 'cap', logo: icon('capgemini.com'), microLogo: microIcon('capgemini.com'), name: 'Capgemini', type: 'service', diff: 'medium', pkg: '₹4–7 LPA', rounds: '3 Rounds + Versant English', style: 'verbal_heavy', culture: 'Values collaboration, diversity and client partnerships.' },
    { id: 'cog', logo: icon('cognizant.com'), microLogo: microIcon('cognizant.com'), name: 'Cognizant', type: 'service', diff: 'medium', pkg: '₹4–7 LPA', rounds: 'GenC Evolve Test + HR', style: 'aptitude_heavy', culture: 'Values digital mindset, agility, and problem solving.' },
    { id: 'lti', logo: icon('ltimindtree.com'), microLogo: microIcon('ltimindtree.com'), name: 'LTIMindtree', type: 'service', diff: 'medium', pkg: '₹4.5–8 LPA', rounds: 'Aptitude + Technical + HR', style: 'balanced', culture: 'Values tech leadership and client success.' },
    // MNC Product
    { id: 'amazon', logo: icon('amazon.com'), microLogo: microIcon('amazon.com'), name: 'Amazon', type: 'mnc', diff: 'hard', pkg: '₹18–35 LPA', rounds: 'OA + 4 Tech Rounds (LP-based)', style: 'dsa_heavy', culture: 'Values ownership, customer obsession, and 16 Leadership Principles.' },
    { id: 'google', logo: icon('google.com'), microLogo: microIcon('google.com'), name: 'Google', type: 'mnc', diff: 'hard', pkg: '₹25–50 LPA', rounds: 'Phone Screen + 4–5 Onsite Rounds', style: 'dsa_heavy', culture: 'Values innovation, intellectual humility, and data-driven decisions.' },
    { id: 'ms', logo: icon('microsoft.com'), microLogo: microIcon('microsoft.com'), name: 'Microsoft', type: 'mnc', diff: 'hard', pkg: '₹20–45 LPA', rounds: 'Technical Screen + 4–5 Rounds', style: 'dsa_heavy', culture: 'Values growth mindset, empathy, and inclusive culture.' },
    { id: 'meta', logo: icon('meta.com'), microLogo: microIcon('meta.com'), name: 'Meta', type: 'mnc', diff: 'hard', pkg: '₹22–50 LPA', rounds: 'Recruiter Screen + 4 Coding Rounds', style: 'dsa_heavy', culture: 'Values moving fast, bold thinking, and social impact.' },
    { id: 'adobe', logo: icon('adobe.com'), microLogo: microIcon('adobe.com'), name: 'Adobe', type: 'mnc', diff: 'hard', pkg: '₹18–35 LPA', rounds: 'OA + 3 Technical + HR', style: 'dsa_heavy', culture: 'Values creativity, genuine curiosity, and exceptional experiences.' },
    { id: 'oracle', logo: icon('oracle.com'), microLogo: microIcon('oracle.com'), name: 'Oracle', type: 'mnc', diff: 'hard', pkg: '₹15–30 LPA', rounds: 'OA + Technical + Managerial + HR', style: 'dsa_heavy', culture: 'Values technology excellence, customer success, and respect.' },
    // Consulting
    { id: 'acc', logo: icon('accenture.com'), microLogo: microIcon('accenture.com'), name: 'Accenture', type: 'consulting', diff: 'medium', pkg: '₹4.5–9 LPA', rounds: 'Aptitude + Coding + HR', style: 'verbal_heavy', culture: 'Values inclusion, innovation, and client-first delivery.' },
    { id: 'del', logo: icon('deloitte.com'), microLogo: microIcon('deloitte.com'), name: 'Deloitte', type: 'consulting', diff: 'medium', pkg: '₹6–14 LPA', rounds: 'Case Study + Technical + HR', style: 'case_study', culture: 'Values integrity, quality, and collaborative excellence.' },
    { id: 'ibm', logo: icon('ibm.com'), microLogo: microIcon('ibm.com'), name: 'IBM', type: 'consulting', diff: 'medium', pkg: '₹6–12 LPA', rounds: 'Aptitude + Technical + HR', style: 'balanced', culture: 'Values curiosity, pioneering tech, and inclusive culture.' },
    { id: 'ey', logo: icon('ey.com'), microLogo: microIcon('ey.com'), name: 'EY', type: 'consulting', diff: 'medium', pkg: '₹7–15 LPA', rounds: 'Case Study + HR + Technical', style: 'case_study', culture: 'Values building a better working world and integrity.' },
    // Indian Startups/Product
    { id: 'zoho', logo: icon('zoho.com'), microLogo: microIcon('zoho.com'), name: 'Zoho', type: 'product', diff: 'hard', pkg: '₹5–12 LPA', rounds: 'Programming Test (4 levels) + Tech', style: 'dsa_heavy', culture: 'Values privacy, self-reliance, and product depth.' },
    { id: 'fresh', logo: icon('freshworks.com'), microLogo: microIcon('freshworks.com'), name: 'Freshworks', type: 'product', diff: 'hard', pkg: '₹8–20 LPA', rounds: 'OA + 3 Technical + HR', style: 'dsa_heavy', culture: 'Values humility, customer delight, and frugal innovation.' },
    { id: 'flip', logo: icon('flipkart.com'), microLogo: microIcon('flipkart.com'), name: 'Flipkart', type: 'startup', diff: 'hard', pkg: '₹15–30 LPA', rounds: 'OA + 3 Tech + Hiring Manager', style: 'dsa_heavy', culture: 'Values ownership, bias for action, and customer obsession.' },
    { id: 'swiggy', logo: icon('swiggy.com'), microLogo: microIcon('swiggy.com'), name: 'Swiggy', type: 'startup', diff: 'hard', pkg: '₹12–25 LPA', rounds: 'OA + 2 Tech + System Design + HR', style: 'dsa_heavy', culture: 'Values hustle, empathy, and bold moves.' },
    { id: 'zomato', logo: icon('zomato.com'), microLogo: microIcon('zomato.com'), name: 'Zomato', type: 'startup', diff: 'hard', pkg: '₹12–24 LPA', rounds: 'OA + 2 Tech + Culture Fit', style: 'dsa_heavy', culture: 'Values pure curiosity, directness, and customer love.' },
    { id: 'paytm', logo: icon('paytm.com'), microLogo: microIcon('paytm.com'), name: 'Paytm', type: 'startup', diff: 'medium', pkg: '₹8–18 LPA', rounds: 'OA + Technical + Managerial + HR', style: 'dsa_heavy', culture: 'Values scale thinking, innovation, and financial inclusion.' },
    // Banking
    { id: 'hdfc', logo: icon('hdfcbank.com'), microLogo: microIcon('hdfcbank.com'), name: 'HDFC Bank', type: 'banking', diff: 'medium', pkg: '₹3.5–8 LPA', rounds: 'Aptitude + Group Discussion + HR', style: 'verbal_heavy', culture: 'Values customer centricity, integrity, and sustainability.' },
    { id: 'icici', logo: icon('icicibank.com'), microLogo: microIcon('icicibank.com'), name: 'ICICI Bank', type: 'banking', diff: 'medium', pkg: '₹3.5–7 LPA', rounds: 'Aptitude + Technical + HR', style: 'aptitude_heavy', culture: 'Values fair, transparent banking and community focus.' },
    { id: 'sbi', logo: icon('onlinesbi.sbi'), microLogo: microIcon('onlinesbi.sbi'), name: 'SBI', type: 'banking', diff: 'medium', pkg: '₹4–9 LPA', rounds: 'Online Exam + GD + Interview', style: 'verbal_heavy', culture: 'Values public service, stability, and financial inclusion.' },
    { id: 'axis', logo: icon('axisbank.com'), microLogo: microIcon('axisbank.com'), name: 'Axis Bank', type: 'banking', diff: 'medium', pkg: '₹3.5–7 LPA', rounds: 'Aptitude + HR + Technical', style: 'balanced', culture: 'Values customer happiness, sustainability, and digital-first banking.' },
];

/* ── QUESTION BANKS ───────────────────────────────── */
const APT_BANK = {
    tech: [
        { cat: 'Quant', q: 'A server processes 500 req/min. How many in 2.5 hours?', opts: ['75,000', '60,000', '80,000', '50,000'], ans: 0, exp: '500×60×2.5=75,000.' },
        { cat: 'Reasoning', q: 'Next in series: 1,1,2,3,5,8,?', opts: ['13', '11', '10', '15'], ans: 0, exp: 'Fibonacci: 5+8=13.' },
        { cat: 'Quant', q: '3 developers finish in 6 days. 9 developers take?', opts: ['2 days', '3 days', '4 days', '1 day'], ans: 0, exp: '3×6=18 person-days. 18/9=2.' },
        { cat: 'Verbal', q: 'Antonym of "Synchronous":', opts: ['Asynchronous', 'Serial', 'Sequential', 'Concurrent'], ans: 0, exp: 'Asynchronous = not at same time.' },
        { cat: 'Quant', q: 'SSD reads 500 MB/s. Time for 2.5 GB file?', opts: ['5 s', '4 s', '6 s', '2.5 s'], ans: 0, exp: '2500÷500=5 seconds.' },
        { cat: 'Reasoning', q: 'Which does NOT belong: Python, Java, HTML, JavaScript?', opts: ['HTML', 'Java', 'Python', 'JavaScript'], ans: 0, exp: 'HTML is markup, not a programming language.' },
        { cat: 'Quant', q: 'O(n²) algorithm, n=100. Operations?', opts: ['10,000', '1,000', '100,000', '1,000,000'], ans: 0, exp: '100²=10,000.' },
        { cat: 'Verbal', q: 'Synonym of "Deprecated":', opts: ['Obsolete', 'Enhanced', 'Optimised', 'Integrated'], ans: 0, exp: 'Deprecated = marked as obsolete.' },
        { cat: 'Quant', q: 'If ARRAY shifted +2 = BSSAZ, STACK=?', opts: ['TUBDL', 'TUCDL', 'SVADJ', 'TUCAK'], ans: 0, exp: 'Each letter +2: S→T,T→U,A→B,C→D,K→L.' },
        { cat: 'Quant', q: 'Codebase grows 20%/sprint from 1000. After 3 sprints?', opts: ['1728', '1440', '1620', '1800'], ans: 0, exp: '1000×1.2³=1728.' },
    ],
    banking: [
        { cat: 'Quant', q: 'SI on ₹50,000 at 8% p.a. for 3 years?', opts: ['₹12,000', '₹10,000', '₹8,000', '₹15,000'], ans: 0, exp: '50000×8×3/100=₹12,000.' },
        { cat: 'Quant', q: '₹1,00,000 at 10% CI for 2 years. Interest?', opts: ['₹21,000', '₹20,000', '₹22,100', '₹10,000'], ans: 0, exp: '1,00,000×1.1²=1,21,000. CI=21,000.' },
        { cat: 'Verbal', q: 'Repo rate is the rate at which:', opts: ['RBI lends to banks', 'Banks lend to public', 'Banks lend to RBI', 'Forex is exchanged'], ans: 0, exp: 'Repo rate = RBI lends to commercial banks.' },
        { cat: 'Quant', q: 'Profit on ₹8,000 item sold at ₹10,400?', opts: ['30%', '20%', '25%', '40%'], ans: 0, exp: '2400/8000×100=30%.' },
        { cat: 'Reasoning', q: 'Which is NOT an RBI function?', opts: ['Retail banking', 'Monetary policy', 'Currency print', 'Banker\'s bank'], ans: 0, exp: 'RBI doesn\'t do retail banking.' },
        { cat: 'Quant', q: 'Current assets ₹80,000; liabilities ₹40,000. Current ratio?', opts: ['2:1', '1:2', '4:1', '3:1'], ans: 0, exp: '80,000/40,000=2.' },
        { cat: 'Quant', q: 'CAR (Capital Adequacy Ratio) minimum as per Basel III?', opts: ['10.5%', '8%', '12%', '6%'], ans: 0, exp: 'Basel III mandates minimum CAR of 10.5% (including buffer).' },
        { cat: 'Verbal', q: 'NPA stands for:', opts: ['Non-Performing Asset', 'Net Profit Allocation', 'National Public Account', 'New Procurement Act'], ans: 0, exp: 'NPA = loan overdue more than 90 days.' },
        { cat: 'Quant', q: '₹5,000 doubles in 10 years (SI). Rate?', opts: ['10%', '15%', '20%', '12%'], ans: 0, exp: 'SI: 5000=5000×r×10/100 → r=10%.' },
        { cat: 'Quant', q: 'Series: 5,10,20,40,?', opts: ['80', '60', '100', '50'], ans: 0, exp: 'Geometric ×2: 40×2=80.' },
    ],
    general: [
        { cat: 'Quant', q: 'Train travels 360 km in 4 hr. Speed in m/s?', opts: ['25 m/s', '90 m/s', '100 m/s', '36 m/s'], ans: 0, exp: '90 km/h × 5/18 = 25 m/s.' },
        { cat: 'Reasoning', q: 'Next: 2,6,12,20,30,?', opts: ['42', '40', '45', '36'], ans: 0, exp: 'n(n+1): 6×7=42.' },
        { cat: 'Quant', q: '15% of ₹1,400?', opts: ['₹210', '₹140', '₹200', '₹175'], ans: 0, exp: '15/100×1400=210.' },
        { cat: 'Verbal', q: 'Antonym of "Eloquent":', opts: ['Inarticulate', 'Fluent', 'Verbose', 'Expressive'], ans: 0, exp: 'Inarticulate = unable to express clearly.' },
        { cat: 'Quant', q: 'A in 10 days, B in 15 days. Together?', opts: ['6 days', '8 days', '5 days', '7 days'], ans: 0, exp: '1/10+1/15=1/6 → 6 days.' },
        { cat: 'Quant', q: 'SI on ₹5,000 at 12% for 2 yrs?', opts: ['₹1,200', '₹1,000', '₹600', '₹1,500'], ans: 0, exp: '5000×12×2/100=₹1200.' },
        { cat: 'Reasoning', q: 'A:B=3:5 and A=120. B=?', opts: ['200', '150', '180', '160'], ans: 0, exp: '120/3=40. B=5×40=200.' },
        { cat: 'Verbal', q: 'Correct spelling:', opts: ['Occurrence', 'Occurence', 'Occurance', 'Occurrrence'], ans: 0, exp: 'Occurrence: double C and double R.' },
        { cat: 'Reasoning', q: 'Next: 1,4,9,16,25,?', opts: ['36', '30', '49', '35'], ans: 0, exp: 'Perfect squares: 6²=36.' },
        { cat: 'Quant', q: 'Profit % if CP=₹500, SP=₹625?', opts: ['25%', '20%', '15%', '30%'], ans: 0, exp: '125/500×100=25%.' },
    ]
};

const CODING_BANK = {
    dsa_heavy: [
        { q: 'Time complexity of binary search?', opts: ['O(log n)', 'O(n)', 'O(n²)', 'O(1)'], ans: 0, exp: 'Halves search space each step.' },
        { q: 'Which data structure uses LIFO?', opts: ['Stack', 'Queue', 'Tree', 'Graph'], ans: 0, exp: 'Stack = Last In First Out.' },
        { q: 'Best sorting algorithm for nearly sorted data?', opts: ['Insertion Sort', 'Quick Sort', 'Merge Sort', 'Heap Sort'], ans: 0, exp: 'Insertion Sort performs O(n) on nearly sorted arrays.' },
        { q: 'Space complexity of recursive Fibonacci?', opts: ['O(n)', 'O(1)', 'O(n²)', 'O(log n)'], ans: 0, exp: 'Call stack depth = n.' },
        { q: 'Which data structure for BFS traversal?', opts: ['Queue', 'Stack', 'Array', 'Heap'], ans: 0, exp: 'BFS uses a Queue (FIFO).' },
        { q: 'Hash table average lookup time?', opts: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'], ans: 0, exp: 'Direct key-to-index mapping allows O(1) average.' },
        { q: 'Which is NOT a stable sorting algorithm?', opts: ['Quick Sort', 'Merge Sort', 'Bubble Sort', 'Insertion Sort'], ans: 0, exp: 'Quick Sort is not stable by default.' },
        { q: 'In-order traversal of BST gives:', opts: ['Sorted order', 'Reverse sorted', 'Random', 'Level order'], ans: 0, exp: 'In-order (Left→Root→Right) on BST = ascending sorted output.' },
        { q: 'Dynamic programming solves problems by:', opts: ['Storing subproblem results', 'Dividing equally', 'Random choices', 'Backtracking always'], ans: 0, exp: 'DP = memoization/tabulation of overlapping subproblems.' },
        { q: 'Two pointers technique is useful for:', opts: ['Sorted array problems', 'Tree traversal', 'Graph BFS', 'Hash collisions'], ans: 0, exp: 'Two pointers works best on sorted arrays (e.g. pair sum).' },
    ],
    general: [
        { q: 'What does REST stand for?', opts: ['Representational State Transfer', 'Remote Execution Service', 'Request Evaluation Service', 'Reliable Endpoint State'], ans: 0, exp: 'REST = Representational State Transfer.' },
        { q: 'Which HTTP status = "Not Found"?', opts: ['404', '200', '500', '301'], ans: 0, exp: '404 = resource not found.' },
        { q: 'Primary key in DB ensures:', opts: ['Unique + NOT NULL', 'Only unique', 'Only NOT NULL', 'Foreign ref'], ans: 0, exp: 'Primary key = unique and not null.' },
        { q: 'git pull does:', opts: ['Fetch + merge remote', 'Push local changes', 'Create branch', 'Delete remote'], ans: 0, exp: 'git pull = git fetch + git merge.' },
        { q: 'OOP: child class inherits parent is called:', opts: ['Inheritance', 'Encapsulation', 'Polymorphism', 'Abstraction'], ans: 0, exp: 'Inheritance allows reuse of parent properties.' },
        { q: 'SQL HAVING clause is used:', opts: ['After GROUP BY', 'Before WHERE', 'Instead of WHERE', 'After ORDER BY'], ans: 0, exp: 'HAVING filters grouped results; WHERE filters rows.' },
        { q: 'Which is NOT a JS data type?', opts: ['Character', 'String', 'Boolean', 'Number'], ans: 0, exp: 'JS has no "Character" type.' },
        { q: 'print(2**10) in Python outputs:', opts: ['1024', '20', '100', '512'], ans: 0, exp: '2¹⁰=1024.' },
        { q: 'Cloud computing deployment model owned by one org:', opts: ['Private cloud', 'Public cloud', 'Hybrid cloud', 'Community cloud'], ans: 0, exp: 'Private cloud is dedicated to a single organisation.' },
        { q: 'Which protocol is used for secure web browsing?', opts: ['HTTPS', 'HTTP', 'FTP', 'SMTP'], ans: 0, exp: 'HTTPS encrypts web traffic using TLS/SSL.' },
    ]
};

/* ── COMPANY-SPECIFIC HR QUESTIONS ──────────────── */
const COMPANY_HR = {
    amazon: [
        { q: 'Amazon uses Leadership Principles. Which LP relates to "taking ownership of your work"?', hint: 'LP = Ownership. "Leaders are owners... They never say that\'s not my job."' },
        { q: 'Tell me about a time you disagreed with your manager (Amazon LP: Disagree and Commit).', hint: 'Use STAR. Show you voiced your opinion with data, then committed to team decision.' },
        { q: 'Describe a project where you had to deliver results with minimal resources (LP: Frugality).', hint: 'Amazon values frugality. Show resourcefulness — doing more with less.' },
    ],
    google: [
        { q: 'How do you handle ambiguous problems? (Google values structured thinking)', hint: 'Show you break down ambiguity: clarify scope → hypothesise → test → iterate.' },
        { q: 'Give an example of a data-driven decision you made.', hint: 'Quantify everything. Google loves metrics. Show you used data over intuition.' },
        { q: 'How do you handle failure? (Google growth mindset)', hint: 'Show you learn fast. Use a real failure + what you changed + outcome improvement.' },
    ],
    microsoft: [
        { q: 'Tell me about a time you showed a growth mindset. (Satya Nadella\'s core value)', hint: 'Microsoft\'s culture = growth mindset. Show learning from failure or upskilling.' },
        { q: 'How do you collaborate with diverse teams?', hint: 'Microsoft values inclusion. Show empathy, active listening, and diverse perspectives.' },
        { q: 'Describe how you handled a difficult customer or stakeholder.', hint: 'Microsoft is customer-obsessed. Show empathy, problem-solving, and resolution.' },
    ],
    zoho: [
        { q: 'Why Zoho specifically, when you could join a bigger FAANG company?', hint: 'Zoho values people who believe in its product-first philosophy. Talk about depth, stability, and building real products.' },
        { q: 'Zoho builds everything in-house. How do you feel about reinventing the wheel?', hint: 'Show appreciation for deep technical ownership and learning fundamentals.' },
        { q: 'Tell me about a self-learning project you built.', hint: 'Zoho loves self-learners. Talk about a side project, open-source work, or problem you solved independently.' },
    ],
    tcs: [
        { q: 'Why TCS? How do you see yourself growing within TCS?', hint: 'TCS provides long-term stability and learning. Mention their iEvolve platform, certifications, client rotations.' },
        { q: 'How comfortable are you with rotating projects and clients?', hint: 'TCS frequently rotates employees. Show flexibility and eagerness to learn new domains.' },
        { q: 'Tell me about a time you led or contributed to a team project.', hint: 'TCS values team players. Use STAR to describe collaboration and your specific contribution.' },
    ],
    infosys: [
        { q: 'How do you approach continuous learning? (Infosys values lifelong learning)', hint: 'Mention Infosys Lex platform, online courses, certifications, or self-study.' },
        { q: 'Describe a time you handled a challenging client requirement.', hint: 'Infosys is client-first. Show communication, setting expectations, and delivering.' },
        { q: 'What do you know about Infosys\' core values (C-LIFE)?', hint: 'C-LIFE = Client Value, Leadership by Example, Integrity, Fairness, Excellence.' },
    ],
    default: [
        { q: 'Why do you want to join this company specifically?', hint: 'Research the company\'s mission, recent work, culture. Show genuine interest, not just "good package".' },
        { q: 'Describe a situation where you went above and beyond.', hint: 'Use STAR. Show initiative and impact — quantify results if possible.' },
        { q: 'How do you prioritise when you have multiple deadlines?', hint: 'Describe your prioritisation framework: urgency vs importance, stakeholder communication.' },
    ]
};

/* ── COMPANY-SPECIFIC GD TOPICS ─────────────────── */
const COMPANY_GD = {
    amazon: ['Should Amazon expand its physical retail presence in India?', 'Is Amazon\'s market dominance good or bad for competition?', 'Gig economy: Are delivery partners exploited by companies like Amazon?'],
    google: ['Should search engines be regulated by governments?', 'Is Google\'s data collection a threat to privacy?', 'AI in search: Will ChatGPT replace Google?'],
    microsoft: ['Should Microsoft have acquired Activision Blizzard?', 'Cloud monopoly: Is Azure\'s dominance healthy for the tech ecosystem?', 'Is GitHub Copilot helping or harming junior developers?'],
    tcs: ['IT services vs product companies: Which is better for India?', 'Should freshers prefer service companies over startups?', 'Digital transformation: Can Indian IT companies lead the global wave?'],
    zoho: ['Should Indian software companies reduce foreign dependency?', 'Is bootstrapping better than VC funding for Indian startups?', 'Vernacular software: Should tech companies build for Bharat?'],
    general: ['AI will create more jobs than it destroys', 'India should be a global leader in technology', 'Remote work is the future of employment', 'Social media is doing more harm than good', 'Is startup culture sustainable long-term?']
};

/* ══════════════════════════════════════════
   SETUP SCREEN LOGIC
══════════════════════════════════════════ */
function selectExp(btn, level) {
    document.querySelectorAll('.exp-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    userExp = level;
    validateStep1();
}
function validateStep1() {
    const role = document.getElementById('roleInput')?.value.trim();
    const btn = document.getElementById('nextToCompanyBtn');
    if (btn) btn.disabled = !(role && userExp);
}
function goToStep1() {
    document.getElementById('step1').style.display = 'block';
    document.getElementById('step2').style.display = 'none';
    document.getElementById('sd1').className = 'step-dot active';
    document.getElementById('sd2').className = 'step-dot';
}
function goToCompanyStep() {
    userRole = document.getElementById('roleInput').value.trim();
    userDomain = document.getElementById('domainSelect').value;
    if (!userRole || !userExp) return;
    document.getElementById('step1').style.display = 'none';
    document.getElementById('step2').style.display = 'block';
    document.getElementById('sd1').className = 'step-dot done';
    document.getElementById('sd2').className = 'step-dot active';
    renderCompanyGrid(COMPANIES);
}
document.addEventListener('DOMContentLoaded', () => {
    const ri = document.getElementById('roleInput');
    if (ri) { ri.addEventListener('input', () => { validateStep1(); autoDetectDomain(ri.value); }); }
});
function autoDetectDomain(role) {
    const r = role.toLowerCase(), sel = document.getElementById('domainSelect'); if (!sel) return;
    if (/software|developer|engineer|data|cloud|devops|ml|ai|fullstack|frontend|backend|cyber/.test(r)) sel.value = 'tech';
    else if (/bank|finance|account|audit/.test(r)) sel.value = 'banking';
    else if (/market|sales|brand|seo|content|digital/.test(r)) sel.value = 'marketing';
    else if (/hr|human|recruit|talent/.test(r)) sel.value = 'hr';
    else if (/design|ui|ux|graphic/.test(r)) sel.value = 'design';
    else if (/mechanical|civil|electrical|chemical/.test(r)) sel.value = 'engineering';
}

/* ── COMPANY GRID RENDER ─────────────────────────── */
function renderCompanyGrid(list) {
    const grid = document.getElementById('companyGrid'); if (!grid) return;
    grid.innerHTML = '';
    if (!list.length) { grid.innerHTML = '<p style="color:var(--text-muted);grid-column:1/-1;padding:1rem;text-align:center;">No companies found</p>'; return; }
    list.forEach(c => {
        const diffClass = c.diff === 'hard' ? 'diff-hard' : c.diff === 'medium' ? 'diff-medium' : 'diff-easy';
        const diffLabel = c.diff === 'hard' ? '🔥 Hard' : c.diff === 'medium' ? '⚡ Medium' : '✅ Easy';
        const div = document.createElement('div');
        div.className = 'co-card'; div.dataset.id = c.id;
        const verifiedTick = `<svg viewBox="0 0 24 24" aria-label="Verified" role="img" fill="#1d9bf0" style="width: 1.1em; height: 1.1em; margin-left: 2px; vertical-align: middle;"><path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.918-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.337 2.25c-.416-.165-.866-.25-1.336-.25-2.21 0-3.918 1.79-3.918 4 0 .495.084.965.238 1.4-1.273.65-2.148 2.02-2.148 3.6 0 1.46.78 2.73 1.942 3.332-.08.47-.122.95-.122 1.442 0 2.21 1.71 4 3.918 4 .58 0 1.14-.14 1.636-.39 1.05 1.13 2.52 1.83 4.124 1.83s3.074-.7 4.124-1.83c.496.25 1.056.39 1.636.39 2.21 0 3.918-1.79 3.918-4 0-.492-.042-.972-.122-1.442 1.16-.602 1.942-1.872 1.942-3.332zm-12.91 4.54l-3.3-3.3 1.5-1.5 1.8 1.8 4.3-4.3 1.5 1.5-5.8 5.8z" /></svg>`;
        div.innerHTML = `<div class="co-logo">${c.logo}</div><div class="co-name" style="display:flex;align-items:center;justify-content:center;gap:2px;margin-top:0.5rem;">${c.name} ${verifiedTick}</div><div class="co-package">${c.pkg}</div><div class="co-diff ${diffClass}">${diffLabel}</div>`;
        div.addEventListener('click', () => selectCompany(c, div));
        grid.appendChild(div);
    });
}
function selectCompany(c, div) {
    document.querySelectorAll('.co-card').forEach(d => d.classList.remove('selected'));
    div.classList.add('selected');
    userCompany = c;
    const bar = document.getElementById('selectedCompanyBar');
    if (bar) {
        bar.style.display = 'flex';
        document.getElementById('selCoLogo').innerHTML = c.logo;
        const verifiedTick = `<svg viewBox="0 0 24 24" fill="#1d9bf0" style="width: 1.1em; height: 1.1em; vertical-align: middle; margin-left: 4px;"><path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.918-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.337 2.25c-.416-.165-.866-.25-1.336-.25-2.21 0-3.918 1.79-3.918 4 0 .495.084.965.238 1.4-1.273.65-2.148 2.02-2.148 3.6 0 1.46.78 2.73 1.942 3.332-.08.47-.122.95-.122 1.442 0 2.21 1.71 4 3.918 4 .58 0 1.14-.14 1.636-.39 1.05 1.13 2.52 1.83 4.124 1.83s3.074-.7 4.124-1.83c.496.25 1.056.39 1.636.39 2.21 0 3.918-1.79 3.918-4 0-.492-.042-.972-.122-1.442 1.16-.602 1.942-1.872 1.942-3.332zm-12.91 4.54l-3.3-3.3 1.5-1.5 1.8 1.8 4.3-4.3 1.5 1.5-5.8 5.8z" /></svg>`;
        document.getElementById('selCoName').innerHTML = c.name + verifiedTick + ' selected';
        document.getElementById('selCoInfo').textContent = c.rounds + ' · ' + c.pkg;
    }
    const btn = document.getElementById('startBtn'); if (btn) btn.disabled = false;
    document.getElementById('sd2').className = 'step-dot done';
    document.getElementById('sd3').className = 'step-dot active';
}
function filterByType(type, btn) {
    document.querySelectorAll('.cf-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active'); activeFilter = type;
    applyCompanyFilter();
}
function filterCompanies() {
    companySearchVal = document.getElementById('companySearchInput')?.value.toLowerCase() || '';
    applyCompanyFilter();
}
function applyCompanyFilter() {
    let list = COMPANIES;
    if (activeFilter !== 'all') list = list.filter(c => c.type === activeFilter);
    if (companySearchVal) list = list.filter(c => c.name.toLowerCase().includes(companySearchVal));
    renderCompanyGrid(list);
}

/* ── START PLACEMENT ─────────────────────────────── */
function startPlacement() {
    if (!userRole || !userExp || !userCompany) return;
    const expMap = { fresher: '🎓 Fresher (0–1yr)', junior: '🚀 Junior (1–3yrs)', mid: '⚡ Mid-Level (3–6yrs)', senior: '🏆 Senior (6+yrs)' };
    document.getElementById('setupScreen').style.display = 'none';
    document.getElementById('placementScreen').style.display = 'block';
    document.getElementById('screenTitle').textContent = `🎯 ${userRole} @ ${userCompany.name}`;
    document.getElementById('screenSub').textContent = `${expMap[userExp]} · ${userCompany.rounds}`;
    document.getElementById('expBadge').textContent = expMap[userExp];
    document.getElementById('chip-role').textContent = userRole;
    document.getElementById('chip-exp').textContent = expMap[userExp];
    document.getElementById('chip-company').innerHTML = userCompany.microLogo + ' ' + userCompany.name;
    buildAptitude(); buildCodingMCQ(); buildHR(); buildGD();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}
function resetSetup() {
    document.getElementById('placementScreen').style.display = 'none';
    document.getElementById('setupScreen').style.display = 'flex';
    document.getElementById('step1').style.display = 'block';
    document.getElementById('step2').style.display = 'none';
    document.getElementById('sd1').className = 'step-dot active';
    document.getElementById('sd2').className = 'step-dot';
    document.getElementById('sd3').className = 'step-dot';
    userRole = ''; userExp = ''; userCompany = null;
    document.querySelectorAll('.exp-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('roleInput').value = '';
    document.getElementById('nextToCompanyBtn').disabled = true;
}
function switchRound(id, btn) {
    document.querySelectorAll('.round-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    ['aptitude', 'coding', 'hr', 'gd'].forEach(p => { const el = document.getElementById('panel-' + p); if (el) el.style.display = (p === id) ? 'block' : 'none'; });
}

/* ══════════════════════════════════════════
   APTITUDE ROUND
══════════════════════════════════════════ */
let aptQ = [], qIdx = 0, correct = 0, wrong = 0, skipped = 0, answered = false, qTimerInt = null, qTimerSec = 90;
function buildAptitude() {
    const bank = ['banking'].includes(userDomain) ? APT_BANK.banking : ['tech', 'design', 'hr', 'marketing', 'engineering'].includes(userDomain) ? APT_BANK.tech : APT_BANK.general;
    aptQ = [...bank].sort(() => Math.random() - .5);
    qIdx = 0; correct = 0; wrong = 0; skipped = 0; answered = false;
    updateScore(); loadQuestion();
    const info = document.getElementById('roundInfoBox');
    if (info) info.innerHTML = `<div>🎯 Role: <strong style="color:var(--primary-light)">${esc(userRole)}</strong></div><div>🏢 Company: <strong>${esc(userCompany.name)}</strong></div><div>📊 Style: ${userCompany.style.replace('_', ' ')}</div><div style="margin-top:.5rem;color:var(--accent)">⏱️ 90 sec/question</div>`;
}
function loadQuestion() {
    if (qIdx >= aptQ.length) { showAptComplete(); return; }
    const q = aptQ[qIdx];
    document.getElementById('qNum').textContent = qIdx + 1;
    document.getElementById('qCat').textContent = q.cat;
    document.getElementById('qText').textContent = q.q;
    document.getElementById('qProgress').style.width = ((qIdx / aptQ.length) * 100) + '%';
    document.getElementById('explanationDiv').style.display = 'none';
    document.getElementById('nextBtn').style.display = 'none';
    answered = false;
    const opts = document.getElementById('optionsDiv'); opts.innerHTML = '';
    q.opts.forEach((opt, i) => {
        const btn = document.createElement('div'); btn.className = 'quiz-option';
        btn.innerHTML = `<span class="opt-letter">${String.fromCharCode(65 + i)}</span><span>${opt}</span>`;
        btn.addEventListener('click', () => selOpt(i, btn)); opts.appendChild(btn);
    });
    startQTimer(90);
}
function startQTimer(s) { clearInterval(qTimerInt); qTimerSec = s; updateQTimer(); qTimerInt = setInterval(() => { qTimerSec--; updateQTimer(); if (qTimerSec <= 0) { clearInterval(qTimerInt); if (!answered) skipQuestion(); } }, 1000); }
function updateQTimer() { const m = Math.floor(qTimerSec / 60).toString().padStart(2, '0'), s = (qTimerSec % 60).toString().padStart(2, '0'), el = document.getElementById('qTimer'); if (!el) return; el.textContent = `${m}:${s}`; el.style.color = qTimerSec <= 20 ? 'var(--danger)' : 'var(--primary-light)'; }
function selOpt(i, btn) {
    if (answered) return; answered = true; clearInterval(qTimerInt);
    const q = aptQ[qIdx];
    document.querySelectorAll('.quiz-option').forEach((o, idx) => { if (idx === q.ans) o.classList.add('correct'); else if (idx === i && i !== q.ans) o.classList.add('wrong'); });
    if (i === q.ans) { correct++; if (typeof showToast === 'function') showToast('✅ Correct!', 'success', 1500); }
    else { wrong++; if (typeof showToast === 'function') showToast('❌ Wrong!', 'error', 1500); }
    document.getElementById('explanationDiv').style.display = 'block';
    document.getElementById('explanationText').textContent = q.exp;
    document.getElementById('nextBtn').style.display = 'inline-flex';
    updateScore();
}
function skipQuestion() { if (!answered) { skipped++; answered = true; } clearInterval(qTimerInt); updateScore(); qIdx++; loadQuestion(); }
function nextQuestion() { qIdx++; loadQuestion(); }
function updateScore() {
    document.getElementById('correctCount').textContent = correct;
    document.getElementById('wrongCount').textContent = wrong;
    document.getElementById('skipCount').textContent = skipped;
    const done = correct + wrong, pct = done > 0 ? Math.round(correct / done * 100) : 0;
    document.getElementById('accuracyBar').style.width = pct + '%';
    document.getElementById('accuracyPct').textContent = pct + '%';
}
function showAptComplete() {
    const pct = Math.round(correct / aptQ.length * 100), color = pct >= 70 ? 'var(--accent)' : pct >= 50 ? 'var(--warning)' : 'var(--danger)';
    const grade = pct >= 80 ? '🥇 Excellent' : pct >= 60 ? '🥈 Good' : '📚 Keep Practising';
    const card = document.getElementById('quizCard'); if (!card) return;
    card.innerHTML = `<div style="text-align:center;padding:1.5rem 0"><div style="font-size:4rem;margin-bottom:1rem">🎉</div><h3 style="font-family:'Outfit',sans-serif;font-size:1.4rem;font-weight:900;color:var(--text-primary)">Aptitude Round Complete!</h3><div style="font-size:3rem;font-weight:900;color:${color};margin:.5rem 0">${pct}%</div><p style="color:var(--text-muted);margin-bottom:1.5rem">${correct}/${aptQ.length} correct · ${wrong} wrong · ${skipped} skipped<br><strong style="color:${color}">${grade}</strong></p><button class="btn btn-primary" onclick="buildAptitude()">🔄 Retry Round</button></div>`;
    const ov = document.getElementById('ov-apt'); if (ov) ov.textContent = pct + '%'; updateOverall();
}
function updateOverall() { const a = parseInt(document.getElementById('ov-apt')?.textContent) || 0, c = parseInt(document.getElementById('ov-code')?.textContent) || 0, h = parseInt(document.getElementById('ov-hr')?.textContent) || 0, arr = [a, c, h].filter(x => x > 0); if (arr.length) { const avg = Math.round(arr.reduce((s, v) => s + v, 0) / arr.length); const el = document.getElementById('ov-overall'); if (el) el.textContent = avg + '%'; } }

/* ══════════════════════════════════════════
   CODING MCQ ROUND
══════════════════════════════════════════ */
let coQ = [], cIdx = 0, cC = 0, cW = 0, cAns = false;
function buildCodingMCQ() {
    const isDSA = ['tech', 'design', 'engineering'].includes(userDomain) || ['amazon', 'google', 'ms', 'meta', 'zoho', 'fresh', 'flip', 'swiggy', 'zomato', 'paytm', 'oracle', 'adobe'].includes(userCompany?.id);
    coQ = [...(isDSA ? CODING_BANK.dsa_heavy : CODING_BANK.general)].sort(() => Math.random() - .5);
    cIdx = 0; cC = 0; cW = 0; cAns = false;
    const t = document.getElementById('codingTitle'), d = document.getElementById('codingDesc');
    if (t) t.textContent = `💻 Coding MCQ – ${userRole} @ ${userCompany?.name}`;
    if (d) d.textContent = `${isDSA ? 'DSA & algorithms focused' : 'General tech & CS'}  questions matching ${userCompany?.name} interview style. (${userCompany?.rounds})`;
    renderCodingQ();
}
function renderCodingQ() {
    const area = document.getElementById('codingQuizArea'); if (!area) return;
    if (cIdx >= coQ.length) {
        const pct = Math.round(cC / coQ.length * 100), color = pct >= 70 ? 'var(--accent)' : pct >= 50 ? 'var(--warning)' : 'var(--danger)';
        area.innerHTML = `<div class="card" style="text-align:center;padding:2rem"><div style="font-size:3rem;margin-bottom:1rem">🏆</div><h3 style="font-family:'Outfit',sans-serif;font-size:1.4rem;font-weight:900;color:var(--text-primary)">Technical Round Complete!</h3><div style="font-size:2.5rem;font-weight:900;color:${color};margin:.5rem 0">${pct}%</div><p style="color:var(--text-muted)">${cC}/${coQ.length} correct · ${cW} wrong</p><button class="btn btn-primary" style="margin-top:1rem" onclick="buildCodingMCQ()">🔄 Retry</button></div>`;
        const ov = document.getElementById('ov-code'); if (ov) ov.textContent = pct + '%'; updateOverall(); return;
    }
    const q = coQ[cIdx]; cAns = false;
    area.innerHTML = `<div class="card"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.25rem;flex-wrap:wrap;gap:.5rem"><span class="badge badge-primary">Tech Q${cIdx + 1}/${coQ.length}</span><div style="display:flex;gap:.5rem"><span style="background:rgba(16,185,129,.15);color:var(--accent);border-radius:8px;padding:.25rem .75rem;font-size:.78rem;font-weight:700">✅ ${cC}</span><span style="background:rgba(239,68,68,.1);color:var(--danger);border-radius:8px;padding:.25rem .75rem;font-size:.78rem;font-weight:700">❌ ${cW}</span></div></div><div style="font-size:1rem;font-weight:700;color:var(--text-primary);line-height:1.6;margin-bottom:1.5rem">${esc(q.q)}</div><div id="cOpts"></div><div id="cExp" style="display:none;background:rgba(16,185,129,.07);border:1px solid rgba(16,185,129,.2);border-radius:var(--radius-md);padding:1rem;margin-top:1rem"><strong style="color:var(--accent);font-size:.85rem">💡 Explanation:</strong><p style="font-size:.83rem;color:var(--text-secondary);margin-top:.375rem;line-height:1.7">${esc(q.exp)}</p></div><div style="display:flex;gap:.75rem;margin-top:1.25rem"><button class="btn btn-outline btn-sm" onclick="cIdx++;renderCodingQ()">Skip →</button><button class="btn btn-primary" id="cNext" onclick="cIdx++;renderCodingQ()" style="display:none">Next →</button></div></div>`;
    const od = document.getElementById('cOpts');
    q.opts.forEach((opt, i) => {
        const b = document.createElement('div'); b.className = 'quiz-option';
        b.innerHTML = `<span class="opt-letter">${String.fromCharCode(65 + i)}</span><span>${esc(opt)}</span>`;
        b.addEventListener('click', () => {
            if (cAns) return; cAns = true;
            document.querySelectorAll('#cOpts .quiz-option').forEach((o, idx) => { if (idx === q.ans) o.classList.add('correct'); else if (idx === i && i !== q.ans) o.classList.add('wrong'); });
            if (i === q.ans) { cC++; if (typeof showToast === 'function') showToast('✅ Correct!', 'success', 1500); } else { cW++; if (typeof showToast === 'function') showToast('❌ Wrong!', 'error', 1500); }
            document.getElementById('cExp').style.display = 'block';
            const nb = document.getElementById('cNext'); if (nb) nb.style.display = 'inline-flex';
        });
        od.appendChild(b);
    });
}

/* ══════════════════════════════════════════
   HR ROUND
══════════════════════════════════════════ */
function buildHR() {
    const coHR = COMPANY_HR[userCompany?.id] || COMPANY_HR.default;
    const common = [
        { q: `Tell me about yourself and why you want to join ${userCompany?.name} as a ${userRole}.`, hint: `Structure: Name→Background→Skills→Achievement→Why ${userCompany?.name}. Max 90 seconds.` },
        { q: 'What is your greatest strength relevant to this position?', hint: 'One strength + concrete STAR example. Relate directly to job needs.' },
        { q: `Why ${userCompany?.name} specifically, over competitors?`, hint: `Research ${userCompany?.name}'s culture: "${userCompany?.culture}" Mention specific projects, values, or products.` },
        { q: 'Describe a challenge you faced and how you overcame it.', hint: 'Use STAR method. Show problem-solving, resilience, positive outcome.' },
        { q: 'Where do you see yourself in 3–5 years?', hint: 'Show ambition aligned with company growth. Mention expertise or leadership — not "your manager\'s job"!' },
        { q: 'What are your salary expectations?', hint: `Research market rate for ${userRole} at ${userExp} level. State a range confidently: "Based on market data, ₹X–Y seems fair."` },
        { q: 'Do you have any questions for us?', hint: 'Always ask 2–3: "What does success look like in 90 days?" / "How does team handle [challenge]?" / "What growth looks like here?"' },
    ];
    const questions = [...common, ...coHR].slice(0, 10);
    const t = document.getElementById('hrTitle'), d = document.getElementById('hrDesc');
    if (t) t.textContent = `🎤 HR Round – ${userCompany?.name} Interview`;
    if (d) d.textContent = `${questions.length} questions personalised for ${userRole} at ${userCompany?.name} (${userExp} level). Click any to reveal model answer tips.`;
    const list = document.getElementById('hrQuestionsList'); if (!list) return;
    list.innerHTML = '';
    questions.forEach((q, i) => {
        const div = document.createElement('div'); div.className = 'hr-item';
        div.innerHTML = `<div class="hr-header" onclick="const b=this.nextElementSibling;b.style.display=b.style.display==='block'?'none':'block'"><span style="width:26px;height:26px;background:var(--grad-primary);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:.72rem;font-weight:800;color:white;flex-shrink:0">${i + 1}</span><span style="font-size:.875rem;font-weight:600;color:var(--text-primary);flex:1">${esc(q.q)}</span><span style="color:var(--text-muted)">▼</span></div><div class="hr-body"><div style="font-size:.78rem;font-weight:700;color:var(--primary-light);margin-bottom:.375rem">💡 Tips for ${esc(userCompany?.name)}:</div><p style="margin:0">${esc(q.hint)}</p></div>`;
        list.appendChild(div);
    });
}

/* ══════════════════════════════════════════
   GD TOPICS
══════════════════════════════════════════ */
const GD_BASE = [
    { emoji: '🤖', title: 'AI will replace most jobs in the next decade', cat: 'Technology', color: '#4f46e5', points: ['FOR: Automation of repetitive tasks', 'AGAINST: New job categories emerge', 'KEY: Reskilling is the real challenge'] },
    { emoji: '🌍', title: 'Climate change is the biggest threat of the 21st century', cat: 'Environment', color: '#059669', points: ['Scientific consensus is clear', 'Economic cost of inaction', 'Developing nations bear the highest burden'] },
    { emoji: '📱', title: 'Social media does more harm than good', cat: 'Society', color: '#f97316', points: ['Mental health impact data', 'Misinformation & polarisation', 'Community building & social movements'] },
    { emoji: '🎓', title: 'Online education can fully replace traditional schooling', cat: 'Education', color: '#7c3aed', points: ['Accessibility for remote areas', 'Social & practical skill gaps', 'Quality & accountability issues'] },
    { emoji: '⚡', title: 'Work from home should become the permanent norm', cat: 'Work', color: '#0ea5e9', points: ['Productivity studies show +13%', 'Collaboration & culture suffers', 'Infrastructure & equity concerns'] },
    { emoji: '🇮🇳', title: 'India should make voting mandatory', cat: 'Governance', color: '#ec4899', points: ['Low voter turnout problem', 'Freedom vs civic duty debate', 'Implementation challenges'] },
];
function buildGD() {
    const coTopics = (COMPANY_GD[userCompany?.id] || COMPANY_GD.general).map((t, i) => ({ emoji: ['💼', '🔮', '⚖️'][i % 3], title: t, cat: userCompany?.name + ' Specific', color: '#4f46e5', points: ['Research both sides before GD', 'Use data and real examples', 'End with a balanced conclusion'] }));
    const topics = [...coTopics, ...GD_BASE].slice(0, 8);
    const grid = document.getElementById('gdTopicsGrid'); if (!grid) return;
    grid.innerHTML = '';
    topics.forEach((t, idx) => {
        const id = 'gdp' + idx;
        const card = document.createElement('div'); card.className = 'gd-card';
        card.innerHTML = `<div style="display:flex;align-items:center;gap:.875rem;margin-bottom:.875rem"><span style="font-size:1.75rem">${t.emoji}</span><span class="badge" style="background:${t.color}1a;color:${t.color};border:1px solid ${t.color}33;font-size:.7rem">${t.cat}</span></div><p style="font-size:.9rem;font-weight:700;color:var(--text-primary);line-height:1.4;margin-bottom:.875rem">"${esc(t.title)}"</p><div id="${id}" style="display:none;margin-bottom:.75rem">${(t.points || []).map(p => `<div style="font-size:.78rem;color:var(--text-secondary);border-left:2px solid ${t.color};padding:.25rem 0 .25rem .6rem;margin-bottom:.35rem">• ${esc(p)}</div>`).join('')}</div><button class="btn btn-outline btn-sm" style="width:100%;justify-content:center" onclick="const d=document.getElementById('${id}');d.style.display=d.style.display==='none'?'block':'none';this.textContent=d.style.display==='none'?'📋 View Key Points →':'📋 Hide Points'">📋 View Key Points →</button>`;
        grid.appendChild(card);
    });
}

/* ── UTILITY ───────────────────────────────────── */
function esc(s) { if (!s) return ''; return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
