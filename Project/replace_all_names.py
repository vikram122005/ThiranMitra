import os

def replace_in_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        new_content = content
        
        # Exact word replacements to maintain casing
        replacements = [
            ("ThiranMitra", "ThiranMitra"),
            ("thiranmitra", "thiranmitra"),
            ("ThiranMitraBot", "ThiranMitraBot"),
            ("thiranmitrabot", "thiranmitrabot"),
            ("Work", "Work"),
            ("work", "work")
        ]
        
        for old, new in replacements:
            new_content = new_content.replace(old, new)
            
        if content != new_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"Updated: {filepath}")
            return True
    except Exception as e:
        pass
    return False

def main():
    directory = r"c:\Users\VIKRAM\OneDrive\Desktop\Project"
    
    # Extensions to modify
    allowed_exts = {".html", ".js", ".css", ".py", ".md", ".txt", ".json", ".bat"}
    
    for root, dirs, files in os.walk(directory):
        if ".git" in root or "__pycache__" in root or "node_modules" in root:
            continue
            
        for name in files:
            ext = os.path.splitext(name)[1].lower()
            if ext in allowed_exts:
                replace_in_file(os.path.join(root, name))
                
if __name__ == "__main__":
    main()
