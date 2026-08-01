#!/usr/bin/env node
/* fetch_page.cjs — read a page that plain HTTP cannot read.
 *
 *   node tools/research/fetch_page.cjs <url> [--text] [--sel "css"] [--wait ms] [--out file]
 *
 * WHY THIS EXISTS. The wrestling-game moveset catalogues the owner pointed at — caws.ws, smacktalks
 * — sit behind a Cloudflare interstitial. curl and WebFetch both get HTTP 403 with a "Just a
 * moment..." challenge page, so from a plain HTTP client those sources simply do not exist. That is
 * the single richest source of per-title moveset section names (Ring In/Out, Apron Ring In/Out,
 * Apron Ringside In/Out, Turnbuckle, Taunts) and it was unreadable.
 *
 * Owner LAW: "instead of telling me you can't do thing build tools and actuators that let you."
 * The container already ships Chromium for the game harness. A real browser solves the challenge the
 * same way the owner's phone does, so this drives it and prints the page.
 *
 * Also honours OWNER LAW — NO GUESSES: this reads the ACTUAL catalogue rather than inventing a list
 * of animation names that sound plausible.
 */
const fs = require('fs');
const path = require('path');

const CHROME = (function () {
  const base = '/opt/pw-browsers';
  try {
    for (const d of fs.readdirSync(base)) {
      if (!d.startsWith('chromium')) continue;
      const p = path.join(base, d, 'chrome-linux', 'chrome');
      if (fs.existsSync(p)) return p;
    }
  } catch (e) { /* fall through */ }
  return process.env.CHROME_PATH || null;
})();

function arg(name, dflt) {
  const i = process.argv.indexOf('--' + name);
  return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : dflt;
}
const has = n => process.argv.indexOf('--' + n) > 0;

(async () => {
  const url = process.argv[2];
  if (!url || url.startsWith('--')) {
    console.error('usage: fetch_page.cjs <url> [--text] [--sel "css"] [--wait 12000] [--out file]');
    process.exit(2);
  }
  let chromium;
  try { ({ chromium } = require('playwright')); }
  catch (e) { console.error('playwright not resolvable; try NODE_PATH=/opt/node22/lib/node_modules'); process.exit(3); }

  // MEASURED, not assumed: Chromium cannot use this container's egress path. Pointed at the agent
  // proxy it returns ERR_CONNECTION_RESET even for example.com (both --proxy-server and Playwright's
  // proxy option); pointed straight out it returns ERR_QUIC_PROTOCOL_ERROR. Node's own fetch reaches
  // example.com with status 200. So the browser does not do the networking at all — Node does, and
  // every request the page makes is fulfilled from Node's response. Chromium is here purely to be a
  // real JS engine with a real DOM, which is the part a Cloudflare interstitial is actually testing.
  const browser = await chromium.launch({
    executablePath: CHROME || undefined,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-quic', '--no-proxy-server']
  });
  const ctx = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 2400 }
  });

  // Every request the page makes goes out through Node. Cookies matter here: a Cloudflare challenge
  // hands back a clearance cookie and the retry must carry it, so set-cookie is pushed into the
  // browser context and the context's cookies are pushed back out on each request.
  await ctx.route('**/*', async (route) => {
    const req = route.request();
    const headers = Object.assign({}, req.headers());
    delete headers['accept-encoding'];   // let Node negotiate; Chromium's list confuses re-encoding
    try {
      const cookies = await ctx.cookies(req.url());
      if (cookies.length) headers['cookie'] = cookies.map(c => c.name + '=' + c.value).join('; ');
    } catch (e) { /* no cookies yet */ }
    let res;
    try {
      res = await fetch(req.url(), {
        method: req.method(),
        headers: headers,
        body: req.postDataBuffer() || undefined,
        redirect: 'manual'
      });
    } catch (e) {
      return route.abort();
    }
    const setCookies = (typeof res.headers.getSetCookie === 'function') ? res.headers.getSetCookie() : [];
    if (setCookies.length) {
      const u = new URL(req.url());
      const jar = [];
      for (const sc of setCookies) {
        const first = sc.split(';')[0];
        const eq = first.indexOf('=');
        if (eq < 0) continue;
        jar.push({ name: first.slice(0, eq).trim(), value: first.slice(eq + 1).trim(),
                   domain: u.hostname, path: '/' });
      }
      if (jar.length) { try { await ctx.addCookies(jar); } catch (e) { /* ignore bad cookie */ } }
    }
    const out = {};
    res.headers.forEach((v, k) => {
      // these describe a transfer Node already undid, and content-security-policy on a challenge
      // page blocks the very script that clears it
      if (['content-encoding', 'content-length', 'transfer-encoding', 'set-cookie'].indexOf(k) < 0) out[k] = v;
    });
    const buf = Buffer.from(await res.arrayBuffer());
    return route.fulfill({ status: res.status, headers: out, body: buf });
  });

  const page = await ctx.newPage();
  const waitMs = parseInt(arg('wait', '14000'), 10);
  let out = '';
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    // Sit on the interstitial until it clears. Do NOT judge by <title> alone — caws.ws titles its
    // challenge page plainly "caws.ws", so a title-only check exits immediately and captures the
    // challenge instead of the content. The body text is what actually says which page this is.
    const CHALLENGE = /just a moment|attention required|checking your browser|security verification|enable javascript and cookies/i;
    const deadline = Date.now() + waitMs;
    while (Date.now() < deadline) {
      const t = await page.title().catch(() => '');
      const b = await page.evaluate(() => (document.body ? document.body.innerText : '')).catch(() => '');
      if (!CHALLENGE.test(t) && !CHALLENGE.test(b) && b.length > 400) break;
      await page.waitForTimeout(1500);
    }
    await page.waitForTimeout(1200);
    const sel = arg('sel', null);
    if (sel) {
      out = await page.$$eval(sel, ns => ns.map(n => n.innerText).join('\n\n'));
    } else if (has('text')) {
      out = await page.evaluate(() => document.body.innerText);
    } else {
      out = await page.content();
    }
  } catch (e) {
    console.error('FETCH FAILED: ' + String(e.message).split('\n')[0]);
    await browser.close();
    process.exit(1);
  }
  await browser.close();
  const dest = arg('out', null);
  if (dest) { fs.writeFileSync(dest, out); console.error('wrote ' + out.length + ' chars -> ' + dest); }
  else process.stdout.write(out);
})();
