#!/usr/bin/env node
/* rig_continuity.cjs — IS THIS A BODY, OR AN ACTION FIGURE?
 *
 *   node tools/model_diag/rig_continuity.cjs                 # sweep every model
 *   node tools/model_diag/rig_continuity.cjs BANNON_rigged.glb
 *   node tools/model_diag/rig_continuity.cjs --gate          # exit 1 if a WIRED model is severed
 *
 * Owner, for weeks: "the animations still are not correct cause the animation are still looking
 * procedural" ... "like procedural puppets in strings".
 *
 * I spent that time proving the PROCEDURAL RIG was not on screen, and it was not — measured, 0
 * visible procedural triangles on both fighters. The GLB was bound, skinned, and animating. The
 * puppet he was describing was the GLB.
 *
 * MEASURED on BANNON_rigged.glb, the DEFAULT PLAYER MODEL:
 *     15 primitives, named  chest elL elR ftL ftR haL haR head hipL hipR knL knR pelvis shL shR
 * That is our own joint-key list. The body is CUT AT EVERY JOINT into fifteen loose pieces. Each
 * piece carries JOINTS_0 so every skinning check we own says "skinned, 58 joints, PASS" — and
 * skinqa agrees, because skinqa measures how far a vertex drifts from where its weights say it
 * should be, and a piece welded to exactly one bone never drifts at all. A severed rig is the one
 * thing that scores PERFECTLY on a deformation test while being unable to deform.
 *
 * There is no surface across the elbow, the knee, the shoulder or the neck, so nothing bends. The
 * pieces rotate past each other and gap. That is an action figure, and it is what he has been
 * looking at.
 *
 * THE MEASURE — JOINT SPREAD PER PRIMITIVE. Read the actual JOINTS_0/WEIGHTS_0 data and count how
 * many distinct joints carry real weight in each primitive:
 *     a continuous body       1 primitive influenced by most of the skeleton   (VIPER: 1 prim, 58)
 *     an action figure       15 primitives influenced by 1-3 joints each       (BANNON_rigged)
 * Naming is a hint, never the authority — 'chest' could be any mesh. The WEIGHTS are the fact.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.dirname(path.dirname(__dirname));
const MODELS = path.join(ROOT, 'assets', 'models');
const GATE = process.argv.includes('--gate');
const JSON_OUT = process.argv.includes('--json');

let core, ext, meshopt;
try{
  core = require('@gltf-transform/core'); ext = require('@gltf-transform/extensions');
  meshopt = require('meshoptimizer');
}catch(e){
  console.error('needs: npm i --no-save @gltf-transform/core @gltf-transform/extensions meshoptimizer');
  process.exit(2);
}
const { NodeIO } = core;
const { ALL_EXTENSIONS } = ext;
const { MeshoptEncoder, MeshoptDecoder } = meshopt;
const { normalizeBuffer } = require('./fix_extensions_used.cjs');

const WEIGHT_FLOOR = 0.02;      // below this a "weight" is float noise, not an influence

async function measure(file){
  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS)
    .registerDependencies({ 'meshopt.encoder': MeshoptEncoder, 'meshopt.decoder': MeshoptDecoder });
  await MeshoptEncoder.ready; await MeshoptDecoder.ready;
  const doc = await io.readBinary(normalizeBuffer(fs.readFileSync(file)));

  const joints = doc.getRoot().listSkins().reduce((n, s) => n + s.listJoints().length, 0);
  const prims = [];
  for (const m of doc.getRoot().listMeshes())
    for (const p of m.listPrimitives()){
      const J = p.getAttribute('JOINTS_0'), W = p.getAttribute('WEIGHTS_0'), P = p.getAttribute('POSITION');
      const idx = p.getIndices();
      const tris = idx ? idx.getCount() / 3 : (P ? P.getCount() / 3 : 0);
      if (!J || !W){ prims.push({ name: m.getName() || '', tris: Math.round(tris), spread: 0, rigid: true }); continue; }
      const seen = new Set();
      const jv = [0,0,0,0], wv = [0,0,0,0];
      for (let v = 0; v < J.getCount(); v++){
        J.getElement(v, jv); W.getElement(v, wv);
        for (let k = 0; k < 4; k++) if (wv[k] > WEIGHT_FLOOR) seen.add(jv[k]);
      }
      prims.push({ name: m.getName() || '', tris: Math.round(tris), spread: seen.size, rigid: false });
    }

  const skinned = prims.filter(p => !p.rigid);
  const tris = prims.reduce((n, p) => n + p.tris, 0);
  const maxSpread = skinned.reduce((n, p) => Math.max(n, p.spread), 0);
  const medSpread = skinned.length ? skinned.map(p => p.spread).sort((a,b)=>a-b)[skinned.length >> 1] : 0;

  // A body is SEVERED when it is split into many skinned pieces and no piece spans the skeleton.
  // Two loose primitives (body + a separate hair or belt) is normal authoring, not severance.
  const severed = skinned.length >= 5 && joints >= 8 && maxSpread < joints * 0.45;
  const verdict = !skinned.length ? 'RIGID'
                : severed         ? 'SEVERED'
                : skinned.length === 1 ? 'WHOLE'
                : 'MIXED';
  return { file: path.basename(file), verdict, joints, prims: prims.length, skinnedPrims: skinned.length,
           tris, maxSpread, medSpread, parts: skinned.slice(0, 16).map(p => p.name + ':' + p.spread) };
}

(async () => {
  const args = process.argv.slice(2).filter(a => !a.startsWith('--'));
  const targets = args.length
    ? args.map(a => path.isAbsolute(a) ? a : (fs.existsSync(a) ? a : path.join(MODELS, path.basename(a))))
    : fs.readdirSync(MODELS).filter(f => f.endsWith('.glb')).sort().map(f => path.join(MODELS, f));

  const rows = [];
  for (const t of targets){
    try{ rows.push(await measure(t)); }
    catch(e){ rows.push({ file: path.basename(t), verdict:'ERROR', err: String(e.message).slice(0,70) }); }
  }

  if (JSON_OUT){ console.log(JSON.stringify(rows, null, 1)); }
  else {
    const order = { SEVERED:0, MIXED:1, RIGID:2, WHOLE:3, ERROR:4 };
    rows.sort((a,b) => (order[a.verdict]-order[b.verdict]) || (b.tris||0)-(a.tris||0));
    console.log('\n===== RIG CONTINUITY =====');
    console.log('  a body bends across its joints. an action figure rotates its pieces past each other.\n');
    for (const r of rows){
      if (r.verdict === 'ERROR'){ console.log('  ERROR    ' + r.file.padEnd(34) + r.err); continue; }
      console.log('  ' + r.verdict.padEnd(8) + r.file.padEnd(34) +
        String(r.skinnedPrims).padStart(3) + ' skinned prim' + (r.skinnedPrims===1?' ':'s') +
        '  joints ' + String(r.joints).padStart(3) +
        '  widest piece spans ' + String(r.maxSpread).padStart(3) + ' joints' +
        '  ' + String(r.tris).toLocaleString().padStart(8) + ' tris');
      if (r.verdict === 'SEVERED') console.log('           pieces: ' + r.parts.join(' '));
    }
    const bad = rows.filter(r => r.verdict === 'SEVERED');
    console.log('\n  ' + rows.length + ' models: ' +
      rows.filter(r=>r.verdict==='WHOLE').length + ' whole, ' +
      rows.filter(r=>r.verdict==='MIXED').length + ' mixed, ' +
      bad.length + ' SEVERED, ' +
      rows.filter(r=>r.verdict==='RIGID').length + ' unskinned.');
    if (bad.length) console.log('\n  SEVERED rigs cannot bend. They pass skinqa perfectly — a piece welded to one\n' +
                               '  bone never drifts — and they animate as an action figure. Re-rig with\n' +
                               '  tools/model_diag/transfer_weights.cjs from a WHOLE sibling.');
    if (GATE && bad.length) process.exit(1);
  }
})();
