"""Fix placement.html to use external placement.js"""
import re

with open('placement.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Add placement.js script tag before the inline script
content = content.replace(
    '<script src="js/main.js"></script>\r\n    <script>',
    '<script src="js/main.js"></script>\r\n    <script src="js/placement.js"></script>\r\n    <script>'
)
content = content.replace(
    '<script src="js/main.js"></script>\n    <script>',
    '<script src="js/main.js"></script>\n    <script src="js/placement.js"></script>\n    <script>'
)

# Remove the huge inline script content but keep empty script tags
pattern = r'(<script>)\s*// ==== QUIZ DATA ====.*?(</script>)'
content = re.sub(pattern, r'\1\n        // All logic is in js/placement.js\n    \2', content, flags=re.DOTALL)

with open('placement.html', 'w', encoding='utf-8') as f:
    f.write(content)

print('Done. Lines:', content.count('\n'))
