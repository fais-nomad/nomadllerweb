import os
import glob
import re

def process_file(filepath):
    print(f"Processing {filepath}...")
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Remove canonical from admin/agent-login
    if filepath.endswith('admin.html') or filepath.endswith('agent-login.html'):
        # Regex to remove canonical link tag
        content = re.sub(r'<link[^>]*rel="canonical"[^>]*>\s*', '', content)
    
    # 2. Fix internal redirects by stripping .html from internal links
    # Look for href="something.html" or href="/something.html"
    def replacer(match):
        full_match = match.group(0)
        url = match.group(1)
        
        # Avoid changing external links
        if url.startswith('http://') or url.startswith('https://'):
            return full_match
            
        if url == "index.html" or url == "/index.html":
            return 'href="/"'
            
        # Strip .html
        if url.endswith('.html'):
            return f'href="{url[:-5]}"'
            
        return full_match

    # Find href="..."
    new_content = re.sub(r'href="([^"]+)"', replacer, content)

    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {filepath}")

if __name__ == "__main__":
    html_files = glob.glob("*.html")
    for f in html_files:
        process_file(f)
    print("Done processing HTML files for advanced SEO.")
