#!/usr/bin/env node
/* BANNON model snapshotter — auto-rig + preview any GLB/FBX headless, write turnaround PNGs.
 * Usage: node snapshot.cjs <model.glb|.fbx> [outDir] [label]
 * Prints RIG diagnostics JSON; writes <label>_front/side/back/pose.png to outDir. */
const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright/index.js');
const http = require('http'), fs = require('fs'), path = require('path');

const modelArg = process.argv[2];
if (!modelArg) { console.error('usage: node snapshot.cjs <model.glb|.fbx> [outDir] [label]'); process.exit(1); }
const outDir = path.resolve(process.argv[3] || path.join(__dirname, 'shots'));
const label = process.argv[4] || path.basename(modelArg).replace(/\.[^.]+$/, '');
fs.mkdirSync(outDir, { recursive: true });

const TOOL = __dirname;
const modelAbs = path.resolve(modelArg);
const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const MIME = { '.html':'text/html','.js':'text/javascript','.glb':'model/gltf-binary','.gltf':'model/gltf+json','.fbx':'application/octet-stream','.png':'image/png' };

const srv = http.createServer((q, r) => {
  let u = decodeURIComponent(q.url.split('?')[0]);
  let p = u.startsWith('/model.') ? modelAbs : path.join(TOOL, u);
  if (p.endsWith('/')) p += 'preview.html';
  fs.readFile(p, (e, d) => { if (e){ r.writeHead(404); r.end(); return; } r.writeHead(200, {'Content-Type': MIME[path.extname(p)] || 'application/octet-stream'}); r.end(d); });
});

(async () => {
  await new Promise(r => srv.listen(0, r));
  const port = srv.address().port;
  const ext = path.extname(modelAbs).toLowerCase();
  const browser = await chromium.launch({ executablePath: CHROME, args: ['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist','--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 820, height: 820 } });
  page.on('pageerror', e => console.error('PAGEERR', e.message.split('\n')[0]));
  await page.goto(`http://localhost:${port}/preview.html?model=/model${ext}`, { waitUntil: 'load', timeout: 40000 });
  await page.waitForFunction('window.RESULT && window.RESULT.done', { timeout: 30000 }).catch(() => {});
  const R = await page.evaluate(() => window.RESULT);
  console.log('RIG ' + JSON.stringify(R));
  if (R && (R.loadErr || R.err)) { await browser.close(); srv.close(); process.exit(2); }

  const views = [['front', 0], ['fq', 40], ['side', 90], ['back', 180]];
  for (const [name, az] of views) {
    await page.evaluate(a => window.setView(a, 6), az);
    await page.waitForTimeout(120);
    await page.screenshot({ path: path.join(outDir, `${label}_${name}.png`) });
  }
  // articulation preview (bones bent) — proves it's driven, not a statue
  await page.evaluate(() => { window.setView(40, 6); window.setPose(0.5); });
  await page.waitForTimeout(150);
  await page.screenshot({ path: path.join(outDir, `${label}_pose.png`) });
  await page.evaluate(() => window.setPose(0));

  console.log('SHOTS ' + views.map(v => `${label}_${v[0]}.png`).join(', ') + `, ${label}_pose.png -> ${outDir}`);
  await browser.close(); srv.close();
})();
