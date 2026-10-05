// One GSAP + ScrollTrigger + Lenis instance for the whole site.
// GSAP and Lenis are global (smooth scrolling and the header menu run on every page); ScrollTrigger
// is only downloaded by pages that have scroll-driven sections (loadScrollTrigger, called by site.js).
import { gsap } from 'gsap';
import Lenis from 'lenis';

export let ScrollTrigger;
export async function loadScrollTrigger() {
  ({ ScrollTrigger } = await import('gsap/ScrollTrigger'));
  gsap.registerPlugin(ScrollTrigger);
  lenis.on('scroll', ScrollTrigger.update);
}

export const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
// Reduced motion: native wheel scrolling (Lenis keeps driving ScrollTrigger and scroll locking).
export const lenis = new Lenis({ smoothWheel: !reduceMotion });
gsap.ticker.add(time => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);

export { gsap };

// jQuery-equivalent measurements (fractional, from computed style) so ported maths stays identical.
export function outerHeight(el) {
  const cs = getComputedStyle(el);
  let h = parseFloat(cs.height);
  if (Number.isNaN(h)) return el.offsetHeight;
  if (cs.boxSizing !== 'border-box') {
    h += parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom) + parseFloat(cs.borderTopWidth) + parseFloat(cs.borderBottomWidth);
  }
  return h;
}

export function innerWidth(el) {
  const cs = getComputedStyle(el);
  let w = parseFloat(cs.width);
  if (Number.isNaN(w)) return el.clientWidth;
  if (cs.boxSizing === 'border-box') {
    w -= parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight) + parseFloat(cs.borderLeftWidth) + parseFloat(cs.borderRightWidth);
  }
  return w;
}

export const offsetTop = el => el.getBoundingClientRect().top + scrollY;
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
