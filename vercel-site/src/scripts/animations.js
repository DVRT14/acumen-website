// Site animations, ported from the old theme bundle (hello-theme-child-master/main.min.js).
// Same selectors and GSAP parameters; jQuery replaced by DOM APIs. Deliberate fixes are marked "fix:".
import scrollLock from 'scroll-lock';
import { gsap, ScrollTrigger, loadScrollTrigger, lenis, reduceMotion, outerHeight, innerWidth, offsetTop, $$ } from './scroll.js';

// Every element a ScrollTrigger below hangs off; pages without any skip downloading ScrollTrigger.
const SCROLL_TRIGGER_HOOKS = '.greenSection, .expand-section, .howWeHelpYouSectionAnimation__text, .playInView video, '
  + '.playInViewSingle video, .playInViewRepeat video, .textLeftOnScroll, .textLeftOnScrollFlex, .home-scroll_section, .typingReveal';
let SplitType;
// Page-specific libraries, loaded before initAnimations() runs so ScrollTriggers are still created in
// order (the pinned section before later triggers measure).
export function loadAnimationDeps() {
  return Promise.all([
    document.querySelector(SCROLL_TRIGGER_HOOKS) && loadScrollTrigger(),
    document.querySelector('.expand-section') && import('split-type').then(m => { SplitType = m.default; }),
  ]);
}

const $ = sel => document.querySelector(sel);
const toggle = (els, cls, force) => els.forEach(el => el.classList.toggle(cls, force));

function setDefaultsForVideos() {
  // fix: no longer logs every video to the console.
  $$('video').forEach(v => v.setAttribute('playsinline', ''));
}

function headerNav() {
  let headerDarkVisible = true;
  const light = () => $$('.headerLight'), dark = () => $$('.headerDark');
  function setGreen(on) {
    toggle(light(), 'show', !on);
    toggle(dark(), 'hide', !on);
    headerDarkVisible = on;
  }
  const masthead = $('.masthead');
  if (masthead) {
    // Reserve the bars' natural (unscrolled) height, like the old sticky header spacer did.
    const bars = $$('.header-bar', masthead);
    const reserve = () => {
      const scrolled = masthead.classList.contains('is-scrolled');
      masthead.classList.remove('is-scrolled');
      masthead.style.height = Math.max(...bars.map(b => {
        const { display, transition } = b.style;
        b.style.display = 'flex'; b.style.transition = 'none';
        const h = b.getBoundingClientRect().height;
        b.style.display = display; b.style.transition = transition;
        return h;
      })) + 'px';
      masthead.classList.toggle('is-scrolled', scrolled);
      document.documentElement.classList.toggle('is-scrollable', document.documentElement.scrollHeight > innerHeight);
    };
    reserve();
    addEventListener('resize', reserve);
    addEventListener('load', reserve);
    // Tighter bar once scrolled (the old sticky header's "effects offset" of 100px).
    const onScroll = () => masthead.classList.toggle('is-scrolled', scrollY >= 100);
    addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  const green = $('.greenSection');
  if (green) ScrollTrigger.create({
    trigger: green, start: '-300px top', end: 'bottom top',
    onEnter: () => setGreen(true), onLeave: () => setGreen(false),
    onEnterBack: () => setGreen(true), onLeaveBack: () => setGreen(false),
  });

  const menuTl = gsap.timeline({ paused: true });
  menuTl.fromTo('.dropMenu .imagesParent', { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 0.7, ease: 'power2.out' });
  menuTl.fromTo($$('.headerMenu .menu-item'), { opacity: 0, x: -50 }, { opacity: 1, x: 0, stagger: 0.2, duration: 1, ease: 'power2.out' }, '<');
  menuTl.fromTo($$('.headerSocial li'), { opacity: 0, y: 50 }, { opacity: 1, y: 0, stagger: 0.2, duration: 1, ease: 'power2.out' }, '<');

  let openTimer, closeTimer, opener;
  const dropMenu = () => $('.dropMenu');
  const isOpen = () => dropMenu()?.classList.contains('show');

  function toggleState() {
    const body = document.body;
    if (body.getAttribute('data-lenis-prevent') === 'true') { body.removeAttribute('data-lenis-prevent'); lenis.start(); }
    else { body.setAttribute('data-lenis-prevent', 'true'); lenis.stop(); }
    scrollLock.getScrollState() ? scrollLock.disablePageScroll() : scrollLock.enablePageScroll();
    if (headerDarkVisible) {
      toggle(light(), 'show');
      if (isOpen()) setTimeout(() => toggle(dark(), 'hide'), 300);
      else toggle(dark(), 'hide');
    }
    toggle($$('.menuBtn'), 'active');
    toggle($$('.dropMenu'), 'show');
    toggle([document.body, document.documentElement], 'dropMenuActive');
    // Closed menu (moved off-screen) stays out of the tab order; focus inside it returns to the opener.
    const open = isOpen(), menu = dropMenu();
    if (open) opener = document.activeElement;
    else if (menu.contains(document.activeElement)) opener?.focus({ preventScroll: true });
    menu.inert = !open;
    $$('[aria-controls="drop-menu"]').forEach(b => b.setAttribute('aria-expanded', String(open)));
  }

  function toggleMenu() {
    clearTimeout(openTimer); clearTimeout(closeTimer);
    if (isOpen()) {
      menuTl.timeScale(3).reverse();
      closeTimer = setTimeout(toggleState, 500);
    } else {
      toggleState();
      // fix: reset the speed; the old code left it at 3× after the first close.
      openTimer = setTimeout(() => menuTl.timeScale(1).play(), 300);
    }
  }

  // Menu hover swaps the preview image; the current page's image is the default.
  const defaults = { 'page-id-7': 0, 'page-id-135': 1, 'page-id-151': 2, 'page-id-143': 3 };
  const defaultIndex = document.body.className.split(/\s+/).map(c => defaults[c]).find(v => v !== undefined) ?? 0;
  const images = () => $$('.imagesParent .imageContainer');
  const showImage = i => { const img = images()[i]; if (img) { images().forEach(x => x.classList.remove('show')); img.classList.add('show'); } };
  const resetImage = () => { images().forEach(x => x.classList.remove('show')); images()[defaultIndex]?.classList.add('show'); };
  resetImage();

  $$('.menuBtn, .closeBtn').forEach(b => b.addEventListener('click', e => { e.preventDefault(); toggleMenu(); }));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && isOpen()) toggleMenu(); });
  document.addEventListener('click', e => {
    if (isOpen() && !e.target.closest('.dropMenu') && !e.target.closest('.menuBtn')) toggleMenu();
  });
  $$('.headerMenu li').forEach(li => {
    li.addEventListener('mouseenter', () => showImage([...li.parentElement.children].indexOf(li) + 1));
    li.addEventListener('mouseleave', resetImage);
  });
}

// Runs before the fonts are in (site.js): it measures nothing. The photo (heroAnim4, the LCP element)
// is already painted, 100px low (base.css); the timeline only slides it up.
export function homeLoadingHeroAnimation() {
  const [a1, a2, a3, a4] = [1, 2, 3, 4].map(n => $$('.heroAnim' + n));
  const tl = gsap.timeline();
  if (a1.length) {
    gsap.set(a1, { autoAlpha: 1 });
    tl.fromTo(a1, { clipPath: 'polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)' },
      { clipPath: 'polygon(100% 0%, 0% 0%, 0% 100%, 100% 100%)', duration: 1, delay: 0.3, ease: 'none' });
  }
  if (a2.length) tl.fromTo(a2, { y: 100 }, { autoAlpha: 1, y: 0, duration: 1 }, '-=0.5');
  if (a4.length) tl.fromTo(a4, { y: 100 }, { autoAlpha: 1, y: 0, duration: 1 }, '<');
  if (a3.length) tl.fromTo(a3, { y: 100 }, { autoAlpha: 1, y: 0, duration: 1 }, '-=.3');
}

async function wordSwapTypingAnimation() {
  const containers = $$('.typedContainer');
  if (!containers.length) return;
  // Reduced motion: show the first word instead of the looping typewriter.
  if (reduceMotion) return containers.forEach(c => { c.querySelector('.typed').textContent = c.querySelector('.typed-strings p')?.textContent.trim() ?? ''; });
  const { default: Typed } = await import('typed.js');
  containers.forEach(c => {
    // One pass through the words, then back to the first one and stop (typed.js stops on the last string).
    const strings = $$('.typed-strings p', c).map(p => p.innerHTML.trim());
    setTimeout(() => new Typed(c.querySelector('.typed'), {
      strings: [...strings, strings[0]],
      typeSpeed: 50, backSpeed: 50, loop: false, showCursor: false, backDelay: 1500,
    }), c.classList.contains('delay') ? 800 : 0);
  });
}

function expandSection() {
  const frame = $('.expand-section'), parent = $('.parent');
  if (!frame || !parent) return;
  // Reduced motion: the frame at its end state and the statement fully lit; no split, pin or zoom.
  if (reduceMotion) return gsap.set(frame, { width: '100%' });
  const bg = $$('.expand-section .bgImage');
  const scaleAttr = bg[0]?.getAttribute('data-scale');
  const scale = scaleAttr && !isNaN(scaleAttr) ? parseFloat(scaleAttr) : 1.2;
  const durAttr = bg[0]?.getAttribute('data-duration');
  const duration = durAttr && !isNaN(durAttr) ? parseInt(durAttr, 10) : 30;
  const titles = $$('.textAnim');
  // Letters are spans: assistive tech reads the sentence once, from a hidden copy.
  const splits = titles.map(t => {
    const text = t.textContent.trim().replace(/\s+/g, ' ');
    const { words, chars } = new SplitType(t, { types: 'words, chars' });
    words.forEach(w => w.setAttribute('aria-hidden', 'true'));
    const copy = document.createElement('span');
    copy.className = 'visually-hidden';
    copy.textContent = text;
    t.append(copy);
    return { t, chars };
  });
  // Reverted and rebuilt when the viewport crosses the mobile breakpoint.
  gsap.matchMedia().add({ mobile: '(max-width: 767px)', desktop: '(min-width: 768px)' }, ({ conditions: { mobile } }) => {
    // The statement keeps its full-width line length while the frame widens, so it never re-wraps (layout shift).
    const lock = () => titles.forEach(t => {
      const cs = getComputedStyle(t.parentElement);
      Object.assign(t.style, { maxWidth: 'none', width: parent.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight) + 'px' });
    });
    lock();
    ScrollTrigger.addEventListener('refreshInit', lock);
    gsap.to(frame, { width: '100%', scrollTrigger: { trigger: frame, start: 'top 70%', end: 'top 5%', scrub: true } });
    // Desktop pins for half a viewport while the letters light up; mobile lights them up in passing.
    splits.forEach(({ t, chars }) => gsap.from(chars, {
      scrollTrigger: mobile
        ? { trigger: t, start: 'top 85%', end: 'bottom 45%', scrub: 1.2 }
        : { trigger: parent, start: 'top top', end: '+=50%', scrub: 1.2, pin: true, pinSpacing: true, anticipatePin: 1 },
      opacity: 0.2, stagger: 0.5, ease: 'power2.inOut',
    }));
    return () => ScrollTrigger.removeEventListener('refreshInit', lock);
  });
  // Slow zoom once the photo reaches the top (was restarted, and stacked, on every re-entry).
  gsap.to(bg, { ease: 'none', scale, duration, yoyo: true, repeat: -1, scrollTrigger: { trigger: parent, start: 'top top' } });
}

function sectionDataGroup() {
  const img = $$('.sectionDataGroup .sectionDataGroup__bgImg');
  if (img.length) gsap.to(img, { ease: 'none', scale: 1.5, duration: 20, yoyo: true, repeat: -1 });
}

function sectionRevealOnHover() {
  if (!matchMedia('(min-width: 768px)').matches) return;
  $$('.revealOnHoverSection').forEach(section => {
    const texts = $$('.revealOnHoverSection__text', section), imgs = $$('.revealOnHoverSection__img', section);
    texts.forEach((text, i) => {
      const activate = () => {
        texts.forEach(t => t.classList.remove('active'));
        imgs.forEach(im => im.classList.remove('show'));
        text.classList.add('active');
        imgs[i]?.classList.add('show');
      };
      text.addEventListener('mouseenter', activate);
      text.addEventListener('mouseleave', activate);
    });
  });
}

function howWeHelpYouSectionAnimation() {
  $$('.howWeHelpYouSectionAnimation .howWeHelpYouSectionAnimation__text').forEach(t => {
    gsap.to(t, { opacity: 1, duration: 1, ease: 'power1.inOut', scrollTrigger: { trigger: t, start: 'top 90%', end: 'top 50%', scrub: true } });
  });
}

function videoPlayInView() {
  $$('.playInView video').forEach(v => {
    v.setAttribute('playsinline', '');
    const play = () => { if (!v.playing) { v.play(); v.playing = true; } };
    ScrollTrigger.create({ trigger: v, start: 'top 90%', end: 'top 0%', fastScrollEnd: 2500,
      onEnter: play, onLeave: () => v.pause(), onEnterBack: play, onLeaveBack: () => v.pause() });
    v.addEventListener('ended', () => { v.playing = false; });
  });
}

function videoPlayInViewSingle() {
  $$('.playInViewSingle video').forEach(v => {
    v.setAttribute('playsinline', '');
    ScrollTrigger.create({ trigger: v, start: 'top 90%', end: 'top 0%', fastScrollEnd: 2500,
      onEnter: () => { if (!v.playing) { v.play(); v.playing = true; } } });
  });
}

function videoPlayInViewRepeat() {
  $$('.playInViewRepeat video').forEach(v => {
    const play = () => { v.play(); v.playing = true; }, pause = () => { v.pause(); v.playing = false; };
    ScrollTrigger.create({ trigger: v, start: 'top 50%', end: 'bottom 50%', onEnter: play, onLeave: pause, onEnterBack: play, onLeaveBack: pause });
    v.addEventListener('ended', () => { v.playing = false; });
  });
}

function scrollingText() {
  if (reduceMotion) return;
  $$('.scrollingText').forEach(el => {
    const w = innerWidth(el);
    gsap.to(el, { x: -w, duration: w / 50, ease: 'none', repeat: -1,
      onStart: () => gsap.set(el, { x: document.documentElement.clientWidth }) });
  });
}

function marqueeFunction() {
  if (reduceMotion) return;
  $$('[wb-data="marquee"]').forEach(el => {
    const duration = parseInt(el.getAttribute('duration'), 10) || 5;
    const direction = el.getAttribute('direction') || 'left';
    const first = el.firstElementChild;
    if (!first) return;
    // The copy only fills the loop: hidden from assistive tech so logos/words are not announced twice.
    const copy = first.cloneNode(true);
    copy.setAttribute('aria-hidden', 'true');
    el.append(copy);
    let tween;
    const build = () => {
      const progress = tween ? tween.progress() : 0;
      tween && tween.progress(0).kill();
      const cs = getComputedStyle(first);
      const w = parseInt(cs.width, 10), gap = parseInt(cs.columnGap, 10);
      const dist = direction === 'right' ? w + gap : -1 * (gap + w);
      tween = gsap.fromTo([...el.children], { x: direction === 'right' ? -dist : 0 }, { x: direction === 'right' ? 0 : dist, duration, ease: 'none' });
      tween.progress(progress);
      tween.eventCallback('onComplete', () => tween.restart());
    };
    build();
    let t;
    addEventListener('resize', () => { clearTimeout(t); t = setTimeout(build, 500); });
  });
}

function postItemHover() {
  if (!$('.postItem, .xcard')) return;
  const layout = () => $$('.postItem, .xcard').forEach(item => {
    const contents = item.querySelector('.postItem__contents, .xcard__contents'), title = item.querySelector('.postItem__title, .xcard__title');
    if (!contents || !title) return;
    const cs = getComputedStyle(contents);
    const y = outerHeight(contents) - (outerHeight(title) + (parseInt(cs.paddingTop) + parseInt(cs.paddingBottom)));
    contents.style.transform = `translateY(${y}px)`;
  });
  // fix: the old code re-measured once after 500ms; carousels that size their slides later (Swiper is
  // loaded on demand) left the reveal offset wrong. Re-measure whenever a card changes size.
  const ro = new ResizeObserver(layout);
  $$('.postItem, .xcard').forEach(item => ro.observe(item));
}

function animateElements() {
  const tl = gsap.timeline();
  const fields = $$('.form-field'), fromBottom = $$('.animateFromBottom');
  if (fields.length) tl.to(fields, { opacity: 1, y: 0, stagger: 0.2, duration: 1, ease: 'power2.out' }, 'start');
  if (fromBottom.length) tl.to(fromBottom, { opacity: 1, y: 0, stagger: 0.2, duration: 1, ease: 'power2.out' }, 'start');
}

// fix: on resize the old code killed *every* ScrollTrigger on the page; now each rebuilds only its own.
function rebuildOnResize(build) {
  let tweens = build(), t;
  addEventListener('resize', () => {
    clearTimeout(t);
    t = setTimeout(() => { tweens.forEach(tw => { tw.scrollTrigger?.kill(); tw.kill(); }); tweens = build(); }, 150);
  });
}

function textLeftOnScroll() {
  const els = $$('.textLeftOnScroll');
  if (els.length) rebuildOnResize(() => els.map(el => gsap.fromTo(el, { x: 0 }, {
    x: -el.offsetWidth,
    scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true, toggleActions: 'play reverse play reverse' },
  })));
}

function textLeftOnScrollFlexible() {
  const els = $$('.textLeftOnScrollFlex');
  if (els.length) rebuildOnResize(() => els.map(el => gsap.fromTo(el, { x: 0 }, {
    xPercent: parseInt(el.getAttribute('data-xPercent'), 10) || -100,
    scrollTrigger: {
      trigger: el,
      start: el.getAttribute('data-start') || 'top bottom',
      end: el.getAttribute('data-end') || 'top top',
      scrub: parseInt(el.getAttribute('data-smooth'), 10) || 3,
    },
  })));
}

function benefitsSectionAnimation3() {
  $$('.home-scroll_section').forEach(section => {
    const texts = $$('.home-scroll_text-item', section), imgs = $$('.home-scroll_img-item', section);
    texts.forEach((text, i) => ScrollTrigger.create({
      trigger: text, start: 'center 80%', end: 'bottom center',
      onToggle: self => {
        if (!self.isActive) return;
        texts.forEach(t => t.classList.remove('is-active'));
        imgs.forEach(im => im.classList.remove('is-active'));
        text.classList.add('is-active');
        imgs[i]?.classList.add('is-active');
        const video = imgs[i]?.querySelector('video');
        // fix: the old code set playsinline before checking the video exists.
        // Skip the video column when it is hidden (mobile shows images instead).
        if (video && video.offsetParent && !video.dataset.played) { video.setAttribute('playsinline', ''); video.play(); video.dataset.played = 'true'; }
      },
    }));
  });
}

function goToSectionOnPageLoad() {
  const hash = location.hash;
  let target = null;
  try { target = hash ? document.getElementById(decodeURIComponent(hash.slice(1))) : document.getElementById('start'); } catch { /* malformed hash */ }
  if (!target) return;
  const header = $('.headerLight') || $('.headerDark');
  const offset = header ? outerHeight(header) : 0;
  // jQuery animate(…, 'slow') = 600ms with 'swing' easing.
  lenis.scrollTo(offsetTop(target) - offset, { duration: 0.6, easing: p => 0.5 - Math.cos(p * Math.PI) / 2, force: true });
}

function typingRevealEffectOnScroll() {
  const tl = gsap.timeline();
  $$('.typingReveal').forEach(el => ScrollTrigger.create({
    trigger: el, start: 'top 80%', once: true,
    onEnter: () => tl.fromTo(el, { clipPath: 'polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)' },
      { autoAlpha: 1, clipPath: 'polygon(100% 0%, 0% 0%, 0% 100%, 100% 100%)', duration: 1.5, ease: 'none' }),
  }));
}

// Same order as the old bundle: ScrollTrigger creation order matters for pinning.
export function initAnimations() {
  setDefaultsForVideos();
  headerNav();
  wordSwapTypingAnimation();
  expandSection();
  sectionDataGroup();
  sectionRevealOnHover();
  howWeHelpYouSectionAnimation();
  videoPlayInView();
  videoPlayInViewSingle();
  videoPlayInViewRepeat();
  scrollingText();
  marqueeFunction();
  postItemHover();
  animateElements();
  textLeftOnScroll();
  goToSectionOnPageLoad();
  benefitsSectionAnimation3();
  textLeftOnScrollFlexible();
  typingRevealEffectOnScroll();
}
