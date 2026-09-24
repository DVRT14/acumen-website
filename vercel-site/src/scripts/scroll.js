// One GSAP + ScrollTrigger + Lenis instance for the whole site.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

export const lenis = new Lenis();
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add(time => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);

export { gsap, ScrollTrigger };

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
