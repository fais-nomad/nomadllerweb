import os
import glob
from PIL import Image

def generate_mobile_images():
    print("Generating mobile hero images...")
    heroes = ['russia.webp', 'everest.webp', 'bali.webp', 'annapurna.webp', 'kyrgyzstan.webp']
    base_dir = "public/images"
    
    for hero in heroes:
        src = os.path.join(base_dir, hero)
        dst = os.path.join(base_dir, hero.replace('.webp', '-mobile.webp'))
        
        if os.path.exists(src):
            with Image.open(src) as img:
                width, height = img.size
                if width > 800:
                    new_width = 800
                    new_height = int((800 / width) * height)
                    img_mobile = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
                    img_mobile.save(dst, "WEBP", quality=60, method=6)
                    print(f"Created {dst} from {src}")
        else:
            print(f"Warning: {src} not found.")

def remove_css_import():
    css_file = "style.css"
    if os.path.exists(css_file):
        with open(css_file, "r", encoding="utf-8") as f:
            lines = f.readlines()
        
        with open(css_file, "w", encoding="utf-8") as f:
            for line in lines:
                if "@import url('https://fonts.googleapis.com/css2" in line:
                    continue
                f.write(line)
        print("Removed @import from style.css")

def inject_fonts_into_html():
    print("Injecting Google Fonts directly into HTML files...")
    font_link = '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&family=Syne:wght@400;700;800&display=swap" rel="stylesheet"/>\n'
    
    html_files = glob.glob("*.html")
    for filepath in html_files:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Check if already present to avoid duplicates
        if 'family=Inter:wght@300;400;600;800' not in content:
            # We will insert it right before </head>
            if "</head>" in content:
                content = content.replace("</head>", font_link + "</head>")
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(content)
                print(f"Injected fonts into {filepath}")

def update_index_html_hero():
    filepath = "index.html"
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Update Preload
    old_preload = '<link as="image" href="/images/russia.webp" rel="preload"/>'
    new_preload = '''<link as="image" href="/images/russia-mobile.webp" media="(max-width: 768px)" rel="preload"/>
<link as="image" href="/images/russia.webp" media="(min-width: 769px)" rel="preload"/>'''
    content = content.replace(old_preload, new_preload)

    # Update Slide 1
    slide1_old = '<img alt="Russia Northern Lights" fetchpriority="high" height="1080" src="/images/russia.webp" width="1920"/>'
    slide1_new = '''<picture>
  <source media="(max-width: 768px)" srcset="/images/russia-mobile.webp">
  <img alt="Russia Northern Lights" fetchpriority="high" src="/images/russia.webp" width="1920" height="1080"/>
</picture>'''
    content = content.replace(slide1_old, slide1_new)

    # Update Slide 2
    slide2_old = '<img alt=" " height="1080" loading="lazy" src="/images/everest.webp" width="1920"/>'
    slide2_new = '''<picture>
  <source media="(max-width: 768px)" srcset="/images/everest-mobile.webp">
  <img alt="Everest" height="1080" loading="lazy" src="/images/everest.webp" width="1920"/>
</picture>'''
    content = content.replace(slide2_old, slide2_new)

    # Update Slide 3
    slide3_old = '<img alt=" " height="1080" loading="lazy" src="/images/bali.webp" width="1920"/>'
    slide3_new = '''<picture>
  <source media="(max-width: 768px)" srcset="/images/bali-mobile.webp">
  <img alt="Bali" height="1080" loading="lazy" src="/images/bali.webp" width="1920"/>
</picture>'''
    content = content.replace(slide3_old, slide3_new)

    # Update Slide 4
    slide4_old = '<img alt=" " height="1080" loading="lazy" src="/images/annapurna.webp" width="1920"/>'
    slide4_new = '''<picture>
  <source media="(max-width: 768px)" srcset="/images/annapurna-mobile.webp">
  <img alt="Annapurna" height="1080" loading="lazy" src="/images/annapurna.webp" width="1920"/>
</picture>'''
    content = content.replace(slide4_old, slide4_new)

    # Update Slide 5
    slide5_old = '<img alt=" " height="1080" loading="lazy" src="/images/kyrgyzstan.webp" width="1920"/>'
    slide5_new = '''<picture>
  <source media="(max-width: 768px)" srcset="/images/kyrgyzstan-mobile.webp">
  <img alt="Kyrgyzstan" height="1080" loading="lazy" src="/images/kyrgyzstan.webp" width="1920"/>
</picture>'''
    content = content.replace(slide5_old, slide5_new)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Updated index.html hero slider and preload.")

if __name__ == "__main__":
    generate_mobile_images()
    remove_css_import()
    inject_fonts_into_html()
    update_index_html_hero()
    print("Optimization complete!")
