import glob

def process_file(filepath):
    print(f"Processing {filepath}...")
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Simple replace
    new_content = content.replace("https://nomadller.com", "https://www.nomadller.com")
    
    # Also fix anything that accidentally became https://www.www.nomadller.com
    new_content = new_content.replace("https://www.www.nomadller.com", "https://www.nomadller.com")

    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {filepath}")

if __name__ == "__main__":
    html_files = glob.glob("*.html")
    for f in html_files:
        process_file(f)
    print("Done fixing WWW redirects.")
