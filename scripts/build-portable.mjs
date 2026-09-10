/**
 * Builds a single, self-contained `Forward.html` you can double-click.
 *
 * The normal build (`npm run build`) produces a folder whose scripts must be
 * served over HTTP — browsers refuse to load `file://` module scripts. This
 * script inlines the JS + CSS into one HTML file instead, which Chrome and Edge
 * will happily run straight from disk (localStorage works there too, so your
 * progress is kept).
 *
 * Caveat: a service worker can't register from `file://`, so this file is for
 * *using* the app offline from disk. Install / offline-caching still needs
 * `npm run preview` over HTTP.
 *
 *   npm run build:portable
 */
import { execSync } from 'node:child_process';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');

console.log('→ building…\n');
execSync('npm run build', { cwd: root, stdio: 'inherit' });

const assetsDir = join(dist, 'assets');
const assets = readdirSync(assetsDir);

const cssFile = assets.find((name) => name.endsWith('.css'));
const jsFile = assets.find((name) => name.endsWith('.js'));
if (!cssFile || !jsFile) throw new Error('No built .css/.js found in dist/assets');

const css = readFileSync(join(assetsDir, cssFile), 'utf8');
const js = readFileSync(join(assetsDir, jsFile), 'utf8');
const favicon = readFileSync(join(dist, 'favicon.svg'), 'utf8');

// `</script>` / `</style>` inside a string would close the tag early.
const escapeClosing = (code, tag) =>
  code.replace(new RegExp(`</${tag}`, 'gi'), () => `<\\/${tag}`);

const escapedCss = escapeClosing(css, 'style');
const escapedJs = escapeClosing(js, 'script');
const faviconUri = `data:image/svg+xml,${encodeURIComponent(favicon)}`;

let html = readFileSync(join(dist, 'index.html'), 'utf8');

// NOTE: every replacement below uses a *function*, because a string replacement
// would treat `$&`, `$\``, `$'` and `$1` inside the minified bundle as special
// patterns and silently corrupt the output.
html = html
  // swap the external favicon for an inline data URI
  .replace('href="./favicon.svg"', () => `href="${faviconUri}"`)
  // drop everything that needs a server next to the file
  .replace(/<link rel="apple-touch-icon"[^>]*>/g, '')
  .replace(/<link rel="manifest"[^>]*>/g, '')
  .replace(/<link rel="stylesheet"[^>]*>/g, '')
  .replace(/<script id="vite-plugin-pwa:register-sw"[^>]*><\/script>/g, '')
  .replace(/<script type="module"[^>]*src="\.\/assets\/[^"]+"[^>]*><\/script>/g, '')
  // inline the stylesheet and the app bundle
  .replace('</head>', () => `<style>${escapedCss}</style></head>`)
  .replace('</body>', () => `<script type="module">${escapedJs}</script></body>`);


const outFile = join(root, 'Forward.html');
writeFileSync(outFile, html);

const kb = Math.round(Buffer.byteLength(html) / 1024);
console.log(`\n✓ wrote Forward.html (${kb} kB) — double-click it to open Forward.`);
