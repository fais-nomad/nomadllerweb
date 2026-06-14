import os
from PIL import Image

def find_large_images(dirs, threshold_kb=100):
    large_images = []
    threshold_bytes = threshold_kb * 1024
    for d in dirs:
        for root, _, files in os.walk(d):
            for file in files:
                if file.lower().endswith('.webp'):
                    path = os.path.join(root, file)
                    if os.path.getsize(path) > threshold_bytes:
                        large_images.append(path)
    return large_images

def aggressive_compress():
    dirs_to_check = ['public', 'src']
    large_images = find_large_images(dirs_to_check)
    
    print(f"Found {len(large_images)} WebP images over 100KB.")
    
    for img_path in large_images:
        size_kb = os.path.getsize(img_path) // 1024
        print(f"Compressing {img_path} ({size_kb} KB)")
        try:
            with Image.open(img_path) as img:
                width, height = img.size
                
                # Downscale to max width 1000 if larger
                if width > 1000:
                    new_width = 1000
                    new_height = int((1000 / width) * height)
                    img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
                
                # Save aggressively
                # 50 quality is usually enough to drop it drastically
                img.save(img_path, "WEBP", quality=50, method=6)
                
            new_size = os.path.getsize(img_path) // 1024
            print(f"  -> Reduced to {new_size} KB")
        except Exception as e:
            print(f"Failed to process {img_path}: {e}")

if __name__ == "__main__":
    aggressive_compress()
