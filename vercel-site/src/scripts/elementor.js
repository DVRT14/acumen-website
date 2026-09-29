// Replacements for the Elementor / Elementor Pro / JetEngine frontend scripts, driven by the same
// data-settings JSON the markup already carries. Ported from their minified sources so the
// resulting DOM state (classes, inline styles) matches what the old scripts produced.
import { $$ } from './scroll.js';

const BREAKPOINTS = { mobile: 767, tablet: 1024 };
const settingsOf = el => { try { return JSON.parse(el.dataset.settings || '{}'); } catch { return {}; } };
const deviceMode = () => innerWidth <= BREAKPOINTS.mobile ? 'mobile' : innerWidth <= BREAKPOINTS.tablet ? 'tablet' : 'desktop';

// Elementor's getCurrentDeviceSetting: mobile → tablet → desktop fallback; '' counts as unset.
function deviceSetting(s, key, device = deviceMode()) {
  const chain = { mobile: ['_mobile', '_tablet', ''], tablet: ['_tablet', ''], desktop: [''] }[device];
  for (const suffix of chain) { const v = s[key + suffix]; if (v !== undefined && v !== '' && !(v?.size === '' && !Object.keys(v?.sizes || {}).length)) return v; }
  return undefined;
}

// Elementor's `elementorModules.utils.Scroll.scrollObserver`.
function scrollObserver(callback, offset = '0px') {
  return new IntersectionObserver(entries => callback(entries[0].isIntersecting), { rootMargin: offset, threshold: [0] });
}

function contentHeight(el) {
  const cs = getComputedStyle(el);
  let h = parseFloat(cs.height);
  if (cs.boxSizing === 'border-box') h -= parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom) + parseFloat(cs.borderTopWidth) + parseFloat(cs.borderBottomWidth);
  return h;
}

/* ---------- User-agent class (apple-webkit.min.css targets .e--ua-appleWebkit) ---------- */
function userAgentClasses() {
  const ua = navigator.userAgent;
  const blink = ua.includes('Chrome') && !!window.CSS;
  if (ua.includes('AppleWebKit') && !blink) document.body.classList.add('e--ua-appleWebkit');
}

/* ---------- Sticky (jquery.sticky + Elementor sticky handler) ---------- */
class Sticky {
  constructor(el, opts) {
    this.el = el;
    this.o = { to: 'top', offset: 0, effectsOffset: 0, parent: false, ...opts };
    this.active = false; this.notFollowing = false; this.effects = false;
    el.classList.add('elementor-sticky');
    if (this.o.parent) this.parent = this.o.parent === true ? el.parentElement : el.parentElement.closest(this.o.parent);
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
    this.spacer.classList.add('elementor-sticky__spacer');
    Object.assign(this.spacer.style, { visibility: 'hidden', transition: 'none', animation: 'none' });
    this.el.after(this.spacer);
  }
  stick() {
    this.backup(this.el, '_unsticky', ['position', 'width', 'margin-top', 'margin-bottom', 'top', 'bottom', 'inset-inline-start']);
    const s = this.el.style;
    s.position = 'fixed'; s.width = this.width + 'px'; s.marginTop = '0px'; s.marginBottom = '0px';
    s[this.o.to] = this.o.offset + 'px'; s[this.o.to === 'top' ? 'bottom' : 'top'] = '';
    if (this.left) s.setProperty('inset-inline-start', this.left + 'px');
    this.el.classList.add('elementor-sticky--active', 'elementor-section--handles-inside');
  }
  unstickStyles() { this.restore(this.el, '_unsticky'); this.el.classList.remove('elementor-sticky--active', 'elementor-section--handles-inside'); }
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
    if (this.effects && -t < this.o.effectsOffset) { this.el.classList.remove('elementor-sticky--effects'); this.effects = false; }
    else if (!this.effects && -t >= this.o.effectsOffset) { this.el.classList.add('elementor-sticky--effects'); this.effects = true; }
  }
  onResize() {
    if (!this.active) return;
    this.unstickStyles(); this.spacer.remove();
    this.measureBox(); this.addSpacer(); this.stick();
    if (this.parent) { this.notFollowing = false; this.followParent(); }
  }
}

const isContainer = el => !!el && (el.classList.contains('e-con') || el.classList.contains('e-con-inner'));

function sticky() {
  $$('[data-settings*="sticky"], [data-sticky]').forEach(el => {
    const s = el.dataset.sticky ? JSON.parse(el.dataset.sticky) : settingsOf(el);
    if (!s.sticky || !(s.sticky_on || []).includes(deviceMode())) return;
    const topLevel = isContainer(el) && !isContainer(el.parentElement);
    new Sticky(el, {
      to: s.sticky,
      offset: +deviceSetting(s, 'sticky_offset') || 0,
      effectsOffset: +deviceSetting(s, 'sticky_effects_offset') || 0,
      // Rebuilt markup (data-sticky): the parent is simply the element's parent.
      parent: s.sticky_parent && (el.dataset.sticky || !topLevel) ? (el.dataset.sticky ? true : '.e-con, .e-con-inner, .elementor-widget-wrap') : false,
    });
  });
}

/* ---------- Entrance animations (Elementor GlobalHandler) ---------- */
function entranceAnimations() {
  // Rebuilt markup: data-animate="fadeInUp" data-animate-delay="500", optionally per device
  // (data-animate-tablet / -mobile, same fallback as Elementor). Only data-animate starts hidden.
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
  $$('[data-settings*="animation"]').forEach(el => {
    const s = settingsOf(el);
    const name = deviceSetting(s, 'animation') || deviceSetting(s, '_animation');
    if (!name) return;
    const io = scrollObserver(inView => {
      if (!inView) return;
      io.unobserve(el);
      if (name === 'none') { el.classList.remove('elementor-invisible'); return; }
      el.classList.remove(name);
      setTimeout(() => { el.classList.remove('elementor-invisible'); el.classList.add('animated', name); }, s._animation_delay || s.animation_delay || 0);
    });
    io.observe(el);
  });
}

/* ---------- Motion effects (Elementor Pro motion-fx) ---------- */
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
    let target = el, dims = null;
    const elType = el.dataset.element_type;
    if (el.dataset.parallax !== undefined) {
      dims = el; target = el.firstElementChild; // rebuilt markup: wrapper + moving layer
    } else if (this.type === 'element' && !['section', 'container'].includes(elType)) {
      dims = el;
      target = el.querySelector(':scope > ' + (elType === 'column' ? '.elementor-widget-wrap' : '.elementor-widget-container')) || el;
    }
    this.el = target; this.dimsEl = dims || target; this.parent = target.parentElement;
    this.interactions = this.prepare();
    this.el.classList.add('elementor-motion-effects-element');
    this.parent.classList.add('elementor-motion-effects-parent');
    if (this.type === 'background') {
      this.el.classList.add('elementor-motion-effects-element-type-background');
      this.container = document.createElement('div'); this.container.className = 'elementor-motion-effects-container';
      this.layer = document.createElement('div'); this.layer.className = 'elementor-motion-effects-layer';
      this.container.prepend(this.layer); this.el.prepend(this.container);
      this.sizeLayer();
    }
    this.target = this.type === 'element' ? this.el : this.layer;
    this.defineDimensions();
    this.reset(); this.run();
    addEventListener('resize', () => this.defineDimensions());
    // Elementor's handler re-applies itself on resize (debounced 200ms).
    let t; addEventListener('resize', () => { clearTimeout(t); t = setTimeout(() => { this.interactions = this.prepare(); if (this.type === 'background') { this.sizeLayer(); this.defineDimensions(); } this.reset(); this.run(); }, 200); });
    if (s.motion_fx_motion_fx_scrolling) {
      const c = el.querySelector('.elementor-widget-container') || el;
      c.addEventListener('mouseenter', () => c.style.setProperty('--e-transform-transition-duration', ''));
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
  // Rebuilt markup: data-parallax="<speed>" = Elementor's vertical scrolling effect at that speed.
  $$('[data-parallax]').forEach(el => new MotionFX(el, 'motion_fx', {
    motion_fx_motion_fx_scrolling: 'yes',
    motion_fx_translateY_effect: 'yes',
    motion_fx_translateY_speed: { unit: 'px', size: +el.dataset.parallax, sizes: [] },
    motion_fx_translateY_affectedRange: { unit: '%', size: '', sizes: { start: 0, end: 100 } },
  }));
  // Rebuilt markup may carry the same settings in data-motion (e.g. background scroll effects).
  $$('[data-settings*="motion_fx"], [data-motion]').forEach(el => {
    const s = el.dataset.motion ? JSON.parse(el.dataset.motion) : settingsOf(el), device = deviceMode();
    for (const prefix of ['motion_fx', 'background_motion_fx']) {
      const devices = s[prefix + '_devices'];
      if ((devices && !devices.includes(device)) || !(s[prefix + '_motion_fx_scrolling'] || s[prefix + '_motion_fx_mouse'])) continue;
      const fx = new MotionFX(el, prefix, s);
      if (!Object.keys(fx.interactions).length) fx.reset();
    }
  });
}

/* ---------- Carousels: Elementor loop carousel (Swiper 8) + JetEngine listing slider (was slick) ---------- */
const I18N = {
  prev: 'Vorige slide', next: 'Volgende slide', first: 'Ga naar de eerste slide', last: 'Ga naar de laatste slide',
};

// Elementor's CarouselHandlerBase.getSwiperSettings + SwiperHandler.adjustConfig.
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
  cfg.a11y = { enabled: true, prevSlideMessage: I18N.prev, nextSlideMessage: I18N.next, firstSlideMessage: I18N.first, lastSlideMessage: I18N.last };
  if (s.offset_sides === 'right' || s.offset_sides === 'both') cfg.slidesPerView = show + 0.001;
  // adjustConfig: Elementor keys breakpoints by max-width; Swiper wants min-width.
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
  $$('.jet-listing-grid__slider[data-slider_options]').forEach(wrap => {
    const list = wrap.querySelector(':scope > .jet-listing-grid__items');
    try { if (list) jetSlider(list, JSON.parse(wrap.dataset.slider_options)); } catch { /* bad options */ }
  });
  const loops = $$('.elementor-widget-loop-carousel'), rebuilt = $$('.posts-carousel[data-carousel]');
  if (!loops.length && !rebuilt.length) return;
  const { default: Swiper } = await import('swiper/bundle');

  rebuilt.forEach(w => {
    const s = JSON.parse(w.dataset.carousel), container = w.querySelector('.swiper');
    const slides = $$('.swiper-slide', container);
    if (slides.length < 2) return;
    if (s.offset_sides && s.offset_sides !== 'none') container.classList.add('offset-' + s.offset_sides);
    slides.forEach((sl, i) => sl.setAttribute('aria-label', `${i + 1} van ${slides.length}`));
    new Swiper(container, loopCarouselConfig(s));
  });

  loops.forEach(w => {
    const s = settingsOf(w), container = w.querySelector('.elementor-loop-container');
    if (!container) return;
    const slides = $$('.swiper-slide', container);
    if (slides.length < 2) return;
    const cfg = loopCarouselConfig(s);
    if (s.offset_sides && s.offset_sides !== 'none') container.classList.add('offset-' + s.offset_sides);
    if (s.arrows === 'yes') cfg.navigation = { prevEl: w.querySelector('.elementor-swiper-button-prev'), nextEl: w.querySelector('.elementor-swiper-button-next') };
    slides.forEach((sl, i) => sl.setAttribute('aria-label', `${i + 1} van ${slides.length}`));
    w.closest('.elementor-widget-wrap')?.classList.add('e-swiper-container');
    w.classList.add('e-widget-swiper');
    new Swiper(container, cfg);
  });

}

// JetEngine listing slider. It used slick; this builds the same DOM slick produced (list/track, clones,
// px widths) so the existing CSS applies unchanged. Only what this site uses: no arrows/dots/autoplay.
function jetSlider(list, o) {
  const items = [...list.children], n = items.length;
  let show, slideWidth, current = 0, slides = [], listEl, track, device;

  function slide(el, index, cloned) {
    const s = cloned ? el.cloneNode(true) : el;
    s.classList.add('slick-slide');
    if (cloned) { s.classList.add('slick-cloned'); s.id = ''; s.tabIndex = -1; }
    s.dataset.slickIndex = index;
    return s;
  }
  function build() {
    device = deviceMode();
    show = o.slidesToShow[device] || 1;
    current = 0;
    const loop = o.infinite && n > show;
    listEl = document.createElement('div'); listEl.className = 'slick-list draggable';
    track = document.createElement('div'); track.className = 'slick-track';
    items.forEach(i => i.classList.remove('slick-slide', 'slick-current', 'slick-active'));
    slides = [
      ...(loop ? items.slice(n - show).map((el, i) => slide(el, i - show, true)) : []),
      ...items.map((el, i) => slide(el, i, false)),
      ...(loop ? items.map((el, i) => slide(el, n + i, true)) : []),
    ];
    track.append(...slides); listEl.append(track); list.replaceChildren(listEl);
    list.classList.add('slick-initialized', 'slick-slider');
    track.style.opacity = '1';
    layout();
  }
  const offset = () => (o.infinite && n > show ? show : 0);
  function setPosition(animate) {
    track.style.transition = animate ? `transform ${o.speed}ms ease` : '';
    track.style.transform = `translate3d(${-(slideWidth * (current + offset()))}px, 0px, 0px)`;
    slides.forEach(s => {
      const i = +s.dataset.slickIndex, active = i >= current && i < current + show;
      s.classList.toggle('slick-active', active);
      s.classList.toggle('slick-current', i === current);
      s.setAttribute('aria-hidden', String(!active));
    });
  }
  function layout() {
    slideWidth = Math.ceil(contentWidth(listEl) / show);
    track.style.width = Math.ceil(slideWidth * slides.length) + 'px';
    slides.forEach(s => { s.style.width = slideWidth + 'px'; });
    setPosition(false);
  }
  function goTo(index) {
    current = index;
    setPosition(true);
    setTimeout(() => { if (current < 0 || current >= n) { current = (current + n) % n; setPosition(false); } }, o.speed);
  }

  let startX = null, dx = 0;
  list.addEventListener('pointerdown', e => { if (n > show) { startX = e.clientX; dx = 0; track.style.transition = ''; } });
  addEventListener('pointermove', e => {
    if (startX === null) return;
    dx = e.clientX - startX;
    track.style.transform = `translate3d(${-(slideWidth * (current + offset())) + dx}px, 0px, 0px)`;
  });
  addEventListener('pointerup', () => {
    if (startX === null) return;
    startX = null;
    if (Math.abs(dx) > contentWidth(listEl) / 5) goTo(current + (dx < 0 ? 1 : -1)); else setPosition(true);
  });
  list.addEventListener('click', e => { if (Math.abs(dx) > 5) { e.preventDefault(); e.stopPropagation(); } }, true);
  list.style.touchAction = 'pan-y';
  addEventListener('resize', () => { if (deviceMode() !== device) build(); else layout(); });
  build();
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
  $$('.elementor-share-btn, [data-share]').forEach(btn => {
    const network = btn.dataset.share || [...btn.classList].map(c => c.match(/^elementor-share-btn_(\w+)$/)?.[1]).find(Boolean);
    if (!urls[network]) return;
    const open = () => window.open(urls[network](encodeURIComponent(location.href.split('#')[0])), '', 'width=640,height=480');
    btn.addEventListener('click', open);
    btn.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
  });
}

/* ---------- Lottie (hover trigger only — the only mode this site uses) ---------- */
async function lotties() {
  const widgets = $$('.elementor-widget-lottie, [data-lottie]');
  if (!widgets.length) return;
  const { default: lottie } = await import('lottie-web/build/player/lottie_svg');
  widgets.forEach(w => {
    const s = w.dataset.lottie ? JSON.parse(w.dataset.lottie) : settingsOf(w), container = w.querySelector('.e-lottie__container'), holder = w.querySelector('.e-lottie__animation');
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
      const area = s.hover_area === 'container' ? w.closest('.e-con, .xcard') : container;
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

/* ---------- Forms: POST to the stub endpoint, show Elementor's message markup ---------- */
const FORM_MESSAGES = { success: 'Your submission was successful.', error: 'An error occurred.' };

function forms() {
  $$('form.elementor-form, form[data-form]').forEach(form => {
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const button = form.querySelector('[type="submit"]');
      form.querySelectorAll('.elementor-message').forEach(m => m.remove());
      form.classList.add('elementor-form-waiting');
      if (button) button.disabled = true;
      let ok = false;
      try {
        const res = await fetch('/api/forms', { method: 'POST', body: new FormData(form) });
        ok = res.ok && (await res.json()).success;
      } catch { /* network error → error message */ }
      form.classList.remove('elementor-form-waiting');
      if (button) button.disabled = false;
      const msg = document.createElement('div');
      msg.className = `elementor-message elementor-message-${ok ? 'success' : 'danger'}`;
      msg.setAttribute('role', 'alert');
      msg.textContent = ok ? FORM_MESSAGES.success : FORM_MESSAGES.error;
      if (ok) form.reset();
      form.append(msg);
    });
  });
}

// Elementor initialised its handlers in this order after the theme script.
export function initElementor() {
  userAgentClasses();
  sticky();
  entranceAnimations();
  motionEffects();
  nestedTabs();
  shareButtons();
  forms();
  carousels();
  lotties();
}
