import os
import glob
from PIL import Image

def find_large_images(dirs, threshold_kb=100):
    large_images = []
    threshold_bytes = threshold_kb * 1024
    for d in dirs:
        for root, _, files in os.walk(d):
            for file in files:
                if file.lower().endswith(('.png', '.jpg', '.jpeg', '.webp')):
                    path = os.path.join(root, file)
                    if os.path.getsize(path) > threshold_bytes:
                        large_images.append(path)
    return large_images

def process_images():
    dirs_to_check = ['public', 'src']
    large_images = find_large_images(dirs_to_check)
    
    replacements = [] # list of (old_name, new_name)

    for img_path in large_images:
        print(f"Compressing {img_path} ({os.path.getsize(img_path) // 1024} KB)")
        try:
            with Image.open(img_path) as img:
                # Convert to RGB if necessary (e.g. RGBA for JPEG/WebP sometimes)
                if img.mode in ("RGBA", "P"):
                    img = img.convert("RGB")
                
                base, ext = os.path.splitext(img_path)
                new_path = base + ".webp"
                
                # Save as WebP
                img.save(new_path, "WEBP", quality=75)
                
                # If we created a new WebP file and the old wasn't WebP, delete the old
                if ext.lower() != '.webp':
                    os.remove(img_path)
                    old_name = os.path.basename(img_path)
                    new_name = os.path.basename(new_path)
                    replacements.append((old_name, new_name))
                else:
                    # We just overwrote the existing webp file with a compressed version
                    pass
        except Exception as e:
            print(f"Failed to process {img_path}: {e}")

    print(f"Done compressing. Found {len(replacements)} extension changes.")
    return replacements

def update_references(replacements):
    if not replacements:
        return
        
    # Search in all html, css, js files in root, src, public
    files_to_update = []
    for root, _, files in os.walk('.'):
        if 'node_modules' in root or 'venv' in root or 'dist' in root or '.git' in root:
            continue
        for file in files:
            if file.endswith(('.html', '.js', '.css')):
                files_to_update.append(os.path.join(root, file))
                
    for filepath in files_to_update:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            
        new_content = content
        for old_name, new_name in replacements:
            # simple string replace might be risky if names are short, but usually fine for image names
            new_content = new_content.replace(old_name, new_name)
            
        if new_content != content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"Updated references in {filepath}")

if __name__ == "__main__":
    replacements = process_images()
    update_references(replacements)
