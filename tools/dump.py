"""Dump an Elementor document as a compact tree with widget content (for hand-porting one-off pages):
containers with boxed/full + classes, widgets with their text HTML / image attributes / link.
usage: python tools/dump.py <exported page> <data-elementor-id>"""
import re, sys, html

src = open(sys.argv[1], encoding='utf8').read()
start = re.search(rf'<div data-elementor-type="[\w-]+" data-elementor-id="{sys.argv[2]}"', src).start()


def element(s, i):
    tag = re.match(r'<(\w+)', s[i:]).group(1)
    depth = 0
    for m in re.finditer(rf'<(/?){tag}\b[^>]*>', s[i:]):
        depth += -1 if m.group(1) else 1
        if depth == 0:
            return s[i:i + m.end()]


NOISE = re.compile(r'^(elementor-element(-[0-9a-f]+)?|elementor-widget(-[\w-]+)?|e-con|e-flex|e-child|e-parent|e-con-full|e-con-boxed)$')


def children(el):
    """Direct element children of the element (skipping e-con-inner / widget-container wrappers)."""
    body = el[el.index('>') + 1:el.rindex('<')]
    out, i = [], 0
    while True:
        m = re.search(r'<(\w+)[^>]*\bdata-element_type="(container|widget)"', body[i:])
        if not m:
            return out
        e = element(body, i + m.start())
        out.append(e)
        i += m.start() + len(e)


def inner(el):
    return el[el.index('>') + 1:el.rindex('<')]


def show(el, depth):
    tag = el[:el.index('>')]
    cls = [c for c in re.search(r'class="([^"]*)"', tag).group(1).split() if not NOISE.match(c)]
    did = re.search(r'data-id="(\w+)"', tag).group(1)
    kind = re.search(r'data-element_type="(\w+)"', tag).group(1)
    pad = '  ' * depth
    if kind == 'container':
        box = 'boxed' if 'e-con-boxed' in tag else 'full'
        print(f'{pad}[{did}] {box} {" ".join(cls)}')
        for c in children(el):
            show(c, depth + 1)
        return
    wt = re.search(r'data-widget_type="([\w-]+)', tag).group(1)
    body = inner(el)
    body = re.sub(r'^\s*<div class="elementor-widget-container">\s*', '', body)
    body = re.sub(r'\s*</div>\s*$', '', body)
    if wt == 'image':
        img = re.search(r'<img [^>]*>', body).group(0)
        link = re.search(r'<a [^>]*href="([^"]*)"', body)
        print(f'{pad}({did}) image {" ".join(cls)} {img}' + (f' href={link.group(1)}' if link else ''))
    elif wt == 'spacer':
        print(f'{pad}({did}) spacer')
    else:
        print(f'{pad}({did}) {wt} {" ".join(cls)}: {re.sub(chr(10) + r"\s*", " ", body.strip())}')


for c in children(element(src, start)):
    show(c, 0)
