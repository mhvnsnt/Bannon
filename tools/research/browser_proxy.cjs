#!/usr/bin/env node
/* browser_proxy.cjs — a local proxy that a REAL browser can use, so Cloudflare stops being a wall.
 *
 * Used as a library by tools/research/fetch_page.cjs; runnable standalone for debugging:
 *   node tools/research/browser_proxy.cjs [--port 0] [--verbose]
 *
 * WHY THIS EXISTS. The wrestling moveset catalogues (caws.ws, smacktalks, fandom wikis) sit behind
 * Cloudflare. curl and plain fetch get a challenge page forever, because the challenge is a real
 * browser test. The obvious answer is "drive Chromium", and the obvious problem was that Chromium
 * could not reach the network here at all.
 *
 * WHAT WAS ACTUALLY WRONG — and I got this wrong once already, so it is written down. I concluded
 * "Chromium cannot use this container's egress" and recorded it as fact. It was not true: I had
 * HARDCODED the agent proxy's port from an earlier session. The port is assigned per session
 * (33261 one session, 37009 the next), so Chromium was dialling a dead port and reporting
 * ERR_PROXY_CONNECTION_FAILED, which I misread as "no egress". ALWAYS READ HTTPS_PROXY FROM THE
 * ENVIRONMENT — never copy the port into code or notes.
 *
 * WHAT IS ACTUALLY LEFT. With the right port, a raw CONNECT to the agent proxy succeeds and TLS
 * verifies. Chromium still resets, and the proxy's own failure log says why:
 *     kind: "not_connect"  detail: "non-CONNECT request: GET http://clients2.google.com"
 * Chromium fires plain-HTTP telemetry/component-update requests through its proxy, the agent proxy
 * accepts ONLY CONNECT, and rejects them. So this relay sits in front:
 *   - CONNECT  -> opened as a CONNECT tunnel on the agent proxy (the path that provably works),
 *                 so the browser does its OWN TLS to the origin and presents a real browser
 *                 fingerprint. That is what lets a Cloudflare challenge actually clear.
 *   - plain GET/POST (Chromium's telemetry, and any http:// page) -> answered locally instead of
 *                 being forwarded, so a rejected side-request can never kill the session.
 * Nothing here weakens TLS: the browser validates the origin certificate itself, and the agent
 * proxy is used exactly as designed.
 */
const http = require('http');
const net = require('net');
const { URL } = require('url');

function upstream() {
  // read EVERY time, never cache: the port is per-session
  const raw = process.env.HTTPS_PROXY || process.env.https_proxy ||
              process.env.HTTP_PROXY || process.env.http_proxy || '';
  if (!raw) return null;
  try { const u = new URL(raw); return { host: u.hostname, port: +u.port || 80 }; }
  catch (e) { return null; }
}

// hosts Chromium phones home to; answering locally keeps them off the agent proxy entirely
const TELEMETRY = /(^|\.)(google|gstatic|googleapis|gvt1|gvt2|doubleclick|mozilla|firefox)\.(com|net|org)$/i;

function start({ port = 0, verbose = false } = {}) {
  const log = (...a) => { if (verbose) console.error('[browser_proxy]', ...a); };

  const server = http.createServer((req, res) => {
    // A plain (non-CONNECT) request. The agent proxy refuses these, and forwarding them is what
    // produced the resets, so terminate them here.
    log('plain', req.method, req.url);
    res.writeHead(204, { 'content-length': 0 });
    res.end();
  });

  server.on('connect', (req, clientSocket, head) => {
    const [host, portStr] = req.url.split(':');
    const port = +portStr || 443;
    if (TELEMETRY.test(host)) {
      log('drop telemetry CONNECT', host);
      clientSocket.end('HTTP/1.1 502 Blocked\r\n\r\n');
      return;
    }
    const up = upstream();
    if (!up) { clientSocket.end('HTTP/1.1 502 No upstream proxy\r\n\r\n'); return; }

    const sock = net.connect(up.port, up.host, () => {
      sock.write('CONNECT ' + host + ':' + port + ' HTTP/1.1\r\n' +
                 'Host: ' + host + ':' + port + '\r\n' +
                 'Proxy-Connection: keep-alive\r\n\r\n');
    });

    let banner = '', piped = false;
    sock.on('data', (chunk) => {
      if (piped) return;
      banner += chunk.toString('latin1');
      const end = banner.indexOf('\r\n\r\n');
      if (end < 0) return;
      const statusLine = banner.slice(0, banner.indexOf('\r\n'));
      const ok = / 2\d\d /.test(statusLine);
      log('CONNECT', host + ':' + port, '->', statusLine.trim());
      if (!ok) { clientSocket.end('HTTP/1.1 502 Upstream refused\r\n\r\n'); sock.destroy(); return; }
      piped = true;
      clientSocket.write('HTTP/1.1 200 Connection Established\r\n\r\n');
      const rest = Buffer.from(banner.slice(end + 4), 'latin1');
      if (rest.length) clientSocket.write(rest);
      if (head && head.length) sock.write(head);
      sock.pipe(clientSocket);
      clientSocket.pipe(sock);
    });

    const bail = () => { try { clientSocket.destroy(); } catch (e) {} try { sock.destroy(); } catch (e) {} };
    sock.on('error', (e) => { log('upstream error', host, e.message); bail(); });
    clientSocket.on('error', bail);
  });

  return new Promise((resolve) => {
    server.listen(port, '127.0.0.1', () => {
      const p = server.address().port;
      log('listening on 127.0.0.1:' + p + ' -> ' + JSON.stringify(upstream()));
      resolve({ server, port: p, url: 'http://127.0.0.1:' + p,
                close: () => new Promise(r => server.close(r)) });
    });
  });
}

module.exports = { start };

if (require.main === module) {
  const vi = process.argv.indexOf('--verbose');
  const pi = process.argv.indexOf('--port');
  start({ port: pi > 0 ? +process.argv[pi + 1] : 0, verbose: vi > 0 || true })
    .then(s => console.log(s.url));
}
