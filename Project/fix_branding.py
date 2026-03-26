"""
ThiranMitra Branding Fix Script
Replaces all 'Setu' (old name) with 'Mitra' in logo spans,
and updates ROZGARSETU references in JS comment headers.
"""
import os
import re

PROJECT_DIR = r"c:\Users\VIKRAM\OneDrive\Desktop\Project"

ALLOWED_EXTS = {".html", ".js", ".css", ".py", ".md", ".txt", ".json", ".bat"}

REPLACEMENTS = [
    # Logo brand: Work>Mitra< → Work>Mitra< (in HTML spans)
    (">Mitra<", ">Mitra<"),
    # Inline style spans in login/register (style="color:#fb923c">Mitra<)
    ('style="color:#fb923c">Mitra<', 'style="color:#fb923c">Mitra<'),
    # JS file comment headers
    ("ThiranMitra — api.js", "ThiranMitra — api.js"),
    ("ThiranMitra — main.js", "ThiranMitra — main.js"),
    ("ThiranMitra — landing.js", "ThiranMitra — landing.js"),
    ("ThiranMitra — jobs.js", "ThiranMitra — jobs.js"),
    ("ThiranMitra — dashboard.js", "ThiranMitra — dashboard.js"),
    ("ThiranMitra — profile.js", "ThiranMitra — profile.js"),
    ("ThiranMitra — schemes.js", "ThiranMitra — schemes.js"),
    # CSS comment headers
    ("ThiranMitra — GLOBAL DESIGN SYSTEM", "ThiranMitra — GLOBAL DESIGN SYSTEM"),
    ("ThiranMitra — LANDING PAGE STYLES", "ThiranMitra — LANDING PAGE STYLES"),
    ("ThiranMitra — JOBS PAGE CSS", "ThiranMitra — JOBS PAGE CSS"),
    # skills.html report text
    ("ThiranMitra SKILL GAP REPORT", "ThiranMitra SKILL GAP REPORT"),
    # Old DB mention (just in case)
    ("thiranmitra.db", "thiranmitra.db"),
]


def fix_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8', errors='replace') as f:
            content = f.read()
        new_content = content
        for old, new in REPLACEMENTS:
            new_content = new_content.replace(old, new)
        if new_content != content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"  [OK] Fixed: {os.path.relpath(filepath, PROJECT_DIR)}")
            return True
        return False
    except Exception as e:
        print(f"  [ERR] Error in {filepath}: {e}")
        return False


def main():
    print("=" * 60)
    print("  ThiranMitra Branding Fix")
    print("=" * 60)
    fixed = 0
    for root, dirs, files in os.walk(PROJECT_DIR):
        # Skip hidden / build directories
        dirs[:] = [d for d in dirs if d not in {'.git', '__pycache__', 'node_modules', '.vscode'}]
        for name in files:
            ext = os.path.splitext(name)[1].lower()
            if ext in ALLOWED_EXTS:
                if fix_file(os.path.join(root, name)):
                    fixed += 1

    # Remove old DB file if it exists
    old_db = os.path.join(PROJECT_DIR, "backend", "thiranmitra.db")
    if os.path.exists(old_db):
        os.remove(old_db)
        print(f"  [OK] Deleted old DB: thiranmitra.db")

    print(f"\n  Done! Fixed {fixed} files.")
    print("=" * 60)


if __name__ == "__main__":
    main()
