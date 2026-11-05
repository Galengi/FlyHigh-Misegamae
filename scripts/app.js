'use strict';

const config = window.PORTFOLIO_CONFIG || { studio: {}, apps: [] };
const studio = config.studio || {};
const apps = Array.isArray(config.apps) ? config.apps.filter(a => a && /^[a-z0-9-]+$/.test(a.id)) : [];
const appMap = new Map(apps.map(a => [a.id, a]));
const windowsHost = document.getElementById('windows');
const toastEl = document.getElementById('toast');
const windowsState = new Map();
let highestZ = 25;
let currentMenu = null;
let toastTimer = null;
const THEME_MESSAGE_TYPE = 'flyhigh:theme-change';
const THEME_REQUEST_TYPE = 'flyhigh:theme-request';
const LANGUAGE_MESSAGE_TYPE = 'flyhigh:language-change';
const LANGUAGE_REQUEST_TYPE = 'flyhigh:language-request';
const LANGUAGE_STATE_TYPE = 'flyhigh:language-state';
const CLOSE_REQUEST_TYPE = 'flyhigh:app-close-request';
const CLOSE_CONFIRMED_TYPE = 'flyhigh:app-close-confirmed';
const CLOSE_CANCELLED_TYPE = 'flyhigh:app-close-cancelled';
const THEME_VERSION = 1;
const BRIDGE_VERSION = 1;
const pendingCloseRequests = new Map();
const partyLayoutObservers = new WeakMap();
let closeRequestSequence = 0;
let globalLanguage = 'es-ES';
const t = (key, ...args) => window.FlyHighI18n.t(globalLanguage, key, ...args);

// All catalog text is escaped before being inserted into HTML.
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeURL = value => {
  if (typeof value !== 'string') return '';
  const s = value.trim();
  if (/^https:\/\/[^\s]+$/i.test(s) || /^\.\/assets\/[\w\-./]+$/i.test(s)) return s;
  return '';
};
const safeAppPath = value => {
  if (typeof value !== 'string') return '';
  const s = value.trim();
  return /^\.\/apps\/[a-z0-9-]+\/$/i.test(s) || /^\.\/apps\/[a-z0-9-]+\/\?from=flyhigh$/i.test(s) ? s : '';
};
const safePartyPath = value => typeof value === 'string' && /^\.\/apps\/party\/$/i.test(value.trim()) ? value.trim() : '';
const heartSvg = `<svg viewBox="0 0 84 84" aria-hidden="true"><defs><linearGradient id="pasfhHeart" x1="0" x2="1" y1="0" y2="1"><stop stop-color="#ff7774"/><stop offset="1" stop-color="#d73455"/></linearGradient></defs><rect x="2" y="2" width="80" height="80" rx="20" fill="url(#pasfhHeart)"/><path d="M42 65 20.3 44.6C8.9 33.8 17.4 19 29.6 21.6c5.2 1.1 9 4.5 12.4 9 3.4-4.5 7.2-7.9 12.4-9C66.6 19 75.1 33.8 63.7 44.6L42 65Z" fill="#fff"/><path d="M42 34.5v16M34 42.5h16" stroke="#e64561" stroke-width="5" stroke-linecap="round"/></svg>`;
const aboutSvg = `<svg viewBox="0 0 84 84" aria-hidden="true"><rect x="2" y="2" width="80" height="80" rx="20" fill="#705fcc"/><circle cx="42" cy="42" r="22" fill="none" stroke="white" stroke-width="4"/><path d="M42 38v17" stroke="white" stroke-width="5" stroke-linecap="round"/><circle cx="42" cy="29" r="3.2" fill="white"/></svg>`;
const futureSvg = `<svg viewBox="0 0 84 84" aria-hidden="true"><rect x="2" y="2" width="80" height="80" rx="20" fill="#159fa2"/><path d="M24 34h36M29 34l4 27h18l4-27M34 24l8 10 8-10" fill="none" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M42 43v11M37 48h10" stroke="white" stroke-width="3" stroke-linecap="round"/></svg>`;

function appIcon(app) {
  const image = safeURL(app.icon?.image);
  if (image) return `<img src="${esc(image)}" alt="" loading="lazy"/>`;
  if (app.icon?.type === 'heart') return heartSvg;
  const allowedColors = ['coral','blue','mint','violet','amber','slate'];
  const color = allowedColors.includes(app.icon?.color) ? app.icon.color : 'blue';
  return `<span class="emoji-icon emoji-${color}" aria-hidden="true">${esc(app.icon?.type || '✨')}</span>`;
}

function renderLaunchers() {
  const shortcuts = apps.map(app => `<button type="button" class="shortcut" data-open="${esc(app.id)}" aria-label="${esc(t('open'))} ${esc(app.name)}"><span class="app-icon" aria-hidden="true">${appIcon(app)}</span><span class="shortcut-label">${esc(app.name)}</span>${app.status === 'published' ? '' : `<span class="shortcut-status">${esc(t('development'))}</span>`}</button>`);
  shortcuts.push(`<button type="button" class="shortcut" data-open="acerca" aria-label="${esc(t('open'))} ${esc(t('aboutTitle'))}"><span class="app-icon">${aboutSvg}</span><span class="shortcut-label">${esc(t('aboutTitle'))}</span></button>`);
  shortcuts.push(`<button type="button" class="shortcut" data-open="proximamente" aria-label="${esc(t('open'))} ${esc(t('futureTitle'))}"><span class="app-icon">${futureSvg}</span><span class="shortcut-label">${esc(t('futureTitle'))}</span></button>`);
  document.getElementById('desktop-icons').innerHTML = shortcuts.join('');

  const dockIcons = apps.map(app => `<button type="button" class="dock-item" data-open="${esc(app.id)}" aria-label="${esc(t('open'))} ${esc(app.name)}" title="${esc(app.name)}"><span class="dock-img dock-generic">${appIcon(app)}</span><i class="dock-dot" aria-hidden="true"></i></button>`);
  dockIcons.push('<span class="dock-separator" aria-hidden="true"></span>');
  dockIcons.push(`<button type="button" class="dock-item" data-open="acerca" aria-label="${esc(t('open'))} ${esc(t('aboutTitle'))}" title="${esc(t('aboutTitle'))}"><span class="dock-img dock-generic">${aboutSvg}</span><i class="dock-dot" aria-hidden="true"></i></button>`);
  document.getElementById('dock').innerHTML = dockIcons.join('');
}

function localizedApp(app) {
  const copy = app.translations?.[globalLanguage];
  if (!copy) throw new Error(`Missing ${globalLanguage} translation for ${app.id}`);
  return copy;
}

function renderApp(app) {
  const copy = localizedApp(app);
  const labels = key => t(key);
  const features = (copy.features || []).map(feature => `<article class="feature-card"><span class="feature-glyph" aria-hidden="true">${esc(feature.icon || '✳')}</span><strong>${esc(feature.title)}</strong><p>${esc(feature.description)}</p></article>`).join('');
  const screenshots = (app.screenshots || []).map(img => {
    const src = safeURL(img.src);
    return src ? `<figure class="screenshot"><img src="${esc(src)}" alt="${esc(img.alt || labels('screenshotAlt'))}" loading="lazy" data-screenshot/><figcaption>${esc(img.alt || '')}</figcaption></figure>` : '';
  }).filter(Boolean).join('');
  const links = (app.links || []).map(l => {
    const url = safeURL(l.url);
    return url ? `<a class="primary-btn" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(l.label || t('open'))} ↗</a>` : '';
  }).filter(Boolean).join('');
  const embeddedPath = safeAppPath(app.embedPath);
  const actions = app.actions || {};
  const playAction = embeddedPath ? `<button class="primary-btn" type="button" data-start-embedded="${esc(embeddedPath)}">${esc(copy.actions.play)}</button>` : '';
  const installPath = safePartyPath(actions.install?.url);
  const installAction = installPath ? `<a class="secondary-btn app-action-link" href="${esc(installPath)}" target="_blank" rel="noopener noreferrer">${esc(copy.actions.install)} ↗</a>` : '';
  const androidUrl = safeURL(actions.android?.url || app.android?.url);
  const androidAction = androidUrl ? `<a class="secondary-btn app-action-link" href="${esc(androidUrl)}" download>${esc(copy.actions.download)}</a>` : `<span class="disabled-pill" aria-disabled="true">⌛ ${esc(copy.actions.pendingApk || labels('downloadUnavailable'))}</span>`;
  const actionRow = `<div class="app-actions">${playAction}${installAction}${androidAction}</div>`;
  const footerAction = actionRow || links || `<span class="disabled-pill">⌛ ${esc(labels('downloadUnavailable'))}</span>`;
  const published = app.status === 'published';
  const status = published ? t('published') : t('development');
  const galleryCopy = copy.gallery || { title: t('pendingCaptures'), description: t('addCaptures'), files: '' };
  const emptyGallery = `<div class="empty-gallery"><span class="empty-gallery-icon" aria-hidden="true">▧</span><h4>${esc(galleryCopy.title)}</h4><p>${esc(galleryCopy.description)}</p>${galleryCopy.files ? `<div class="small-details"><div><strong>${esc(labels('files'))}:</strong> ${esc(galleryCopy.files)}</div></div>` : ''}</div>`;
  const partyDetails = app.id === 'partriv' ? `<div class="party-details">${(copy.features || []).map(feature => `<p><strong>${esc(feature.title)}:</strong> ${esc(feature.description)}</p>`).join('')}</div>` : '';
  return `<div class="app-hero"><div class="hero-app-icon">${appIcon(app)}</div><div><div class="app-category">${esc(labels('appLabel'))} · ${esc(copy.category || labels('software'))}</div><h2>${esc(app.name)}</h2><p>${esc(copy.summary)}</p><div class="status-row"><span class="status-pill ${published ? 'status-published' : ''}">● ${esc(status)}</span>${(copy.platform || []).map(platform => `<span class="platform-pill">${esc(platform)}</span>`).join('')}</div></div></div>
    <div class="app-nav" role="tablist" aria-label="${esc(`${labels('appLabel')}: ${app.name}`)}">
      <button class="app-tab" type="button" role="tab" aria-selected="true" data-tab="resumen">${esc(t('description'))}</button>
      <button class="app-tab" type="button" role="tab" aria-selected="false" data-tab="capturas" tabindex="-1">${esc(t('screenshots'))}</button>
      <button class="app-tab" type="button" role="tab" aria-selected="false" data-tab="publicacion" tabindex="-1">${esc(t('publication'))}</button>
    </div>
    <section class="tab-pane" data-pane="resumen" role="tabpanel"><h3 class="pane-heading">${esc(app.name)} · ${esc(copy.category || labels('software'))}</h3><p class="body-copy">${esc(copy.description)}</p>${partyDetails}<div class="feature-grid">${features || `<p>${esc(labels('noFeatures'))}</p>`}</div><div class="app-footer">${footerAction}</div>${app.android?.sizeBytes ? `<div class="download-details"><strong>${esc(labels('apk'))} ${esc(app.android.version || '')}</strong> · ${Number(app.android.sizeBytes).toLocaleString(globalLanguage)} bytes · SHA-256 <code>${esc(app.android.sha256 || labels('pending'))}</code></div>` : ''}${copy.notice ? `<p class="demo-note">${esc(copy.notice)}</p>` : ''}</section>
    <section class="tab-pane" data-pane="capturas" role="tabpanel" hidden><h3 class="pane-heading">${esc(galleryCopy.title || t('gallery', app.name))}</h3>${screenshots ? `<div class="screenshot-grid">${screenshots}</div>` : emptyGallery}</section>
    <section class="tab-pane" data-pane="publicacion" role="tabpanel" hidden><h3 class="pane-heading">${esc(t('appStatus'))}</h3><p class="body-copy">${esc(published ? labels('statusAvailable') : labels('statusPending'))}</p><div class="small-details"><div><strong>${esc(labels('state'))}:</strong> ${esc(status)}</div><div><strong>${esc(t('platform'))}:</strong> ${esc((copy.platform || []).join(', ') || t('pending'))}</div><div><strong>${esc(t('technology'))}:</strong> ${esc(copy.technology || t('pending'))}</div><div><strong>${esc(t('version'))}:</strong> ${esc(app.version || t('pending'))}</div><div><strong>${esc(t('captures'))}:</strong> ${esc((app.screenshots || []).length ? labels('added') : labels('pendingToAdd'))}</div></div><div class="app-footer">${footerAction}</div></section>`;
}

function renderAbout() {
  const copy = studio.translations?.[globalLanguage];
  if (!copy) throw new Error(`Missing ${globalLanguage} studio translation`);
  return `<div class="about-content"><div class="about-mark">${aboutSvg}</div><div class="app-category">${esc(t('welcome'))}</div><h2>${esc(copy.aboutTitle)}</h2><p>${esc(copy.aboutText)}</p><div class="small-details"><div><strong>${esc(t('portfolioVersion'))}:</strong> 4.0</div><div><strong>${esc(t('design'))}:</strong> ${esc(t('centered'))}</div><div><strong>${esc(t('catalogPublication'))}:</strong> ${esc(t('aboutPortfolio'))}</div></div><div class="app-footer"><button type="button" class="primary-btn" data-open="${esc(apps[0]?.id || 'proximamente')}">${esc(t('explore'))} ${esc(apps[0]?.name || '')} →</button></div></div>`;
}
function renderSoon() {
  return `<div class="soon-content"><span class="app-category">${esc(t('preparing'))}</span><h2>${esc(t('futureTitle'))}</h2><p>${esc(t('futureCopy'))}</p><span class="soon-badge">✳ ${esc(t('reserved'))}</span></div>`;
}

function viewById(id) {
  const app = appMap.get(id);
  if (app) { const copy = localizedApp(app); return { title: `${app.name} · ${copy.category}`, width: app.embedPath ? 980 : 680, html: renderApp(app) }; }
  if (id === 'acerca') return { title: t('aboutTitle'), width: 530, html: renderAbout() };
  if (id === 'proximamente') return { title: t('futureTitle'), width: 490, html: renderSoon() };
  return null;
}

function isParty(idOrWindow) {
  const id = typeof idOrWindow === 'string' ? idOrWindow : idOrWindow?.dataset.window;
  return id === 'partriv';
}

function localizeWindowControls(win) {
  const back = win.querySelector('.mobile-back');
  const minimize = win.querySelector('.minimize');
  const maximize = win.querySelector('.maximize');
  const close = win.querySelector('.close');
  if (back) back.setAttribute('aria-label', t('backDesktop'));
  if (minimize) { minimize.setAttribute('aria-label', t('minimize')); minimize.querySelector('span').textContent = '−'; }
  if (maximize) { maximize.setAttribute('aria-label', t('restore')); maximize.querySelector('span').textContent = '□'; }
  if (close) { close.setAttribute('aria-label', t('close')); close.querySelector('span').textContent = '×'; }
}

function refreshWindow(win) {
  const id = win?.dataset.window;
  const view = id ? viewById(id) : null;
  const content = win?.querySelector('.window-content');
  if (!view || !content) return;
  const activeTab = content.querySelector('[data-tab][aria-selected="true"]')?.dataset.tab || 'resumen';
  const scrollTop = content.scrollTop;
  const embedded = content.querySelector('.embedded-app-shell');
  if (embedded) embedded.remove();
  content.innerHTML = view.html;
  if (embedded) content.appendChild(embedded);
  win.setAttribute('aria-label', view.title);
  win.querySelector('.window-title').textContent = view.title;
  selectTab(win, activeTab);
  content.scrollTop = scrollTop;
  localizeWindowControls(win);
  if (embedded) observePartyLayout(win);
}

function postBridgeMessage(frame, data) {
  if (!frame?.contentWindow || (location.protocol !== 'http:' && location.protocol !== 'https:')) return false;
  frame.contentWindow.postMessage({ ...data, version: BRIDGE_VERSION }, location.origin);
  return true;
}

function requestPartyClose(win) {
  const frame = win?.querySelector('.embedded-app-frame');
  if (!frame || pendingCloseRequests.size) return;
  const requestId = `close-${Date.now()}-${++closeRequestSequence}`;
  const timeout = setTimeout(() => {
    const pending = pendingCloseRequests.get(requestId);
    if (!pending) return;
    pendingCloseRequests.delete(requestId);
    toast(t('closeUnavailable'));
  }, 5000);
  pendingCloseRequests.set(requestId, { win, timeout });
  postBridgeMessage(frame, { type: CLOSE_REQUEST_TYPE, requestId });
}

function destroyWindow(id, { route = true } = {}) {
  const win = windowsState.get(id);
  if (!win) return;
  partyLayoutObservers.get(win)?.disconnect();
  partyLayoutObservers.delete(win);
  win.remove();
  windowsState.delete(id);
  syncWindowClasses();
  if (route && location.hash.endsWith('/' + id)) setRoute(null);
}

function toast(message) { clearTimeout(toastTimer); toastEl.textContent = message; toastEl.classList.add('show'); toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2600); }
function openScreenshot(image) {
  const overlay = document.createElement('div');
  overlay.className = 'screenshot-lightbox';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.innerHTML = `<button type="button" class="lightbox-close" aria-label="${esc(t('closeScreenshot'))}">×</button><img src="${esc(image.currentSrc || image.src)}" alt="${esc(image.alt || t('enlargedScreenshot'))}"/>`;
  const close = () => overlay.remove();
  overlay.addEventListener('click', ev => { if (ev.target === overlay || ev.target.closest('.lightbox-close')) close(); });
  document.body.appendChild(overlay);
  overlay.querySelector('.lightbox-close')?.focus();
}
function localizeLightbox() {
  const lightbox = document.querySelector('.screenshot-lightbox');
  if (!lightbox) return;
  lightbox.querySelector('.lightbox-close')?.setAttribute('aria-label', t('closeScreenshot'));
  const image = lightbox.querySelector('img');
  if (image && !image.dataset.sourceAlt) image.alt = t('enlargedScreenshot');
}
function themeMessage(theme) { return { type: THEME_MESSAGE_TYPE, version: THEME_VERSION, theme: theme === 'dawn' ? 'light' : 'dark' }; }
function postThemeToFrame(frame, theme = document.documentElement.dataset.theme) {
  if (!frame?.contentWindow || (location.protocol !== 'http:' && location.protocol !== 'https:')) return;
  frame.contentWindow.postMessage(themeMessage(theme), location.origin);
}
function broadcastTheme(theme = document.documentElement.dataset.theme) {
  windowsHost?.querySelectorAll('iframe.embedded-app-frame').forEach(frame => postThemeToFrame(frame, theme));
}
function registerEmbeddedFrame(frame) {
  if (!frame || frame.dataset.themeBridgeRegistered === 'true') return;
  frame.dataset.themeBridgeRegistered = 'true';
  frame.addEventListener('load', () => { postThemeToFrame(frame); postLanguageToFrame(frame); });
  postThemeToFrame(frame);
  postLanguageToFrame(frame);
}
function handleThemeMessage(ev) {
  if (ev.origin !== location.origin || !ev.data || typeof ev.data !== 'object') return;
  const frame = [...(windowsHost?.querySelectorAll('iframe.embedded-app-frame') || [])]
    .find(candidate => candidate.contentWindow === ev.source);
  if (!frame) return;
  if (ev.data.type === THEME_REQUEST_TYPE && ev.data.version === THEME_VERSION) postThemeToFrame(frame);
  if (ev.data.type === LANGUAGE_REQUEST_TYPE && ev.data.version === BRIDGE_VERSION) postLanguageToFrame(frame);
  if (ev.data.type === CLOSE_CONFIRMED_TYPE || ev.data.type === CLOSE_CANCELLED_TYPE) {
    if (ev.data.version !== BRIDGE_VERSION || typeof ev.data.requestId !== 'string') return;
    const pending = pendingCloseRequests.get(ev.data.requestId);
    if (!pending || pending.win.querySelector('.embedded-app-frame')?.contentWindow !== ev.source) return;
    clearTimeout(pending.timeout);
    pendingCloseRequests.delete(ev.data.requestId);
    if (ev.data.type === CLOSE_CONFIRMED_TYPE) destroyWindow(pending.win.dataset.window);
  }
}
function postLanguageToFrame(frame) { postBridgeMessage(frame, { type: LANGUAGE_STATE_TYPE, language: globalLanguage }); }
function notifyPartyResize(win) {
  if (!win?.classList.contains('party-running')) return;
  const frame = win.querySelector('.embedded-app-frame');
  if (!frame?.contentWindow) return;
  requestAnimationFrame(() => {
    try { frame.contentWindow.dispatchEvent(new Event('resize')); } catch (_) { }
  });
}
function observePartyLayout(win) {
  const shell = win?.querySelector('.embedded-app-shell');
  const content = win?.querySelector('.window-content');
  if (!shell || !content || typeof ResizeObserver === 'undefined') {
    notifyPartyResize(win);
    return;
  }
  partyLayoutObservers.get(win)?.disconnect();
  const observer = new ResizeObserver(() => notifyPartyResize(win));
  observer.observe(shell);
  observer.observe(content);
  partyLayoutObservers.set(win, observer);
  notifyPartyResize(win);
}
function bringFront(el) { highestZ++; el.style.zIndex = String(highestZ); el.classList.remove('is-minimized'); syncWindowClasses(); }
function syncWindowClasses() {
  document.querySelectorAll('.dock-item').forEach(btn => btn.classList.toggle('running', windowsState.has(btn.dataset.open) && !windowsState.get(btn.dataset.open).classList.contains('is-minimized')));
  document.body.classList.toggle('has-open-window', [...windowsState.values()].some(el => !el.classList.contains('is-minimized')));
  document.body.classList.toggle('party-open', windowsState.has('partriv'));
}
function setRoute(id) {
  if (location.protocol === 'about:') return; // Entorno de previsualización sin URL pública
  const route = id ? `#app/${encodeURIComponent(id)}` : location.pathname + location.search;
  if ((id && location.hash !== route) || (!id && location.hash)) history.pushState(null, '', route);
}
function toggleWindow(id) {
  const existing = windowsState.get(id);
  if (!existing) { openWindow(id); return; }
  // Launcher clicks always activate/focus. Minimizing is reserved for the
  // window control and the desktop commands.
  bringFront(existing);
  setRoute(id);
}
function openWindow(id, { route = true } = {}) {
  closeMenu();
  const view = viewById(id); if (!view) return;
  if (matchMedia('(max-width: 760px)').matches && !isParty(id)) {
    windowsState.forEach((win, winId) => {
      if (winId === id) return;
      if (isParty(win)) win.classList.add('is-minimized');
      else { win.remove(); windowsState.delete(winId); }
    });
    syncWindowClasses();
  }
  const existing = windowsState.get(id);
  if (existing) { bringFront(existing); if (route) setRoute(id); return; }
  const el = document.createElement('section');
  el.className = `window${isParty(id) ? ' party-window' : ''}`; el.dataset.window = id;
  el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', view.title);
  el.style.setProperty('--w', view.width + 'px');
  el.innerHTML = `<header class="window-titlebar" data-drag-handle><button type="button" class="mobile-back" data-window-action="hide" aria-label="${esc(t('backDesktop'))}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 5-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button><span class="window-title">${esc(view.title)}</span><div class="window-controls"><button type="button" class="minimize" data-window-action="minimize" aria-label="${esc(t('minimize'))}"><span>—</span></button><button type="button" class="maximize" data-window-action="maximize" aria-label="${esc(t('restore'))}"><span>□</span></button><button type="button" class="close" data-window-action="close" aria-label="${esc(t('close'))}"><span>×</span></button></div></header><div class="window-content">${view.html}</div>`;
  windowsHost.appendChild(el); windowsState.set(id, el); bringFront(el); enableDrag(el);
  localizeWindowControls(el);
  registerEmbeddedFrame(el.querySelector('.embedded-app-frame'));
  el.addEventListener('pointerdown', () => { if (!el.classList.contains('is-minimized')) bringFront(el); });
  if (route) setRoute(id);
}
function closeWindow(id, { route = true } = {}) {
  const win = windowsState.get(id); if (!win) return;
  if (isParty(win) && win.querySelector('.embedded-app-frame')) {
    requestPartyClose(win);
    return;
  }
  destroyWindow(id, { route });
}
function startEmbeddedParty(win) {
  if (!win || !isParty(win)) return;
  closeMenu();
  let shell = win.querySelector('.embedded-app-shell');
  let frame = win.querySelector('.embedded-app-frame');
  if (!frame) {
    shell = document.createElement('div');
    shell.className = 'embedded-app-shell';
    frame = document.createElement('iframe');
    frame.className = 'embedded-app-frame';
    frame.title = t('iframeTitle');
    frame.loading = 'eager';
    frame.src = safeAppPath(appMap.get('partriv')?.embedPath) || './apps/party/';
    shell.appendChild(frame);
    win.querySelector('.window-content')?.appendChild(shell);
    registerEmbeddedFrame(frame);
  }
  win.classList.add('party-running');
  observePartyLayout(win);
  bringFront(win);
  frame.focus();
}
function selectTab(win, id) {
  win.querySelectorAll('[data-tab]').forEach(btn => { const selected = btn.dataset.tab === id; btn.setAttribute('aria-selected', String(selected)); btn.tabIndex = selected ? 0 : -1; });
  win.querySelectorAll('[data-pane]').forEach(p => { p.hidden = p.dataset.pane !== id; });
  win.querySelector('.window-content')?.scrollTo({top:0,behavior:'instant'});
}
function topWindow() { return [...windowsState.values()].filter(w => !w.classList.contains('is-minimized')).sort((a,b) => +b.style.zIndex - +a.style.zIndex)[0]; }
function centerWindows() { windowsState.forEach(w => { w.style.removeProperty('left'); w.style.removeProperty('top'); }); toast(t('centered')); }
function showDesktop() { windowsState.forEach(w => w.classList.add('is-minimized')); syncWindowClasses(); setRoute(null); }

function getMenuItems(id) {
  const main = apps.map(app => [`${t('open')} ${app.name}`, app.id]);
  switch (id) {
    case 'archivo': return main;
    case 'ver': return [[t('showDesktop'),'escritorio'], [t('center'),'centrar']];
    case 'ventana': return [[t('minimizeActive'),'minimizar'], [t('hideActive'),'ocultar'], [t('closeActive'),'cerrar']];
    case 'ayuda': return [[t('aboutPortfolio'),'acerca']];
    default: return [];
  }
}
function menuAction(id) {
  const top = topWindow();
  if (id === 'escritorio') showDesktop();
  else if (id === 'centrar') centerWindows();
  else if ((id === 'minimizar' || id === 'ocultar') && top) { top.classList.add('is-minimized'); syncWindowClasses(); setRoute(null); }
  else if (id === 'cerrar' && top) closeWindow(top.dataset.window);
  else openWindow(id);
}
function closeMenu() { document.querySelectorAll('[data-menu]').forEach(btn => { btn.setAttribute('aria-expanded', 'false'); btn.classList.remove('active'); }); const menuPopover = document.querySelector('.menu-popover'); if (menuPopover) menuPopover.hidden = true; currentMenu = null; }
function toggleMenu(btn) {
  const id = btn.dataset.menu;
  if (currentMenu === id) { closeMenu(); return; }
  currentMenu = id;
  document.querySelectorAll('[data-menu]').forEach(b => { b.classList.toggle('active', b === btn); b.setAttribute('aria-expanded', String(b === btn)); });
  const menuPopover = document.querySelector('.menu-popover');
  if (!menuPopover) return;
  menuPopover.replaceChildren();
  getMenuItems(id).forEach(([label, action]) => {
    const option = document.createElement('button'); option.type = 'button'; option.className = 'menu-option'; option.setAttribute('role','menuitem');
    option.textContent = label; option.addEventListener('click', () => { closeMenu(); menuAction(action); }); menuPopover.appendChild(option);
  });
  menuPopover.hidden = false;
  const rect = btn.getBoundingClientRect(); menuPopover.style.left = Math.max(8, Math.min(rect.left, innerWidth - 252)) + 'px';
}
function enableDrag(win) {
  const handle = win.querySelector('[data-drag-handle]'); let moving = null;
  handle.addEventListener('pointerdown', ev => {
    if (matchMedia('(max-width: 760px)').matches || win.classList.contains('is-maximized') || ev.target.closest('button') || ev.button !== 0) return;
    const rect = win.getBoundingClientRect();
    moving = { pointer:ev.pointerId, x:ev.clientX, y:ev.clientY, left:rect.left, top:rect.top };
    handle.setPointerCapture(ev.pointerId);
  });
  handle.addEventListener('pointermove', ev => {
    if (!moving || ev.pointerId !== moving.pointer) return;
    win.style.left = Math.max(8, Math.min(innerWidth - 130, moving.left + ev.clientX - moving.x)) + 'px';
    win.style.top = Math.max(49, Math.min(innerHeight - 90, moving.top + ev.clientY - moving.y - 45)) + 'px';
  });
  const end = () => { moving = null; };
  handle.addEventListener('pointerup',end); handle.addEventListener('pointercancel',end);
}

// Themes: dark Azul Noche Elegante and light Amanecer Radiante.
function setTheme(theme, persist = true) {
  const active = theme === 'dawn' ? 'dawn' : 'night';
  document.documentElement.dataset.theme = active;
  document.documentElement.style.colorScheme = active === 'dawn' ? 'light' : 'dark';
  document.querySelectorAll('[data-theme-choice]').forEach(btn => {
    btn.setAttribute('aria-pressed', String(btn.dataset.themeChoice === active));
  });
  const meta = document.getElementById('browser-theme-color');
  if (meta) meta.content = active === 'dawn' ? '#F7F2E8' : '#0E1A2B';
  if (persist) { try { localStorage.setItem('flyhigh-theme', active); } catch (_) {} }
  broadcastTheme(active);
}
function initTheme() {
  let stored = null;
  try { stored = localStorage.getItem('flyhigh-theme'); } catch (_) {}
  const preference = (stored === 'night' || stored === 'dawn') ? stored :
    (window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'dawn' : 'night');
  setTheme(preference, false);
  document.querySelectorAll('[data-theme-choice]').forEach(btn => {
    btn.addEventListener('click', () => setTheme(btn.dataset.themeChoice));
  });
}

function applyLanguage() {
  document.documentElement.lang = globalLanguage;
  const studioCopy = studio.translations?.[globalLanguage];
  if (studioCopy) {
    document.title = `${studio.name || 'Fly High'} · ${studioCopy.subtitle}`;
    document.querySelector('meta[name="description"]')?.setAttribute('content', t('metaDescription'));
    const introTagline = document.getElementById('intro-tagline');
    if (introTagline) introTagline.textContent = studioCopy.subtitle;
  }
  const picker = document.getElementById('language-picker');
  if (picker) picker.value = globalLanguage;
  document.querySelector('.menubar')?.setAttribute('aria-label', t('topBar'));
  document.querySelector('.desktop-menus')?.setAttribute('aria-label', t('desktopMenus'));
  picker?.setAttribute('aria-label', t('globalLanguage'));
  document.querySelector('.theme-picker')?.setAttribute('aria-label', t('themeLabel'));
  document.querySelector('.theme-option[data-theme-choice="night"]')?.setAttribute('title', t('nightTitle'));
  document.querySelector('.theme-option[data-theme-choice="dawn"]')?.setAttribute('title', t('dawnTitle'));
  document.getElementById('clock')?.setAttribute('aria-label', t('localTime'));
  document.querySelector('.hero-brand-mark img')?.setAttribute('alt', t('logoAlt'));
  document.querySelector('noscript')?.replaceChildren(document.createTextNode(t('noScript')));
  const menuLabels = { archivo:'file', ver:'view', ventana:'window', ayuda:'help' };
  document.querySelectorAll('[data-menu]').forEach(button => {
    const key = menuLabels[button.dataset.menu];
    if (key) { button.textContent = t(key); button.setAttribute('aria-label', t(key)); button.title = t(key); }
  });
  const themeOptions = document.querySelectorAll('[data-theme-choice]');
  themeOptions[0]?.querySelector('span') && (themeOptions[0].querySelector('span').textContent = t('night'));
  themeOptions[1]?.querySelector('span') && (themeOptions[1].querySelector('span').textContent = t('dawn'));
  document.querySelector('.language-picker-label')?.replaceChildren(document.createTextNode(t('language')));
  const brandHome = document.getElementById('brand-name');
  if (brandHome) { brandHome.setAttribute('aria-label', t('backDesktop')); brandHome.title = t('backDesktop'); }
  document.getElementById('desktop')?.setAttribute('aria-label', t('desktop'));
  document.getElementById('dock')?.setAttribute('aria-label', t('quickAccess'));
  document.querySelectorAll('.shortcut-status').forEach(el => { el.textContent = t('development'); });
  const openMenuId = currentMenu;
  if (openMenuId) closeMenu();
  renderLaunchers();
  windowsState.forEach(win => {
    refreshWindow(win);
    const frame = win.querySelector('.embedded-app-frame');
    if (frame) postLanguageToFrame(frame);
  });
  if (openMenuId) {
    const menuButton = document.querySelector(`[data-menu="${openMenuId}"]`);
    if (menuButton) toggleMenu(menuButton);
  }
  localizeLightbox();
}

function setGlobalLanguage(language, persist = true) {
  if (!window.FlyHighI18n.locales.some(([code]) => code === language)) language = 'es-ES';
  globalLanguage = language;
  if (persist) { try { localStorage.setItem(languageKey, language); } catch (_) {} }
  applyLanguage();
}

function initLanguage() {
  try { globalLanguage = localStorage.getItem(languageKey) || 'es-ES'; } catch (_) { globalLanguage = 'es-ES'; }
  const picker = document.getElementById('language-picker');
  if (picker) {
    picker.replaceChildren(...window.FlyHighI18n.locales.map(([code, label]) => { const option = document.createElement('option'); option.value = code; option.textContent = label; return option; }));
    picker.addEventListener('change', () => setGlobalLanguage(picker.value));
  }
  setGlobalLanguage(globalLanguage, false);
}

function init() {
  initTheme();
  initLanguage();
  window.addEventListener('message', handleThemeMessage);
  const studioCopy = studio.translations?.[globalLanguage];
  document.title = `${studio.name || 'Fly High'} · ${studioCopy?.subtitle || document.title}`;
  const brandLabel = document.querySelector('#brand-name span');
  if (brandLabel) brandLabel.textContent = studio.name || 'Fly High';
  const introHeadline = document.getElementById('intro-headline');
  const introTagline = document.getElementById('intro-tagline');
  if (introHeadline) introHeadline.textContent = studio.headline || studio.name || 'Fly High';
  if (introTagline) introTagline.textContent = studioCopy?.subtitle || '';
  renderLaunchers();
  document.addEventListener('pointerdown', ev => {
    if (!currentMenu) return;
    if (!ev.target.closest('.menu-popover') && !ev.target.closest('[data-menu]')) closeMenu();
  }, true);
  window.addEventListener('blur', () => {
    if (document.activeElement?.tagName === 'IFRAME') closeMenu();
  });
  document.addEventListener('focusin', ev => {
    if (ev.target?.tagName === 'IFRAME') closeMenu();
  });
  document.addEventListener('click', ev => {
    const brandHome = ev.target.closest('#brand-name');
    if (brandHome) { showDesktop(); return; }
    const menu = ev.target.closest('[data-menu]'); if (menu) { toggleMenu(menu); return; }
    if (currentMenu && !ev.target.closest('.menu-popover')) closeMenu();
    const opener = ev.target.closest('[data-open]'); if (opener) { toggleWindow(opener.dataset.open); return; }
    const embedded = ev.target.closest('[data-start-embedded]');
    if (embedded) { startEmbeddedParty(embedded.closest('.window')); return; }
    const screenshot = ev.target.closest('[data-screenshot]');
    if (screenshot) { openScreenshot(screenshot); return; }
    const action = ev.target.closest('[data-window-action]');
    if (action) {
      const win = action.closest('.window'); if (!win) return;
      const id = win.dataset.window;
      switch (action.dataset.windowAction) {
        case 'hide':
        case 'minimize':
          win.classList.add('is-minimized');
          syncWindowClasses();
          setRoute(null);
          break;
        case 'maximize': win.classList.toggle('is-maximized'); bringFront(win); break;
        case 'close': closeWindow(id); break;
      }
      return;
    }
    const tab = ev.target.closest('[data-tab]');
    if (tab) { const win = tab.closest('.window'); if (win) selectTab(win, tab.dataset.tab); }
  });
  document.addEventListener('keydown', ev => {
    if (ev.key === 'Escape' && document.querySelector('.screenshot-lightbox')) { document.querySelector('.screenshot-lightbox')?.remove(); return; }
    if (ev.key === 'Escape') { if (currentMenu) { closeMenu(); return; } const top = topWindow(); if (top) closeWindow(top.dataset.window); }
    if (ev.key === 'ArrowRight' || ev.key === 'ArrowLeft') {
      if (ev.target.matches('[role="tab"]')) {
        const tabs = [...ev.target.parentElement.querySelectorAll('[role="tab"]')];
        const i = tabs.indexOf(ev.target); const next = tabs[(i + (ev.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
        next.focus(); selectTab(next.closest('.window'), next.dataset.tab); ev.preventDefault();
      }
    }
  });
  window.addEventListener('popstate', () => {
    const id = decodeURIComponent((location.hash.match(/^#app\/([a-z0-9-]+)$/) || [])[1] || '');
    if (id && viewById(id)) openWindow(id, { route: false });
    else if (matchMedia('(max-width: 760px)').matches) { windowsState.forEach((_, id) => closeWindow(id, {route:false})); }
  });
  const hash = location.hash;
  const routeId = (hash.match(/^#app\/([a-z0-9-]+)$/) || [])[1] || (hash.match(/^#([a-z0-9-]+)$/) || [])[1];
  if (routeId && viewById(routeId)) openWindow(routeId, { route: false });
  function updateClock() { document.getElementById('clock').textContent = new Intl.DateTimeFormat('es-ES', {weekday:'short',hour:'2-digit',minute:'2-digit'}).format(new Date()); }
  updateClock(); setInterval(updateClock,30_000);
}
init();
