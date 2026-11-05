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
  const shortcuts = apps.map(app => `<button type="button" class="shortcut" data-open="${esc(app.id)}" aria-label="Abrir ${esc(app.name)}"><span class="app-icon" aria-hidden="true">${appIcon(app)}</span><span class="shortcut-label">${esc(app.name)}</span>${app.status === 'published' ? '' : '<span class="shortcut-status">En desarrollo</span>'}</button>`);
  shortcuts.push(`<button type="button" class="shortcut" data-open="acerca" aria-label="Abrir Acerca de"><span class="app-icon">${aboutSvg}</span><span class="shortcut-label">Acerca de</span></button>`);
  shortcuts.push(`<button type="button" class="shortcut" data-open="proximamente" aria-label="Abrir Próximamente"><span class="app-icon">${futureSvg}</span><span class="shortcut-label">Próximamente</span></button>`);
  document.getElementById('desktop-icons').innerHTML = shortcuts.join('');

  const dockIcons = apps.map(app => `<button type="button" class="dock-item" data-open="${esc(app.id)}" aria-label="Abrir ${esc(app.name)}" title="${esc(app.name)}"><span class="dock-img dock-generic">${appIcon(app)}</span><i class="dock-dot" aria-hidden="true"></i></button>`);
  dockIcons.push('<span class="dock-separator" aria-hidden="true"></span>');
  dockIcons.push(`<button type="button" class="dock-item" data-open="acerca" aria-label="Abrir Acerca de" title="Acerca de"><span class="dock-img dock-generic">${aboutSvg}</span><i class="dock-dot" aria-hidden="true"></i></button>`);
  document.getElementById('dock').innerHTML = dockIcons.join('');
}

function renderApp(app) {
  const features = (app.features || []).map(f => `<article class="feature-card"><span class="feature-glyph" aria-hidden="true">${esc(f.icon || '✳')}</span><strong>${esc(f.title)}</strong><p>${esc(f.description)}</p></article>`).join('');
  const screenshots = (app.screenshots || []).map(img => {
    const src = safeURL(img.src);
    return src ? `<figure class="screenshot"><img src="${esc(src)}" alt="${esc(img.alt || 'Captura de la aplicación')}" loading="lazy" data-screenshot/><figcaption>${esc(img.alt || '')}</figcaption></figure>` : '';
  }).filter(Boolean).join('');
  const links = (app.links || []).map(l => {
    const url = safeURL(l.url);
    if (!url) return '';
    return `<a class="primary-btn" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(l.label || 'Abrir enlace')} ↗</a>`;
  }).filter(Boolean).join('');
  const embeddedPath = safeAppPath(app.embedPath);
  const actions = app.actions || {};
  const playAction = embeddedPath
    ? `<button class="primary-btn" type="button" data-start-embedded="${esc(embeddedPath)}">${esc(actions.play?.label || 'Jugar ahora')}</button>`
    : '';
  const installPath = safePartyPath(actions.install?.url);
  const installAction = installPath
    ? `<a class="secondary-btn app-action-link" href="${esc(installPath)}" target="_blank" rel="noopener noreferrer">${esc(actions.install?.label || 'Instalar versión web')} ↗</a>`
    : '';
  const androidUrl = safeURL(actions.android?.url || app.android?.url);
  const androidAction = androidUrl
    ? `<a class="secondary-btn app-action-link" href="${esc(androidUrl)}" download>${esc(actions.android?.label || 'Descargar APK Android')}</a>`
    : `<span class="disabled-pill" aria-disabled="true">⌛ ${esc(actions.android?.pendingLabel || 'APK pendiente de publicación')}</span>`;
  const actionRow = `<div class="app-actions">${playAction}${installAction}${androidAction}</div>`;
  const footerAction = actionRow || links || '<span class="disabled-pill">⌛ Descarga todavía no disponible</span>';
  const status = app.status === 'published' ? 'Publicada' : 'En desarrollo';
  const partyDetails = app.id === 'partriv'
    ? `<div class="party-details"><p><strong>Tres rondas:</strong> Definición, Una palabra y Mímica. Cada ronda cambia la forma de dar pistas y responder.</p><p><strong>Configuración:</strong> conceptos, idiomas, periodos, categorías, cultura, regiones y dificultad, además de los ajustes de sonido, orientación y colores de equipo disponibles en ParTriv.</p><p><strong>Uso:</strong> partida por equipos en PC y smartphone. Tras la primera carga, la PWA conserva los recursos necesarios para continuar sin conexión.</p></div>`
    : '';
  const emptyGallery = app.id === 'partriv'
    ? '<div class="empty-gallery"><span class="empty-gallery-icon" aria-hidden="true">▧</span><h4>Capturas de ParTriv pendientes</h4><p>La galería está preparada para incorporar capturas reales de la pantalla inicial, configuración, partida y resultados. No se muestran imágenes ficticias ni de otra aplicación.</p><div class="small-details"><div><strong>Archivos necesarios:</strong> partriv-home.png, partriv-settings.png, partriv-game.png y partriv-results.png</div></div></div>'
    : '<div class="empty-gallery"><span class="empty-gallery-icon" aria-hidden="true">▧</span><h4>Capturas pendientes</h4><p>Añadiremos imágenes reales de la aplicación cuando estén disponibles. No mostramos diseños conceptuales como si fueran capturas auténticas.</p></div>';
  const embedded = '';
  return `<div class="app-hero"><div class="hero-app-icon">${appIcon(app)}</div><div><div class="app-category">Aplicación · ${esc(app.category || 'Software')}</div><h2>${esc(app.name)}</h2><p>${esc(app.summary)}</p><div class="status-row"><span class="status-pill ${app.status === 'published' ? 'status-published' : ''}">● ${status}</span>${(app.platform || []).map(p => `<span class="platform-pill">${esc(p)}</span>`).join('')}</div></div></div>
    ${embedded}
    <div class="app-nav" role="tablist" aria-label="Información de ${esc(app.name)}">
      <button class="app-tab" type="button" role="tab" aria-selected="true" data-tab="resumen">Descripción</button>
      <button class="app-tab" type="button" role="tab" aria-selected="false" data-tab="capturas" tabindex="-1">Capturas</button>
      <button class="app-tab" type="button" role="tab" aria-selected="false" data-tab="publicacion" tabindex="-1">Publicación</button>
    </div>
    <section class="tab-pane" data-pane="resumen" role="tabpanel"><h3 class="pane-heading">${esc(app.name)} · ${esc(app.category || 'Aplicación')}</h3><p class="body-copy">${esc(app.description)}</p>${partyDetails}<div class="feature-grid">${features || '<p>Próximamente añadiremos las funciones de esta aplicación.</p>'}</div><div class="app-footer">${footerAction}</div>${app.android?.sizeBytes ? `<div class="download-details"><strong>APK ${esc(app.android.version || '')}</strong> · ${Number(app.android.sizeBytes).toLocaleString(globalLanguage)} bytes · SHA-256 <code>${esc(app.android.sha256 || 'pendiente')}</code></div>` : ''}${app.notice ? `<p class="demo-note">${esc(app.notice)}</p>` : ''}</section>
    <section class="tab-pane" data-pane="capturas" role="tabpanel" hidden><h3 class="pane-heading">Galería de ${esc(app.name)}</h3>${screenshots ? `<div class="screenshot-grid">${screenshots}</div>` : emptyGallery}</section>
    <section class="tab-pane" data-pane="publicacion" role="tabpanel" hidden><h3 class="pane-heading">Estado de la publicación</h3><p class="body-copy">${app.status === 'published' ? 'Puedes consultar los enlaces de esta versión a continuación.' : 'La ficha de esta aplicación está disponible, pero todavía no hemos publicado una descarga validada.'}</p><div class="small-details"><div><strong>Estado:</strong> ${status}</div><div><strong>Plataforma:</strong> ${esc((app.platform || []).join(', ') || 'Pendiente')}</div><div><strong>Tecnología:</strong> ${esc(app.technology || 'Sin especificar')}</div><div><strong>Versión:</strong> ${esc(app.version || 'Pendiente')}</div><div><strong>Capturas:</strong> ${(app.screenshots || []).length ? 'Añadidas al catálogo' : 'Pendientes de incorporar'}</div></div><div class="app-footer">${footerAction}</div></section>`;
}

function renderAbout() {
  return `<div class="about-content"><div class="about-mark">${aboutSvg}</div><div class="app-category">Bienvenido al escritorio</div><h2>${esc(studio.aboutTitle || 'Un espacio para crear cosas útiles.')}</h2><p>${esc(studio.aboutText || '')}</p><div class="small-details"><div><strong>Versión del portfolio:</strong> 4.0 (demostración)</div><div><strong>Diseño:</strong> Adaptado a móvil y escritorio</div><div><strong>Publicación:</strong> Catálogo editable sin panel privado</div></div><div class="app-footer"><button type="button" class="primary-btn" data-open="${esc(apps[0]?.id || 'proximamente')}">Explorar ${esc(apps[0]?.name || 'el catálogo')} →</button></div></div>`;
}
function renderSoon() {
  return `<div class="soon-content"><span class="app-category">En preparación</span><h2>Más aplicaciones, próximamente.</h2><p>Este acceso reserva un lugar para futuros proyectos. Todas las nuevas aplicaciones que añadas a <code>scripts/catalogo.js</code> aparecerán automáticamente en el escritorio y en el dock.</p><span class="soon-badge">✳ Espacio reservado para la siguiente app</span></div>`;
}

function viewById(id) {
  const app = appMap.get(id);
  if (app) return { title: `${app.name} · ${app.category || 'Aplicación'}`, width: app.embedPath ? 980 : 680, html: renderApp(app) };
  if (id === 'acerca') return { title: 'Acerca de este espacio', width: 530, html: renderAbout() };
  if (id === 'proximamente') return { title: 'Próximamente', width: 490, html: renderSoon() };
  return null;
}

function isParty(idOrWindow) {
  const id = typeof idOrWindow === 'string' ? idOrWindow : idOrWindow?.dataset.window;
  return id === 'partriv';
}

function localizeWindowControls(win) {
  const minimize = win.querySelector('.minimize');
  const maximize = win.querySelector('.maximize');
  const close = win.querySelector('.close');
  if (minimize) { minimize.setAttribute('aria-label', t('minimize')); minimize.querySelector('span').textContent = '−'; }
  if (maximize) { maximize.setAttribute('aria-label', t('restore')); maximize.querySelector('span').textContent = '□'; }
  if (close) { close.setAttribute('aria-label', t('close')); close.querySelector('span').textContent = '×'; }
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
  overlay.innerHTML = `<button type="button" class="lightbox-close" aria-label="Cerrar captura">×</button><img src="${esc(image.currentSrc || image.src)}" alt="${esc(image.alt || 'Captura ampliada')}"/>`;
  const close = () => overlay.remove();
  overlay.addEventListener('click', ev => { if (ev.target === overlay || ev.target.closest('.lightbox-close')) close(); });
  document.body.appendChild(overlay);
  overlay.querySelector('.lightbox-close')?.focus();
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
  el.innerHTML = `<header class="window-titlebar" data-drag-handle><button type="button" class="mobile-back" data-window-action="hide" aria-label="Volver al escritorio"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 5-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button><span class="window-title">${esc(view.title)}</span><div class="window-controls"><button type="button" class="minimize" data-window-action="minimize" aria-label="Minimizar ventana"><span>—</span></button><button type="button" class="maximize" data-window-action="maximize" aria-label="Maximizar o restaurar ventana"><span>□</span></button><button type="button" class="close" data-window-action="close" aria-label="Cerrar ventana"><span>×</span></button></div></header><div class="window-content">${view.html}</div>`;
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
    frame.title = 'ParTriv';
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
function centerWindows() { windowsState.forEach(w => { w.style.removeProperty('left'); w.style.removeProperty('top'); }); toast('Ventanas centradas'); }
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
  const picker = document.getElementById('language-picker');
  if (picker) picker.value = globalLanguage;
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
  windowsState.forEach(win => localizeWindowControls(win));
  renderLaunchers();
  windowsState.forEach(win => { const frame = win.querySelector('.embedded-app-frame'); if (frame) postLanguageToFrame(frame); });
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
  document.title = studio.pageTitle || document.title;
  const brandLabel = document.querySelector('#brand-name span');
  if (brandLabel) brandLabel.textContent = studio.name || 'Fly High';
  const introHeadline = document.getElementById('intro-headline');
  const introTagline = document.getElementById('intro-tagline');
  if (introHeadline) introHeadline.textContent = studio.headline || studio.name || 'Fly High';
  if (introTagline) introTagline.textContent = studio.subtitle || 'Aplicaciones personales';
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
