// Run with: node checks.cjs (no dependencies or network required).
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = file => fs.readFileSync(path.join(__dirname, file), 'utf8');

class Element extends EventTarget {
  constructor() {
    super();
    this.attrs = {};
    this.children = [];
    this.style = {};
    this._classes = new Set();
    this.classList = {
      add: (...cls) => cls.forEach(c => this._classes.add(c)),
      remove: (...cls) => cls.forEach(c => this._classes.delete(c)),
      contains: c => this._classes.has(c),
      toggle: (c, force) => {
        const shouldAdd = typeof force === 'boolean' ? force : !this._classes.has(c);
        if (shouldAdd) this._classes.add(c);
        else this._classes.delete(c);
        return shouldAdd;
      }
    };
  }
  setAttribute(key, value) { this.attrs[key] = String(value); }
  getAttribute(key) { return this.attrs[key] ?? null; }
  removeAttribute(key) { delete this.attrs[key]; }
  hasAttribute(key) { return key in this.attrs; }
  querySelector(sel) {
    for (const child of this.children) {
      if (child instanceof Element) {
        if (sel.startsWith('.') && (child.className || '').split(' ').includes(sel.slice(1))) return child;
        if (sel.startsWith('#') && child.id === sel.slice(1)) return child;
        if (sel === 'iframe' && (child.hasAttribute('data-src') || child.hasAttribute('src'))) return child;
        const res = child.querySelector(sel);
        if (res) return res;
      }
    }
    return null;
  }
  append(...children) { this.children.push(...children); }
  appendChild(child) { this.append(child); }
  replaceChildren(...children) { this.children = children; }
  scrollIntoView() {}
  focus() {}
  getBoundingClientRect() { return { top: 0, bottom: 0, left: 0, right: 0, width: 0, height: 0 }; }
}

async function checkApp(stored) {
  const elements = Object.fromEntries([
    '#radio', '#play-btn', '#volume-slider', '#sticky-volume-slider',
    '#mute-btn', '#sticky-mute-btn', '#recent-tracks-list',
    '#sticky-player', '#audio-status', '#weather-card', '#reproductor',
    '#sticky-top-btn', '#sleep-timer-btn', '#sleep-timer-text', '#sleep-cancel-btn',
    '#chat', '#chat-toggle-btn', '#chat-drawer'
  ].map(id => [id, new Element()]));

  const chatCard = elements['#chat'];
  const chatToggleBtn = elements['#chat-toggle-btn'];
  chatToggleBtn.setAttribute('aria-expanded', 'false');
  chatToggleBtn.setAttribute('aria-controls', 'chat-drawer');

  const toggleText = new Element();
  toggleText.className = 'chat-toggle-text';
  toggleText.textContent = 'Abrir Chat en vivo';
  const toggleArrow = new Element();
  toggleArrow.className = 'chat-toggle-arrow';
  toggleArrow.textContent = '▼';
  chatToggleBtn.append(toggleText, toggleArrow);

  const chatDrawer = elements['#chat-drawer'];
  const chatIframe = new Element();
  chatIframe.setAttribute('data-src', 'https://www3.cbox.ws/box/?boxid=3560755&boxtag=BrdrSs');
  chatDrawer.append(chatIframe);
  elements['#chat iframe[data-src]'] = chatIframe;
  elements['#chat-drawer iframe[data-src]'] = chatIframe;
  elements['#chat-drawer iframe'] = chatIframe;
  elements['#chat iframe'] = chatIframe;
  const radio = elements['#radio'];
  radio.volume = 0.9;
  radio.muted = false;
  radio.paused = true;
  radio.load = () => {};
  radio.play = () => Promise.resolve();
  radio.pause = () => { radio.paused = true; };
  elements['#volume-slider'].value = '0.9';
  const document = Object.assign(new EventTarget(), {
    readyState: 'complete', hidden: false,
    documentElement: new Element(), head: new Element(),
    querySelector: id => elements[id] || null,
    querySelectorAll: () => [], createElement: () => new Element()
  });
  const window = Object.assign(new EventTarget(), {
    matchMedia: () => ({ matches: false, addEventListener() {} }),
    scrollY: 0
  });
  const context = vm.createContext({
    document, window, navigator: { onLine: true },
    localStorage: { getItem: () => null, setItem() {} },
    sessionStorage: { getItem: () => stored, setItem() {} },
    setTimeout: (fn) => typeof fn === 'function' ? (fn(), 1) : 1,
    clearTimeout: () => {},
    setInterval: () => 1,
    clearInterval: () => {},
    URL, console, Math, Date
  });
  vm.runInContext(source('app.js'), context);
  assert.ok(vm.runInContext('Array.isArray(recentTracks) && recentTracks.length <= 5', context));
  const title = '<img src=x onerror="alert(1)"> & canción';
  vm.runInContext(`addRecentTrack(${JSON.stringify(title)})`, context);
  const row = elements['#recent-tracks-list'].children[0];
  assert.equal(row.children[0].textContent, title);
  assert.equal(row.children[0].title, title);
  assert.equal(row.children[0].children.length, 0);
  vm.runInContext('updateNowPlaying({ songtitle: 42 })', context);
  for (const id of ['#volume-slider', '#sticky-volume-slider']) {
    elements[id].value = '0.35';
    elements[id].dispatchEvent(new Event('input'));
    assert.equal(radio.volume, 0.35);
    for (const sliderId of ['#volume-slider', '#sticky-volume-slider']) {
      assert.equal(Number(elements[sliderId].value), 0.35);
      assert.equal(elements[sliderId].getAttribute('aria-valuenow'), '0.35');
    }
  }
  radio.volume = 0.65;
  radio.dispatchEvent(new Event('volumechange'));
  assert.equal(Number(elements['#volume-slider'].value), 0.65);
  assert.equal(Number(elements['#sticky-volume-slider'].value), 0.65);
  radio.muted = true;
  radio.dispatchEvent(new Event('volumechange'));
  assert.equal(elements['#sticky-mute-btn'].getAttribute('aria-pressed'), 'true');
  assert.equal(elements['#volume-slider'].getAttribute('aria-valuetext'), 'Silenciado');

  // Sticky visibility helper and inert/aria-hidden states
  const stickyPlayer = elements['#sticky-player'];
  vm.runInContext('setStickyVisible(true)', context);
  assert.equal(stickyPlayer.classList.contains('is-visible'), true);
  assert.equal(stickyPlayer.getAttribute('aria-hidden'), null);
  assert.equal(stickyPlayer.getAttribute('inert'), null);
  vm.runInContext('setStickyVisible(false)', context);
  assert.equal(stickyPlayer.classList.contains('is-visible'), false);
  assert.equal(stickyPlayer.getAttribute('aria-hidden'), 'true');
  assert.equal(stickyPlayer.getAttribute('inert'), '');

  // stopPlayback helper clears retry states and pauses audio
  radio.paused = false;
  vm.runInContext('stopPlayback()', context);
  assert.equal(radio.paused, true);

  // Play rejection routing to error status
  radio.play = () => Promise.reject(new Error('Playback failed'));
  elements['#play-btn'].dispatchEvent(new Event('click'));
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(elements['#audio-status'].textContent, 'Error al conectar');
  assert.equal(elements['#audio-status'].className, 'stream-status-tag is-error');

  // Offline safety: fetchLiveTrack should not inject script when offline
  context.navigator.onLine = false;
  const headChildCount = document.head.children.length;
  vm.runInContext('fetchLiveTrack()', context);
  assert.equal(document.head.children.length, headChildCount, 'fetchLiveTrack must not inject scripts when offline');
  context.navigator.onLine = true;

  // Mobile Collapsible Cbox Drawer deferred loading verification
  assert.equal(chatToggleBtn.getAttribute('aria-expanded'), 'false');
  assert.equal(chatToggleBtn.getAttribute('aria-controls'), 'chat-drawer');
  assert.equal(chatCard.classList.contains('is-open'), false);
  assert.equal(chatIframe.getAttribute('src'), null);

  // Simulate toggle click: open drawer and verify deferred loading
  chatToggleBtn.dispatchEvent(new Event('click'));
  assert.equal(chatToggleBtn.getAttribute('aria-expanded'), 'true');
  assert.equal(chatCard.classList.contains('is-open'), true);
  assert.equal(chatIframe.getAttribute('src'), 'https://www3.cbox.ws/box/?boxid=3560755&boxtag=BrdrSs');
  assert.equal(chatIframe.src, 'https://www3.cbox.ws/box/?boxid=3560755&boxtag=BrdrSs');
  assert.equal(chatIframe.hasAttribute('data-src'), false);
  assert.equal(toggleText.textContent, 'Cerrar Chat');
  assert.equal(toggleArrow.textContent, '▲');

  // Simulate toggle click: collapse drawer
  chatToggleBtn.dispatchEvent(new Event('click'));
  assert.equal(chatToggleBtn.getAttribute('aria-expanded'), 'false');
  assert.equal(chatCard.classList.contains('is-open'), false);
  assert.equal(toggleText.textContent, 'Abrir Chat en vivo');
  assert.equal(toggleArrow.textContent, '▼');
}

async function checkWorker() {
  const scope = 'https://example.test/rinconada/';
  const prefix = `rinconada-stereo:${scope}:`;
  const cacheName = `${prefix}v6`;
  const entries = new Map();
  const deleted = [];
  const handlers = {};
  let rejectInstall = false;
  let rejectWrites = false;
  let skipped = 0;
  let fetchImpl = async () => { throw new Error('offline'); };
  const key = req => typeof req === 'string' ? req : req.url;
  const cache = {
    async addAll() { if (rejectInstall) throw new Error('missing asset'); },
    async match(req) { return entries.get(key(req)); },
    async put(req, res) {
      if (rejectWrites) throw new Error('quota exceeded');
      entries.set(key(req), res);
    }
  };
  const context = vm.createContext({
    self: {
      registration: { scope }, location: { origin: 'https://example.test' },
      addEventListener: (name, fn) => { handlers[name] = fn; },
      skipWaiting: async () => { skipped++; }, clients: { claim: async () => {} }
    },
    caches: {
      open: async name => { assert.equal(name, cacheName); return cache; },
      keys: async () => [`${prefix}v5`, cacheName, 'other-site', 'rinconada-stereo:https://example.test/other/:v4'],
      delete: async name => { deleted.push(name); return true; }
    },
    fetch: req => fetchImpl(req), URL, Response, console
  });
  vm.runInContext(source('sw.js'), context);

  // Verify PRECACHE_ASSETS contains essential shell, 404 and no redundant PNG variants
  const precache = vm.runInContext('PRECACHE_ASSETS', context);
  assert.ok(Array.isArray(precache));
  assert.ok(precache.includes('index.html'));
  assert.ok(precache.includes('404.html'), 'PRECACHE_ASSETS must include 404.html for offline resilience');
  assert.ok(precache.includes('app.js'));
  assert.ok(!precache.includes('assets/locupez.png'), 'sw.js should avoid precaching bulky redundant PNG variants');

  async function lifecycle(name) {
    const pending = [];
    handlers[name]({ waitUntil: promise => pending.push(promise) });
    await Promise.all(pending);
  }
  rejectInstall = true;
  await assert.rejects(lifecycle('install'), /missing asset/);
  assert.equal(skipped, 0);
  rejectInstall = false;
  await lifecycle('install');
  assert.equal(skipped, 1);
  await lifecycle('activate');
  assert.deepEqual(deleted, [`${prefix}v5`]);

  async function request(url, mode = 'navigate', destination = '') {
    const pending = [];
    let response;
    handlers.fetch({
      request: { url, mode, destination, method: 'GET' },
      respondWith: promise => { response = promise; },
      waitUntil: promise => pending.push(promise)
    });
    const result = await response;
    await Promise.all(pending);
    return result;
  }
  entries.set(scope, new Response('offline shell'));
  assert.equal(await (await request(`${scope}missing-route`)).text(), 'offline shell');
  entries.clear();
  assert.equal((await request(`${scope}missing-route`)).type, 'error');
  assert.equal((await request(`${scope}missing.css`, 'cors')).type, 'error');
  assert.equal(await request('https://play14.tikast.com:22012/stream', 'cors', 'audio'), undefined);
  assert.equal(await request('https://api.open-meteo.com/v1/forecast', 'cors'), undefined);
  fetchImpl = async () => new Response('fresh');
  rejectWrites = true;
  assert.equal(await (await request(scope)).text(), 'fresh');
  rejectWrites = false;
  entries.set(`${scope}styles.css`, new Response('cached'));
  assert.equal(await (await request(`${scope}styles.css`, 'cors')).text(), 'cached');
  assert.equal(await entries.get(`${scope}styles.css`).text(), 'fresh');
}

function checkAssetsAndStyles() {
  const css = source('styles.css');
  assert.ok(!/,\s*@media/.test(css), 'styles.css must not have invalid trailing commas before @media');

  const html = source('index.html');
  assert.ok(!/<link[^>]+sizes=["'](?:512x512|192x192)["'][^>]*>/i.test(html),
    'index.html should not include heavy 192x192 or 512x512 icons in head');
  assert.ok(html.includes('sha256-0aUJUYOhhM/vaekn9gpZ6JIdb61dQ0OdZ4f+9RNrn5U='),
    'index.html CSP must include HTML5 LF hash for theme script');

  const page404 = source('404.html');
  assert.ok(page404.includes('srcset="assets/logo-rinconada.avif"'), '404.html must provide AVIF logo source');
  assert.ok(page404.includes('srcset="assets/locupez.avif"'), '404.html must provide AVIF mascot source');

  const manifest = JSON.parse(source('manifest.webmanifest'));
  assert.ok(manifest.icons.some(i => i.sizes === '192x192'), 'manifest.webmanifest must preserve 192x192 icon');
  assert.ok(manifest.icons.some(i => i.sizes === '512x512'), 'manifest.webmanifest must preserve 512x512 icon');

  // Mobile Collapsible Cbox Drawer in index.html and styles.css
  const chatToggleMatch = html.match(/<button[^>]+id=["']chat-toggle-btn["'][^>]*>/i);
  assert.ok(chatToggleMatch, 'index.html must include #chat-toggle-btn');
  assert.ok(chatToggleMatch[0].includes('aria-expanded="false"'), '#chat-toggle-btn must have initial aria-expanded="false"');
  assert.ok(chatToggleMatch[0].includes('aria-controls="chat-drawer"'), '#chat-toggle-btn must have aria-controls="chat-drawer"');
  assert.ok(html.includes('id="chat-drawer"'), 'index.html must include #chat-drawer');
  assert.ok(html.includes('data-src="https://www3.cbox.ws/box/?boxid=3560755&amp;boxtag=BrdrSs"'),
    'index.html chat iframe must have data-src configured');
  assert.ok(css.includes('.chat-toggle-btn'), 'styles.css must include .chat-toggle-btn');
  assert.ok(css.includes('.chat-drawer'), 'styles.css must include .chat-drawer');
  assert.ok(css.includes('@media (min-width: 901px)'), 'styles.css must include desktop media query for chat drawer');
  assert.ok(css.includes('@media (max-width: 900px)'), 'styles.css must include mobile media query for chat drawer');
}

function checkCloudflareConfigs() {
  const headers = source('_headers');
  assert.ok(headers.includes('/assets/*'), '_headers must define cache policy for /assets/*');
  assert.ok(headers.includes('max-age=31536000, immutable'), '_headers must use 1-year immutable cache for static assets');
  assert.ok(headers.includes('/sw.js'), '_headers must define cache policy for /sw.js');
  assert.ok(headers.includes('max-age=0, must-revalidate'), '_headers must require immediate revalidation for sw.js');
  assert.ok(headers.includes('/404.html'), '_headers must define cache policy for /404.html');
  assert.ok(headers.includes('X-Content-Type-Options: nosniff'), '_headers must include nosniff security header');
  assert.ok(headers.includes('X-Frame-Options: SAMEORIGIN'), '_headers must protect against clickjacking');
  assert.ok(headers.includes('Strict-Transport-Security: max-age=31536000'), '_headers must include HSTS');
  assert.ok(headers.includes('Content-Security-Policy: default-src \'self\''), '_headers must include CSP');
  assert.ok(headers.includes('sha256-0aUJUYOhhM/vaekn9gpZ6JIdb61dQ0OdZ4f+9RNrn5U='),
    '_headers CSP must include HTML5 LF hash for theme script');
  assert.ok(headers.includes('Link: </styles.css>; rel=preload; as=style'), '_headers must configure 103 Early Hints for styles.css');
  assert.ok(headers.includes('Link: </app.js>; rel=preload; as=script'), '_headers must configure 103 Early Hints for app.js');

  const redirects = source('_redirects');
  assert.ok(/\/escuchanos-en-vivo\s+\/\s+301/.test(redirects), '_redirects must redirect /escuchanos-en-vivo to /');
  assert.ok(/\/en-vivo\s+\/\s+301/.test(redirects), '_redirects must redirect /en-vivo to /');
  assert.ok(/\/streaming\s+\/\s+301/.test(redirects), '_redirects must redirect /streaming to /');
  assert.ok(/\/radio\s+\/\s+301/.test(redirects), '_redirects must redirect /radio to /');

  const wranglerConfig = JSON.parse(source('wrangler.jsonc'));
  assert.equal(wranglerConfig.name, 'rinconadastereo', 'wrangler.jsonc must configure worker name');
  assert.equal(wranglerConfig.workers_dev, true, 'wrangler.jsonc must explicitly enable workers_dev to silence CI warning');
  assert.equal(wranglerConfig.preview_urls, true, 'wrangler.jsonc must explicitly configure preview_urls to silence CI warning');
  assert.equal(wranglerConfig.assets.not_found_handling, '404-page', 'wrangler.jsonc must route 404s to 404.html');
  assert.equal(wranglerConfig.assets.directory, '.', 'wrangler.jsonc assets directory must be .');
  assert.equal(wranglerConfig.assets.binding, undefined, 'wrangler.jsonc must not declare an asset binding for an assets-only Worker');

  const assetsIgnore = source('.assetsignore');
  assert.ok(assetsIgnore.includes('.git/'), '.assetsignore must exclude .git/ to prevent source leak');
  assert.ok(assetsIgnore.includes('.githooks/'), '.assetsignore must exclude .githooks/');
  assert.ok(assetsIgnore.includes('*.md'), '.assetsignore must exclude markdown documentation');
  assert.ok(assetsIgnore.includes('research/'), '.assetsignore must exclude research folder');
  assert.ok(assetsIgnore.includes('checks.cjs'), '.assetsignore must exclude test scripts');
  assert.ok(assetsIgnore.includes('.wrangler/'), '.assetsignore must exclude .wrangler/');
  assert.ok(assetsIgnore.includes('package.json'), '.assetsignore must exclude package.json');

  const pkg = JSON.parse(source('package.json'));
  assert.ok(pkg.devDependencies && pkg.devDependencies.wrangler, 'package.json must declare wrangler in devDependencies');
}

function checkInstitutionalIdentity() {
  const filesToCheck = ['app.js', 'index.html', 'llms.txt', 'sw.js', 'manifest.webmanifest', '404.html'];
  const bannedPattern = /\bcomunitari[ao]s?\b/i;

  for (const file of filesToCheck) {
    const content = source(file);
    const match = content.match(bannedPattern);
    assert.ok(!match, `File ${file} contains prohibited term '${match ? match[0] : ''}'. Institutional identity rule: Rinconada Stereo is an online radio station, not a 'comunitaria'.`);
  }

  const marketingBannedPattern = /inter[eé]s\s+social/i;
  for (const file of ['app.js', 'index.html', '404.html', 'sw.js']) {
    const content = source(file);
    const match = content.match(marketingBannedPattern);
    assert.ok(!match, `File ${file} contains bureaucratic marketing phrase '${match ? match[0] : ''}'. Marketing rule: Show, don't tell.`);
  }
}

(async () => {
  checkCloudflareConfigs();
  checkInstitutionalIdentity();
  checkAssetsAndStyles();
  for (const stored of [null, '{bad json', 'null', '{}', '[null,{"title":42}]',
    JSON.stringify(Array.from({ length: 8 }, (_, i) => ({ title: `Track ${i}`, time: '12:00' })))]) {
    await checkApp(stored);
  }
  await checkWorker();
  console.log('PASS: Cloudflare headers & redirects, institutional identity compliance, safe history, stored-data validation, volume sync, scoped caches, offline fallback, cache refresh, install failure, sticky inert state, playback rejection routing, lean precache, clean CSS syntax, low-bandwidth icon hygiene, and mobile chat drawer with deferred loading.');
})().catch(err => { console.error(err); process.exitCode = 1; });

