// Site runtime: replaces jQuery, Elementor (+Pro), JetEngine, CookieYes and the old theme bundle.
import { initConsent } from './consent.js';
import { initAnimations } from './animations.js';
import { initElementor } from './elementor.js';

initConsent();
// Measurements (header height, marquee widths, slider sizes) depend on the web fonts; the old
// scripts ran late enough that fonts were in. Wait for them explicitly.
document.fonts.ready.then(() => {
  // Old order: theme animations were registered first, then Elementor's handlers ran.
  initAnimations();
  initElementor();
});
