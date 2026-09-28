"""Group compare.mjs report failures by signature. python summarize.py [report-dir]"""
import re, html, sys, collections
d = sys.argv[1] if len(sys.argv) > 1 else 'out/report'
s = open(f'{d}/index.html', encoding='utf8').read()
C = collections.Counter(); ex = {}; px = []; msgs = []
for sec in re.findall(r'<section[^>]*>(.*?)</section>', s, re.S):
    head = re.sub(r'<[^>]+>', '', sec.split('<pre>')[0]).strip().split('\n')[0]
    pre = re.search(r'<pre>(.*?)</pre>', sec, re.S)
    if pre:
        for l in html.unescape(pre.group(1)).split('\n')[:2]:
            sig = re.sub(r'#\d+', '', re.sub(r'[-\d.]+', 'N', l))[:90]
            C[sig] += 1; ex.setdefault(sig, []).append(head)
    elif re.search(r'\d+ px', head): px.append(head)
    else: msgs.append(re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', ' ', sec)))[:160])
for k, v in C.most_common(30): print(f'{v:4} {k}   e.g. {ex[k][0]}')
print(f'--- pixel-only ({len(px)})'); [print('  ', p) for p in px[:40]]
print(f'--- other ({len(msgs)})'); [print('  ', m) for m in msgs[:20]]
