import json

with open('login.html', 'r', encoding='utf-8') as f:
    content = f.read()

start_marker = '<script src="js/login3d.js"></script>'
end_marker = "const btn = loginBtn;"

idx1 = content.find(start_marker)
idx2 = content.find(end_marker)

if idx1 != -1 and idx2 != -1:
    prefix = content[:idx1 + len(start_marker)]
    suffix = content[idx2:]
    
    # We use a raw string literal to avoid escape sequence issues
    patch = r'''
    <script>
        // ── Auth guard ──
        if (typeof AuthAPI !== 'undefined' && AuthAPI.isLoggedIn()) {
            window.location.href = 'dashboard.html';
        }

        function  { return document.getElementById(id); }

        function validateEmail(email) {
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
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
            '''
            
    final_content = prefix + patch + suffix
    
    with open('login.html', 'w', encoding='utf-8') as f:
        f.write(final_content)
    print("PATCH SUCCESSFUL")
else:
    print(f"FAILED TO FIND MARKERS: idx1={idx1}, idx2={idx2}")

