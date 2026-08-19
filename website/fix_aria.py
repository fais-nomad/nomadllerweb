import os
import glob
import re

def fix_aria_labels():
    html_files = glob.glob("*.html")
    for filepath in html_files:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        # Specifically fix modal close buttons which have <button id="close..."><i ...>
        # Match <button id="close-something" ...>
        pattern = re.compile(r'(<button\s+id="close-[^"]*")([^>]*>)')
        
        def add_aria(match):
            btn_start = match.group(1)
            btn_rest = match.group(2)
            if 'aria-label' not in btn_start and 'aria-label' not in btn_rest:
                return f'{btn_start} aria-label="Close modal"{btn_rest}'
            return match.group(0)

        new_content = pattern.sub(add_aria, content)

        # Also fix any <button id="close-modal" ...> directly if it doesn't match the hyphen correctly
        pattern2 = re.compile(r'(<button\s+id="close-modal")([^>]*>)')
        new_content = pattern2.sub(add_aria, new_content)
        
        if new_content != content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"Fixed aria-labels in {filepath}")

if __name__ == "__main__":
    fix_aria_labels()
