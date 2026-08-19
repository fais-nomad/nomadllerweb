import os
from PIL import Image

images = [
    "public/images/real/ebc-stone.webp",
    "public/images/real/ebc-group-1.webp",
    "public/images/team/fais.webp",
    "public/images/team/fathima.webp"
]

for img_path in images:
    if os.path.exists(img_path):
        size_kb = os.path.getsize(img_path) // 1024
        print(f"Crushing {img_path} ({size_kb} KB)")
        try:
            with Image.open(img_path) as img:
                width, height = img.size
                
                # Extreme downscale to max width 400
                if width > 400:
                    new_width = 400
                    new_height = int((400 / width) * height)
                    img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
                
                # Save very aggressively
                img.save(img_path, "WEBP", quality=20, method=6)
                
            new_size = os.path.getsize(img_path) // 1024
            print(f"  -> Reduced to {new_size} KB")
        except Exception as e:
            print(f"Failed to process {img_path}: {e}")
