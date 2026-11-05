import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = relative => fs.readFileSync(new URL(relative, root), 'utf8');
const sourceFiles = ['scripts/localization.js', 'scripts/catalogo.js', 'scripts/app.js', 'index.html', 'scripts/build-local.ps1'];
const mojibake = /(?:Ã.|Â.|â.|�)/u;

test('las cadenas visibles no contienen corrupción UTF-8', () => {
  for (const file of sourceFiles) assert.equal(mojibake.test(read(file)), false, file);
});

test('el selector conserva los nueve idiomas y sus nombres correctos', () => {
  const source = read('scripts/localization.js');
  for (const label of ['Español (España)', 'Valencià', 'Español (Latinoamérica)', 'Français', 'Português']) {
    assert.match(source, new RegExp(label.replace(/[()]/g, '\\$&')));
  }
  assert.equal((source.match(/\['[a-z]{2}(?:-[A-Za-z0-9]+)+',/g) || []).length, 9);
});

test('FlyHigh es el acceso al escritorio y no existe el botón de menú principal', () => {
  const index = read('index.html');
  const app = read('scripts/app.js');
  assert.match(index, /id="brand-name"[^>]*type="button"/);
  assert.doesNotMatch(index, /class="brand-menu"/);
  assert.doesNotMatch(index, /data-menu="inicio"/);
  assert.match(app, /const brandHome = ev\.target\.closest\('#brand-name'\)/);
});

test('el regreso móvil usa un botón accesible con SVG y mantiene la minimización', () => {
  const app = read('scripts/app.js');
  assert.match(app, /class="mobile-back"[^>]*data-window-action="hide"/);
  assert.match(app, /class="mobile-back"[\s\S]*?<svg/);
  assert.match(app, /class="mobile-back"[\s\S]*?aria-label="Volver al escritorio"/);
});

test('los menús se cierran fuera, con Escape y al abrir una aplicación', () => {
  const app = read('scripts/app.js');
  assert.match(app, /document\.addEventListener\('pointerdown',[\s\S]*closeMenu\(\)/);
  assert.match(app, /window\.addEventListener\('blur',[\s\S]*closeMenu\(\)/);
  assert.match(app, /if \(ev\.key === 'Escape'\)[\s\S]*currentMenu[\s\S]*closeMenu\(\)/);
  assert.match(app, /function openWindow\(id[\s\S]*closeMenu\(\)/);
  assert.match(app, /option\.addEventListener\('click',[\s\S]*closeMenu\(\)/);
  assert.match(app, /function closeMenu\(\)[\s\S]*menuPopover\.hidden = true/);
});

test('las fichas usan únicamente las pestañas superiores para navegar', () => {
  const app = read('scripts/app.js');
  assert.doesNotMatch(app, /data-tab-to/);
  assert.doesNotMatch(app, /Ver capturas →|← Volver a descripción|← Volver/);
  assert.match(app, /data-tab="resumen"/);
  assert.match(app, /data-tab="capturas"/);
  assert.match(app, /data-tab="publicacion"/);
  assert.match(app, /selectTab\(win, tab\.dataset\.tab\)/);
});

test('ParTriv abre ficha y solo crea el iframe al pulsar Jugar', () => {
  const app = read('scripts/app.js');
  assert.match(app, /data-start-embedded/);
  assert.match(app, /function startEmbeddedParty\(/);
  assert.match(app, /const embedded = ''/);
  assert.match(app, /party-window/);
  assert.match(read('assets/styles.css'), /\.party-window \.window-controls \.maximize/);
});

test('el juego integrado tiene una cadena flex dimensionable y observa cambios de tamaño', () => {
  const app = read('scripts/app.js');
  const css = read('assets/styles.css');
  assert.match(app, /ResizeObserver/);
  assert.match(app, /frame\.contentWindow\.dispatchEvent\(new Event\('resize'\)\)/);
  assert.match(css, /\.party-window\.party-running\{height:min\(72dvh,760px\)\}/);
  assert.match(css, /\.party-window\.party-running \.window-content\{display:flex;flex:1 1 auto/);
  assert.match(css, /\.party-window\.party-running \.embedded-app-shell\{display:flex;flex:1 1 auto;width:100%;height:100%/);
  assert.match(css, /\.embedded-app-frame\{display:block;width:100%;height:100%;min-width:0;min-height:0/);
});

if (fs.existsSync(new URL('../dist/index.html', import.meta.url))) {
  test('dist contiene las mismas protecciones de codificación e interfaz', () => {
    for (const file of ['dist/scripts/localization.js', 'dist/scripts/catalogo.js', 'dist/scripts/app.js', 'dist/index.html']) {
      assert.equal(mojibake.test(read(file)), false, file);
    }
    assert.doesNotMatch(read('dist/index.html'), /class="brand-menu"/);
    assert.match(read('dist/scripts/app.js'), /class="mobile-back"[\s\S]*?<svg/);
  });
}
