"""
fix_footers.py  —  Update footer links in all HTML files to point to actual pages.
Also fix nav auth state visibility.
"""
import os
import re

PROJECT_DIR = r"c:\Users\VIKRAM\OneDrive\Desktop\Project"

# Footer link replacements
FOOTER_FIXES = [
    # Privacy Policy  
    (
        'href="#" onclick="showToast(\'Privacy Policy coming soon!\',\'info\');return false;"',
        'href="privacy.html"'
    ),
    # Terms of Service
    (
        'href="#" onclick="showToast(\'Terms coming soon!\',\'info\');return false;"',
        'href="terms.html"'
    ),
    # Report Scam  
    (
        "href=\"#\"\r\n                                onclick=\"showToast('Report scam via job card Report button.','info');return false;\"",
        'href="jobs.html" title="Use Report button on job cards"'
    ),
    # Single-line scam
    (
        'href="#" onclick="showToast(\'Report scam via job card Report button.\',\'info\');return false;"',
        'href="jobs.html" title="Use Report button on job cards"'
    ),
]

def fix_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        new = content
        for old, new_str in FOOTER_FIXES:
            new = new.replace(old, new_str)
        if new != content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new)
            print(f"[OK] Fixed: {os.path.relpath(filepath, PROJECT_DIR)}")
            return True
        return False
    except Exception as e:
        print(f"[ERR] {filepath}: {e}")
        return False

fixed = 0
for root, dirs, files in os.walk(PROJECT_DIR):
    dirs[:] = [d for d in dirs if d not in {'.git', '__pycache__', 'node_modules', '.vscode', 'backend'}]
    for name in files:
        if name.endswith('.html'):
            if fix_file(os.path.join(root, name)):
                fixed += 1

print(f"\nDone! Fixed {fixed} HTML files.")
