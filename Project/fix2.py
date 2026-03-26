import json
import re

with open('C:/Users/VIKRAM/OneDrive/Desktop/Project/login.html', 'r', encoding='utf-8') as f:
    text = f.read()

start_marker = r'<script src="js/login3d\.js"></script>.*?<script>'
end_marker = r'const content = \$\(''btnContent''\);'

match_start = re.search(start_marker, text, re.DOTALL)
match_end = re.search(end_marker, text)

if match_start and match_end:
    before = text[:match_start.end()]
    after = text[match_end.start():]
    patch = '''
        // ── Auth guard ──
        if (typeof AuthAPI !== 'undefined' && AuthAPI.isLoggedIn()) {
            window.location.href = 'dashboard.html';
        }

        function  { return document.getElementById(id); }

        function validateEmail(email) {
            return /^[^\s@]+@[^\s@]+\\.[^\s@]+$/.test(email);
        }

        /* ── Toggle password visibility ── */
        function togglePass() {
            const inp = loginPassword;
            const icon = eyeIcon;
            inp.type = inp.type === 'password' ? 'text' : 'password';
            icon.textContent = inp.type === 'password' ? '👁' : '🙈';
        }

        /* ── Login handler ── */
        async function handleLogin() {
            const email = loginEmail.value.trim();
            const pass = loginPassword.value;
            const btn = loginBtn;
            '''
    
    with open('C:/Users/VIKRAM/OneDrive/Desktop/Project/login.html', 'w', encoding='utf-8') as f:
        f.write(before + patch + after)
    print("PATCH APPLIED SUCCESS")
else:
    print("FAILED TO MATCH REGEX")
