"""For an Elementor template shared by several pages: which widgets vary per page (fields) vs are static.
usage: python tools/fields.py <template-id> <exported page>..."""
import sys, re, collections

def element(src, start):
    """Outer HTML of the element whose start tag begins at `start` (balanced on its tag name)."""
    tag = re.match(r'<(\w+)', src[start:]).group(1)
    depth = 0
    for m in re.finditer(rf'<(/?){tag}\b[^>]*>', src[start:]):
        depth += -1 if m.group(1) else 1
        if depth == 0: return src[start:start + m.end()]
    return src[start:]

def fields(src, doc):
    d = src.find(f'data-elementor-id="{doc}"'); d = src.rfind('<', 0, d)
    body = element(src, d); out = {}
    for m in re.finditer(r'<\w+[^>]*\bdata-id="([0-9a-f]+)"', body):
        out.setdefault(m.group(1), element(body, m.start()))
    return out

doc, files = sys.argv[1], sys.argv[2:]
per = {f: fields(open(f, encoding='utf8').read(), doc) for f in files}
norm = lambda h: re.sub(r'\s+', ' ', re.sub(r'<style[^>]*>.*?</style>', '', h, flags=re.S)).strip()
text = lambda h: re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', ' ', h)).strip()
for i in per[files[0]]:
    vals = collections.Counter(norm(per[f].get(i, '')) for f in files)
    kind = 'STATIC' if len(vals) == 1 else f'VARIES({len(vals)})'
    print(f'{i} {kind:11} {len(norm(per[files[0]][i])):6}  {text(per[files[0]][i])[:80]}')
