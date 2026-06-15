import os
from PIL import Image

def compress_images():
    print("Compressing mobile hero images aggressively...")
    
    # Files to compress
    images = [
        "public/images/annapurna-mobile.webp",
        "public/images/bali-mobile.webp",
        "public/images/everest-mobile.webp",
        "public/images/annapurna.webp",
        "public/images/bali.webp",
        "public/images/everest.webp",
        "public/images/team/fais_final_v2.webp"
    ]
    
    for img_path in images:
        if os.path.exists(img_path):
            with Image.open(img_path) as img:
                # If it's a mobile image, cap width at 800px
                width, height = img.size
                if '-mobile' in img_path:
                    if width > 800:
                        new_width = 800
                        new_height = int((800 / width) * height)
                        img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
                    # Compress mobile aggressively
                    img.save(img_path, "WEBP", quality=50, method=6)
                    print(f"Compressed mobile image {img_path}")
                else:
                    # Compress desktop aggressively
                    img.save(img_path, "WEBP", quality=60, method=6)
                    print(f"Compressed desktop image {img_path}")
        else:
            print(f"Warning: {img_path} not found.")

if __name__ == "__main__":
    compress_images()
