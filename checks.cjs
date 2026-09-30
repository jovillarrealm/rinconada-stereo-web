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
      contains: c => this._classes.has(c)
    };
  }
  setAttribute(key, value) { this.attrs[key] = String(value); }
  getAttribute(key) { return this.attrs[key] ?? null; }
  removeAttribute(key) { delete this.attrs[key]; }
  hasAttribute(key) { return key in this.attrs; }
  querySelector() { return null; }
  append(...children) { this.children.push(...children); }
  appendChild(child) { this.append(child); }
  replaceChildren(...children) { this.children = children; }
  scrollIntoView() {}
  focus() {}
}

async function checkApp(stored) {
  const elements = Object.fromEntries([
    '#radio', '#play-btn', '#volume-slider', '#sticky-volume-slider',
    '#mute-btn', '#sticky-mute-btn', '#recent-tracks-list',
    '#sticky-player', '#audio-status', '#weather-card', '#reproductor',
    '#sticky-top-btn', '#sleep-timer-btn', '#sleep-timer-text', '#sleep-cancel-btn'
  ].map(id => [id, new Element()]));
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
}

async function checkWorker() {
  const scope = 'https://example.test/rinconada/';
  const prefix = `rinconada-stereo:${scope}:`;
  const cacheName = `${prefix}v5`;
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
      keys: async () => [`${prefix}v4`, cacheName, 'other-site', 'rinconada-stereo:https://example.test/other/:v4'],
      delete: async name => { deleted.push(name); return true; }
    },
    fetch: req => fetchImpl(req), URL, Response, console
  });
  vm.runInContext(source('sw.js'), context);

  // Verify PRECACHE_ASSETS contains essential shell and no redundant PNG variants
  const precache = vm.runInContext('PRECACHE_ASSETS', context);
  assert.ok(Array.isArray(precache));
  assert.ok(precache.includes('index.html'));
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
  assert.deepEqual(deleted, [`${prefix}v4`]);

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

(async () => {
  for (const stored of [null, '{bad json', 'null', '{}', '[null,{"title":42}]',
    JSON.stringify(Array.from({ length: 8 }, (_, i) => ({ title: `Track ${i}`, time: '12:00' })))]) {
    await checkApp(stored);
  }
  await checkWorker();
  console.log('PASS: safe history, stored-data validation, volume sync, scoped caches, offline fallback, cache refresh, install failure, sticky inert state, playback rejection routing, and lean precache.');
})().catch(err => { console.error(err); process.exitCode = 1; });
