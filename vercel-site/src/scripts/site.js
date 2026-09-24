// Site runtime: replaces jQuery, Elementor (+Pro), JetEngine, CookieYes and the old theme bundle.
import { initConsent } from './consent.js';
import { initAnimations } from './animations.js';
import { initElementor } from './elementor.js';

initConsent();
// Old order: theme animations were registered first, then Elementor's handlers ran.
initAnimations();
initElementor();
