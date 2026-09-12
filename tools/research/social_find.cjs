#!/usr/bin/env node
/* social_find.cjs — GO AND FIND a wrestler's videos. Do not ask a human for links.
 *
 *   node tools/research/social_find.cjs --q "Tarzan Duran" --platform facebook --limit 40
 *   node tools/research/social_find.cjs --profile https://www.facebook.com/randy.christie --limit 60
 *   node tools/research/social_find.cjs --q "Tarzan Duran" --out /tmp/urls.txt
 *
 * WHY: scrape_clips.py can download a URL and segment_match.py can cut it into moves, but something
 * has to SUPPLY the URLs. Owner, plainly: "finding the links and videos is ur job ... stop giving me
 * manual homework". He is right — handing him a search box is not automation.
 *
 * yt-dlp cannot search Facebook (there is no search extractor), so this drives the logged-in browser
 * instead: it reuses the session written by social_login.cjs, runs the platform's own video search or
 * opens a profile's video tab, scrolls to load more, and harvests every video/reel/watch permalink it
 * finds. The output is a plain URL list that feeds straight into scrape_clips.py --source.
 *
 * Same network path as the rest of tools/research: CONNECT relay in front of the agent proxy, TLS
 * capped at 1.2 because the egress middlebox resets 1.3, automation flags erased, headed on Xvfb.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.dirname(path.dirname(__dirname));
const COOKIES = (p) => path.join(ROOT, '.claude', 'social', p + '.cookies.txt');

function arg(n, d) { const i = process.argv.indexOf('--' + n); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d; }

// cookies.txt (Netscape) -> playwright cookie objects
function loadCookies(file) {
  if (!fs.existsSync(file)) return [];
  const out = [];
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    if (!line || line.startsWith('#')) continue;
    const p = line.split('\t');
    if (p.length < 7) continue;
    out.push({ domain: p[0], path: p[2], secure: p[3] === 'TRUE',
               expires: parseInt(p[4], 10) || -1, name: p[5], value: p[6] });
  }
  return out;
}

const RX = {
  facebook: /https?:\/\/(?:www\.)?facebook\.com\/(?:[^\/\s"']+\/videos\/\d+|reel\/\d+|watch\/?\?v=\d+)/g,
  instagram: /https?:\/\/(?:www\.)?instagram\.com\/(?:reel|p|tv)\/[A-Za-z0-9_-]+/g
};

(async () => {
  const platform = (arg('platform', 'facebook')).toLowerCase();
  const q = arg('q', null);
  const profile = arg('profile', null);
  const limit = parseInt(arg('limit', '40'), 10);
  const outFile = arg('out', null);
  const scrolls = parseInt(arg('scrolls', '12'), 10);
  if (!q && !profile) { console.error('need --q "search terms" or --profile <url>'); process.exit(2); }

  let chromium;
  try { ({ chromium } = require('playwright')); }
  catch (e) { console.error('playwright not resolvable; NODE_PATH=/opt/node22/lib/node_modules'); process.exit(3); }

  const relay = await require('./browser_proxy.cjs').start({});
  let xvfb = null, display = process.env.DISPLAY || null;
  if (!display && fs.existsSync('/usr/bin/Xvfb')) {
    display = ':' + (180 + Math.floor(Math.random() * 40));
    xvfb = require('child_process').spawn('/usr/bin/Xvfb',
      [display, '-screen', '0', '1280x1024x24', '-nolisten', 'tcp'], { stdio: 'ignore' });
    await new Promise(r => setTimeout(r, 900));
  }
  const CHROME = fs.readdirSync('/opt/pw-browsers')
    .filter(d => d.startsWith('chromium'))
    .map(d => '/opt/pw-browsers/' + d + '/chrome-linux/chrome')
    .find(p => fs.existsSync(p));

  const browser = await chromium.launch({
    headless: !display,
    env: display ? Object.assign({}, process.env, { DISPLAY: display }) : process.env,
    executablePath: CHROME,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-quic', '--ssl-version-max=tls1.2',
           '--disable-features=PostQuantumKyber,EncryptedClientHello,AutomationControlled',
           '--disable-blink-features=AutomationControlled', '--lang=en-US,en'],
    ignoreDefaultArgs: ['--enable-automation'],
    proxy: { server: relay.url }
  });
  const ctx = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 1000 }, locale: 'en-US'
  });
  const ck = loadCookies(COOKIES(platform));
  if (ck.length) { await ctx.addCookies(ck); console.error('session: ' + ck.length + ' cookie(s) for ' + platform); }
  else console.error('no saved session for ' + platform + ' — results will be limited to public pages');
  await ctx.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    window.chrome = window.chrome || { runtime: {} };
  });

  const page = await ctx.newPage();
  const found = new Map();
  const harvest = async () => {
    const html = await page.content().catch(() => '');
    const rx = RX[platform] || RX.facebook;
    let m;
    rx.lastIndex = 0;
    while ((m = rx.exec(html)) !== null) {
      const u = m[0].replace(/\\+/g, '');
      if (!found.has(u)) found.set(u, true);
    }
  };

  const targets = [];
  if (profile) {
    const base = profile.replace(/\/$/, '');
    targets.push(base + '/videos', base + '/reels', base);
  }
  if (q) {
    if (platform === 'facebook') {
      targets.push('https://www.facebook.com/search/videos/?q=' + encodeURIComponent(q));
      targets.push('https://www.facebook.com/search/posts/?q=' + encodeURIComponent(q));
    } else {
      targets.push('https://www.instagram.com/explore/tags/' + encodeURIComponent(q.replace(/\s+/g, '')) + '/');
    }
  }

  for (const t of targets) {
    if (found.size >= limit) break;
    try {
      console.error('-> ' + t);
      await page.goto(t, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.waitForTimeout(4000);
      await harvest();
      for (let i = 0; i < scrolls && found.size < limit; i++) {
        await page.mouse.wheel(0, 2200);
        await page.waitForTimeout(1600);
        await harvest();
      }
      console.error('   running total: ' + found.size);
    } catch (e) {
      console.error('   failed: ' + String(e.message).split('\n')[0].slice(0, 90));
    }
  }

  const urls = [...found.keys()].slice(0, limit);
  await browser.close(); await relay.close();
  try { if (xvfb) xvfb.kill(); } catch (e) {}

  console.error('\nfound ' + urls.length + ' video url(s)');
  if (outFile) { fs.writeFileSync(outFile, urls.join('\n') + '\n'); console.error('-> ' + outFile); }
  for (const u of urls) console.log(u);
})();
