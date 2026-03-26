
$text = [IO.File]::ReadAllText("login.html")
$marker1 = "<script src=" + [char]34 + "js/login3d.js" + [char]35 + "></script>"
$idx1 = $text.IndexOf(($marker1.Replace([char]35,[char]34)))
$marker2 = "            const btn" 
$idx2 = $text.IndexOf($marker2)
if ($idx1 -lt 0 -or $idx2 -lt 0) { Write-Host "Not found" } else {
$prefix = $text.Substring(0, $idx1 + 45)
$suffix = $text.Substring($idx2)
$patch = "
    <script>
        // -- Auth guard --
        if (typeof AuthAPI !== `u0027undefined`u0027 && AuthAPI.isLoggedIn()) {
            window.location.href = `u0027dashboard.html`u0027;
        }

        function `$(id) { return document.getElementById(id); }

        function validateEmail(email) {
            return /^[^\s@]+@[^\s@]+\.[^\s@]+`$/.test(email);
        }

        /* -- Toggle password visibility -- */
        function togglePass() {
            const inp = `$(`u0027loginPassword`u0027);
            const icon = `$(`u0027eyeIcon`u0027);
            inp.type = inp.type === `u0027password`u0027 ? `u0027text`u0027 : `u0027password`u0027;
            icon.textContent = inp.type === `u0027password`u0027 ? `u0027eye`u0027 : `u0027hide`u0027;
        }

        /* -- Login handler -- */
        async function handleLogin() {
            const email = `$(`u0027loginEmail`u0027).value.trim();
            const pass = `$(`u0027loginPassword`u0027).value;
"
$patch = $patch.Replace("`u0027", [char]39)
[IO.File]::WriteAllText("login.html", $prefix + $patch + $suffix, [System.Text.Encoding]::UTF8)
Write-Host "Repaired!"
}
