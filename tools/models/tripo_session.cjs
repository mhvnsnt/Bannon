#!/usr/bin/env node
/* tripo_session.cjs — use the OWNER'S OWN Tripo account through a LOGIN, not an API key.
 *
 *   TRIPO_EMAIL=... TRIPO_PASSWORD=... node tools/models/tripo_session.cjs --login
 *   node tools/models/tripo_session.cjs --check
 *   node tools/models/tripo_session.cjs --list            # what is in the account's workspace
 *   node tools/models/tripo_session.cjs --pull <id> --name KAGE
 *
 * OWNER: "could hook up my tripo 3d account to this through logins and not API keys".
 *
 * Exactly the pattern already proven in tools/research/social_login.cjs: drive a REAL browser,
 * log in once, keep the SESSION, and reuse it. Same network stack, because this container's egress
 * needs all of it — a CONNECT relay in front (the agent proxy accepts only CONNECT and Chromium
 * fires plain-HTTP telemetry that kills the session), TLS capped at 1.2 (the middlebox RESETS a
 * TLS 1.3 ClientHello), automation flags erased, and HEADED on Xvfb because headless is detectable
 * in ways a flag cannot hide. And ALWAYS READ HTTPS_PROXY FROM THE ENVIRONMENT — the port is
 * assigned per session, and hardcoding it once already cost a wrong "no egress" conclusion.
 *
 * CREDENTIALS COME FROM THE ENVIRONMENT, ARE USED ONCE, AND ARE NEVER WRITTEN TO DISK. The session
 * lands in .claude/tripo/session.json, and .claude/ is gitignored, so a token never reaches the
 * repo. Same rule as the social sessions.
 *
 * WHY THIS IS THE SECOND CHOICE, NOT THE FIRST: tools/models/image_to_3d.py generates a mesh here
 * in ~25 seconds on CPU with no account, no credits and no queue, and it is MIT. Use the Tripo
 * account when its quality is worth the credits — for hero characters — and generate locally for
 * the long tail. Both land in the same place and go through the same rig-and-gate chain.
 *
 * HONEST LIMIT, STATED UP FRONT: Tripo's web app is a private, unversioned interface. The login
 * flow and the workspace endpoints below are read from the live page at run time rather than
 * hardcoded, but a redesign on their side WILL break this, and the failure mode is a screenshot
 * plus a clear message rather than a silent wrong answer. It refuses to claim success without a
 * real session cookie.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.dirname(path.dirname(__dirname));
const DIR = path.join(ROOT, '.claude', 'tripo');
const SESSION = path.join(DIR, 'session.json');
const argv = process.argv.slice(2);
const has = f => argv.includes('--' + f);
const arg = (f, d) => { const i = argv.indexOf('--' + f); return i >= 0 && argv[i + 1] ? argv[i + 1] : d; };

const LOGIN_URL = 'https://www.tripo3d.ai/login';
const APP_URL = 'https://www.tripo3d.ai/app';

function saveSession(cookies, origins) {
  fs.mkdirSync(DIR, { recursive: true });
  fs.writeFileSync(SESSION, JSON.stringify({ cookies, origins, at: new Date().toISOString() }, null, 1));
  fs.chmodSync(SESSION, 0o600);
}
const loadSession = () => (fs.existsSync(SESSION) ? JSON.parse(fs.readFileSync(SESSION, 'utf8')) : null);

// A session is REAL when the browser holds an auth cookie for the domain — not when a page happened
// to render. social_login.cjs learned this the hard way: a wrong selector times out and reads
// exactly like a rejected password.
const AUTHY = /session|token|auth|sid|jwt|login/i;
const looksAuthed = cookies =>
  (cookies || []).some(c => /tripo3d\.ai$/.test((c.domain || '').replace(/^\./, '')) &&
                            AUTHY.test(c.name) && String(c.value || '').length > 20);

async function browser() {
  let chromium;
  try { ({ chromium } = require('playwright')); }
  catch (e) { console.error('playwright not resolvable; try NODE_PATH=/opt/node22/lib/node_modules'); process.exit(3); }

  const relay = await require('../research/browser_proxy.cjs').start({});
  let xvfb = null, display = process.env.DISPLAY || null;
  if (!display && fs.existsSync('/usr/bin/Xvfb')) {
    display = ':' + (180 + Math.floor(Math.random() * 40));
    xvfb = require('child_process').spawn('/usr/bin/Xvfb',
      [display, '-screen', '0', '1280x1024x24', '-nolisten', 'tcp'], { stdio: 'ignore' });
    await new Promise(r => setTimeout(r, 900));
  }
  const CHROME = (() => {
    for (const d of fs.readdirSync('/opt/pw-browsers')) {
      if (!d.startsWith('chromium')) continue;
      const p = '/opt/pw-browsers/' + d + '/chrome-linux/chrome';
      if (fs.existsSync(p)) return p;
    }
  })();
  const b = await chromium.launch({
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
  const saved = loadSession();
  const ctx = await b.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 900 }, locale: 'en-US',
    storageState: saved ? { cookies: saved.cookies || [], origins: saved.origins || [] } : undefined
  });
  await ctx.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
    Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
    window.chrome = window.chrome || { runtime: {} };
  });
  return { b, ctx, relay, close: async () => { await b.close(); await relay.close(); try { if (xvfb) xvfb.kill(); } catch (e) {} } };
}

async function shot(page, name) {
  try {
    fs.mkdirSync(DIR, { recursive: true });
    const p = path.join(DIR, name + '.png');
    await page.screenshot({ path: p });
    console.error('  screenshot -> ' + p + '   LOOK AT IT before believing a failure');
  } catch (e) {}
}

(async () => {
  if (has('login')) {
    const email = process.env.TRIPO_EMAIL, pass = process.env.TRIPO_PASSWORD;
    if (!email || !pass) {
      console.error('Set TRIPO_EMAIL and TRIPO_PASSWORD in the environment for this one call.\n' +
                    'They are used once and never written to disk; only the resulting session is kept,\n' +
                    'in .claude/tripo/session.json, which is gitignored.');
      process.exit(2);
    }
    const { ctx, close } = await browser();
    const page = await ctx.newPage();
    try {
      await page.goto(LOGIN_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.waitForTimeout(2500);
      // Find the fields by TYPE, not by a brittle id. social_login's Facebook note applies here:
      // a wrong selector times out and is indistinguishable from a rejected password.
      const user = page.locator('input[type="email"], input[name="email"], input[autocomplete="username"]').first();
      const pw = page.locator('input[type="password"]').first();
      await user.waitFor({ timeout: 20000 });
      await user.fill(email);
      await pw.fill(pass);
      const btn = page.locator('button[type="submit"], button:has-text("Sign in"), button:has-text("Log in"), button:has-text("Continue")').first();
      await btn.click({ timeout: 15000 }).catch(() => pw.press('Enter'));
      await page.waitForTimeout(7000);
      const cookies = await ctx.cookies();
      if (!looksAuthed(cookies)) {
        await shot(page, 'login-failed');
        console.error('  no session cookie for tripo3d.ai — NOT claiming success.\n' +
                      '  Most likely: a wrong password, an e-mail code / 2FA step, or a redesigned form.\n' +
                      '  The screenshot shows which.');
        await close(); process.exit(1);
      }
      saveSession(cookies, (await ctx.storageState()).origins);
      console.log('  signed in. session -> ' + SESSION + ' (0600, gitignored)');
      await close();
    } catch (e) {
      await shot(page, 'login-error');
      console.error('  ' + String(e.message).split('\n')[0]);
      await close(); process.exit(1);
    }
    return;
  }

  if (has('check') || has('list') || has('pull')) {
    if (!loadSession()) { console.error('No session. Run with --login first.'); process.exit(2); }
    const { ctx, close } = await browser();
    const page = await ctx.newPage();
    await page.goto(APP_URL, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});
    await page.waitForTimeout(4000);
    const cookies = await ctx.cookies();
    const ok = looksAuthed(cookies) && !/\/login/.test(page.url());
    console.log('  session: ' + (ok ? 'VALID' : 'EXPIRED or rejected — re-run --login'));
    if (!ok) { await shot(page, 'check'); await close(); process.exit(1); }

    if (has('check')) { saveSession(cookies, (await ctx.storageState()).origins); await close(); return; }

    // The workspace listing is read from whatever the app itself calls — nothing is hardcoded,
    // because a private API changes without notice and a guessed endpoint fails silently.
    const seen = [];
    page.on('response', r => {
      const u = r.url();
      if (/tripo3d\.ai\/.*\/(task|model|asset|generat|history|workspace)/i.test(u) && r.request().method() !== 'OPTIONS')
        seen.push(u);
    });
    await page.reload({ waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
    await page.waitForTimeout(3000);
    const glbs = await page.evaluate(() =>
      performance.getEntriesByType('resource').map(e => e.name).filter(n => /\.glb(\?|$)/i.test(n)));
    console.log('  workspace endpoints the app called: ' + (seen.length ? '' : '(none seen)'));
    [...new Set(seen)].slice(0, 12).forEach(u => console.log('    ' + u.slice(0, 150)));
    if (glbs.length) { console.log('  model files the page loaded:'); [...new Set(glbs)].slice(0, 20).forEach(u => console.log('    ' + u.slice(0, 150))); }
    else console.log('  no .glb requests observed — the app may render previews only until you export.');
    await shot(page, 'workspace');
    await close();
    return;
  }

  console.log(fs.readFileSync(__filename, 'utf8').split('*/')[0].replace(/^\/\*|^ \*ted?/gm, ''));
})();
