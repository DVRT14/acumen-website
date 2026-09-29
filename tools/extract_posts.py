"""One-off migration: pull the per-post data out of the exported Elementor pages.

Writes
  vercel-site/src/data/cards.json            post cards (as shown in the "related" carousels), by post id
  vercel-site/src/content/knowledge/*.json   fields of every post that used single-post template 996, and
                                             of the whitepaper posts (templates 3311/3314/3537/3590/3625)
  vercel-site/src/content/expertise/*.json   fields of every expertise page (template 1047)
  vercel-site/src/data/expertise-cards.json  the "Our Expertise" slider cards (JetEngine listing 2137)
  vercel-site/src/content/vacatures/*.json   vacancies (Elementor pages 4122/4165: one layout, copied)
  vercel-site/src/content/one-off/*.json     named widget contents of hand-written one-off pages (ONE_OFF)
                                             and single-column posts (wp-post 3782, 3810) as a list of blocks
  vercel-site/src/data/meta.json             SEO head + body class of every page, for hand-written pages
  vercel-site/src/content/pages/*.json       pages without Elementor content (legal, careers, the
                                             expertise archive): their HTML between header and footer
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


# ASCII whitespace only: authored no-break spaces at the edges are content (they take up width).
WS = ' \t\r\n'


def heading(src, data_id):
    """Inner HTML of a heading widget's title element (tags like <span>/<br> kept); None if the
    widget is absent (Elementor drops widgets whose dynamic value is empty)."""
    w = by_id(src, data_id)
    if w is None:
        return None
    t = first(w, r'<(h[1-6]|div|p|span)[^>]*class="elementor-heading-title')
    return inner(t).strip(WS)


def text_editor(src, data_id):
    w = by_id(src, data_id)
    if w is None:
        return None
    return inner(first(w, r'<div class="elementor-widget-container')).strip(WS)


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
    for m in re.finditer(r'<div data-elementor-type="loop-item" data-elementor-id="(?:1145|1441)"', src):
        item = element(src, m.start())
        pid = re.search(r'e-loop-item-(\d+)', item).group(1)
        a = re.search(r'<a class="[^"]*postItem[^"]*"[^>]*href="([^"]*)"', item)
        img = re.search(r'<img [^>]*>', item)
        excerpt = re.search(r'postItem__excerpt.*?<div class="elementor-widget-container">(.*?)</div>', item, re.S)
        out[pid] = {
            'href': a.group(1),
            'title': inner(first(item, r'<h\d class="elementor-heading-title')).strip(),
            'date': (re.search(r'<time>(.*?)</time>', item) or [None, None])[1],
            'terms': (lambda t: inner(t).strip() if t else None)(first(item, r'<span class="elementor-post-info__terms-list">')),
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
        'appendix': appendix(src, '996'),
    }


def appendix(src, template):
    """Hand-written HTML placed after the template (e.g. an FAQ section + its JSON-LD); None if none."""
    m = re.search(rf'<div data-elementor-type="[\w-]+" data-elementor-id="{template}"', src)
    end = m.start() + len(element(src, m.start()))
    footer = src.find('data-elementor-type="footer"', end)
    return src[end:src.rfind('<', 0, footer)].strip() or None


def expertise_fields(src):
    bg = dict(re.findall(r'elementor-element-(1431f4ef|2f20deee):not\(\.elementor-motion-effects-element-type-background\), [^{]*\{background-image:url\("([^"]*)"\)', src))
    img = lambda data_id: img_attrs(re.search(r'<img [^>]*>', by_id(src, data_id)).group(0))
    button = by_id(src, 'c3b8981')
    return {
        'title': heading(src, '00865f1'),
        'content': text_editor(src, 'e2c3888'),
        'marquee': heading(src, '1bab047d'),
        'bannerImage': bg['1431f4ef'],
        'authorImage': img('3a7936c1'),
        'author': heading(src, '617d945f'),
        'introTitle': heading(src, '14e6008d'),
        'introText': text_editor(src, '6a2c749f'),
        'featuresTitle': heading(src, '15f2af36'),
        'featuresText': text_editor(src, '2683c6cd'),
        'photoImage': bg['2f20deee'],
        'quote': text_editor(src, '4b9814dc'),
        'conclusionTitle': heading(src, '4f36a8e1'),
        'conclusionText': text_editor(src, '18a73961'),
        'contactImage': img('4aa7306'),
        'contactTitle': heading(src, '7e1d58d6'),
        'contactButton': {
            'label': inner(first(button, r'<span class="elementor-button-text')).strip(),
            'href': re.search(r'<a [^>]*href="([^"]*)"', button).group(1),
        },
        'related': re.findall(r'e-loop-item-(\d+) post-', by_id(src, '84c593f')),
    }


def expertise_cards(src):
    out = []
    for m in re.finditer(r'<div class="jet-listing-grid__item jet-listing-dynamic-post-(\d+)"', src):
        item = element(src, m.start())
        out.append({
            'href': re.search(r'<a [^>]*href="([^"]*)"', item).group(1),
            'title': inner(first(item, r'<h\d class="elementor-heading-title')).strip(),
            'excerpt': inner(first(first(item, r'<div class="[^"]*postItem__excerpt'), r'<div class="elementor-widget-container')).strip(),
            'bg': re.search(rf'jet-listing-dynamic-post-{m.group(1)} [^{{]*\{{background-color:([^;]+);', src).group(1),
        })
    return out


WHITEPAPER_TEMPLATES = ('3311', '3314', '3537', '3590', '3625')


def whitepaper_fields(src, template):
    """The five whitepaper templates are copies of one layout (same CSS once ids are normalised), so
    widgets are addressed by their position in the document."""
    m = re.search(rf'<div data-elementor-type="[\w-]+" data-elementor-id="{template}"', src)
    doc = element(src, m.start())
    in_cards = {i for m in re.finditer(r'<div data-elementor-type="loop-item"', doc) for i in re.findall(r'data-id="([0-9a-f]+)"', element(doc, m.start()))}
    ids = [i for i in dict.fromkeys(re.findall(r'data-id="([0-9a-f]+)"', doc)) if i not in in_cards]
    if template == '2628':  # the white paper download page: same layout with the posts carousel moved to the top
        ids = ids[3:] + ids[:3]
    form = by_id(src, ids[11])
    button = by_id(src, ids[18])
    return {
        'template': 'whitepaper',
        'title': heading(src, ids[1]),
        'lead': text_editor(src, ids[2]),
        'downloadTitle': heading(src, ids[7]),
        'downloadText': text_editor(src, ids[8]),
        'form': {
            'name': html.unescape(re.search(r'<form [^>]*name="([^"]*)"', form).group(1)),
            **{k: html.unescape(v) for k, v in re.findall(r'<input type="hidden" name="(\w+)" value="([^"]*)"', form)},
        },
        'fields': form_block(form)['fields'],
        'hello': heading(src, ids[14]),
        'contactImage': img_attrs(re.search(r'<img [^>]*>', by_id(src, ids[16])).group(0)),
        'contactTitle': heading(src, ids[17]),
        'contactButton': {
            'label': inner(first(button, r'<span class="elementor-button-text')).strip(),
            'href': re.search(r'<a [^>]*href="([^"]*)"', button).group(1),
        },
        'related': re.findall(r'e-loop-item-(\d+) post-', by_id(src, ids[21])),
        'appendix': appendix(src, template),
    }


def plain_body(src):
    header = re.search(r'<\w+ data-elementor-type="header"', src)
    end = header.start() + len(element(src, header.start()))
    footer = src.find('data-elementor-type="footer"', end)
    return src[end:src.rfind('<', 0, footer)].strip()


def vacature_fields(src, page_id):
    """Both vacancy pages are copies of one layout: widgets addressed by position."""
    m = re.search(rf'<div data-elementor-type="wp-page" data-elementor-id="{page_id}"', src)
    ids = list(dict.fromkeys(re.findall(r'data-id="([0-9a-f]+)"', element(src, m.start()))))
    form = by_id(src, ids[43])
    card = lambda h, t: {'title': heading(src, ids[h]), 'text': text_editor(src, ids[t])}
    return {
        'title': heading(src, ids[1]),
        'location': text_editor(src, ids[2]),
        'aboutTitle': heading(src, ids[5]), 'aboutText': text_editor(src, ids[7]),
        'roleTitle': heading(src, ids[9]), 'roleText': text_editor(src, ids[11]),
        'cards': [card(15, 17), card(19, 21), card(25, 27), card(29, 31)],
        'whyTitle': heading(src, ids[34]), 'whyText': text_editor(src, ids[36]),
        'applyText': text_editor(src, ids[38]),
        'applyTitle': heading(src, ids[40]),
        'form': {
            'name': html.unescape(re.search(r'<form [^>]*name="([^"]*)"', form).group(1)),
            **{k: html.unescape(v) for k, v in re.findall(r'<input type="hidden" name="(\w+)" value="([^"]*)"', form)},
        },
    }


def widget(src, data_id):
    """A widget's content: heading/text HTML, or image attributes."""
    w = by_id(src, data_id)
    if 'elementor-widget-image"' in w[:w.index('>')] or 'elementor-widget-image ' in w[:w.index('>')]:
        return img_attrs(re.search(r'<img [^>]*>', w).group(0))
    if 'elementor-widget-icon' in w[:w.index('>')]:
        return re.search(r'<svg.*?</svg>', w, re.S).group(0)
    if 'elementor-widget-button' in w[:w.index('>')]:
        href = re.search(r'<a [^>]*href="([^"]*)"', w)
        return {'label': inner(first(w, r'<span class="elementor-button-text')).strip(), 'href': href and href.group(1)}
    if 'elementor-heading-title' in w:
        return heading(src, data_id)
    return text_editor(src, data_id)


# One-off pages written by hand: name -> {field: widget id or [ids]}.
ONE_OFF = {
    'anaplan': {
        'title': 'fb4139f', 'intro': 'd80487d', 'quote': '785e768',
        'honeycomb': '53593e9', 'connectedTitle': '77ae143', 'connectedText': '3d7b795',
        'bandLeft': 'fb6aa4f', 'useCasesText': 'ebdb783', 'useCasesImage': '43e38d3', 'bandRight': '19f3b45',
        'diffTitle': '5ea3e99',
        'cards': [['b3353af', '9175a3d'], ['3bb3467', 'fd5ad26'], ['bb4806b', '3e5b87b'], ['52b64f6', 'eed24f2'], ['e3f4078', 'bbd137a'], ['0c5ec87', '3d9f414']],
        'banner': 'b89301e', 'outro': '7935461',
    },
    'knowledge~agentic-ai': {
        'title': '447557e', 'lead': '117f98f', 'tags': ['6afb0b7', '8bc608b', '7f60637', '9a4db71', '3e2932b', '3d83847'],
        'whatKicker': 'c24b1d5', 'whatTitle': '0282c2e', 'whatText': '6c0ec28', 'compare': [['c1838cc', '66e2150'], ['bb69a1f', '8eaf29b']],
        'canTitle': '1c73bb3',
        'can': [['43b241b', 'c570e40', 'c794b91'], ['b1fdae5', 'bcfe474', '3ca179f'], ['cbb274a', 'c5e217b', '9cf496a'],
                ['9e56a60', '67c142a', 'ec3c9f5'], ['8409041', '43d786e', '2d3c498'], ['3a2cb30', 'd5f733f', '67916b0']],
        'valueKicker': '561ceff', 'valueTitle': 'fe663e4', 'value': [['9f86248', 'b8118b1'], ['a8b6122', '3e3749d'], ['24de051', '0ac7fb3'], ['d6cbea8', 'aad1b1d']],
        'nowKicker': '0a3b3be', 'nowTitle': 'a837961', 'nowText': '49b4254',
        'stats': [['295c51c', '5d0fd00', 'f7de694'], ['bb0c0be', '445db95', 'b377939'], ['15f96b5', '87972de', '3665f29']],
        'meansKicker': 'f044057', 'meansTitle': '45d8379', 'meansText': '2c57bd8',
        'uses': [['6bfde85', 'a2dbc5a', '375599f', '5f1767e', '1b4726c'], ['44c4149', '1237da2', '7b95645', 'ea3f05a', '786c782'],
                 ['d2c102a', '9eabe32', 'c7a5ba0', '9545509', '6259735'], ['3f85b23', '4ca2bc0', 'c04d796', '7d334b7', '92e2563']],
        'howKicker': 'f3aec21', 'howTitle': '7728b1b', 'steps': [['658df2f', 'e8103d5', 'd12b3f1'], ['c1c846d', 'ebebef2', 'e1fe48d'], ['8d8fc38', 'b510604', '362a261']],
        'casesKicker': '50f8148', 'casesTitle': 'd2b04c7', 'casesIntro': '653e76b',
        'cases': [['d8d6e09', '875e428', '54d6782', '17ea92a'], ['e133a47', '90cf9cb', '7c9da66', '726a090'], ['fc7014d', '16e5087', 'b1570b4', '80dfee3']],
        'whyKicker': 'd0b5594', 'why': [['55aabdb', '684ba01'], ['7cd85a2', '07b19b2'], ['61184f0', 'ab50414'], ['926cc84', 'c31a8cc']],
        'safeKicker': '9b7afec', 'safeTitle': 'edb765a', 'safe': [['8b3aa66', '29e5185'], ['50897fb', '31ee0f1'], ['615182b', '022a492']],
        'ctaTitle': '021f931', 'ctaText': 'e4e6451', 'ctaButtons': ['403a833', 'be665a0'],
    },
    'culture': {
        'typedHero': '6804fcc', 'hero': '5da3408',
        'story': [['bb3ed5e', 'd2ee5fb'], ['fea4e34', 'b7dbbf8'], ['dc30bfe', '447f060']],
        'quote': 'f243230',
        'team': [['adbb3ed', 'abf9fd0', '6a2fd13'], ['4fec3f5', '006b2e0', '7eaef4e'], ['2796d89', 'eeb2b92', '9102f23'], ['da0bbc9', 'd378fd4', 'c803ed7']],
        'joinTitle': 'e43f1d4', 'positionsTitle': 'd3440e7',
        'positions': [['f67edbf', '3ae667d'], ['bbba7c5', 'c237d32']],
        'quoteImage': '61a4a41', 'typedQuote': '7510728', 'quoteText': '448bbde', 'quoteAuthor': 'e7d9a7b',
        'photoLeft': 'f562b2d', 'photoRight': '19ad05b',
    },
    'index': {
        'typed': '1fe7dcb7', 'heroTitle': '7f1c8441', 'heroText': '4e12a72e', 'heroButton': '67d45422',
        'photo': '7ddad3e1', 'photoText': '3b5288d5',
        'logos': ['2b3c5101', '3380bcdf', '1a2964e7', '5bfa3140', '5a684bca', '4d7f5f4a', '1f483184', '4af73fe3', 'ccdd621', '1c492d78', '2938afa6'],
        'benefits': [['7057cf44', '1fb4be47'], ['790e6cc8', '7499afb5'], ['7e1d6902', '10d05673']],
        'benefitImages': ['1a0b5c10', '2011c88e', 'e4a3b76'],
        'groupImage': '35702987', 'groupTitle': '440f2868', 'groupText': '3f6eb724', 'groupButton': '24de8fb8',
        'howTitle': '583fda0d',
        'steps': [['1402fe14', '7e73a933'], ['4142bd4', '2a29ce36'], ['11944b62', '5410b30c'], ['d513fc4', '1f8a1204'], ['6dfb911b', '208de9e1']],
        'toolsTitle': '6747e376', 'toolsText': '4002a1ca', 'toolsImage': 'd86eab6',
        'supportText': '757f0a62', 'pricingText': '52995a9d',
        'values': [['72da9c1a', '420c93ec'], ['102dcff2', '6f9df9ff'], ['48848f3a', 'a18c57e'], ['74f18c7d', '7b0e0ec']],
        'valueImages': ['52e93765', '3b47cc5d', '3209d9fa', '69b008af'],
        'cultureTitle': '20264c55', 'cultureText': '22a0d513', 'cultureButton': '19d64546', 'cultureMarquee': '7090e411',
        'ctaTitle': '531eccc5', 'ctaButtons': ['44004dd2', '8c1c9cd'],
    },
    'anaplan-market': {
        'title': 'fb4139f', 'intro': 'd80487d', 'bandTop': 'fefd2de', 'quadrant': '12d7c47',
        'cards': [['923ac87', '442e9e3'], ['f82df85', '4500365'], ['ab7b6fe', '59957bd'], ['183387c', 'a81a2e2']],
        'supplyChain': 'b1227f8', 'bandLeft': 'fb6aa4f',
        'epmTitle': 'b533447', 'epmText': 'd307e0d', 'epmTable': '9d68d41', 'bandRight': '332a241',
        'scmText': 'b36f15e', 'scmTable': '6328881', 'banner': 'b89301e', 'outro': '7935461',
    },
}


def one_off(src, spec):
    get = lambda v: [get(x) for x in v] if isinstance(v, list) else widget(src, v)
    return {k: get(v) for k, v in spec.items()}


def ids_in(src, pattern):
    return list(dict.fromkeys(re.findall(r'data-id="([0-9a-f]+)"', element(src, re.search(pattern, src).start()))))


def remap(spec, source_ids, target_ids):
    """A spec written for one page, applied to a copy of it (same structure, other ids)."""
    to = dict(zip(source_ids, target_ids))
    get = lambda v: [get(x) for x in v] if isinstance(v, list) else to[v]
    return {k: get(v) for k, v in spec.items()}


def anaplan_tabs(src):
    """The tabs page holds copies of the "Tool" (3504) and "Market" (3457) pages in its first two tabs."""
    out = one_off(src, {'title': 'fb4139f', 'intro': 'd80487d'})
    for key, page, doc, panel in (('tool', 'anaplan', '3504', 'f37a7dd'), ('market', 'anaplan-market', '3457', '65ec279')):
        page_src = open(os.path.join(LEGACY, page + '.html'), encoding='utf8').read()
        source = ids_in(page_src, rf'<div data-elementor-type="wp-page" data-elementor-id="{doc}"')
        target = ids_in(src, rf'<div [^>]*data-id="{panel}"')[1:]
        out[key] = one_off(src, remap(ONE_OFF[page], source, target))
    out['tabs'] = [t.strip() for t in re.findall(r'<span class="e-n-tab-title-text">(.*?)</span>', src, re.S)]
    return out


def css_rule(css, data_id, prop, media=None):
    """Value of a custom property Elementor set for an element (optionally inside a media query)."""
    if media:
        m = re.search(re.escape(media) + r'\{(.*?)\}\s*(?=@media|/\*|$)', css, re.S)
        css = m.group(1) if m else ''
    m = re.search(rf'elementor-element-{data_id}\{{[^}}]*{re.escape(prop)}:([^;}}]+)', css)
    return m.group(1).strip() if m else None


# Single-column posts: page -> (document id, {widget id: style name}); unnamed widgets use the default style.
ARTICLES = {
    'knowledge~data-agents-insights-action': ('3782', {'afb8032': 'title', '776edf2': 'subtitle', '006a290': 'start', '8ec1b7f': 'lead', '0f477c1': 'cta'}),
    'knowledge~de-riziv-controleshoft-is-ingezet': ('3810', {'afb8032': 'title', '776edf2': 'subtitle', '35b948b': 'pull', '8ec1b7f': 'lead-left', '540195b': 'lead-left', '0f477c1': 'cta-dark'}),
}


def form_block(form):
    """An Elementor form as data: name, hidden fields, visible fields, submit label."""
    fields = []
    for g in re.finditer(r'<div class="([^"]*elementor-field-group[^"]*)">\s*<label for="([^"]+)" class="elementor-field-label">\s*(.*?)\s*</label>\s*<(input|textarea)([^>]*)>', form, re.S):
        attrs = dict(re.findall(r'([\w-]+)="([^"]*)"', g.group(5)))
        fields.append({k: v for k, v in {'label': g.group(3), 'tag': g.group(4), 'type': attrs.get('type'), 'name': attrs['name'],
                                         'placeholder': attrs.get('placeholder'), 'rows': attrs.get('rows'),
                                         'col': re.search(r'elementor-col-(\d+)', g.group(1)).group(1),
                                         'required': 'required' in attrs or None}.items() if v})
    return {
        'name': html.unescape(re.search(r'<form [^>]*name="([^"]*)"', form).group(1)),
        'hidden': {k: html.unescape(v) for k, v in re.findall(r'<input type="hidden" name="(\w+)" value="([^"]*)"', form)},
        'fields': fields,
        'submit': inner(first(form, r'<span class="elementor-button-text')).strip(),
    }


def article_blocks(src, doc_id, styles):
    css = open(os.path.join(ROOT, 'public', 'wp-content', 'uploads', 'elementor', 'css', f'post-{doc_id}.css'), encoding='utf8').read()
    doc = element(src, re.search(rf'<div data-elementor-type="[\w-]+" data-elementor-id="{doc_id}"', src).start())
    blocks = []
    for m in re.finditer(r'<div class="[^"]*elementor-widget-(heading|text-editor|spacer|image|button|form)\b[^"]*" data-id="(\w+)"', doc):
        kind, wid = m.groups()
        if kind == 'form':
            blocks.append({'k': 'form', 'id': wid, **form_block(first(by_id(src, wid), r'<form '))})
            continue
        b = {'k': kind, 'id': wid, 's': styles.get(wid)}
        if kind == 'spacer':
            b['h'] = css_rule(css, wid, '--spacer-size')
            b['hm'] = css_rule(css, wid, '--spacer-size', '@media(max-width:767px)')
        elif kind == 'button':
            w = by_id(src, wid)
            b['label'] = inner(first(w, r'<span class="elementor-button-text')).strip()
            b['href'] = re.search(r'<a [^>]*href="([^"]*)"', w).group(1)
        elif kind == 'heading':
            b['tag'] = re.search(r'<(h\d|p|div|span) class="elementor-heading-title', by_id(src, wid)).group(1)
            b['html'] = heading(src, wid)
        else:
            b['html' if kind == 'text-editor' else 'img'] = widget(src, wid)
        blocks.append({k: v for k, v in b.items() if v is not None})
    return blocks


cards = {}
posts = {}
plain = {}
meta = {}
vacatures = {}
expertise = {}
for f in sorted(glob.glob(os.path.join(LEGACY, '*.html'))):
    src = open(f, encoding='utf8').read()
    for pid, card in cards_from(src).items():
        cards.setdefault(pid, {}).update({k: v for k, v in card.items() if v is not None or k not in cards.get(pid, {})})
    name = os.path.basename(f)[:-5]
    if name == 'knowledge~agentic-ai':
        os.makedirs(os.path.join(ROOT, 'src', 'content', 'one-off'), exist_ok=True)
        with open(os.path.join(ROOT, 'src', 'content', 'one-off', 'agentic-ai.json'), 'w', encoding='utf8') as fh:
            json.dump({**one_off(src, ONE_OFF[name]), 'appendix': appendix(src, '3891')}, fh, ensure_ascii=False, indent=1)
    elif name in ONE_OFF or name == 'anaplan-tabs':
        os.makedirs(os.path.join(ROOT, 'src', 'content', 'one-off'), exist_ok=True)
        with open(os.path.join(ROOT, 'src', 'content', 'one-off', name + '.json'), 'w', encoding='utf8') as fh:
            json.dump(anaplan_tabs(src) if name == 'anaplan-tabs' else one_off(src, ONE_OFF[name]), fh, ensure_ascii=False, indent=1)
    if name in ARTICLES:
        doc_id, styles = ARTICLES[name]
        body_class = re.search(r'<body[^>]*class="([^"]*)"', src).group(1)
        posts[name.split('~', 1)[1]] = {'seo': seo_head(src), 'bodyClass': body_class, 'template': 'article', 'blocks': article_blocks(src, doc_id, styles)}
    meta[name] = {'seo': seo_head(src), 'bodyClass': re.search(r'<body[^>]*class="([^"]*)"', src).group(1)}
    if 'data-elementor-type="single-post" data-elementor-id="996"' in src:
        slug = name.split('~', 1)[1]
        body_class = re.search(r'<body[^>]*class="([^"]*)"', src).group(1)
        posts[slug] = {'seo': seo_head(src), 'bodyClass': body_class, **post_fields(src)}
    if set(re.findall(r'data-elementor-type="([\w-]+)"', src)) <= {'header', 'footer'}:
        body_class = re.search(r'<body[^>]*class="([^"]*)"', src).group(1)
        plain[name] = {'seo': seo_head(src), 'bodyClass': body_class, 'html': plain_body(src)}
    vac = re.search(r'data-elementor-type="wp-page" data-elementor-id="(4122|4165)"', src)
    if vac:
        vacatures[name.split('~', 1)[1]] = {**meta[name], **vacature_fields(src, vac.group(1))}
    if name == 'white-paper-download-page':
        os.makedirs(os.path.join(ROOT, 'src', 'content', 'one-off'), exist_ok=True)
        with open(os.path.join(ROOT, 'src', 'content', 'one-off', name + '.json'), 'w', encoding='utf8') as fh:
            json.dump(whitepaper_fields(src, '2628'), fh, ensure_ascii=False, indent=1)
    wp = re.search(r'data-elementor-type="single-post" data-elementor-id="(\d+)"', src)
    if wp and wp.group(1) in WHITEPAPER_TEMPLATES:
        body_class = re.search(r'<body[^>]*class="([^"]*)"', src).group(1)
        posts[name.split('~', 1)[1]] = {'seo': seo_head(src), 'bodyClass': body_class, **whitepaper_fields(src, wp.group(1))}
    if 'data-elementor-type="single-post" data-elementor-id="1047"' in src:
        body_class = re.search(r'<body[^>]*class="([^"]*)"', src).group(1)
        slider = expertise_cards(by_id(src, 'f06ec46'))
        expertise[name.split('~', 1)[1]] = {'seo': seo_head(src), 'bodyClass': body_class, **expertise_fields(src)}

os.makedirs(os.path.join(ROOT, 'src', 'data'), exist_ok=True)
with open(os.path.join(ROOT, 'src', 'data', 'cards.json'), 'w', encoding='utf8') as fh:
    json.dump(cards, fh, ensure_ascii=False, indent=1)
with open(os.path.join(ROOT, 'src', 'data', 'meta.json'), 'w', encoding='utf8') as fh:
    json.dump(meta, fh, ensure_ascii=False, indent=1)
with open(os.path.join(ROOT, 'src', 'data', 'expertise-cards.json'), 'w', encoding='utf8') as fh:
    json.dump(slider, fh, ensure_ascii=False, indent=1)
for kind, pages in (('knowledge', posts), ('expertise', expertise), ('pages', plain), ('vacatures', vacatures)):
    out = os.path.join(ROOT, 'src', 'content', kind)
    os.makedirs(out, exist_ok=True)
    for slug, data in pages.items():
        with open(os.path.join(out, slug + '.json'), 'w', encoding='utf8') as fh:
            json.dump(data, fh, ensure_ascii=False, indent=1)
print(f'{len(cards)} cards, {len(posts)} posts, {len(expertise)} expertise pages')
for slug, data in {**posts, **expertise}.items():
    missing = [k for k, v in data.items() if v in (None, '', []) and k != 'appendix']
    if missing: print('  ', slug, 'missing:', missing)
