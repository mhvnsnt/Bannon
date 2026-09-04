'use strict'
/**
 * BANNON WEB-RUNTIME WORKER — the generic harness actuator M. Engine does not have.
 *
 * WHY THIS EXISTS AND WHY IT IS HERE AND NOT THERE.
 * The M. Engine map (docs/M_ENGINE_MAP.md) found a real, well-built remote worker for UNREAL and no
 * generic sandbox / web actuator at all: `POST /workers/dispatch` is declared in its OpenAPI naming
 * SWE-agent/OpenHands, but the only worker implemented is Unreal-specific. Meanwhile every
 * locomotion defect actually measured in this project lives in BANNON_v150.html — the Three.js build
 * the owner's phone plays — and this container has no Unreal at all (its own probe returns
 * CAPABILITY_GAP for runtime, build, Android toolchain and adb). So dispatching Bannon's locomotion
 * work to the Unreal worker would send it to a runtime holding none of the code under test.
 * This worker closes that gap for the runtime that actually holds the code.
 *
 * IT SPEAKS M. ENGINE'S PROTOCOL ON PURPOSE — same `/health`, `/capabilities`, `POST /op/<name>`,
 * same STATES vocabulary, same bearer-token rule. Two workers that answer the same shape can be
 * enrolled by the same control plane (`/api/v1/worker/enroll` + `/heartbeat` already exist there).
 * A second worker with its own private protocol would be a second integration problem.
 *
 * THE CONSTRAINTS ARE COPIED DELIBERATELY, because they are the reason that worker is good:
 *  - NO ARBITRARY SHELL EXECUTION. Operations are a named allowlist of SEMANTIC jobs. There is no
 *    endpoint that takes a command string; the harness name is validated against a table and the
 *    argv is built here, never supplied by the caller. A worker that accepts arbitrary commands is
 *    a remote shell with extra steps.
 *  - PATHS ARE CONFINED to the configured repo root. Traversal is REFUSED, not sanitised.
 *  - EVERY OPERATION IS BOUNDED and returns evidence INCLUDING ON FAILURE. Failure is data.
 *  - CAPABILITIES ARE PROBED, NEVER CONFIGURED. "Playwright is installed" according to a config
 *    file is not evidence; the probe imports it and looks for the browser binary on disk.
 *
 * Zero dependencies: Node stdlib only.
 *
 * PORTABILITY NOTE, hit immediately: M. Engine's worker is `.js` and this one MUST be `.cjs`.
 * Bannon's package.json declares "type": "module", so a `.js` file is parsed as ESM and every
 * `require` throws before a line of it runs. That is also why every harness in tools/harness is
 * `.cjs`. Copying the upstream filename verbatim would have shipped a worker that cannot start.
 *
 * Usage:  node tools/worker/web_worker.cjs --port 8771 --repo /home/user/Bannon [--token SECRET]
 *         node tools/worker/web_worker.cjs --probe          # print capabilities and exit
 *         node tools/worker/web_worker.cjs --run gait       # run one harness inline and exit
 */
const http = require('http')
const path = require('path')
const fs = require('fs')
const crypto = require('crypto')
const { execFile } = require('child_process')

// Same vocabulary as M. Engine's probe.js, verbatim, so a control plane reading either worker's
// answer does not need two enums.
const STATES = {
  VERIFIED: 'VERIFIED',
  PARTIALLY_VERIFIED: 'PARTIALLY_VERIFIED',
  IMPLEMENTED_UNVERIFIED: 'IMPLEMENTED_UNVERIFIED',
  CAPABILITY_GAP: 'CAPABILITY_GAP',
  BLOCKED: 'BLOCKED_BY_EXTERNAL_DEPENDENCY',
}

function run(cmd, args, timeoutMs, cwd) {
  return new Promise((resolve) => {
    execFile(cmd, args, { timeout: timeoutMs, cwd: cwd, windowsHide: true, maxBuffer: 64 * 1024 * 1024 },
      (err, stdout, stderr) => {
        resolve({
          ok: !err,
          code: err && typeof err.code === 'number' ? err.code : err ? -1 : 0,
          stdout: (stdout || '').toString(),
          stderr: (stderr || '').toString(),
          error: err ? err.message : null,
        })
      })
  })
}

function parseArgs(argv) {
  const cfg = { port: 8771, repo: process.cwd(), token: null, probeOnly: false, runOne: null }
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--port') cfg.port = parseInt(argv[++i], 10)
    else if (a === '--repo') cfg.repo = path.resolve(argv[++i])
    else if (a === '--token') cfg.token = argv[++i]
    else if (a === '--probe') cfg.probeOnly = true
    else if (a === '--run') cfg.runOne = argv[++i]
  }
  return cfg
}
let config = parseArgs(process.argv)

/** Refuse rather than sanitise. */
function withinRepo(target) {
  const t = path.resolve(target)
  const root = path.resolve(config.repo)
  return t === root || t.startsWith(root + path.sep)
}

/**
 * THE HARNESS TABLE. The allowlist is at the SEMANTIC level — a job name, not a command. Argv is
 * assembled here from validated pieces; the caller never supplies a flag string. `variants` are the
 * only switches a caller may ask for, by NAME, so an A/B is expressible without opening a hole.
 */
const HARNESSES = {
  probe:          null,  // handled by the operation, not a script
  gait:           { script: 'tools/harness/gait_and_bind.cjs', timeoutMs: 15 * 60 * 1000,
                    variants: { control: ['--noloco'], candidate: [] },
                    reads: 'dist/playtest/gait_and_bind.json' },
  poseLedger:     { script: 'tools/harness/pose_ledger.cjs',   timeoutMs: 20 * 60 * 1000,
                    variants: { control: ['--nostateclip'], layered: ['--noauthority'], candidate: [] },
                    reads: 'dist/playtest/pose_ledger.json' },
  moveTruth:      { script: 'tools/harness/move_truth.cjs',    timeoutMs: 25 * 60 * 1000,
                    variants: { watch: [], drive: ['--drive'] },
                    reads: 'dist/playtest/move_truth.json' },
  grappleContact: { script: 'tools/harness/grapple_contact.cjs', timeoutMs: 20 * 60 * 1000,
                    variants: { candidate: [], control: ['--nogripik'] },
                    reads: 'dist/playtest/grapple_contact.json' },
  smoke:          { script: 'tools/harness/smoke.cjs',         timeoutMs: 15 * 60 * 1000,
                    variants: { default: [] },
                    reads: 'dist/playtest/smoke.json' },
}

/**
 * CAPABILITIES ARE PROBED. Every one of these is a thing that has silently broken a harness in this
 * project's history, which is why each is checked rather than assumed:
 *  - the game file itself (an absent asset has twice been debugged as a code bug)
 *  - the vendored engine (three.js CDN-first cost 44 page errors when unreachable)
 *  - the browser BINARY on disk, not just the playwright module
 *  - free disk (a full disk presents as "Page crashed" in a harness that worked minutes earlier)
 */
async function probeAll() {
  const caps = {}
  const repoOk = fs.existsSync(config.repo)

  caps.BANNON_WORKSPACE = repoOk
    ? { state: STATES.VERIFIED, evidence: config.repo }
    : { state: STATES.CAPABILITY_GAP, evidence: `no such repo root: ${config.repo}` }

  const gameFile = path.join(config.repo, 'BANNON_v150.html')
  caps.BANNON_GAME_PRESENT = fs.existsSync(gameFile)
    ? { state: STATES.VERIFIED, evidence: `${(fs.statSync(gameFile).size / 1048576).toFixed(1)} MB` }
    : { state: STATES.CAPABILITY_GAP, evidence: 'BANNON_v150.html not found — every harness boots it' }

  const vendor = path.join(config.repo, 'assets', 'vendor', 'three.min.js')
  caps.VENDORED_ENGINE = fs.existsSync(vendor)
    ? { state: STATES.VERIFIED, evidence: vendor }
    : { state: STATES.CAPABILITY_GAP, evidence: 'assets/vendor/three.min.js absent; the game would be hostage to a CDN' }

  const node = await run(process.execPath, ['--version'], 10000)
  caps.NODE_RUNTIME = node.ok
    ? { state: STATES.VERIFIED, evidence: node.stdout.trim() }
    : { state: STATES.CAPABILITY_GAP, evidence: node.error }

  // The MODULE resolving is not the same fact as the BROWSER existing. Both are checked.
  let pwPath = null
  try { pwPath = require.resolve('playwright', { paths: [config.repo] }) } catch (e) { pwPath = null }
  const browserCandidates = [
    '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    '/opt/pw-browsers/chromium/chrome',
  ]
  const browser = browserCandidates.find(p => fs.existsSync(p)) || null
  caps.BROWSER_RUNTIME = (pwPath && browser)
    ? { state: STATES.VERIFIED, evidence: browser, module: pwPath }
    : { state: STATES.CAPABILITY_GAP,
        evidence: `playwright module ${pwPath ? 'ok' : 'MISSING'}, chromium binary ${browser || 'MISSING'}` }

  const names = Object.keys(HARNESSES).filter(k => HARNESSES[k])
  const present = names.filter(k => fs.existsSync(path.join(config.repo, HARNESSES[k].script)))
  caps.HARNESSES_AVAILABLE = present.length === names.length
    ? { state: STATES.VERIFIED, harnesses: present }
    : { state: STATES.PARTIALLY_VERIFIED, harnesses: present,
        evidence: `missing: ${names.filter(n => !present.includes(n)).join(', ')}` }

  const df = await run('df', ['-Pk', config.repo], 10000)
  let freeMb = null
  if (df.ok) { const l = df.stdout.trim().split('\n').pop().split(/\s+/); freeMb = Math.round(parseInt(l[3], 10) / 1024) }
  caps.DISK_HEADROOM = (freeMb == null)
    ? { state: STATES.IMPLEMENTED_UNVERIFIED, evidence: 'df unavailable' }
    : freeMb > 2048
      ? { state: STATES.VERIFIED, evidence: `${freeMb} MB free` }
      : { state: STATES.BLOCKED, evidence: `${freeMb} MB free — a full disk reports as "Page crashed"` }

  const ready = Object.values(caps).every(c => c.state === STATES.VERIFIED || c.state === STATES.PARTIALLY_VERIFIED)
  return { worker: 'web', version: 1, repo: config.repo, ready, capabilities: caps }
}

const OPERATIONS = {
  async probe() { return probeAll() },

  /**
   * Run ONE named harness. `harness` is a key in the table; `variant` is a key in that harness's own
   * variant map. Neither is ever interpolated into a shell — argv is assembled from the table.
   */
  async harness({ harness, variant }) {
    const spec = HARNESSES[harness]
    if (!spec) return { ok: false, error: `REFUSED: unknown harness '${harness}'`, allowed: Object.keys(HARNESSES) }
    const scriptPath = path.join(config.repo, spec.script)
    if (!withinRepo(scriptPath)) return { ok: false, error: 'REFUSED: harness outside repo root' }
    if (!fs.existsSync(scriptPath)) {
      return { ok: false, state: STATES.CAPABILITY_GAP, error: `harness script absent: ${spec.script}` }
    }
    const vname = variant || Object.keys(spec.variants)[0]
    const extra = spec.variants[vname]
    if (!extra) return { ok: false, error: `REFUSED: unknown variant '${vname}'`, allowed: Object.keys(spec.variants) }

    const probed = await probeAll()
    if (probed.capabilities.BROWSER_RUNTIME.state !== STATES.VERIFIED) {
      return { ok: false, state: STATES.CAPABILITY_GAP, error: 'no browser runtime on this host',
               evidence: probed.capabilities.BROWSER_RUNTIME.evidence }
    }

    const args = [scriptPath].concat(extra)
    const started = Date.now()
    const res = await run(process.execPath, args, spec.timeoutMs, config.repo)

    // The harness's own JSON report is the structured result; stdout is the human evidence. Both are
    // returned, and both on failure too.
    let report = null
    try {
      const rp = path.join(config.repo, spec.reads)
      if (fs.existsSync(rp)) report = JSON.parse(fs.readFileSync(rp, 'utf8'))
    } catch (e) { report = { parseError: String(e && e.message).slice(0, 200) } }

    return {
      ok: res.ok,
      state: res.ok ? STATES.VERIFIED : STATES.BLOCKED,
      harness, variant: vname,
      exitCode: res.code,
      durationMs: Date.now() - started,
      command: `node ${spec.script} ${extra.join(' ')}`.trim(),
      stdout: res.stdout.slice(-40000),
      stderr: res.stderr.slice(-40000),
      report,
    }
  },

  /**
   * An A/B/A in ONE job. The control is re-run at the END on purpose: this project's own law is that
   * any A/B whose conditions run in sequence must re-test the first condition, because a harness that
   * warms up produces a monotone ranking that looks exactly like a result. If control and control2
   * disagree, the experiment measured time, not the variable, and the caller can see that.
   */
  async experiment({ harness, control, candidate }) {
    const spec = HARNESSES[harness]
    if (!spec) return { ok: false, error: `REFUSED: unknown harness '${harness}'` }
    const order = [
      { label: 'A_control', variant: control },
      { label: 'B_candidate', variant: candidate },
      { label: 'A2_control', variant: control },
    ]
    const runs = []
    for (const step of order) {
      const r = await OPERATIONS.harness({ harness, variant: step.variant })
      runs.push({ label: step.label, variant: step.variant, ok: r.ok, exitCode: r.exitCode,
                  durationMs: r.durationMs, report: r.report,
                  stdoutTail: (r.stdout || '').slice(-4000) })
      if (!r.ok) break
    }
    const controls = runs.filter(r => r.label.startsWith('A'))
    return {
      ok: runs.every(r => r.ok),
      harness, runs,
      note: controls.length < 2
        ? 'INCOMPLETE: the second control did not run, so nothing is comparable'
        : 'Compare the two controls FIRST. If they disagree, the difference is noise and the candidate proves nothing.',
    }
  },
}

function send(res, code, body) {
  const payload = JSON.stringify(body, null, 2)
  res.writeHead(code, { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) })
  res.end(payload)
}

/** Constant-time compare so the token check cannot be timed. */
function tokenOk(header) {
  if (!config.token) return true // no token configured = local trusted use
  const given = (header || '').replace(/^Bearer\s+/i, '')
  const a = Buffer.from(given), b = Buffer.from(config.token)
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

async function main() {
  if (config.probeOnly) {
    const p = await probeAll()
    console.log(JSON.stringify(p, null, 2))
    process.exit(p.ready ? 0 : 1)
  }
  if (config.runOne) {
    const r = await OPERATIONS.harness({ harness: config.runOne })
    console.log(r.stdout || '')
    console.log('--- ' + config.runOne + ': ' + (r.ok ? 'OK' : 'FAILED') + ' in ' + r.durationMs + 'ms')
    process.exit(r.ok ? 0 : 1)
  }

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost')

    // Health is deliberately unauthenticated: it is how the fabric discovers the worker, and it
    // reveals nothing beyond that.
    if (url.pathname === '/health') {
      return send(res, 200, { status: 'UP', worker: 'web', version: 1 })
    }
    if (!tokenOk(req.headers.authorization)) return send(res, 401, { error: 'unauthorised' })

    if (url.pathname === '/capabilities' && req.method === 'GET') {
      return send(res, 200, await probeAll())
    }
    if (url.pathname.startsWith('/op/') && req.method === 'POST') {
      const name = url.pathname.slice(4)
      const op = OPERATIONS[name]
      if (!op) return send(res, 404, { error: `no such operation '${name}'`, allowed: Object.keys(OPERATIONS) })
      let body = ''
      req.on('data', c => { body += c; if (body.length > 1e6) req.destroy() })
      req.on('end', async () => {
        let args = {}
        try { args = body ? JSON.parse(body) : {} } catch (e) { return send(res, 400, { error: 'bad JSON body' }) }
        try { send(res, 200, await op(args)) }
        catch (e) { send(res, 500, { ok: false, error: String(e && e.message).slice(0, 400) }) }
      })
      return
    }
    send(res, 404, { error: 'not found' })
  })
  server.listen(config.port, () => {
    console.log(`[bannon-web-worker] listening on :${config.port}  repo=${config.repo}  token=${config.token ? 'set' : 'none'}`)
  })
}
main()
