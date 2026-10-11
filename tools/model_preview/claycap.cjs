#!/usr/bin/env node
/* Clay + textured closeup captures for geometry-truth evidence. */
const { chromium } = require('/home/hatch/workspace/brutalfist-fix/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path');

const modelAbs = path.resolve(process.argv[2]);
const outDir = path.resolve(process.argv[3]);
const label = process.argv[4];
fs.mkdirSync(outDir, { recursive: true });
const TOOL = __dirname;
const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const MIME = { '.html':'text/html','.js':'text/javascript','.glb':'model/gltf-binary','.png':'image/png' };
const srv = http.createServer((q, r) => {
  let u = decodeURIComponent(q.url.split('?')[0]);
  let p = u.startsWith('/model.') ? modelAbs : path.join(TOOL, u);
  if (p.endsWith('/')) p += 'uvcap.html';
  fs.readFile(p, (e, d) => { if (e){ r.writeHead(404); r.end(); return; }
    r.writeHead(200, {'Content-Type': MIME[path.extname(p)] || 'application/octet-stream'}); r.end(d); });
});
(async () => {
  await new Promise(r => srv.listen(0, r));
  const port = srv.address().port;
  const browser = await chromium.launch({ executablePath: CHROME,
    args: ['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist','--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1000, height: 1000 } });
  await page.goto(`http://localhost:${port}/uvcap.html?model=/model.glb`, { waitUntil: 'load', timeout: 40000 });
  await page.waitForFunction('window.RESULT && window.RESULT.done', { timeout: 30000 }).catch(() => {});
  // textured fq + front
  await page.evaluate(a => window.setView(a, 6), 40); await page.waitForTimeout(150);
  await page.screenshot({ path: path.join(outDir, `${label}_tex_fq.png`) });
  await page.evaluate(a => window.setView(a, 6), 130); await page.waitForTimeout(150);
  await page.screenshot({ path: path.join(outDir, `${label}_tex_front.png`) });
  // clay fq + front (same cameras)
  await page.evaluate(() => window.setClayMode(true)); await page.waitForTimeout(120);
  await page.evaluate(a => window.setView(a, 6), 40); await page.waitForTimeout(150);
  await page.screenshot({ path: path.join(outDir, `${label}_clay_fq.png`) });
  await page.evaluate(a => window.setView(a, 6), 130); await page.waitForTimeout(150);
  await page.screenshot({ path: path.join(outDir, `${label}_clay_front.png`) });
  console.log('CLAY CAPTURED -> ' + outDir);
  await browser.close(); srv.close();
})().catch(e => { console.error('FATAL', e.message); process.exit(1); });
