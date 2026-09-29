"""Print an outline of Elementor documents in a page: containers, widgets, custom classes, text.
usage: python tools/outline.py <exported page> [data-elementor-id ...]"""
import sys, re, json, html as H
from html.parser import HTMLParser

VOID = {'area','base','br','col','embed','hr','img','input','link','meta','source','track','wbr'}
NOISE = re.compile(r'^(elementor-element(-[0-9a-f]+)?|elementor-widget(-[\w-]+)?|e-con|e-flex|e-child|e-parent|e-con-full|e-con-boxed|elementor-widget__width-\w+|elementor-hidden-\w+)$')

class P(HTMLParser):
    def __init__(s, ids):
        super().__init__(convert_charrefs=True); s.ids = ids; s.stack = []; s.depth = None; s.out = []; s.text = ''
    def handle_starttag(s, tag, attrs):
        a = dict(attrs)
        if tag in VOID:
            if s.depth is not None and tag == 'img': s.out.append('  ' * (len(s.stack) - s.depth) + f'img {a.get("src","").split("/")[-1]}')
            return
        s.stack.append(tag)
        if s.depth is None and a.get('data-elementor-id') in s.ids:
            s.depth = len(s.stack); s.out.append(f'# document {a.get("data-elementor-type")} {a.get("data-elementor-id")}'); return
        if s.depth is None: return
        et = a.get('data-element_type'); wt = a.get('data-widget_type')
        if et:
            cls = [c for c in a.get('class', '').split() if not NOISE.match(c)]
            hidden = [c.replace('elementor-hidden-', '') for c in a.get('class', '').split() if c.startswith('elementor-hidden-')]
            st = {}
            try: st = json.loads(a.get('data-settings') or '{}')
            except Exception: pass
            keys = [k for k in st if any(x in k for x in ('animation', 'sticky', 'motion_fx', 'background_background'))]
            s.flush()
            s.out.append('  ' * (len(s.stack) - s.depth) + f'{(wt or et).replace(".default","")} #{a.get("data-id")} {" ".join("."+c for c in cls)}'
                         + (f' hide:{",".join(hidden)}' if hidden else '') + (f' [{",".join(keys)}]' if keys else ''))
    def handle_endtag(s, tag):
        if tag in VOID or tag not in s.stack: return  # stray end tags (e.g. "</span>" in titles)
        while s.stack:
            t = s.stack.pop()
            if s.depth is not None and len(s.stack) < s.depth: s.flush(); s.depth = None
            if t == tag: break
    def handle_data(s, d):
        if s.depth is not None and d.strip(): s.text += ' ' + d.strip()
    def flush(s):
        if s.text.strip(): s.out.append('  ' * (len(s.stack) - (s.depth or 0) + 1) + '"' + re.sub(r'\s+', ' ', s.text.strip())[:70] + '"')
        s.text = ''

src = open(sys.argv[1], encoding='utf8').read()
ids = sys.argv[2:] or re.findall(r'data-elementor-id="(\d+)"', src)
p = P(set(ids)); p.feed(src); print('\n'.join(p.out))
