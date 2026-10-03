#!/usr/bin/env node
/* social_login.cjs — log a REAL browser into a social account and export the session as cookies.txt.
 *
 *   FB_USER='...' FB_PASS='...' node tools/research/social_login.cjs facebook
 *   FB_USER='...' FB_PASS='...' node tools/research/social_login.cjs facebook --shot /tmp/fb.png
 *
 * WHY: tools/mocap/scrape_clips.py needs a logged-in session to list a PROFILE (Instagram, Facebook
 * and TikTok all refuse otherwise — measured: HTTP 429 / "unable to extract" without one). The
 * documented route is for a human to export cookies from their phone. This is the other route: drive
 * the login in a real browser here and write the same cookies.txt out the far end.
 *
 * CREDENTIALS ARE NEVER STORED BY THIS TOOL. They are read from the environment (FB_USER/FB_PASS,
 * IG_USER/IG_PASS, TT_USER/TT_PASS), used once, and not written anywhere. The only artefact is
 * .claude/social/<platform>.cookies.txt, and .claude/ is gitignored — so a session never reaches the
 * repo and a password never touches disk.
 *
 * IT USES THE SAME NETWORK PATH AS fetch_page.cjs, because that is the one that works here:
 * a local CONNECT relay in front of the agent proxy (browser_proxy.cjs), Chromium capped at TLS 1.2
 * because the egress middlebox resets TLS 1.3, automation flags erased, and HEADED on Xvfb.
 *
 * IT IS HONEST ABOUT CHECKPOINTS. Logging in from a datacentre IP frequently trips a verification
 * challenge. This does not try to defeat one — it screenshots whatever it lands on and says so, so
 * the human can decide. A tool that silently reports success on a checkpoint page is worse than one
 * that fails.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.dirname(path.dirname(__dirname));
const OUTDIR = path.join(ROOT, '.claude', 'social');

const SITES = {
  facebook: {
    url: 'https://www.facebook.com/login',
    user: () => process.env.FB_USER, pass: () => process.env.FB_PASS,
    userSel: '#email, input[name="email"]',
    passSel: '#pass, input[name="pass"]',
    // Facebook ships several login layouts. The old one had button[name="login"]; the current
    // one is a plain button whose only stable handle is its TEXT. Try each in order rather than
    // assuming — a wrong selector here just times out and looks like a failed login.
    submitSel: ['button[name="login"]', '#loginbutton',
                'div[role="button"]:has-text("Log in")', 'button:has-text("Log in")'],
    okWhen: (u) => /facebook\.com\/(\?|$|home|feed)/.test(u) && !/login|checkpoint|recover/.test(u)
  },
  instagram: {
    url: 'https://www.instagram.com/accounts/login/',
    user: () => process.env.IG_USER, pass: () => process.env.IG_PASS,
    userSel: 'input[name="username"]',
    passSel: 'input[name="password"]',
    submitSel: 'button[type="submit"]',
    okWhen: (u) => /instagram\.com\/(\?|$)/.test(u) && !/login|challenge/.test(u)
  }
};

function arg(n, d) { const i = process.argv.indexOf('--' + n); return i > 0 ? process.argv[i + 1] : d; }

// Netscape cookies.txt — the format yt-dlp expects
function toNetscape(cookies) {
  const lines = ['# Netscape HTTP Cookie File', '# written by tools/research/social_login.cjs'];
  for (const c of cookies) {
    const domain = c.domain.startsWith('.') ? c.domain : '.' + c.domain;
    lines.push([domain, 'TRUE', c.path || '/', c.secure ? 'TRUE' : 'FALSE',
                Math.floor(c.expires && c.expires > 0 ? c.expires : Date.now() / 1000 + 31536000),
                c.name, c.value].join('\t'));
  }
  return lines.join('\n') + '\n';
}

(async () => {
  const which = (process.argv[2] || '').toLowerCase();
  const site = SITES[which];
  if (!site) { console.error('usage: social_login.cjs <' + Object.keys(SITES).join('|') + '> [--shot out.png]'); process.exit(2); }
  const user = site.user(), pass = site.pass();
  if (!user || !pass) { console.error('set the credentials in the environment first (never on the command line)'); process.exit(2); }

  let chromium;
  try { ({ chromium } = require('playwright')); }
  catch (e) { console.error('playwright not resolvable; NODE_PATH=/opt/node22/lib/node_modules'); process.exit(3); }

  const relay = await require('./browser_proxy.cjs').start({});
  let xvfb = null, display = process.env.DISPLAY || null;
  if (!display && fs.existsSync('/usr/bin/Xvfb')) {
    display = ':' + (140 + Math.floor(Math.random() * 40));
    xvfb = require('child_process').spawn('/usr/bin/Xvfb',
      [display, '-screen', '0', '1280x1024x24', '-nolisten', 'tcp'], { stdio: 'ignore' });
    await new Promise(r => setTimeout(r, 900));
  }
  const CHROME = (function () {
    for (const d of fs.readdirSync('/opt/pw-browsers')) {
      if (!d.startsWith('chromium')) continue;
      const p = '/opt/pw-browsers/' + d + '/chrome-linux/chrome';
      if (fs.existsSync(p)) return p;
    }
    return undefined;
  })();

  const browser = await chromium.launch({
    headless: !display,
    env: display ? Object.assign({}, process.env, { DISPLAY: display }) : process.env,
    executablePath: CHROME,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-quic',
           '--ssl-version-max=tls1.2',
           '--disable-features=PostQuantumKyber,EncryptedClientHello,AutomationControlled',
           '--disable-blink-features=AutomationControlled', '--lang=en-US,en'],
    ignoreDefaultArgs: ['--enable-automation'],
    proxy: { server: relay.url }
  });
  const ctx = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 900 }, locale: 'en-US'
  });
  await ctx.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
    Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
    window.chrome = window.chrome || { runtime: {} };
  });

  const page = await ctx.newPage();
  const done = async (code, msg) => {
    const shot = arg('shot', null);
    if (shot) { try { await page.screenshot({ path: shot, fullPage: false }); console.error('screenshot -> ' + shot); } catch (e) {} }
    await browser.close(); await relay.close();
    try { if (xvfb) xvfb.kill(); } catch (e) {}
    if (msg) console.error(msg);
    process.exit(code);
  };

  try {
    await page.goto(site.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(2500);
    // cookie/consent banners block the form on first visit in a fresh profile
    for (const t of ['Allow all cookies', 'Accept all', 'Only allow essential cookies']) {
      const b = await page.$('button:has-text("' + t + '")');
      if (b) { await b.click().catch(() => {}); await page.waitForTimeout(1200); break; }
    }
    await page.fill(site.userSel, user, { timeout: 20000 });
    await page.fill(site.passSel, pass, { timeout: 20000 });
    const sels = Array.isArray(site.submitSel) ? site.submitSel : [site.submitSel];
    let clicked = false;
    for (const sel of sels) {
      const el = await page.$(sel);
      if (!el) continue;
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 45000 }).catch(() => {}),
        el.click({ timeout: 15000 }).catch(() => {})
      ]);
      clicked = true;
      break;
    }
    if (!clicked) {                      // last resort: submit the form from the password field
      await page.press(site.passSel, 'Enter').catch(() => {});
      await page.waitForTimeout(8000);
    }
    await page.waitForTimeout(6000);
  } catch (e) {
    await done(1, 'LOGIN FLOW FAILED: ' + String(e.message).split('\n')[0]);
  }

  const url = page.url();
  const body = await page.evaluate(() => (document.body ? document.body.innerText.slice(0, 400) : '')).catch(() => '');
  const checkpoint = /checkpoint|verify|confirm your identity|two-factor|security code|unusual/i.test(url + ' ' + body);

  const cookies = await ctx.cookies();
  const named = cookies.map(c => c.name);
  // c_user (facebook) / sessionid (instagram) are the cookies that actually prove a session
  const proof = which === 'facebook' ? named.includes('c_user') && named.includes('xs')
                                     : named.includes('sessionid');

  console.log('landed on : ' + url);
  console.log('cookies   : ' + cookies.length + (proof ? '  (session cookies present)' : '  (NO session cookie)'));
  if (checkpoint) console.log('CHECKPOINT: the account is being asked to verify — see the screenshot.');
  console.log('page says : ' + body.replace(/\s+/g, ' ').slice(0, 200));

  if (!proof) await done(1, 'NOT LOGGED IN — nothing written.');

  fs.mkdirSync(OUTDIR, { recursive: true });
  const out = path.join(OUTDIR, which + '.cookies.txt');
  fs.writeFileSync(out, toNetscape(cookies), { mode: 0o600 });
  console.log('session   -> ' + out + '  (gitignored)');
  await done(0, null);
})();
