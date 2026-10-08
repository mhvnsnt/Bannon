#!/usr/bin/env node
/* Capture beauty + UV-encoded renders from identical cameras for texture projection. */
const { chromium } = require('/home/hatch/workspace/brutalfist-fix/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path');

const modelArg = process.argv[2];
const outDir = path.resolve(process.argv[3] || '/tmp/cyborg/views');
const label = process.argv[4] || 'stickup';
fs.mkdirSync(outDir, { recursive: true });

const TOOL = __dirname;
const modelAbs = path.resolve(modelArg);
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
  const ext = path.extname(modelAbs).toLowerCase();
  const browser = await chromium.launch({ executablePath: CHROME,
    args: ['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist','--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1024, height: 1024 } });
  page.on('pageerror', e => console.error('PAGEERR', e.message.split('\n')[0]));
  await page.goto(`http://localhost:${port}/uvcap.html?model=/model${ext}`, { waitUntil: 'load', timeout: 40000 });
  await page.waitForFunction('window.RESULT && window.RESULT.done', { timeout: 30000 }).catch(() => {});
  const R = await page.evaluate(() => window.RESULT);
  console.log('RIG ' + JSON.stringify(R && R.size));

  const views = [['fq', 40], ['side', 130], ['back', 220], ['rside', 310]];
  for (const [name, az] of views) {
    await page.evaluate(a => window.setView(a, 6), az);
    await page.waitForTimeout(150);
    await page.screenshot({ path: path.join(outDir, `${label}_beauty_${name}.png`) });
    await page.evaluate(() => window.setUVMode(true, false));
    await page.waitForTimeout(120);
    await page.screenshot({ path: path.join(outDir, `${label}_uv_${name}.png`) });
    await page.evaluate(() => window.setUVMode(true, true));
    await page.waitForTimeout(120);
    await page.screenshot({ path: path.join(outDir, `${label}_uvf_${name}.png`) });
    await page.evaluate(() => window.setUVMode(false));
  }
  console.log('CAPTURED -> ' + outDir);
  await browser.close(); srv.close();
})().catch(e => { console.error('FATAL', e.message); process.exit(1); });
