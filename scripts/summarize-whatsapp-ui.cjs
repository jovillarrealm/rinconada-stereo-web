// Summarize measured MCP results, preserving parent-frame and all-frame CLS separately.
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const dir = path.resolve(process.argv[2] || 'screenshots/whatsapp-ui');
const records = JSON.parse(fs.readFileSync(path.join(dir, 'results.json')));
const environment = JSON.parse(fs.readFileSync(path.join(dir, 'environment.json')));
const median = values => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];
const summary = { environment, samples: [], profiles: [] };
summary.environment.browser = records[0].metrics.userAgent;
summary.environment.afterSha256 = Object.fromEntries(['index.html', 'styles.css'].map(file => [file, crypto.createHash('sha256').update(fs.readFileSync(path.resolve(__dirname, '..', file))).digest('hex')]));
for (const record of records) {
  const label = `${record.profile}-${record.variant}-${record.run}`;
  const text = fs.readFileSync(path.join(dir, `${label}-trace.txt`), 'utf8');
  const trace = JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(dir, `${label}.json.gz`))));
  const shifts = trace.traceEvents.filter(e => e.name === 'LayoutShift' && !e.args?.data?.had_recent_input);
  let cluster = 0, clusterStart = 0, last = 0, traceCls = 0;
  for (const shift of [...shifts].sort((a, b) => a.ts - b.ts)) {
    if (shift.ts - last > 1000000 || shift.ts - clusterStart > 5000000) { cluster = 0; clusterStart = shift.ts; }
    cluster += shift.args.data.weighted_score_delta ?? shift.args.data.score;
    traceCls = Math.max(traceCls, cluster); last = shift.ts;
  }
  summary.samples.push({ profile: record.profile, variant: record.variant, run: record.run, lcpMs: record.metrics.vitals.lcp.ms, traceLcpMs: Number(text.match(/- LCP: ([\d,]+) ms/)?.[1]?.replaceAll(',', '')), parentCls: record.metrics.vitals.cls, traceCls, traceClsRounded: Number(text.match(/- CLS: ([\d.]+)/)?.[1] || 0), mainFrameShiftCount: shifts.filter(e => e.args?.data?.is_main_frame).length, childFrameShiftCount: shifts.filter(e => e.args?.data?.is_main_frame === false).length, lcpElement: record.metrics.vitals.lcp, overflow: record.metrics.overflow });
}
for (const profile of environment.profiles) {
  const before = summary.samples.filter(x => x.profile === profile.name && x.variant === 'before');
  const after = summary.samples.filter(x => x.profile === profile.name && x.variant === 'after');
  assert.equal(before.length, environment.runs, 'Incomplete before measurements');
  assert.equal(after.length, environment.runs, 'Incomplete after measurements');
  const pairs = records.filter(x => x.profile === profile.name);
  let maxGeometryDelta = 0;
  const changes = [];
  for (let run = 1; run <= environment.runs; run++) {
    const a = pairs.find(x => x.run === run && x.variant === 'before');
    const b = pairs.find(x => x.run === run && x.variant === 'after');
    for (const stage of ['metrics', 'scrolled']) {
      if (!a[stage] || !b[stage]) continue;
      for (const [selector, rect] of Object.entries(a[stage].boxes)) for (const axis of ['x', 'y', 'width', 'height']) {
        const delta = Math.abs(rect[axis] - b[stage].boxes[selector][axis]);
        maxGeometryDelta = Math.max(maxGeometryDelta, delta);
        if (delta > 0.1) changes.push({ run, stage, selector, axis, before: rect[axis], after: b[stage].boxes[selector][axis], delta });
      }
    }
  }
  const firstAfter = pairs.find(x => x.run === 1 && x.variant === 'after');
  assert.equal(firstAfter.metrics.chatEmoji, '\u{1f4ac}');
  assert.deepEqual(firstAfter.metrics.logoFills, ['rgb(255, 255, 255)', 'rgb(255, 255, 255)']);
  assert.equal(firstAfter.hover?.logoFills[0], 'rgb(0, 0, 0)');
  assert.equal(firstAfter.stickyHover?.logoFills[1], 'rgb(0, 0, 0)');
  assert.equal(firstAfter.scrolled.stickyVisible, true);
  assert(after.every(x => !x.overflow));
  const lcpBefore = median(before.map(x => x.lcpMs)), lcpAfter = median(after.map(x => x.lcpMs));
  summary.profiles.push({ profile: profile.name, lcpBefore, lcpAfter, lcpDeltaMs: lcpAfter - lcpBefore, lcpDeltaPercent: (lcpAfter / lcpBefore - 1) * 100, lcpBeforeRange: [Math.min(...before.map(x => x.lcpMs)), Math.max(...before.map(x => x.lcpMs))], lcpAfterRange: [Math.min(...after.map(x => x.lcpMs)), Math.max(...after.map(x => x.lcpMs))], parentClsBefore: Math.max(...before.map(x => x.parentCls)), parentClsAfter: Math.max(...after.map(x => x.parentCls)), traceClsBeforeRange: [Math.min(...before.map(x => x.traceClsRounded)), Math.max(...before.map(x => x.traceClsRounded))], traceClsAfterRange: [Math.min(...after.map(x => x.traceClsRounded)), Math.max(...after.map(x => x.traceClsRounded))], mainFrameShiftCount: after.reduce((s, x) => s + x.mainFrameShiftCount, 0), maxGeometryDelta, geometryChangesOverPointOnePixel: changes, chatEmojiPreserved: true, logoVariantsVerified: true, stickyVisible: true, overflow: false });
}
fs.writeFileSync(path.join(dir, 'summary.json'), JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary.profiles, null, 2));
if (summary.profiles.some(x => x.geometryChangesOverPointOnePixel.length)) process.exitCode = 1;
