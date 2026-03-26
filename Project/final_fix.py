import sys

def restore():
    filepath = 'C:/Users/VIKRAM/OneDrive/Desktop/Project/login.html'
    
    with open(filepath, 'r', encoding='utf-8') as f:
        html = f.read()

    idx_start = html.find('<script src="js/login3d.js"></script>')
    idx_end = html.find("            const content = \$\('btnContent'\);".replace('\\',''))
    
    if idx_start == -1 or idx_end == -1:
        print(f"ERROR: Start={idx_start}, End={idx_end}")
        return
        
    prefix = html[:idx_start + len('<script src="js/login3d.js"></script>')]
    suffix = html[idx_end:]

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
            const btn = loginBtn;
'''
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(prefix + patch + suffix)
    print("SUCCESS")

restore()
