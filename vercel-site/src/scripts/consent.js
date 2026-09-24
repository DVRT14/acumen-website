// Cookie consent + tracker loading. Nothing third-party loads until its category is accepted.
// Keeps CookieYes' cookie name/format so choices made on the old site stay valid.
const COOKIE = 'cookieyes-consent';
const EXPIRY_DAYS = 365;
const CATEGORIES = ['necessary', 'functional', 'analytics', 'performance', 'advertisement'];

const TRACKERS = {
  googleTag: 'GT-57V29WMM',
  gtm: 'GTM-K9LS6TDR',
  linkedinPartnerId: '9276114',
};

function readConsent() {
  const raw = document.cookie.split('; ').find(c => c.startsWith(COOKIE + '='));
  if (!raw) return null;
  const map = Object.fromEntries(decodeURIComponent(raw.slice(COOKIE.length + 1)).split(',').map(p => p.split(':')));
  return map.action === 'yes' ? map : null;
}

function writeConsent(choices) {
  const id = readConsent()?.consentid || crypto.randomUUID().replace(/-/g, '');
  const parts = [`consentid:${id}`, 'consent:yes', 'action:yes', ...CATEGORIES.map(c => `${c}:${c === 'necessary' || choices[c] ? 'yes' : 'no'}`)];
  const secure = location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${COOKIE}=${encodeURIComponent(parts.join(','))}; max-age=${EXPIRY_DAYS * 86400}; path=/; SameSite=Lax${secure}`;
}

const granted = (consent, c) => consent?.[c] === 'yes';

function loadScript(src) {
  const s = document.createElement('script');
  s.async = true; s.src = src;
  document.head.append(s);
}

let loaded = {};
function applyConsent(consent) {
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag() { dataLayer.push(arguments); };
  const g = v => (v ? 'granted' : 'denied');
  const state = {
    analytics_storage: g(granted(consent, 'analytics')),
    ad_storage: g(granted(consent, 'advertisement')),
    ad_user_data: g(granted(consent, 'advertisement')),
    ad_personalization: g(granted(consent, 'advertisement')),
    functionality_storage: g(granted(consent, 'functional')),
    personalization_storage: g(granted(consent, 'functional')),
    security_storage: 'granted',
  };
  if (!loaded.consentDefault) { gtag('consent', 'default', { ...state, wait_for_update: 500 }); loaded.consentDefault = true; }
  else gtag('consent', 'update', state);

  if (granted(consent, 'analytics') && !loaded.google) {
    loaded.google = true;
    gtag('set', 'linker', { domains: ['acumen.be'] });
    gtag('js', new Date());
    gtag('set', 'developer_id.dZTNiMT', true);
    gtag('config', TRACKERS.googleTag, { googlesitekit_post_type: 'page' });
    loadScript(`https://www.googletagmanager.com/gtag/js?id=${TRACKERS.googleTag}`);
    dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
    loadScript(`https://www.googletagmanager.com/gtm.js?id=${TRACKERS.gtm}`);
  }
  if (granted(consent, 'advertisement') && !loaded.linkedin) {
    loaded.linkedin = true;
    window._linkedin_partner_id = TRACKERS.linkedinPartnerId;
    window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
    window._linkedin_data_partner_ids.push(TRACKERS.linkedinPartnerId);
    window.lintrk = window.lintrk || Object.assign((a, b) => window.lintrk.q.push([a, b]), { q: [] });
    loadScript('https://snap.licdn.com/li.lms-analytics/insight.min.js');
  }
}

export function initConsent() {
  const q = sel => document.querySelector(sel);
  const banner = q('.cky-consent-container'), modal = q('.cky-modal'), overlay = q('.cky-overlay'), revisit = q('.cky-btn-revisit-wrapper');
  if (!banner || !modal) return;
  let consent = readConsent();
  let lastFocus = null;

  const syncSwitches = () => document.querySelectorAll('[data-consent-category]').forEach(i => { i.checked = granted(consent, i.dataset.consentCategory); });
  const showBanner = on => banner.classList.toggle('cky-hide', !on);
  const showRevisit = on => revisit?.classList.toggle('cky-revisit-hide', !on);

  function openModal() {
    lastFocus = document.activeElement;
    syncSwitches();
    showBanner(false);
    overlay?.classList.remove('cky-hide');
    modal.classList.add('cky-modal-open');
    modal.focus();
  }
  function closeModal() {
    modal.classList.remove('cky-modal-open');
    overlay?.classList.add('cky-hide');
    if (!consent) showBanner(true);
    lastFocus?.focus?.();
  }

  function save(choices) {
    const previous = consent;
    writeConsent(choices);
    consent = readConsent();
    modal.classList.remove('cky-modal-open');
    overlay?.classList.add('cky-hide');
    showBanner(false);
    showRevisit(true);
    // Scripts can't be unloaded: if something was withdrawn, reload so it stops running.
    if (CATEGORIES.some(c => granted(previous, c) && !granted(consent, c))) { location.reload(); return; }
    applyConsent(consent);
    document.dispatchEvent(new CustomEvent('consent:update', { detail: consent }));
  }
  const all = value => Object.fromEntries(CATEGORIES.map(c => [c, value]));
  const fromSwitches = () => Object.fromEntries([...document.querySelectorAll('[data-consent-category]')].map(i => [i.dataset.consentCategory, i.checked]));

  const on = (sel, fn) => document.querySelectorAll(sel).forEach(el => el.addEventListener('click', e => { e.preventDefault(); fn(); }));
  on('.cky-btn-accept', () => save(all(true)));
  on('.cky-btn-reject, .cky-banner-btn-close', () => save(all(false)));
  on('.cky-btn-preferences', () => save(fromSwitches()));
  on('.cky-btn-customize, .cky-btn-revisit', openModal);
  on('.cky-btn-close', closeModal);
  on('.cky-overlay', closeModal);

  modal.addEventListener('click', e => {
    const header = e.target.closest('.cky-accordion-btn, .cky-accordion-chevron');
    if (header) {
      const acc = header.closest('.cky-accordion');
      const open = acc.classList.toggle('cky-accordion-active');
      acc.querySelector('.cky-accordion-btn')?.setAttribute('aria-expanded', String(open));
      return;
    }
    const more = e.target.closest('.cky-show-desc-btn');
    if (more) {
      const wrap = modal.querySelector('.cky-preference-content-wrapper'), tpl = document.getElementById('consent-full-description');
      [wrap.innerHTML, tpl.innerHTML] = [tpl.innerHTML, wrap.innerHTML];
      wrap.querySelector('.cky-show-desc-btn')?.focus();
    }
  });
  modal.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeModal(); return; }
    if (e.key !== 'Tab') return;
    const focusable = [...modal.querySelectorAll('button, input, a[href]')].filter(el => el.offsetParent !== null);
    const first = focusable[0], last = focusable.at(-1);
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  if (consent) { showRevisit(true); applyConsent(consent); }
  else { showBanner(true); applyConsent(null); }
}
