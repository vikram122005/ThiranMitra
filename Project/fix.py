import json
with open('C:/Users/VIKRAM/OneDrive/Desktop/Project/login.html', 'r', encoding='utf-8') as f:
    text = f.read()

start_marker = '<script src="js/login3d.js"></script>'
end_marker = "const content = btnContent;"
start_idx = text.find(start_marker)
end_idx = text.find(end_marker)

if start_idx != -1 and end_idx != -1:
    before = text[:start_idx + len(start_marker)]
    after = text[end_idx:]
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
    import fnmatch # no-op just to test format
    
    with open('C:/Users/VIKRAM/OneDrive/Desktop/Project/login.html', 'w', encoding='utf-8') as f:
        f.write(before + patch + after)
    print("PATCH APPLIED")
else:
    print(f"FAILED idx1 {start_idx} idx2 {end_idx}")
