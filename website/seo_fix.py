import os
import glob
from bs4 import BeautifulSoup

def process_html_file(filepath):
    print(f"Processing {filepath}...")
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    soup = BeautifulSoup(content, 'html.parser')
    
    # 2. External Links Security
    for a in soup.find_all('a', target='_blank'):
        rel = a.get('rel', [])
        if isinstance(rel, str):
            rel = rel.split()
        if 'noopener' not in rel:
            rel.append('noopener')
        if 'noreferrer' not in rel:
            rel.append('noreferrer')
        a['rel'] = " ".join(rel)

    # 3. Canonicals
    head = soup.head
    if head:
        canonical = head.find('link', rel='canonical')
        if not canonical:
            basename = os.path.basename(filepath)
            url_path = "" if basename == "index.html" else basename.replace('.html', '')
            url = f"https://nomadller.com/{url_path}"
            new_link = soup.new_tag('link', rel='canonical', href=url)
            head.append(new_link)

    # 4. Heading Structure
    h1s = soup.find_all('h1')
    if len(h1s) == 0:
        main = soup.find('main')
        title_text = soup.title.string if soup.title else "Nomadller Expeditions"
        new_h1 = soup.new_tag('h1', style="display:none;") # Hidden or visually hidden if adding blindly
        new_h1.string = title_text
        if main:
            main.insert(0, new_h1)
        elif soup.body:
            soup.body.insert(0, new_h1)
    elif len(h1s) > 1:
        # Keep the first, change others to h2
        for h in h1s[1:]:
            h.name = 'h2'

    # 5. Meta Tags
    title_tag = soup.title
    if title_tag and title_tag.string:
        title = title_tag.string.strip()
        if len(title) > 60:
            title_tag.string = title[:57] + "..."
        elif len(title) < 30:
            title_tag.string = title + " | Nomadller Trekking Company"

    meta_desc = soup.find('meta', attrs={'name': 'description'})
    if meta_desc and meta_desc.get('content'):
        desc = meta_desc['content']
        if len(desc) > 155:
            # truncate to 155 chars
            meta_desc['content'] = desc[:152] + "..."
    elif head:
        # Add missing meta description
        new_desc = soup.new_tag('meta', attrs={'name': 'description', 'content': "Nomadller provides top trekking and adventure experiences. Join us for an unforgettable expedition."})
        head.append(new_desc)

    # 6. Image Optimization
    images = soup.find_all('img')
    for i, img in enumerate(images):
        if i > 0:  # Skip the first image (hero)
            if not img.get('loading'):
                img['loading'] = "lazy"

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(str(soup))

if __name__ == "__main__":
    html_files = glob.glob("*.html")
    for f in html_files:
        process_html_file(f)
    print("Done processing HTML files.")
