lines = []
with open("login.html", "r", encoding="utf-8") as f:
    lines = f.readlines()

out = []
found = False

for line in lines:
    if "const btn = $('loginBtn');" in line or "const content = $('btnContent');" in line:
        found = True
        break
    out.append(line)

if found:
    patch = """    <script>
        // ── Auth guard ──
        if (typeof AuthAPI !== 'undefined' && AuthAPI.isLoggedIn()) {
            window.location.href = 'dashboard.html';
        }

        function $(id) { return document.getElementById(id); }

        function validateEmail(email) {
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        }

        /* ── Toggle password visibility ── */
        function togglePass() {
            const inp = $('loginPassword');
            const icon = $('eyeIcon');
            inp.type = inp.type === 'password' ? 'text' : 'password';
            icon.textContent = inp.type === 'password' ? '👁' : '🙈';
        }

        /* ── Login handler ── */
        async function handleLogin() {
            const email = $('loginEmail').value.trim();
            const pass = $('loginPassword').value;
            const btn = $('loginBtn');
            const content = $('btnContent');
"""
    # Now read backwards from the end of what we appended to find where to snip!
    while out and ("<script src=" not in out[-1] and "<script>" not in out[-1]):
        out.pop()
    
    # Also pop the `<script>` if it's there
    if out and "<script>" in out[-1] and "src" not in out[-1]:
       out.pop()

    out.append(patch)

    # Search for exactly where we broke off inside the original lines to append the rest
    resume_idx = 0
    for i, line in enumerate(lines):
        if "clearErrors();" in line and "let valid = true;" in lines[i+1]:
            resume_idx = i
            break
            
    if resume_idx > 0:
        out.extend(lines[resume_idx:])
        
        with open("login.html", "w", encoding="utf-8") as f:
            f.writelines(out)
        print("PERFECT PATCH")
    else:
        print("Could not find resume idx")
else:
    print("Could not find start marker")
