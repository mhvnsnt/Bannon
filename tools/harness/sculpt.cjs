#!/usr/bin/env node
/* sculpt.cjs — DO THE CREATE SLIDERS ACTUALLY MOVE THE GLB?
 *
 *   node tools/harness/sculpt.cjs
 *
 * The whole point of this system is a claim that can be measured directly: move a slider, and the
 * GLB's vertices move. Before it, they did not — applyShapeMorphs' blendshape half is dead (every
 * shipped rig has 0 morph targets) and its bone-scale half covers 4 of ~90 controls.
 *
 * What this asserts, in order of how badly it would have failed before:
 *   1. a girth slider displaces vertices AT ALL, and by a sane amount
 *   2. it displaces THE RIGHT ONES — a chest slider must move the chest and leave the feet alone
 *   3. returning the slider to neutral restores the mesh EXACTLY (no compounding drift)
 *   4. the skeleton is untouched, so animation still plays after a sculpt
 *   5. it is fast enough to sit behind a dragged slider
 */
const { chromium } = require('playwright');
const http = require('http'); const fs = require('fs'); const path = require('path');
const ROOT = path.dirname(path.dirname(__dirname));
const MIME = { '.html':'text/html','.js':'text/javascript','.json':'application/json','.glb':'model/gltf-binary',
  '.fbx':'application/octet-stream','.bin':'application/octet-stream','.png':'image/png','.jpg':'image/jpeg',
  '.webp':'image/webp','.mp3':'audio/mpeg','.wav':'audio/wav','.ogg':'audio/ogg','.css':'text/css',
  '.svg':'image/svg+xml','.jgz':'application/octet-stream' };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const FAILS = [];

(async () => {
  const port = 9400 + Math.floor(Math.random()*200);
  const srv = http.createServer((q,s)=>{ let p=decodeURIComponent(q.url.split('?')[0]); if(p==='/')p='/BANNON_v150.html';
    const f=path.join(ROOT,p); if(!f.startsWith(ROOT)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){s.writeHead(404);return s.end('no');}
    s.writeHead(200,{'Content-Type':MIME[path.extname(f).toLowerCase()]||'application/octet-stream','Cache-Control':'no-cache'});
    fs.createReadStream(f).pipe(s); });
  await new Promise(r => srv.listen(port, r));
  const br = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    args:['--use-gl=swiftshader','--no-sandbox','--no-proxy-server','--proxy-bypass-list=<-loopback>'] });
  const pg = await br.newPage({ viewport:{ width:412, height:915 } });
  const errs = []; pg.on('pageerror', e => errs.push(String(e.message).slice(0,150)));
  await pg.goto(`http://127.0.0.1:${port}/BANNON_v150.html`, { waitUntil:'domcontentloaded', timeout:60000 });
  const gs = () => pg.evaluate(()=>{try{return new Function('return gameState')();}catch(e){return null;}}).catch(()=>null);
  for (let i=0;i<400 && (await gs())!=='menu'; i++) await sleep(500);
  await pg.evaluate(()=>{ try{ window.BANNON_PERF.setTier(4); window.BANNON_PERF_AUTO=false; }catch(e){} });
  await pg.evaluate(()=>{ const b=document.getElementById('btnFight'); if(b) b.click(); });
  for (let i=0;i<60;i++){ if (await pg.evaluate(()=>{const s=document.getElementById('csStart');return !!(s&&s.offsetParent!==null);})) break; await sleep(400); }
  await pg.evaluate(()=>{ const s=document.getElementById('csStart'); if(s) s.click(); });
  for (let i=0;i<120 && (await gs())!=='fight'; i++) await sleep(500);
  for (let i=0;i<200;i++){ if (await pg.evaluate(()=>{try{const F=new Function('return fighters')();return !!(F&&F[0]&&F[0].model);}catch(e){return false;}})) break; await sleep(500); }
  await sleep(2000);

  const R = await pg.evaluate(async () => {
    const F = new Function('return fighters')(), f = F[0];
    const S = window.BANNON_SCULPT;
    if (!S) return { err:'BANNON_SCULPT missing' };
    const prep = S.prepare(f.model);
    if (!prep) return { err:'no skinned mesh to sculpt' };

    // snapshot helper: mean |displacement| of the vertices belonging to a named region
    const RN = ['head','neck','shoulders','chest','waist','hips','forearms','hands','arms','thighs','feet','calves'];
    const snap = () => prep.meshes.map(m => new Float32Array(m.pos.array));
    const diffByRegion = (a) => {
      const acc = {}, cnt = {};
      prep.meshes.forEach((m, mi) => {
        const cur = m.pos.array, was = a[mi];
        for (let v=0; v<m.n; v++){
          const r = m.r0[v]; if (r < 0) continue;
          const i = v*3;
          const d = Math.hypot(cur[i]-was[i], cur[i+1]-was[i+1], cur[i+2]-was[i+2]);
          const k = RN[r]; acc[k] = (acc[k]||0) + d; cnt[k] = (cnt[k]||0) + 1;
        }
      });
      const out = {};
      for (const k in acc) out[k] = +(1000*acc[k]/cnt[k]).toFixed(3);   // MILLIMETRES
      return out;
    };
    const boneSig = () => {
      let s = '';
      f.model.traverse(o => { if (o.isBone) s += o.name + o.position.toArray().map(x=>x.toFixed(4)).join(','); });
      return s;
    };

    f.shape = f.shape || {};
    // neutral baseline
    delete f.shape.chest; delete f.shape.arms; delete f.shape.waist;
    S.apply(f);
    const base = snap();
    const bonesBefore = boneSig();

    // 1 + 2. a chest slider must move the chest and leave the feet alone
    f.shape.chest = 1.45;
    const t0 = performance.now(); S.apply(f); const applyMs = performance.now() - t0;
    const chestDiff = diffByRegion(base);

    // 3. back to neutral must restore EXACTLY
    delete f.shape.chest; S.apply(f);
    let maxBack = 0;
    prep.meshes.forEach((m, mi) => { const cur = m.pos.array, was = base[mi];
      for (let i=0;i<cur.length;i++) maxBack = Math.max(maxBack, Math.abs(cur[i]-was[i])); });

    // several sliders at once, and a second identical apply must be idempotent
    f.shape.arms = 1.3; f.shape.waist = 0.75; f.shape.thighs = 1.2; f.shape.muscularity = 0.8;
    S.apply(f);
    const multi = snap();
    S.apply(f);
    let maxIdem = 0;
    prep.meshes.forEach((m, mi) => { const cur = m.pos.array, was = multi[mi];
      for (let i=0;i<cur.length;i++) maxIdem = Math.max(maxIdem, Math.abs(cur[i]-was[i])); });
    const multiDiff = diffByRegion(base);

    return { regions: prep.regions, verts: prep.meshes.reduce((a,m)=>a+m.n,0),
             chestDiff, multiDiff, maxBack:+maxBack.toFixed(8), maxIdem:+maxIdem.toFixed(8),
             applyMs:+applyMs.toFixed(1), bonesUnchanged: bonesBefore === boneSig(),
             stats: S.stats(), controls: S.controls.length };
  });

  // does the body still animate after being sculpted?
  let posed = 0;
  if (!R.err){
    await pg.evaluate(() => { window.__pc = 0; const o = window.studioApplyClipPose;
      if (o && !o.__sc){ const w = function(){ window.__pc++; return o.apply(this, arguments); }; w.__sc=1; window.studioApplyClipPose = w; } });
    for (let i=0;i<8;i++){
      await pg.evaluate(() => { ['j','k','w'].forEach(k => { dispatchEvent(new KeyboardEvent('keydown',{key:k,bubbles:true}));
        setTimeout(()=>dispatchEvent(new KeyboardEvent('keyup',{key:k,bubbles:true})), 80); }); });
      await sleep(900);
    }
    posed = await pg.evaluate(() => window.__pc || 0);
  }
  await br.close(); srv.close();

  console.log('\n===== SCULPT =====');
  if (R.err){ console.log('  ERROR: ' + R.err); FAILS.push(R.err); }
  else {
    console.log('  controls wired  ' + R.controls + '        regions found: ' + R.regions.join(' '));
    console.log('  vertices        ' + R.verts + '   apply ' + R.applyMs + 'ms');
    console.log('  chest 1.45  -> mean displacement per region, MILLIMETRES:');
    Object.entries(R.chestDiff).sort((a,b)=>b[1]-a[1]).forEach(([k,v]) => console.log('     ' + k.padEnd(10) + String(v).padStart(9) + ' mm'));
    console.log('  arms+waist+thighs+muscle -> ');
    Object.entries(R.multiDiff).sort((a,b)=>b[1]-a[1]).forEach(([k,v]) => console.log('     ' + k.padEnd(10) + String(v).padStart(9) + ' mm'));
    console.log('  back to neutral: max residual ' + R.maxBack + '   second identical apply: ' + R.maxIdem);
    console.log('  skeleton untouched by the sculpt: ' + R.bonesUnchanged);
    console.log('  poseCalls after sculpting: ' + posed);

    const c = R.chestDiff;
    if (!(c.chest > 2)) FAILS.push('chest slider moved the chest by only ' + c.chest + ' mm — it is not reaching the mesh');
    if ((c.feet || 0) > 0.5) FAILS.push('a CHEST slider moved the FEET by ' + c.feet + ' mm — region weights are wrong');
    if ((c.hands || 0) > 0.5) FAILS.push('a CHEST slider moved the HANDS by ' + c.hands + ' mm');
    if (R.maxBack > 1e-5) FAILS.push('returning to neutral left ' + R.maxBack + ' of drift — the sculpt is compounding');
    if (R.maxIdem > 1e-9) FAILS.push('a second identical apply changed the mesh — not idempotent');
    if (!R.bonesUnchanged) FAILS.push('the sculpt moved BONES — animation would drift');
    if (posed < 3) FAILS.push('only ' + posed + ' pose calls after sculpting — animation may have stopped');
    if (R.applyMs > 120) FAILS.push('apply takes ' + R.applyMs + 'ms — too slow to sit behind a dragged slider');
  }
  if (errs.length) FAILS.push(errs.length + ' page errors: ' + errs.slice(0,2).join(' | '));
  console.log('  page errors ' + errs.length);
  console.log(FAILS.length ? '\n  FAIL:' : '\n  PASS — the CREATE sliders move the GLB.');
  FAILS.forEach(f => console.log('    x ' + f));
  process.exit(FAILS.length ? 1 : 0);
})();
