// Site runtime: replaces the old site's jQuery, page-builder and plugin scripts, CookieYes and theme bundle.
import { initConsent } from './consent.js';
import { initAnimations } from './animations.js';
import { initWidgets } from './widgets.js';
import { ScrollTrigger } from './scroll.js';

initConsent();
// Measurements (header height, marquee widths, slider sizes) depend on the web fonts; the old
// scripts ran late enough that fonts were in. Wait for them explicitly.
document.fonts.ready.then(() => {
  // Old order: theme animations were registered first, then the widget handlers ran.
  initAnimations();
  initWidgets();
  // The handlers above change the layout (sliders collapse to one row, ...). The old scripts ran
  // before window load, so ScrollTrigger's load refresh picked that up; we may run after it.
  ScrollTrigger.refresh();
});
