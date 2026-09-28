"""Print the authored CSS rules that target Elementor element ids, grouped by media query.
usage: python tools/rules.py <css-file> <data-id> [<data-id> ...]"""
import sys, re

css = open(sys.argv[1], encoding='utf8').read()
ids = sys.argv[2:]

def blocks(text, media='(all)'):
    i = 0
    while i < len(text):
        j = text.find('{', i)
        if j < 0: return
        sel = text[i:j].strip()
        if sel.startswith('@media') or sel.startswith('@supports') or sel.startswith('@container'):
            depth, k = 1, j + 1
            while depth and k < len(text):
                depth += {'{': 1, '}': -1}.get(text[k], 0); k += 1
            yield from blocks(text[j + 1:k - 1], sel)
            i = k
        else:
            k = text.find('}', j)
            yield media, sel, text[j + 1:k].strip()
            i = k + 1

out = {}
for media, sel, body in blocks(css):
    if any(f'elementor-element-{d}' in sel for d in ids) and body:
        out.setdefault(media, []).append(f'  {sel} {{ {body} }}')
for media, rules in out.items():
    print(media); print('\n'.join(rules))
