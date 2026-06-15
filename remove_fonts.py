import os
import glob
import re

def remove_fonts():
    html_files = glob.glob("*.html")
    for filepath in html_files:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        # Remove the <link href="https://fonts.googleapis.com... rel="stylesheet"/>
        # And the preconnects
        pattern1 = re.compile(r'<link href="https://fonts\.googleapis\.com[^>]*>\n?', re.MULTILINE)
        pattern2 = re.compile(r'<link crossorigin="" href="https://fonts\.gstatic\.com[^>]*>\n?', re.MULTILINE)
        
        new_content = pattern1.sub('', content)
        new_content = pattern2.sub('', new_content)

        if new_content != content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"Removed Google Fonts links from {filepath}")

if __name__ == "__main__":
    remove_fonts()
