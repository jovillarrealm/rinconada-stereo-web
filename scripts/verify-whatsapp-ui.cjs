// Run with the official MCP package installed in screenshots/devtools-tools (see docs/verification.md).
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { pathToFileURL } = require('node:url');
const { spawn, execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const option = (key, fallback) => process.argv.find(x => x.startsWith(`--${key}=`))?.split('=').slice(1).join('=') || fallback;
const runs = Number(option('runs', '3'));
const out = path.resolve(root, option('out', 'screenshots/whatsapp-ui'));
const baselineRef = option('baseline', '86b91a9d6fec696bde39262c9f87536d96a54767');
fs.mkdirSync(out, { recursive: true });
const baseline = Object.fromEntries(['index.html', 'styles.css'].map(file => [file, execFileSync('git', ['show', `${baselineRef}:${file}`], { cwd: root })]));
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.avif': 'image/avif', '.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon' };
const server = http.createServer((req, res) => {
  const parts = decodeURIComponent(new URL(req.url, 'http://localhost').pathname).split('/').filter(Boolean);
  const variant = parts.shift(), file = parts.join('/') || 'index.html';
  // Serve public assets only. SW returns 404 so previous caches cannot contaminate comparisons.
  if (!['before', 'after'].includes(variant) || !/^(assets\/[\w./-]+|index\.html|styles\.css|app\.js|manifest\.webmanifest|manifest\.json|favicon\.ico)$/.test(file) || parts.includes('..')) { res.writeHead(404); return res.end(); }
  try {
    const body = variant === 'before' && baseline[file] ? baseline[file] : fs.readFileSync(path.join(root, file));
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' }); res.end(body);
  } catch { res.writeHead(404); res.end(); }
});
const binary = path.join(root, 'screenshots/devtools-tools/node_modules/chrome-devtools-mcp/build/src/bin/chrome-devtools-mcp.js');
const proc = spawn(process.execPath, [binary, '--headless', '--isolated', '--no-usage-statistics', '--no-performance-crux'], { cwd: root, stdio: ['pipe', 'pipe', 'pipe'] });
let id = 0, buffer = '';
const pending = new Map();
proc.stderr.on('data', data => fs.appendFileSync(path.join(out, 'mcp-stderr.log'), data));
proc.stdout.on('data', data => {
  buffer += data;
  let end;
  while ((end = buffer.indexOf('\n')) >= 0) {
    const line = buffer.slice(0, end); buffer = buffer.slice(end + 1);
    try {
      const msg = JSON.parse(line);
      if (msg.method === 'roots/list') proc.stdin.write(JSON.stringify({ jsonrpc: '2.0', id: msg.id, result: { roots: [{ uri: pathToFileURL(root).href, name: 'rinconada-stereo-web' }] } }) + '\n');
      else if (pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
    } catch {}
  }
});
proc.on('exit', code => { for (const resolve of pending.values()) resolve({ error: { message: `MCP exited: ${code}` } }); pending.clear(); });
function request(method, params) {
  const key = ++id;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { pending.delete(key); reject(Error(`MCP timeout: ${method}`)); }, 60000);
    pending.set(key, msg => { clearTimeout(timer); msg.error ? reject(Error(JSON.stringify(msg.error))) : resolve(msg.result); });
    proc.stdin.write(JSON.stringify({ jsonrpc: '2.0', id: key, method, params }) + '\n');
  });
}
async function tool(name, args) {
  const result = await request('tools/call', { name, arguments: args });
  const text = result.content?.filter(x => x.type === 'text').map(x => x.text).join('\n') || '';
  fs.appendFileSync(path.join(out, 'mcp-calls.jsonl'), JSON.stringify({ name, args, result }) + '\n');
  if (result.isError) throw Error(`${name}: ${text}`);
  return text;
}
function parseEvaluation(text) {
  const match = text.match(/```json\s*([\s\S]*?)```/);
  if (!match) throw Error(`Unexpected evaluation response: ${text}`);
  return JSON.parse(match[1]);
}
function observe(theme) {
  localStorage.clear(); localStorage.setItem('rinconada_theme', theme);
  window.__vitals = { lcp: null, shifts: [] };
  new PerformanceObserver(list => {
    for (const e of list.getEntries()) window.__vitals.lcp = { ms: e.startTime, tag: e.element?.tagName, id: e.element?.id, url: e.url, size: e.size };
  }).observe({ type: 'largest-contentful-paint', buffered: true });
  new PerformanceObserver(list => {
    for (const e of list.getEntries()) window.__vitals.shifts.push({ time: e.startTime, value: e.value, hadRecentInput: e.hadRecentInput, sources: e.sources?.map(s => ({ tag: s.node?.tagName, id: s.node?.id, className: s.node?.className, previousRect: s.previousRect.toJSON(), currentRect: s.currentRect.toJSON() })) });
  }).observe({ type: 'layout-shift', buffered: true });
}
function collect() {
  const rect = el => { const r = el.getBoundingClientRect(); return { x: r.x, y: r.y + scrollY, width: r.width, height: r.height }; };
  let max = 0, sum = 0, start = 0, last = 0;
  for (const e of window.__vitals.shifts.filter(e => !e.hadRecentInput)) {
    if (e.time - last > 1000 || e.time - start > 5000) { sum = 0; start = e.time; }
    sum += e.value; max = Math.max(max, sum); last = e.time;
  }
  const boxes = {};
  for (const sel of ['.site-header', '.main-grid', '.player-card', '#now-playing-box', '.track-actions-bar', '#track-share-wa', '.track-wa-icon', '.track-wa-label', '#locupez', '#chat', '#chat-toggle-btn', '.chat-toggle-icon', '#clima', 'footer', '#sticky-player', '.sticky-player-left', '#sticky-wa-btn', '.sticky-wa-icon', '.sticky-wa-text']) {
    const el = document.querySelector(sel); if (el) boxes[sel] = rect(el);
  }
  return { vitals: { ...window.__vitals, cls: max }, boxes, overflow: document.documentElement.scrollWidth > innerWidth, theme: document.documentElement.dataset.theme, chatEmoji: document.querySelector('.chat-toggle-icon')?.textContent, logoFills: [...document.querySelectorAll('.track-wa-icon svg, .sticky-wa-icon svg')].map(el => getComputedStyle(el).fill), userAgent: navigator.userAgent, documentHeight: document.documentElement.scrollHeight, resources: performance.getEntriesByType('resource').map(r => ({ name: r.name, transferSize: r.transferSize, duration: r.duration })), stickyVisible: document.querySelector('#sticky-player').classList.contains('is-visible') };
}
const profiles = [{ name: 'desktop-light', viewport: '1440x900x1', theme: 'light' }, { name: 'desktop-dark', viewport: '1440x900x1', theme: 'dark' }, { name: 'mobile-light', viewport: '390x844x1,mobile,touch', theme: 'light' }, { name: 'mobile-dark', viewport: '390x844x1,mobile,touch', theme: 'dark' }];
(async () => {
  const results = [];
  try {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const origin = `http://127.0.0.1:${server.address().port}`;
    const initialized = await request('initialize', { protocolVersion: '2025-03-26', capabilities: { roots: { listChanged: false } }, clientInfo: { name: 'rinconada-ui-verification', version: '1.0' } });
    proc.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n');
    fs.writeFileSync(path.join(out, 'environment.json'), JSON.stringify({ initialized, baselineRef, node: process.version, date: new Date().toISOString(), runs, profiles, cpuThrottlingRate: 4, networkConditions: 'Fast 4G', sw: '404 on test server; no SW cache', observationMs: 5000, externalServices: 'live, uncontrolled' }, null, 2));
    for (const profile of profiles) for (let run = 1; run <= runs; run++) for (const variant of run % 2 ? ['before', 'after'] : ['after', 'before']) {
      const label = `${profile.name}-${variant}-${run}`;
      const pageText = await tool('new_page', { url: 'about:blank', isolatedContext: label });
      const pageId = Number(pageText.match(/(\d+): about:blank \[selected\]/)?.[1]);
      if (!pageId) throw Error(`Missing page ID: ${pageText}`);
      await tool('emulate', { pageId, viewport: profile.viewport, colorScheme: profile.theme, cpuThrottlingRate: 4, networkConditions: 'Fast 4G' });
      await tool('performance_start_trace', { pageId, reload: false, autoStop: false });
      await tool('navigate_page', { pageId, url: `${origin}/${variant}/`, initScript: `(${observe.toString()})(${JSON.stringify(profile.theme)})`, timeout: 20000 });
      await tool('evaluate_script', { pageId, function: 'async () => { await document.fonts.ready; await new Promise(r => setTimeout(r, Math.max(0, 5000 - performance.now()))); return true; }', waitForStableDom: false });
      const metrics = parseEvaluation(await tool('evaluate_script', { pageId, function: collect.toString(), waitForStableDom: false }));
      const trace = await tool('performance_stop_trace', { pageId, filePath: path.join(out, `${label}.json.gz`) });
      fs.writeFileSync(path.join(out, `${label}-trace.txt`), trace);
      if (run === 1) for (const insightName of ['CLSCulprits', 'LCPBreakdown']) {
        if (trace.includes(`insight name: ${insightName}`)) {
          const insightSetId = trace.match(/insight set id: (\S+)/)?.[1];
          if (insightSetId) fs.writeFileSync(path.join(out, `${label}-${insightName}.txt`), await tool('performance_analyze_insight', { pageId, insightName, insightSetId }));
        }
      }
      const record = { profile: profile.name, run, variant, metrics };
      if (run === 1) {
        await tool('take_screenshot', { pageId, filePath: path.join(out, `${label}-top.png`) });
        const snapshot = await tool('take_snapshot', { pageId });
        fs.writeFileSync(path.join(out, `${label}-snapshot.txt`), snapshot);
        const uid = snapshot.match(/uid=([\w_]+) link "Dedicar en cabina por WhatsApp"/)?.[1];
        if (uid) {
          await tool('hover', { pageId, uid });
          await tool('evaluate_script', { pageId, function: 'async () => { await new Promise(r => setTimeout(r, 250)); return true; }', waitForStableDom: false });
          record.hover = parseEvaluation(await tool('evaluate_script', { pageId, function: collect.toString(), waitForStableDom: false }));
          await tool('take_screenshot', { pageId, filePath: path.join(out, `${label}-hover.png`) });
        }
        await tool('evaluate_script', { pageId, function: 'async () => { scrollTo({top: document.documentElement.scrollHeight, behavior: "instant"}); await new Promise(r => setTimeout(r, 800)); return true; }', waitForStableDom: false });
        record.scrolled = parseEvaluation(await tool('evaluate_script', { pageId, function: collect.toString(), waitForStableDom: false }));
        await tool('take_screenshot', { pageId, filePath: path.join(out, `${label}-sticky.png`) });
        const stickySnapshot = await tool('take_snapshot', { pageId });
        const stickyUid = stickySnapshot.match(/uid=([\w_]+) link "Pedir tema por WhatsApp"/)?.[1];
        if (stickyUid) {
          await tool('hover', { pageId, uid: stickyUid });
          await tool('evaluate_script', { pageId, function: 'async () => { await new Promise(r => setTimeout(r, 250)); return true; }', waitForStableDom: false });
          record.stickyHover = parseEvaluation(await tool('evaluate_script', { pageId, function: collect.toString(), waitForStableDom: false }));
          await tool('take_screenshot', { pageId, filePath: path.join(out, `${label}-sticky-hover.png`) });
        }
        record.console = await tool('list_console_messages', { pageId, types: ['error', 'warn'] });
        record.network = await tool('list_network_requests', { pageId });
      }
      results.push(record);
      fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify(results, null, 2));
      console.log(`${label}: LCP=${metrics.vitals.lcp?.ms?.toFixed(1)}ms CLS=${metrics.vitals.cls.toFixed(6)} overflow=${metrics.overflow}`);
      await tool('close_page', { pageId });
    }
  } finally { proc.stdin.end(); proc.kill(); server.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
