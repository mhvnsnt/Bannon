#!/usr/bin/env node
/* spikes.cjs — find the FEW vertices that draw a stretched sheet across the screen.
 *
 *   node tools/model_diag/spikes.cjs VIPER_rigged.glb [more.glb ...]
 *   node tools/model_diag/spikes.cjs --gate MODEL.glb
 *
 * WHY skinqa WAS NOT ENOUGH. The owner sent screenshots of a pale sheet of geometry fanning out
 * of a fighter's torso to the mat, mid-match, and said it "only does this during matches and looks
 * fine during selection and in menus". Both halves of that are the diagnosis:
 *
 *   - In a menu the model sits in BIND POSE. No bone has rotated, so no weight is exercised and
 *     nothing can smear. The defect is invisible exactly where we kept looking at it.
 *   - A stretched triangle needs only ONE bad vertex. Its two neighbours stay on the body, it flies
 *     off, and the triangle between them is drawn as a long sheet.
 *
 * skinqa grades on p95 and VIPER scores 0.0440 PASS. p95 CANNOT SEE THIS. One bad vertex in
 * 100,000 is the 99.999th percentile. The statistic was wrong for the defect, so the gate was
 * green while the game was visibly broken. That is the whole lesson: pick the statistic that
 * matches the failure, not the one that looks rigorous.
 *
 * WHAT THIS MEASURES. Pose the skeleton (the same canonical action pose skinqa uses), then for
 * every TRIANGLE compare its posed edge lengths against its bind edge lengths. A triangle that
 * grows by more than a few times its rest length is a visible spike no matter how few there are.
 * Reports the count, the worst offenders, and which joints they are weighted to -- because the
 * fix is usually one joint index or a vertex with no weight at all.
 */
'use strict';
const { chromium } = require('/opt/node22/lib/node_modules/playwright/node_modules/playwright-core');
const { spawn } = require('child_process');
const path = require('path');

const argv = process.argv.slice(2);
const GATE = argv.includes('--gate');
const MODELS = argv.filter(a => !a.startsWith('--'));
if (!MODELS.length) { console.error('usage: spikes.cjs <model.glb> [...] [--gate]'); process.exit(1); }

// A triangle edge that grows past this multiple of its rest length is a visible artifact.
// 2.5x is deliberately generous: real skin stretches at a shoulder or a hip, but not 150%.
const STRETCH = 2.5;
const MAX_BAD = 0;        // --gate: any spike at all is a fail; they are always visible

(async () => {
  const dir = path.join(__dirname);
  const srv = spawn('/opt/node22/bin/node', ['-e', `
    const http=require('http'),fs=require('fs'),p=require('path');const root='${dir}',md='/home/user/Bannon/assets/models';
    const T={'.html':'text/html','.js':'text/javascript','.glb':'model/gltf-binary'};
    http.createServer((req,res)=>{let f=decodeURIComponent(req.url.split('?')[0]);
      let fp=f.startsWith('/m/')?p.join(md,f.slice(3)):p.join(root,f==='/'?'/test.html':f);
      fs.readFile(fp,(e,d)=>{if(e){res.writeHead(404);res.end('nf');return;}res.writeHead(200,{'content-type':T[p.extname(fp)]||'application/octet-stream'});res.end(d);});}).listen(8087);
  `], { stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 800));
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--no-sandbox'] });
  const page = await browser.newPage();
  const perr = []; page.on('pageerror', e => perr.push(String(e)));
  await page.goto('http://localhost:8087/test.html', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3500);

  let failed = 0;
  for (const mf of MODELS) {
    const r = await page.evaluate(async (u) => {
      function load(url) { return new Promise((res, rej) => { new THREE.GLTFLoader().load(url, g => res(g), undefined, e => rej(e)); }); }
      let g; try { g = await load('/m/' + u); } catch (e) { return { err: String(e).slice(0, 80) }; }

      const skinned = [];
      g.scene.traverse(n => { if (n.isSkinnedMesh) skinned.push(n); });
      if (!skinned.length) return { noSkin: true };

      g.scene.updateMatrixWorld(true);

      // ---- bind-pose triangle lengths ----
      const out = { meshes: skinned.length, tris: 0, spikes: 0, worst: [], noWeight: 0, badIndex: 0 };
      const sm = skinned[0];
      const geo = sm.geometry;
      const pos = geo.attributes.position;
      const _si = geo.attributes.skinIndex, _sw = geo.attributes.skinWeight;
      // r128: skin attributes may be interleaved, and getComponent is not present on every path.
      // getX/getY/getZ/getW exist on both BufferAttribute and InterleavedBufferAttribute.
      const COMP = ['getX','getY','getZ','getW'];
      const skinIdx = { getComponent:(i,k)=>_si[COMP[k]](i) };
      const skinWt  = { getComponent:(i,k)=>_sw[COMP[k]](i) };
      const boneCount = sm.skeleton.bones.length;

      // vertices with no weight at all, or an out-of-range joint -> guaranteed artifacts
      for (let i = 0; i < pos.count; i++) {
        let w = 0;
        for (let k = 0; k < 4; k++) {
          w += skinWt.getComponent(i, k);
          const bi = skinIdx.getComponent(i, k);
          if (bi >= boneCount || bi < 0) out.badIndex++;
        }
        if (w < 1e-4) out.noWeight++;
      }

      const bindLen = [];
      const idx = geo.index;
      const triCount = idx ? idx.count / 3 : pos.count / 3;
      out.tris = triCount;
      const va = new THREE.Vector3(), vb = new THREE.Vector3(), vc = new THREE.Vector3();
      const gi = (t, k) => idx ? idx.getX(t * 3 + k) : (t * 3 + k);
      for (let t = 0; t < triCount; t++) {
        va.fromBufferAttribute(pos, gi(t, 0)); vb.fromBufferAttribute(pos, gi(t, 1)); vc.fromBufferAttribute(pos, gi(t, 2));
        bindLen.push(Math.max(va.distanceTo(vb), vb.distanceTo(vc), vc.distanceTo(va)));
      }

      // ---- pose the skeleton the way a MATCH does, then re-measure ----
      const bones = sm.skeleton.bones;
      const hit = (re) => bones.filter(b => re.test(b.name));
      hit(/arm|shoulder|elbow|clav/i).forEach(b => { b.rotation.z += 0.9; b.rotation.x += 0.5; });
      hit(/leg|knee|thigh|shin|foot/i).forEach(b => { b.rotation.x += 0.8; });
      hit(/spine|chest|hips|neck|head/i).forEach(b => { b.rotation.y += 0.4; b.rotation.x += 0.25; });
      g.scene.updateMatrixWorld(true);
      sm.skeleton.update();

      // CPU skinning, matching three.js's own skinning so the numbers are what the GPU draws
      const bm = new THREE.Matrix4(), tmp = new THREE.Matrix4(), sk = new THREE.Matrix4();
      const skinnedPos = new Float32Array(pos.count * 3);
      const v = new THREE.Vector3(), res = new THREE.Vector3();
      for (let i = 0; i < pos.count; i++) {
        sk.set(0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0);
        let any = false;
        for (let k = 0; k < 4; k++) {
          const w = skinWt.getComponent(i, k); if (w === 0) continue;
          const bi = skinIdx.getComponent(i, k); if (bi < 0 || bi >= boneCount) continue;
          bm.multiplyMatrices(sm.skeleton.bones[bi].matrixWorld, sm.skeleton.boneInverses[bi]);
          tmp.copy(bm); for (let e = 0; e < 16; e++) sk.elements[e] += tmp.elements[e] * w;
          any = true;
        }
        v.fromBufferAttribute(pos, i);
        if (any) res.copy(v).applyMatrix4(sk); else res.copy(v);
        skinnedPos[i*3] = res.x; skinnedPos[i*3+1] = res.y; skinnedPos[i*3+2] = res.z;
      }
      const P = (j, o) => o.set(skinnedPos[j*3], skinnedPos[j*3+1], skinnedPos[j*3+2]);
      for (let t = 0; t < triCount; t++) {
        const a = gi(t,0), b = gi(t,1), c = gi(t,2);
        P(a, va); P(b, vb); P(c, vc);
        const L = Math.max(va.distanceTo(vb), vb.distanceTo(vc), vc.distanceTo(va));
        const rest = bindLen[t];
        // BOTH conditions. Ratio alone is not the signal: real skin at a shoulder or hip stretches
        // 3-4x over a 3cm triangle and that is invisible and correct. What the owner photographed was
        // HALF A METRE of geometry. A spike is a triangle that grew a lot AND ended up big enough to
        // draw across the screen. BANNON_rigged's worst is 14.6cm (fine); VIPER's are 51.8cm (the sheet).
        if (rest > 1e-6 && L / rest > 2.5 && L > 0.15) {
          out.spikes++;
          if (out.worst.length < 8) {
            const jl = [];
            for (let k = 0; k < 4; k++) {
              const w = skinWt.getComponent(a, k);
              if (w > 0.01) jl.push((sm.skeleton.bones[skinIdx.getComponent(a,k)]||{name:'?'}).name + ':' + w.toFixed(2));
            }
            out.worst.push({ tri: t, ratio: +(L/rest).toFixed(1), restCm: +(rest*100).toFixed(1),
                             posedCm: +(L*100).toFixed(1), joints: jl });
          }
        }
      }
      out.spikePct = +(100 * out.spikes / triCount).toFixed(4);
      return out;
    }, mf);

    if (r.err || r.noSkin) { console.log('ERR  ' + mf.padEnd(34) + ' ' + JSON.stringify(r)); continue; }
    const bad = r.spikes > MAX_BAD;
    if (bad) failed++;
    console.log((bad ? 'SPIKES' : 'clean ') + '  ' + mf.padEnd(32)
      + ' tris=' + String(r.tris).padStart(7)
      + '  stretched>2.5x=' + String(r.spikes).padStart(5) + ' (' + r.spikePct + '%)'
      + '  zeroWeightVerts=' + r.noWeight + '  outOfRangeJoint=' + r.badIndex);
    (r.worst || []).forEach(w => console.log('        tri ' + w.tri + '  ' + w.restCm + 'cm -> ' + w.posedCm
      + 'cm  (' + w.ratio + 'x)   ' + w.joints.join(' ')));
  }
  console.log('pageerrors ' + perr.length);
  await browser.close(); srv.kill();
  if (GATE && failed) process.exit(1);
})();
