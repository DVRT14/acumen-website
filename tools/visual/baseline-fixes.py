"""Apply accepted content fixes to the baseline worktree (.baseline/, never committed there), so the
gate compares against "old site + intentional fixes" and only real regressions show up.
Idempotent. Run after (re)creating the worktree: python tools/visual/baseline-fixes.py"""
import re, glob, os

root = os.path.join(os.path.dirname(__file__), '..', '..', '.baseline', 'vercel-site')
fixes = {
    # 23 posts: <img> whose src is pasted body text (broken request, empty gap) — removed.
    'broken body-text img': (r'<img [^>]*src="http://AItechnologyiswidely[^"]*"[^>]*/?>', ''),
}
for name, (pat, rep) in fixes.items():
    n = 0
    for f in glob.glob(os.path.join(root, '**', 'index.html'), recursive=True):
        s = open(f, encoding='utf8').read()
        s2, c = re.subn(pat, rep, s)
        if c: open(f, 'w', encoding='utf8').write(s2); n += c
    print(f'{name}: {n} replaced')
