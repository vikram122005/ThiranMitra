const fs = require('fs');
let txt = fs.readFileSync('login.html', 'utf8');
const start = '<script src="js/login3d.js"></script>';
const end = "                const btn = $('loginBtn');";
const startIdx = txt.indexOf(start);
const endIdx = txt.indexOf(end);

if (startIdx !== -1 && endIdx !== -1) {
    const freshScript = start + \n    <script>
        // ?? Auth guard ??
        if (typeof AuthAPI !== 'undefined' && AuthAPI.isLoggedIn()) {
            window.location.href = 'dashboard.html';
        }

        function  { return document.getElementById(id); }

        function validateEmail(email) {
            return /^[^\s@]+@[^\s@]+\\.[^\s@]+$/.test(email);
        }

        /* ?? Toggle password visibility ?? */
        function togglePass() {
            const inp = loginPassword;
            const icon = eyeIcon;
            inp.type = inp.type === 'password' ? 'text' : 'password';
            icon.textContent = inp.type === 'password' ? '??' : '??';
        }

        /* ?? Login handler ?? */
        async function handleLogin() {\n + "                const btn = ;";
    
    txt = txt.substring(0, startIdx) + freshScript + txt.substring(endIdx + end.length);
    fs.writeFileSync('login.html', txt);
    console.log('Fixed successfully');
} else {
    console.log('Not found:', startIdx, endIdx);
}
