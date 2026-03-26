import sys

def restore():
    filepath = 'C:/Users/VIKRAM/OneDrive/Desktop/Project/login.html'
    
    with open(filepath, 'r', encoding='utf-8') as f:
        html = f.read()

    # Step 1: Slice before '<script src="js/login3d.js"></script>'
    idx_start = html.find('<script src="js/login3d.js"></script>')
    if idx_start == -1:
        print("ERROR: Start point not found")
        return
        
    prefix = html[:idx_start + len('<script src="js/login3d.js"></script>')]

    # Step 2: Slice after the point where handleLogin body continues
    idx_end = html.find("            const content = btnContent;")
    if idx_end == -1:
        print("ERROR: End point not found")
        return
        
    suffix = html[idx_end:]

    # Step 3: Define the exact patch without any backslashes escaping problems because we use raw string formatting
    patch = '''
    <script>
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
    
    # Write to file
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(prefix + patch + suffix)
    print("SUCCESS")

restore()
