import os
import glob
import re

def process_js_file(filepath):
    # skip vite config and node_modules
    if "vite.config.js" in filepath or "node_modules" in filepath:
        return
        
    print(f"Processing {filepath}...")
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Regex to find /something.html in quotes or backticks
    # Matches '/admin.html' or `/admin.html?id=` etc
    # We want to replace the .html part with nothing.
    
    def replacer(match):
        prefix = match.group(1) # e.g. " or ' or `
        path = match.group(2)   # e.g. /agent-login
        suffix = match.group(3) # e.g. ?id=1 or just quote
        
        # If the link is strictly index.html, we should probably change it to /
        if path == "/index":
            return f"{prefix}/{suffix}"
        
        return f"{prefix}{path}{suffix}"

    # Pattern: (['"`])(/[\w-]+)\.html(.*?)
    # Wait, we want to match .html before ? or # or end of string quote.
    # Pattern: (['"`])(/[\w_-]+)\.html([^'"`\s]*)(['"`])
    
    pattern = r"(['\"`])(/[\w_-]+)\.html([^'\"`]*?)(['\"`])"
    
    def safe_replacer(match):
        q1 = match.group(1)
        path = match.group(2)
        query = match.group(3)
        q2 = match.group(4)
        
        if path == "/index":
            return f"{q1}/{query}{q2}"
            
        return f"{q1}{path}{query}{q2}"
        
    new_content = re.sub(pattern, safe_replacer, content)

    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated JS routes in {filepath}")

if __name__ == "__main__":
    js_files = glob.glob("src/*.js") + glob.glob("*.js")
    for f in js_files:
        process_js_file(f)
    print("Done fixing JS files.")
