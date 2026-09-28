// Site runtime: replaces jQuery, Elementor (+Pro), JetEngine, CookieYes and the old theme bundle.
import { initConsent } from './consent.js';
import { initAnimations } from './animations.js';
import { initElementor } from './elementor.js';
import { ScrollTrigger } from './scroll.js';

initConsent();
// Measurements (header height, marquee widths, slider sizes) depend on the web fonts; the old
// scripts ran late enough that fonts were in. Wait for them explicitly.
document.fonts.ready.then(() => {
  // Old order: theme animations were registered first, then Elementor's handlers ran.
  initAnimations();
  initElementor();
  // The handlers above change the layout (sliders collapse to one row, ...). The old scripts ran
  // before window load, so ScrollTrigger's load refresh picked that up; we may run after it.
  ScrollTrigger.refresh();
});
