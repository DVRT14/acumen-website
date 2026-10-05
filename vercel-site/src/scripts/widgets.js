// Widget behaviour driven by data attributes on the markup: sticky elements (data-sticky), entrance
// animations (data-animate), scroll/mouse motion (data-parallax, data-motion), carousels
// (data-carousel, data-slider_options), tabs, share buttons (data-share), lottie (data-lottie) and
// forms (data-form). Settings keep the old page builder's JSON shape, so the values carried over as-is.
import { $$, reduceMotion } from './scroll.js';

const BREAKPOINTS = { mobile: 767, tablet: 1024 };
const deviceMode = () => innerWidth <= BREAKPOINTS.mobile ? 'mobile' : innerWidth <= BREAKPOINTS.tablet ? 'tablet' : 'desktop';

// Per-device setting: mobile → tablet → desktop fallback; '' counts as unset.
function deviceSetting(s, key, device = deviceMode()) {
  const chain = { mobile: ['_mobile', '_tablet', ''], tablet: ['_tablet', ''], desktop: [''] }[device];
  for (const suffix of chain) { const v = s[key + suffix]; if (v !== undefined && v !== '' && !(v?.size === '' && !Object.keys(v?.sizes || {}).length)) return v; }
  return undefined;
}

function scrollObserver(callback, offset = '0px') {
  return new IntersectionObserver(entries => callback(entries[0].isIntersecting), { rootMargin: offset, threshold: [0] });
}

function contentHeight(el) {
  const cs = getComputedStyle(el);
  let h = parseFloat(cs.height);
  if (cs.boxSizing === 'border-box') h -= parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom) + parseFloat(cs.borderTopWidth) + parseFloat(cs.borderBottomWidth);
  return h;
}

/* ---------- Sticky (the behaviour of jquery.sticky) ---------- */
class Sticky {
  constructor(el, opts) {
    this.el = el;
    this.o = { to: 'top', offset: 0, effectsOffset: 0, parent: false, ...opts };
    this.active = false; this.notFollowing = false; this.effects = false;
    el.classList.add('sticky');
    if (this.o.parent) this.parent = el.parentElement;
    addEventListener('scroll', () => this.check(), { passive: true });
    addEventListener('resize', () => this.onResize());
    this.check();
  }
  size(el, prop) {
    const cs = getComputedStyle(el);
    let v = parseFloat(cs[prop]);
    const sides = prop === 'height' ? ['top', 'bottom'] : ['left', 'right'];
    if (cs.boxSizing !== 'border-box') sides.forEach(s => { v += parseFloat(cs[`border-${s}-width`]) + parseFloat(cs[`padding-${s}`]); });
    return v;
  }
  measure(el) {
    const h = this.size(el, 'height'), fromTop = el.getBoundingClientRect().top, fromBottom = fromTop - innerHeight;
    return { top: { fromTop, fromBottom }, bottom: { fromTop: fromTop + h, fromBottom: fromBottom + h } };
  }
  backup(el, key, props) { el[key] = Object.fromEntries(props.map(p => [p, el.style.getPropertyValue(p)])); }
  restore(el, key) { for (const [p, v] of Object.entries(el[key] || {})) el.style.setProperty(p, v); }
  measureBox() {
    this.width = this.size(this.el, 'width');
    this.left = this.el.getBoundingClientRect().left + scrollX;
  }
  addSpacer() {
    this.spacer = this.el.cloneNode(true);
    this.spacer.classList.add('sticky__spacer');
    Object.assign(this.spacer.style, { visibility: 'hidden', transition: 'none', animation: 'none' });
    this.el.after(this.spacer);
  }
  stick() {
    this.backup(this.el, '_unsticky', ['position', 'width', 'margin-top', 'margin-bottom', 'top', 'bottom', 'inset-inline-start']);
    const s = this.el.style;
    s.position = 'fixed'; s.width = this.width + 'px'; s.marginTop = '0px'; s.marginBottom = '0px';
    s[this.o.to] = this.o.offset + 'px'; s[this.o.to === 'top' ? 'bottom' : 'top'] = '';
    if (this.left) s.setProperty('inset-inline-start', this.left + 'px');
    this.el.classList.add('sticky--active');
  }
  unstickStyles() { this.restore(this.el, '_unsticky'); this.el.classList.remove('sticky--active'); }
  followParent() {
    const t = this.measure(this.el), top = this.o.to === 'top';
    if (this.notFollowing) {
      if (top ? t.top.fromTop > this.o.offset : t.bottom.fromBottom < -this.o.offset) {
        this.restore(this.parent, '_childNotFollowing'); this.restore(this.el, '_notFollowing'); this.notFollowing = false;
      }
      return;
    }
    const s = this.measure(this.parent), border = parseFloat(getComputedStyle(this.parent)[top ? 'borderBottomWidth' : 'borderTopWidth']);
    const limit = top ? s.bottom.fromTop - border : s.top.fromBottom + border;
    if (top ? limit <= t.bottom.fromTop : limit >= t.top.fromBottom) {
      this.backup(this.parent, '_childNotFollowing', ['position']);
      this.parent.style.position = 'relative';
      this.backup(this.el, '_notFollowing', ['position', 'inset-inline-start', 'top', 'bottom']);
      // jQuery .position().left of the spacer: offset relative to its offsetParent's padding box, minus margin.
      const op = this.spacer.offsetParent || document.documentElement, r = this.spacer.getBoundingClientRect(), pr = op.getBoundingClientRect();
      const left = r.left - pr.left - op.clientLeft - parseFloat(getComputedStyle(this.spacer).marginLeft);
      const st = this.el.style;
      st.position = 'absolute'; st.setProperty('inset-inline-start', left + 'px');
      st[this.o.to] = ''; st[top ? 'bottom' : 'top'] = '0px';
      this.notFollowing = true;
    }
  }
  check() {
    let t;
    if (this.active) {
      const s = this.measure(this.spacer);
      t = this.o.to === 'top' ? s.top.fromTop - this.o.offset : -s.bottom.fromBottom - this.o.offset;
      if (this.parent) this.followParent();
      if (t > 0) { this.unstickStyles(); this.spacer.remove(); this.active = false; }
    } else {
      const n = this.measure(this.el);
      t = this.o.to === 'top' ? n.top.fromTop - this.o.offset : -n.bottom.fromBottom - this.o.offset;
      if (t <= 0) { this.measureBox(); this.addSpacer(); this.stick(); this.active = true; if (this.parent) this.followParent(); }
    }
    if (this.effects && -t < this.o.effectsOffset) { this.el.classList.remove('sticky--effects'); this.effects = false; }
    else if (!this.effects && -t >= this.o.effectsOffset) { this.el.classList.add('sticky--effects'); this.effects = true; }
  }
  onResize() {
    if (!this.active) return;
    this.unstickStyles(); this.spacer.remove();
    this.measureBox(); this.addSpacer(); this.stick();
    if (this.parent) { this.notFollowing = false; this.followParent(); }
  }
}

function sticky() {
  $$('[data-sticky]').forEach(el => {
    const s = JSON.parse(el.dataset.sticky);
    if (!s.sticky || !(s.sticky_on || []).includes(deviceMode())) return;
    new Sticky(el, {
      to: s.sticky,
      offset: +deviceSetting(s, 'sticky_offset') || 0,
      effectsOffset: +deviceSetting(s, 'sticky_effects_offset') || 0,
      parent: !!s.sticky_parent, // stay within the parent element
    });
  });
}

/* ---------- Entrance animations ---------- */
// Measures nothing: site.js starts it before the fonts are in, so above-the-fold content isn't held back.
export function entranceAnimations() {
  // data-animate="fadeInUp" data-animate-delay="500", optionally per device (data-animate-tablet /
  // -mobile, same fallback as deviceSetting). Only data-animate starts hidden.
  $$('[data-animate], [data-animate-tablet], [data-animate-mobile]').forEach(el => {
    const d = el.dataset, name = deviceSetting({ a: d.animate, a_tablet: d.animateTablet, a_mobile: d.animateMobile }, 'a');
    if (!name) return;
    const io = scrollObserver(inView => {
      if (!inView) return;
      io.unobserve(el);
      if (name === 'none') { el.classList.add('animated'); return; }
      setTimeout(() => el.classList.add('animated', name), +d.animateDelay || 0);
    });
    io.observe(el);
  });
}

/* ---------- Motion effects (scroll / mouse) ---------- */
const EFFECTS = {
  translateY: ['scroll', ['translateY']], translateX: ['scroll', ['translateX']], rotateZ: ['scroll', ['rotateZ']],
  scale: ['scroll', ['scale']], opacity: ['scroll', ['opacity']], blur: ['scroll', ['blur']],
  mouseTrack: ['mouseMove', ['translateXY']], tilt: ['mouseMove', ['tilt']],
};
const mouse = { x: undefined, y: undefined };
let mouseTracked = false;

function viewportPercentage(el) {
  const r = el.getBoundingClientRect(), a = r.top - innerHeight;
  const u = Math.max(0, Math.min((0 - a) / (r.top + contentHeight(el) - a), 1));
  return parseFloat((100 * u).toFixed(2));
}
const movePoint = (total, passed) => +(passed / total * 100).toFixed(2);

function directionMovePoint(p, dir, range) {
  let s;
  if (p < range.start) {
    if (dir === 'out-in') s = 0; else if (dir === 'in-out') s = 100;
    else { s = movePoint(range.start, p); if (dir === 'in-out-in') s = 100 - s; }
  } else if (p < range.end) {
    if (dir === 'in-out-in') s = 0; else if (dir === 'out-in-out') s = 100;
    else { s = movePoint(range.end - range.start, p - range.start); if (dir === 'in-out') s = 100 - s; }
  } else if (dir === 'in-out') s = 0; else if (dir === 'out-in') s = 100;
  else { s = movePoint(100 - range.end, 100 - p); if (dir === 'in-out-in') s = 100 - s; }
  return s;
}

class MotionFX {
  constructor(el, prefix, s) {
    this.widget = el; this.prefix = prefix; this.s = s;
    this.type = prefix === 'motion_fx' ? 'element' : 'background';
    // data-parallax: a wrapper (measured) around the moving layer; data-motion: the element itself.
    const target = el.dataset.parallax !== undefined ? el.firstElementChild : el;
    this.el = target; this.dimsEl = el; this.parent = target.parentElement;
    this.interactions = this.prepare();
    this.el.classList.add('fx-element');
    if (this.type === 'background') {
      this.el.classList.add('fx-background');
      this.container = document.createElement('div'); this.container.className = 'fx-container';
      this.layer = document.createElement('div'); this.layer.className = 'fx-layer';
      this.container.prepend(this.layer); this.el.prepend(this.container);
      this.sizeLayer();
    }
    this.target = this.type === 'element' ? this.el : this.layer;
    this.defineDimensions();
    this.reset(); this.run();
    addEventListener('resize', () => this.defineDimensions());
    // Re-apply on resize (debounced 200ms).
    let t; addEventListener('resize', () => { clearTimeout(t); t = setTimeout(() => { this.interactions = this.prepare(); if (this.type === 'background') { this.sizeLayer(); this.defineDimensions(); } this.reset(); this.run(); }, 200); });
    if (s.motion_fx_motion_fx_scrolling) {
      el.addEventListener('mouseenter', () => el.style.setProperty('--e-transform-transition-duration', ''));
    }
  }
  prepare() {
    const s = this.s, out = {};
    for (const [key, val] of Object.entries(s)) {
      const m = key.match(new RegExp('^' + this.prefix + '_(.+?)_effect'));
      if (!m || !val) continue;
      const opts = {};
      for (const [k, v] of Object.entries(s)) {
        const mm = k.match(new RegExp(this.prefix + '_' + m[1] + '_(.+)'));
        if (!mm || mm[1] === 'effect') continue;
        opts[mm[1]] = v && typeof v === 'object' ? (Object.keys(v.sizes).length ? v.sizes : v.size) : v;
      }
      const [interaction, actions] = EFFECTS[m[1]];
      if (reduceMotion && interaction === 'mouseMove') continue; // no mouse tracking/tilt under reduced motion
      out[interaction] ||= {};
      actions.forEach(a => { out[interaction][a] = opts; });
    }
    return out;
  }
  sizeLayer() {
    const add = { x: 0, y: 0 }, mm = this.interactions.mouseMove, sc = this.interactions.scroll;
    if (mm?.translateXY) { add.x = 10 * mm.translateXY.speed; add.y = 10 * mm.translateXY.speed; }
    if (sc?.translateX) add.x = 10 * sc.translateX.speed;
    if (sc?.translateY) add.y = 10 * sc.translateY.speed;
    this.layer.style.width = 100 + add.x + '%'; this.layer.style.height = 100 + add.y + '%';
  }
  defineDimensions() {
    const e = this.dimsEl, r = e.getBoundingClientRect();
    this.dims = { elementHeight: r.height, elementWidth: r.width, elementTop: r.top + scrollY, elementLeft: r.left + scrollX };
    if (this.type === 'background') {
      this.dims.movableX = contentWidth(this.layer) - this.dims.elementWidth;
      this.dims.movableY = contentHeight(this.layer) - this.dims.elementHeight;
    }
  }
  reset() {
    this.rules = {};
    Object.assign(this.target.style, { transform: '', filter: '', opacity: '', willChange: '' });
    this.observer?.disconnect(); cancelAnimationFrame(this.raf);
    this.lastScroll = undefined; this.lastMouse = {};
  }
  updateRulePart(prop, name, value) {
    this.rules[prop] ||= {};
    if (!this.rules[prop][name]) {
      this.rules[prop][name] = true;
      this.target.style[prop] = Object.keys(this.rules[prop]).map(n => `${n}(var(--${n}))`).join('');
    }
    this.target.style.setProperty('--' + name, value);
  }
  step(p, o) {
    if (this.type === 'element') return -(p - 50) * o.speed;
    return -(this.dims['movable' + o.axis.toUpperCase()] * p / 100);
  }
  transform(name, p, o) { if (o.direction) p = 100 - p; this.updateRulePart('transform', name, this.step(p, o) + o.unit); }
  action(name, o, p, p2) {
    if (o.affectedRange) { if (o.affectedRange.start > p) p = o.affectedRange.start; if (o.affectedRange.end < p) p = o.affectedRange.end; }
    switch (name) {
      case 'translateX': o.axis = 'x'; o.unit = 'px'; this.transform('translateX', p, o); break;
      case 'translateY': o.axis = 'y'; o.unit = 'px'; this.transform('translateY', p, o); break;
      case 'translateXY': this.action('translateX', o, p); this.action('translateY', o, p2); break;
      case 'rotateZ': o.unit = 'deg'; this.transform('rotateZ', p, o); break;
      case 'scale': this.updateRulePart('transform', 'scale', 1 + o.speed * directionMovePoint(p, o.direction, o.range) / 1e3); break;
      case 'opacity': {
        const lvl = o.level / 10;
        Object.assign(this.target.style, { opacity: 1 - lvl + lvl * directionMovePoint(p, o.direction, o.range) / 100, willChange: 'opacity' });
        break;
      }
      case 'blur': this.updateRulePart('filter', 'blur', o.level - o.level * directionMovePoint(p, o.direction, o.range) / 100 + 'px'); break;
    }
  }
  run() {
    const { scroll, mouseMove } = this.interactions;
    const tick = () => {
      if (scroll && scrollY !== this.lastScroll) {
        this.lastScroll = scrollY;
        const p = viewportPercentage(this.parent);
        for (const [a, o] of Object.entries(scroll)) this.action(a, o, p);
        this.el.style.setProperty('--e-transform-transition-duration', '100ms');
      }
      if (mouseMove && (mouse.x !== this.lastMouse.x || mouse.y !== this.lastMouse.y)) {
        this.lastMouse = { ...mouse };
        if (mouse.x !== undefined) for (const [a, o] of Object.entries(mouseMove)) this.action(a, o, 100 / innerWidth * mouse.x, 100 / innerHeight * mouse.y);
      }
    };
    if (mouseMove && !mouseTracked) { mouseTracked = true; addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; }); }
    tick();
    const loop = () => { tick(); this.raf = requestAnimationFrame(loop); };
    this.observer = scrollObserver(inView => { cancelAnimationFrame(this.raf); if (inView) loop(); });
    this.observer.observe(this.parent);
  }
}

function motionEffects() {
  // data-parallax="<speed>": vertical scrolling effect at that speed.
  $$('[data-parallax]').forEach(el => new MotionFX(el, 'motion_fx', {
    motion_fx_motion_fx_scrolling: 'yes',
    motion_fx_translateY_effect: 'yes',
    motion_fx_translateY_speed: { unit: 'px', size: +el.dataset.parallax, sizes: [] },
    motion_fx_translateY_affectedRange: { unit: '%', size: '', sizes: { start: 0, end: 100 } },
  }));
  // data-motion: the full settings (e.g. background scroll effects, mouse tracking).
  $$('[data-motion]').forEach(el => {
    const s = JSON.parse(el.dataset.motion), device = deviceMode();
    for (const prefix of ['motion_fx', 'background_motion_fx']) {
      const devices = s[prefix + '_devices'];
      if ((devices && !devices.includes(device)) || !(s[prefix + '_motion_fx_scrolling'] || s[prefix + '_motion_fx_mouse'])) continue;
      const fx = new MotionFX(el, prefix, s);
      if (!Object.keys(fx.interactions).length) fx.reset();
    }
  });
}

/* ---------- Carousels: posts carousel + "Our Expertise" slider (Swiper 8) ---------- */
const I18N = document.documentElement.lang.startsWith('nl')
  ? { of: 'van', goTo: 'Ga naar slide' }
  : { of: 'of', goTo: 'Go to slide' };

// Swiper settings from the carousel's data-carousel options.
function loopCarouselConfig(s) {
  const show = +s.slides_to_show || 3, single = show === 1;
  const spacing = device => { const v = deviceSetting(s, 'image_spacing_custom', device); return Number(v?.size ?? v) || 0; };
  const cfg = { slidesPerView: show, loop: s.infinite === 'yes', speed: s.speed, breakpoints: {} };
  const fallback = { mobile: 1, tablet: single ? 1 : 2 };
  let prev = show;
  for (const dev of ['tablet', 'mobile']) {
    const d = fallback[dev] ?? prev;
    cfg.breakpoints[BREAKPOINTS[dev]] = { slidesPerView: +s['slides_to_show_' + dev] || d, slidesPerGroup: +s['slides_to_scroll_' + dev] || 1 };
    if (s.image_spacing_custom) cfg.breakpoints[BREAKPOINTS[dev]].spaceBetween = spacing(dev);
    prev = +s['slides_to_show_' + dev] || d;
  }
  if (s.autoplay === 'yes') cfg.autoplay = { delay: s.autoplay_speed, disableOnInteraction: s.pause_on_interaction === 'yes' };
  if (single) { cfg.effect = s.effect; if (s.effect === 'fade') cfg.fadeEffect = { crossFade: true }; }
  else cfg.slidesPerGroup = +s.slides_to_scroll || 1;
  if (s.image_spacing_custom) cfg.spaceBetween = spacing('desktop');
  if (s.offset_sides === 'right' || s.offset_sides === 'both') cfg.slidesPerView = show + 0.001;
  // The options key breakpoints by max-width; Swiper wants min-width.
  const values = [BREAKPOINTS.mobile, BREAKPOINTS.tablet];
  for (const key of Object.keys(cfg.breakpoints)) {
    const i = parseInt(key);
    const to = i === BREAKPOINTS.mobile ? 0 : values[values.findIndex(v => v === i) - 1];
    cfg.breakpoints[to] = cfg.breakpoints[key];
    cfg.breakpoints[key] = { slidesPerView: cfg.slidesPerView, slidesPerGroup: cfg.slidesPerGroup || 1 };
  }
  return cfg;
}

async function carousels() {
  const posts = $$('.posts-carousel[data-carousel]'), xsliders = $$('.xslider');
  if (!posts.length && !xsliders.length) return;
  const { default: Swiper, A11y, Mousewheel, Pagination } = await import('swiper');
  Swiper.use([A11y, Mousewheel, Pagination]);

  // Shared feel: sideways trackpad swipes, clickable dots, arrow keys while focus is inside.
  // No loop, so a drag past either end springs back.
  const carousel = (w, cfg) => {
    const container = w.querySelector('.swiper');
    if ($$('.swiper-slide', container).length < 2) return;
    Object.assign(cfg, {
      mousewheel: { forceToAxis: true },
      pagination: { el: w.querySelector('.carousel-dots'), clickable: true, bulletElement: 'button', bulletClass: 'carousel-dots__dot', bulletActiveClass: 'is-active' },
      a11y: { enabled: true, paginationBulletMessage: `${I18N.goTo} {{index}}`, slideLabelMessage: `{{index}} ${I18N.of} {{slidesLength}}` },
    });
    const sw = new Swiper(container, cfg);
    // Arrow keys only while focus is inside this carousel (Swiper 8's Keyboard module listens page-wide).
    w.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight') sw.slideNext(); else if (e.key === 'ArrowLeft') sw.slidePrev(); else return;
      e.preventDefault();
    });
  };

  posts.forEach(w => {
    const s = JSON.parse(w.dataset.carousel), container = w.querySelector('.swiper');
    if (s.offset_sides && s.offset_sides !== 'none') container.classList.add('offset-' + s.offset_sides);
    carousel(w, loopCarouselConfig(s));
  });
  // Next card peeks in on mobile, three cards from tablet up.
  xsliders.forEach(w => carousel(w, { speed: 500, slidesPerView: 2.2, breakpoints: { [BREAKPOINTS.mobile + 1]: { slidesPerView: 3 } } }));
}

function contentWidth(el) {
  const cs = getComputedStyle(el);
  let w = parseFloat(cs.width);
  if (cs.boxSizing === 'border-box') w -= parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight) + parseFloat(cs.borderLeftWidth) + parseFloat(cs.borderRightWidth);
  return w;
}

/* ---------- Nested tabs ---------- */
function nestedTabs() {
  $$('.e-n-tabs').forEach(tabs => {
    const titles = $$(':scope > .e-n-tabs-heading > .e-n-tab-title', tabs);
    const select = title => {
      titles.forEach(t => {
        const on = t === title;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        document.getElementById(t.getAttribute('aria-controls'))?.classList.toggle('e-active', on);
      });
    };
    tabs.classList.add('e-activated');
    tabs.dataset.touchMode = String('ontouchstart' in window || navigator.maxTouchPoints > 0);
    titles.forEach((t, i) => {
      t.addEventListener('click', () => select(t));
      t.addEventListener('keydown', e => {
        const next = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: titles.length - 1 }[e.key];
        if (next === undefined) return;
        e.preventDefault();
        const target = titles[(next + titles.length) % titles.length];
        target.focus(); select(target);
      });
    });
  });
}

/* ---------- Share buttons ---------- */
function shareButtons() {
  const urls = {
    linkedin: u => `https://www.linkedin.com/shareArticle?mini=true&url=${u}`,
    facebook: u => `https://www.facebook.com/sharer.php?u=${u}`,
    twitter: u => `https://twitter.com/intent/tweet?url=${u}`,
  };
  $$('[data-share]').forEach(btn => {
    const network = btn.dataset.share;
    if (!urls[network]) return;
    const open = () => window.open(urls[network](encodeURIComponent(location.href.split('#')[0])), '', 'width=640,height=480');
    btn.addEventListener('click', open);
    btn.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
  });
}

/* ---------- Lottie (hover trigger only — the only mode this site uses) ---------- */
async function lotties() {
  const widgets = $$('[data-lottie]');
  if (!widgets.length) return;
  const { default: lottie } = await import('lottie-web/build/player/lottie_svg');
  widgets.forEach(w => {
    const s = JSON.parse(w.dataset.lottie), container = w.querySelector('.e-lottie__container'), holder = w.querySelector('.e-lottie__animation');
    if (!holder) return;
    if (container && !container.querySelector('.e-lottie__caption')) {
      const p = document.createElement('p'); p.className = 'e-lottie__caption'; container.append(p);
    }
    const anim = lottie.loadAnimation({ container: holder, path: s.source_json?.url || s.source_external_url?.url, renderer: s.renderer || 'svg', autoplay: false, name: 'lottie-widget' });
    let total, direction = 'forward', newCycle = false, count = 0;
    const endFrame = () => total * (s.end_point?.size ?? 100) / 100;
    const startFrame = () => total * (s.start_point?.size ?? 0) / 100;
    const reverseMode = () => s.on_hover_out === 'reverse' && direction === 'backward';
    const play = () => {
      const current = anim.currentFrame, start = startFrame();
      let first = 0, last = total;
      if (start && start > first) first = start;
      const end = endFrame(); if (end && end < last) last = end;
      if (!newCycle) first = start && start > current ? start : current;
      if (direction === 'backward' && reverseMode()) { first = current; last = start && start > 0 ? start : 0; }
      anim.stop(); anim.playSegments([first, last], true); newCycle = false;
    };
    anim.addEventListener('DOMLoaded', () => {
      total = anim.totalFrames;
      if (s.play_speed?.size) anim.setSpeed(s.play_speed.size);
      anim.goToAndStop(startFrame(), true);
      const area = s.hover_area === 'container' ? w.closest('.xcard') : container;
      area?.addEventListener('mouseenter', () => { direction = 'forward'; play(); });
      if (s.on_hover_out === 'reverse' || s.on_hover_out === 'pause') {
        area?.addEventListener('mouseleave', () => { if (s.on_hover_out === 'pause') anim.pause(); else { direction = 'backward'; play(); } });
      }
    });
    anim.addEventListener('complete', () => {
      newCycle = true;
      if (!reverseMode()) return;
      if (count < 1) { count++; direction = 'backward'; play(); }
      else if (direction === 'forward') { direction = 'backward'; play(); }
      else { count = 0; direction = 'forward'; }
    });
  });
}

/* ---------- Forms: POST to the stub endpoint, show a success/error message ---------- */
const FORM_MESSAGES = { success: 'Your submission was successful.', error: 'An error occurred.' };

function forms() {
  $$('form[data-form]').forEach(form => {
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const button = form.querySelector('[type="submit"]');
      form.querySelectorAll('.form-message').forEach(m => m.remove());
      form.classList.add('form-waiting');
      if (button) button.disabled = true;
      let ok = false;
      try {
        const res = await fetch('/api/forms', { method: 'POST', body: new FormData(form) });
        ok = res.ok && (await res.json()).success;
      } catch { /* network error → error message */ }
      form.classList.remove('form-waiting');
      if (button) button.disabled = false;
      const msg = document.createElement('div');
      msg.className = `form-message form-message--${ok ? 'success' : 'error'}`;
      msg.setAttribute('role', 'alert');
      msg.textContent = ok ? form.dataset.success || FORM_MESSAGES.success : FORM_MESSAGES.error;
      if (ok) form.reset();
      form.append(msg);
    });
  });
}

// Same order as the old handlers, after the theme animations.
export function initWidgets() {
  sticky();
  motionEffects();
  nestedTabs();
  shareButtons();
  forms();
  carousels();
  lotties();
}
