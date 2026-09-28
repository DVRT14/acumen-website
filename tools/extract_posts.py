"""One-off migration: pull the per-post data out of the exported Elementor pages.

Writes
  vercel-site/src/data/cards.json            post cards (as shown in the "related" carousels), by post id
  vercel-site/src/content/knowledge/*.json   fields of every post that used single-post template 996
Run from the repo root: python tools/extract_posts.py
"""
import glob, html, json, os, re

ROOT = os.path.join(os.path.dirname(__file__), '..', 'vercel-site')
LEGACY = os.path.join(ROOT, 'src', 'legacy')


def element(src, start):
    """Outer HTML of the element whose start tag begins at `start` (balanced on its tag name)."""
    tag = re.match(r'<(\w+)', src[start:]).group(1)
    depth = 0
    for m in re.finditer(rf'<(/?){tag}\b[^>]*>', src[start:]):
        depth += -1 if m.group(1) else 1
        if depth == 0:
            return src[start:start + m.end()]
    raise ValueError(f'unbalanced <{tag}>')


def inner(outer):
    return outer[outer.index('>') + 1:outer.rindex('<')]


def by_id(src, data_id):
    m = re.search(rf'<\w+[^>]*\bdata-id="{data_id}"', src)
    return element(src, m.start()) if m else None


def first(src, pattern):
    m = re.search(pattern, src, re.S)
    return element(src, m.start()) if m else None


def heading(src, data_id):
    """Inner HTML of a heading widget's title element (tags like <span>/<br> kept); None if the
    widget is absent (Elementor drops widgets whose dynamic value is empty)."""
    w = by_id(src, data_id)
    if w is None:
        return None
    t = first(w, r'<(h[1-6]|div|p|span)[^>]*class="elementor-heading-title')
    return inner(t).strip()


def text_editor(src, data_id):
    w = by_id(src, data_id)
    if w is None:
        return None
    return inner(first(w, r'<div class="elementor-widget-container')).strip()


def img_attrs(tag):
    return {k: html.unescape(v) for k, v in re.findall(r'([\w-]+)="([^"]*)"', tag) if k not in ('class',)}


def seo_head(src):
    """Head tags that carry meaning (SEO, icons); everything layout-related is left behind."""
    head = src[src.index('<head>') + 6:src.index('</head>')]
    keep = []
    yoast = re.search(r"<meta name='robots'.*?<!-- / Yoast SEO plugin. -->", head, re.S)
    keep.append(yoast.group(0))
    keep += re.findall(r'<link rel="(?:apple-touch-icon|icon|manifest)"[^>]*>', head)
    keep += re.findall(r'<meta name="msapplication-TileImage"[^>]*/>', head)
    return '\n'.join(keep)


def cards_from(src):
    out = {}
    for m in re.finditer(r'<div data-elementor-type="loop-item" data-elementor-id="1145"', src):
        item = element(src, m.start())
        pid = re.search(r'e-loop-item-(\d+)', item).group(1)
        a = re.search(r'<a class="[^"]*postItem[^"]*"[^>]*href="([^"]*)"', item)
        img = re.search(r'<img [^>]*>', item)
        excerpt = re.search(r'postItem__excerpt.*?<div class="elementor-widget-container">(.*?)</div>', item, re.S)
        out[pid] = {
            'href': a.group(1),
            'title': inner(first(item, r'<h1 class="elementor-heading-title')).strip(),
            'date': re.search(r'<time>(.*?)</time>', item).group(1),
            'excerpt': excerpt.group(1).strip() if excerpt else None,
            'image': img_attrs(img.group(0)) if img else None,
        }
    for pid, color in re.findall(r'\.e-loop-item-(\d+) \.elementor-element\.elementor-element-87f0d1c:not[^{]*\{background-color:([^;]+);\}', src):
        out.setdefault(pid, {})['bg'] = color
    return out


def post_fields(src):
    button = by_id(src, 'ad9feeb')
    contact_img = re.search(r'<img [^>]*>', by_id(src, '933da15') or '')
    form = by_id(src, 'e914a34')
    bg = dict(re.findall(r'elementor-element-(59ffa65|a08f239) > \.elementor-motion-effects-container > \.elementor-motion-effects-layer\{background-image:url\("([^"]*)"\)', src))
    carousel = by_id(src, 'e1fa7a0')
    return {
        'postId': re.search(r'name="queried_id" value="(\d+)"', form).group(1),
        'formTitle': html.unescape(re.search(r'name="referer_title" value="([^"]*)"', form).group(1)),
        'title': heading(src, '6b6e079'),
        'lead': text_editor(src, '826cb13'),
        'author': heading(src, '8f6e0e9'),
        'introTitle': heading(src, '7366c3e'),
        'introText': text_editor(src, '43f1380'),
        'featuresTitle': heading(src, '5fec9a3'),
        'featuresText': text_editor(src, '9196320'),
        'quote': text_editor(src, '760f843'),
        'conclusionTitle': heading(src, 'da814f0'),
        'conclusionText': text_editor(src, '81b4bb0'),
        'ctaTitle': heading(src, '15c7213'),
        'ctaText': text_editor(src, 'e2928e0'),
        'contactTitle': heading(src, 'a6679a0'),
        'contactImage': img_attrs(contact_img.group(0)) if contact_img else None,
        'contactButton': button and {
            'label': inner(first(button, r'<span class="elementor-button-text')).strip(),
            'href': re.search(r'<a [^>]*href="([^"]*)"', button).group(1),
        },
        'bannerImage': bg.get('59ffa65'),
        'photoImage': bg.get('a08f239'),
        'related': re.findall(r'e-loop-item-(\d+) post-', carousel),
    }


cards = {}
posts = {}
for f in sorted(glob.glob(os.path.join(LEGACY, '*.html'))):
    src = open(f, encoding='utf8').read()
    for pid, card in cards_from(src).items():
        cards.setdefault(pid, {}).update({k: v for k, v in card.items() if v is not None or k not in cards.get(pid, {})})
    name = os.path.basename(f)[:-5]
    if 'data-elementor-type="single-post" data-elementor-id="996"' in src:
        slug = name.split('~', 1)[1]
        body_class = re.search(r'<body[^>]*class="([^"]*)"', src).group(1)
        posts[slug] = {'seo': seo_head(src), 'bodyClass': body_class, **post_fields(src)}

os.makedirs(os.path.join(ROOT, 'src', 'data'), exist_ok=True)
with open(os.path.join(ROOT, 'src', 'data', 'cards.json'), 'w', encoding='utf8') as fh:
    json.dump(cards, fh, ensure_ascii=False, indent=1)
out = os.path.join(ROOT, 'src', 'content', 'knowledge')
os.makedirs(out, exist_ok=True)
for slug, data in posts.items():
    with open(os.path.join(out, slug + '.json'), 'w', encoding='utf8') as fh:
        json.dump(data, fh, ensure_ascii=False, indent=1)
print(f'{len(cards)} cards, {len(posts)} posts')
for slug, data in posts.items():
    missing = [k for k, v in data.items() if v in (None, '', [])]
    if missing: print('  ', slug, 'missing:', missing)
