#!/usr/bin/env node
/* render_truth.cjs — THE RENDERED-CHARACTER BRING-UP GATE. Runs BEFORE any animation work.
 *
 *   node tools/harness/render_truth.cjs [--seconds N] [--tiers 0,2,4]
 *
 * OWNER, on a frame I showed him and narrated past: "the models are floating, broken, blacked out,
 * halfway in the ring, one floating looking like a silhouette, it's not good at all and u didn't say
 * anything about it." And then, on what to do about it: "do not tune locomotion while the character
 * itself is capable of loading as a black silhouette, splitting into boots/body, or spawning under
 * the floor. Otherwise every animation measurement is contaminated."
 *
 * He is right on both counts. This is the P0 gate he specified, and every line of it is a number or
 * a scene-graph fact — never an impression of a picture.
 *
 *   PLACEMENT TRUTH   the lowest SKINNED vertex, in WORLD space, against the surface the fighter's
 *                     own zone puts him on. This is the check the foot BONES miss completely:
 *                     measured, BANNON's foot bones read +0.20 (above the mat) while his drawn mesh
 *                     spans -0.767 to +0.34 — the skeleton looks fine and the body is buried.
 *   MATERIAL TRUTH    material type, colour, whether each texture actually DECODED (image.width>0,
 *                     not merely referenced), emissive, and the scene's live light budget.
 *   RENDER TRUTH      the fighter's own pixels, sampled inside his PROJECTED silhouette so the mat
 *                     and the crowd cannot dilute the answer. Mean luma plus DISTINCT COLOUR COUNT,
 *                     because a mean alone cannot tell "dark because the arena is dark" from "flat
 *                     black because nothing is shading him".
 *   SCENE TRUTH       every visible mesh that occupies a large share of the frame and is not one of
 *                     the fighters, reported with node name, parent chain, geometry, material and
 *                     world bounds. Owner: "Do not accept 'probably lighting.' A giant object in the
 *                     middle of the ring is discoverable." UNKNOWN is a FAIL, not a shrug.
 *   CAMERA TRUTH      before an image is written: is the subject on screen, does it occupy the
 *                     frame, is the camera above the floor and outside the subject's own bounds. If
 *                     any of those is false the file is labelled SCREENSHOT INVALID and the picture
 *                     is not evidence of anything.
 *
 * TIER IS A VARIABLE, NOT A CONSTANT. visual_defects.cjs forces POTATO (tier 4) so its frame rate is
 * survivable, which is a confounder: a quality tier that strips lights would blacken a body for a
 * reason that has nothing to do with the model. The sim is FROZEN first, then the same pose and the
 * same camera are photographed at each tier, so the only thing that changes is the tier.
 *
 * THE CANVAS MUST BE READ INSIDE A FRAME. The game's renderer has no preserveDrawingBuffer, so a
 * drawImage from page.evaluate — outside any rAF, after compositing — returns an EMPTY buffer. My
 * first version did exactly that and reported meanLuma 0 / 1 distinct colour for BOTH fighters at
 * ALL THREE tiers, which reads as "every body is black" and is really "the instrument read nothing".
 * A measurement where everything is identical and extreme is the one to distrust first.
 */
const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.dirname(path.dirname(__dirname));
const OUT = path.join(ROOT, 'dist', 'playtest', 'render');
const MIME = { '.html':'text/html','.js':'text/javascript','.json':'application/json','.glb':'model/gltf-binary',
  '.fbx':'application/octet-stream','.bin':'application/octet-stream','.png':'image/png','.jpg':'image/jpeg',
  '.jpeg':'image/jpeg','.webp':'image/webp','.mp3':'audio/mpeg','.wav':'audio/wav','.ogg':'audio/ogg',
  '.css':'text/css','.svg':'image/svg+xml','.gltf':'model/gltf+json' };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const argv = process.argv.slice(2);
const num = (f, d) => { const i = argv.indexOf('--' + f); return i >= 0 ? (+argv[i+1] || d) : d; };
const str = (f, d) => { const i = argv.indexOf('--' + f); return i >= 0 ? argv[i+1] : d; };

function serve(port){
  const srv = http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/BANNON_v150.html';
    const f = path.join(ROOT, p);
    if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()){ res.writeHead(404); return res.end('no'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(f).toLowerCase()] || 'application/octet-stream',
                         'Cache-Control':'no-cache' });
    fs.createReadStream(f).pipe(res);
  });
  return new Promise(r => srv.listen(port, () => r(srv)));
}

function PROBE(){
  const V = () => new THREE.Vector3();
  const FIGHTERS = new Function('return typeof fighters!=="undefined"?fighters:null');
  const CAMERA   = new Function('return typeof camera!=="undefined"?camera:null');
  const SCENE    = new Function('return typeof scene!=="undefined"?scene:null');
  const RENDERER = new Function('return typeof renderer!=="undefined"?renderer:null');
  const RINGY    = new Function('return typeof RING!=="undefined"?RING.floorY:0');

  function skinOf(model){
    let sm = null;
    model.traverse(o => { if (!sm && o.isSkinnedMesh && o.geometry && o.geometry.attributes && o.geometry.attributes.position) sm = o; });
    return sm;
  }
  function chainOf(o){
    const a = []; let p = o;
    while (p && a.length < 8){ a.push(p.name || p.type); p = p.parent; }
    return a.join(' < ');
  }

  // ── PLACEMENT: the DRAWN body, in world space ────────────────────────────────────────────────
  // boneTransform returns the mesh's LOCAL space (the shader applies modelViewMatrix afterwards), so
  // it MUST go through matrixWorld before it can be compared with a ring surface. A local-space Y
  // against a world-space mat is a category error that would read as a defect on every model.
  window.__rtBody = function(idx){
    const A = FIGHTERS() || []; const f = A[idx]; if (!f) return { err:'no fighter ' + idx };
    if (!f.model) return { err:'fighter ' + idx + ' has NO MODEL BOUND' };
    const sm = skinOf(f.model);
    if (!sm) return { err:'no skinned mesh in the bound model' };
    if (typeof sm.boneTransform !== 'function') return { err:'boneTransform unavailable — cannot measure the drawn surface' };
    sm.updateMatrixWorld(true);
    const pos = sm.geometry.attributes.position, n = pos.count;
    const step = Math.max(1, Math.floor(n / 1500));
    const p = V(), box = new THREE.Box3();
    for (let i = 0; i < n; i += step){ sm.boneTransform(i, p); p.applyMatrix4(sm.matrixWorld); box.expandByPoint(p); }
    let zy = 0;
    try{ const Z = window.ZONE_Y || {}; zy = (f.zone && Z[f.zone] != null) ? Z[f.zone] : 0; }catch(e){}
    const surface = (RINGY() || 0) + zy;
    const c = box.getCenter(V()), s = box.getSize(V());
    // How many skinned meshes does this ONE fighter have — a duplicated body shows up here.
    let nSkins = 0, meshNames = [];
    f.model.traverse(o => { if (o.isSkinnedMesh){ nSkins++; meshNames.push(o.name || '(unnamed)'); } });
    return { name:(f.opts && f.opts.name) || f.name || ('fighter'+idx), state:f.state, zone:f.zone || 'RING',
             ragdoll:!!f.ragdoll, airborne:!!(f.airborne || (typeof f.y === 'number' && f.y > 0.12)),
             mesh:(sm.name || '(unnamed)'), nSkins:nSkins, meshNames:meshNames.slice(0,4),
             minY:+box.min.y.toFixed(3), maxY:+box.max.y.toFixed(3), surfaceY:+surface.toFixed(3),
             sunkM:+(surface - box.min.y).toFixed(3), heightM:+s.y.toFixed(3),
             widthM:+s.x.toFixed(3), depthM:+s.z.toFixed(3),
             cx:+c.x.toFixed(3), cy:+c.y.toFixed(3), cz:+c.z.toFixed(3),
             modelLocalY:+f.model.position.y.toFixed(3),
             yBase:+((f.model.userData && f.model.userData.yBase) || 0).toFixed(3),
             fitScale:+((f.model.userData && f.model.userData.fitScale) || 0).toFixed(4),
             minYUserData:+((f.model.userData && f.model.userData.minY) || 0).toFixed(4),
             sampled: Math.ceil(n/step), verts:n };
  };

  // ── ASSET TRUTH: THE BIND POSE, WHICH IS THE ONE CONFIGURATION THE FILE IS KNOWN CORRECT IN ──
  // Read from inverse(boneInverses[i]) — the skeleton as AUTHORED, before any retarget, clip or IK
  // has touched it. If the feet are already above the hips here, the defect is in the GLB and no
  // animation change can fix it. If bind is sane and the live pose is not, it is the pose pipeline.
  // That is the whole question, and it is one subtraction.
  window.__rtBind = function(idx){
    const A = FIGHTERS() || []; const f = A[idx]; if (!f || !f.model) return { err:'no model' };
    const sm = skinOf(f.model); if (!sm || !sm.skeleton) return { err:'no skeleton' };
    const sk = sm.skeleton, inv = sk.boneInverses || [];
    const pick = {}, m4 = new THREE.Matrix4(), v = V();
    const want = { hips:'hips', head:'head', leftfoot:'leftfoot', rightfoot:'rightfoot',
                   leftleg:'leftleg', leftupleg:'leftupleg', lefttoe:'lefttoebase' };
    const bindY = {}, liveY = {};
    sk.bones.forEach((b, i) => {
      const nm = String(b.name || '').toLowerCase().replace(/[^a-z0-9]/g, '').replace(/^mixamorig\d*/, '');
      for (const k in want){
        if (bindY[k] != null) continue;
        if (nm.indexOf(want[k]) < 0) continue;
        if (inv[i]){ m4.copy(inv[i]).invert(); bindY[k] = +m4.elements[13].toFixed(3); }
        b.getWorldPosition(v); liveY[k] = +v.y.toFixed(3);
        pick[k] = b.name;
      }
    });
    // The bind box of the whole skeleton, and of the bind MESH, for the rig/mesh scale cross-check.
    let bMin = 1e9, bMax = -1e9;
    sk.bones.forEach((b, i) => { if (!inv[i]) return; m4.copy(inv[i]).invert();
      const y = m4.elements[13]; if (y < bMin) bMin = y; if (y > bMax) bMax = y; });
    const g = sm.geometry; if (!g.boundingBox) g.computeBoundingBox();
    const gb = g.boundingBox;
    return { bones:pick, bindY:bindY, liveY:liveY,
             boneBindSpanY:[+bMin.toFixed(3), +bMax.toFixed(3)],
             meshBindSpanY:[+gb.min.y.toFixed(3), +gb.max.y.toFixed(3)],
             // THE TEST: in a correct bind pose the feet are the lowest thing on the body.
             bindFeetBelowHips: (bindY.leftfoot != null && bindY.hips != null) ? (bindY.leftfoot < bindY.hips) : null,
             liveFeetBelowHips: (liveY.leftfoot != null && liveY.hips != null) ? (liveY.leftfoot < liveY.hips) : null,
             nBones: sk.bones.length };
  };

  // ── SCENE IDENTITY BY RAY, NOT BY EYE ────────────────────────────────────────────────────────
  // Owner: "screen ray -> raycast -> mesh -> node name -> parent chain ... Do not accept 'probably
  // lighting'." The screen point is FOUND, not chosen: the brightest near-white cluster in the frame
  // that is not part of a fighter. Nothing here depends on me deciding where to look.
  window.__rtBlob = function(){
    window.__rtBlobR = null;
    const cam = CAMERA(), S = SCENE(), cv = document.querySelector('canvas');
    if (!cam || !S || !cv){ window.__rtBlobR = { err:'no camera/scene/canvas' }; return; }
    requestAnimationFrame(function(){ requestAnimationFrame(function(){
      try{
        const off = document.createElement('canvas'); off.width = cv.width; off.height = cv.height;
        const ctx = off.getContext('2d', { willReadFrequently:true }); ctx.drawImage(cv, 0, 0);
        const d = ctx.getImageData(0, 0, cv.width, cv.height).data;
        // coarse grid so a cluster is a REGION, not a pixel; the UI strip at the bottom is excluded
        // by area rather than by naming widgets, because the widgets change.
        const GX = 48, GY = 96, cellW = cv.width/GX, cellH = cv.height/GY;
        const grid = new Float32Array(GX*GY);
        for (let gy = 0; gy < GY; gy++) for (let gx = 0; gx < GX; gx++){
          let n = 0, hit = 0;
          for (let y = Math.floor(gy*cellH); y < (gy+1)*cellH; y += 3)
            for (let x = Math.floor(gx*cellW); x < (gx+1)*cellW; x += 3){
              const o = (y*cv.width + x)*4, r = d[o], g = d[o+1], b = d[o+2];
              const mx = Math.max(r,g,b), mn = Math.min(r,g,b);
              n++; if (mx > 225 && (mx - mn) < 26) hit++;      // near-white and bright
            }
          grid[gy*GX+gx] = n ? hit/n : 0;
        }
        let best = -1, bi = -1;
        for (let i = 0; i < grid.length; i++){
          const gy = Math.floor(i/GX);
          if (gy < GY*0.10 || gy > GY*0.62) continue;          // skip the HUD band and the control pad
          if (grid[i] > best){ best = grid[i]; bi = i; }
        }
        if (bi < 0 || best < 0.55){ window.__rtBlobR = { none:true, bestFrac:+best.toFixed(2) }; return; }
        const gx = bi % GX, gy = Math.floor(bi/GX);
        const px = (gx+0.5)*cellW, py = (gy+0.5)*cellH;
        const ndc = new THREE.Vector2((px/cv.width)*2-1, -((py/cv.height)*2-1));
        const rc = new THREE.Raycaster(); rc.setFromCamera(ndc, cam);
        const hits = rc.intersectObject(S, true).filter(h => h.object && h.object.visible).slice(0, 4);
        window.__rtBlobR = { px:[Math.round(px), Math.round(py)], whiteFrac:+best.toFixed(2),
          hits: hits.map(h => { const o = h.object, mat = Array.isArray(o.material)?o.material[0]:o.material;
            const bb = new THREE.Box3().setFromObject(o); const s = bb.getSize(V()); const c = bb.getCenter(V());
            return { dist:+h.distance.toFixed(2), node:o.name || '(unnamed)', kind:o.type,
                     geometry:(o.geometry && o.geometry.type) || '?',
                     material: mat ? mat.type + (mat.color ? ' #' + mat.color.getHexString() : '') +
                                     (mat.map ? ' +map' + (mat.map.image ? '(' + (mat.map.image.width||0) + 'px)' : '(NO IMAGE)') : '') : 'none',
                     chain: chainOf(o.parent),
                     centre:[+c.x.toFixed(2), +c.y.toFixed(2), +c.z.toFixed(2)],
                     sizeM:[+s.x.toFixed(2), +s.y.toFixed(2), +s.z.toFixed(2)] }; }) };
      }catch(e){ window.__rtBlobR = { err:String(e && e.message).slice(0,140) }; }
    }); });
  };

  // ── SOLO RENDER: sampling a fighter's screen pixels measures whatever is IN FRONT OF HIM ─────
  // The glowing ropes sit between the camera and the body, so a "shaded" verdict taken from the full
  // frame can be reading the ropes. Hiding every other MESH isolates him. Lights are untouched on
  // purpose — hiding a light changes three.js's light COUNT and recompiles every material in the
  // scene (banked law), which would change the very thing being measured.
  window.__rtSolo = function(idx, on){
    const A = FIGHTERS() || []; const f = A[idx], S = SCENE();
    if (!f || !f.model || !S) return false;
    if (on){
      const keep = f.model; const hidden = [];
      const inKeep = o => { let p = o; while (p){ if (p === keep) return true; p = p.parent; } return false; };
      S.traverse(o => { if ((o.isMesh || o.isPoints || o.isSprite || o.isLine) && o.visible && !inKeep(o)){ o.visible = false; hidden.push(o); } });
      window.__rtHidden = hidden; return hidden.length;
    }
    (window.__rtHidden || []).forEach(o => { o.visible = true; });
    window.__rtHidden = null; return 0;
  };

  // ── MATERIAL TRUTH ───────────────────────────────────────────────────────────────────────────
  // A texture that is REFERENCED and a texture that DECODED are different claims. image.width > 0 is
  // the second one; a material can name a map whose image never arrived and still look "assigned".
  window.__rtMaterial = function(idx){
    const A = FIGHTERS() || []; const f = A[idx]; if (!f || !f.model) return { err:'no model' };
    const mats = [];
    f.model.traverse(o => {
      if (!o.isMesh) return;
      const list = Array.isArray(o.material) ? o.material : [o.material];
      list.forEach(m => {
        if (!m) return mats.push({ mesh:o.name || '(unnamed)', material:'NULL MATERIAL' });
        const tex = {};
        ['map','normalMap','roughnessMap','emissiveMap','aoMap'].forEach(k => {
          const t = m[k]; if (!t) return;
          const img = t.image;
          tex[k] = img ? ((img.width || 0) + 'x' + (img.height || 0)) : 'NO IMAGE';
        });
        mats.push({ mesh:o.name || '(unnamed)', visible:o.visible, frustumCulled:o.frustumCulled,
                    type:m.type, name:m.name || '',
                    color: m.color ? '#' + m.color.getHexString() : null,
                    emissive: m.emissive ? '#' + m.emissive.getHexString() : null,
                    metalness: m.metalness, roughness: m.roughness, opacity:m.opacity,
                    transparent:!!m.transparent, skinning:!!m.skinning, visibleMat:m.visible !== false,
                    textures: tex, nTextures:Object.keys(tex).length });
      });
    });
    // The scene's live light budget, because BANNON_PERF zeroes INTENSITY rather than hiding lights
    // (hiding one changes three.js's light COUNT and recompiles every material — banked law), so an
    // all-zero-intensity scene is exactly what a blackened body would look like.
    const S = SCENE(); const lights = [];
    if (S) S.traverse(o => { if (o.isLight) lights.push({ type:o.type, intensity:+(o.intensity||0).toFixed(3), visible:o.visible }); });
    const R = RENDERER();
    return { materials:mats, lights:lights,
             litIntensity:+lights.reduce((a,l) => a + (l.visible ? l.intensity : 0), 0).toFixed(3),
             renderer: R ? { toneMapping:R.toneMapping, toneMappingExposure:R.toneMappingExposure,
                             outputEncoding:R.outputEncoding, shadowMapEnabled:!!(R.shadowMap && R.shadowMap.enabled),
                             pixelRatio:R.getPixelRatio ? +R.getPixelRatio().toFixed(3) : null } : null,
             tier: (window.BANNON_PERF && window.BANNON_PERF.report) ? (window.BANNON_PERF.report().tier) : null };
  };

  // ── CAMERA TRUTH ─────────────────────────────────────────────────────────────────────────────
  // Framed from the subject's own MEASURED bounds. Then validated, because a picture that does not
  // contain the thing it claims to show is not weak evidence, it is no evidence.
  window.__rtFrame = function(idx){
    const b = window.__rtBody(idx); if (!b || b.err) return b;
    const d = Math.max(1.7, b.heightM * 1.45);
    const surf = b.surfaceY;
    // Never put the eye below the surface the subject stands on — that is how the last pass produced
    // a photograph of the underside of the mat and called it a defect image.
    const py = Math.max(surf + 0.35, b.cy + b.heightM * 0.12);
    window.__camShot = { px: b.cx + d*0.32, py: py, pz: b.cz + d, lx: b.cx, ly: b.cy, lz: b.cz, w:1, speed:90 };
    return b;
  };
  window.__rtCamCheck = function(idx){
    const A = FIGHTERS() || []; const f = A[idx];
    const cam = CAMERA(); const cv = document.querySelector('canvas');
    if (!f || !f.model || !cam || !cv) return { valid:false, why:'no fighter/camera/canvas' };
    const sm = skinOf(f.model); if (!sm) return { valid:false, why:'no skinned mesh' };
    sm.updateMatrixWorld(true); cam.updateMatrixWorld(true);
    const pos = sm.geometry.attributes.position, n = pos.count, step = Math.max(1, Math.floor(n/600));
    const p = V(); let minX=1e9,maxX=-1e9,minY=1e9,maxY=-1e9,on=0,total=0;
    const box = new THREE.Box3();
    for (let i = 0; i < n; i += step){
      sm.boneTransform(i, p); p.applyMatrix4(sm.matrixWorld); box.expandByPoint(p);
      const q = p.clone().project(cam); total++;
      if (q.z < -1 || q.z > 1) continue;
      const x = (q.x*0.5+0.5) * cv.width, y = (-q.y*0.5+0.5) * cv.height;
      if (x < 0 || y < 0 || x >= cv.width || y >= cv.height) continue;
      on++; if (x<minX)minX=x; if (x>maxX)maxX=x; if (y<minY)minY=y; if (y>maxY)maxY=y;
    }
    const camPos = cam.getWorldPosition(V());
    let zy = 0; try{ const Z = window.ZONE_Y || {}; zy = (f.zone && Z[f.zone] != null) ? Z[f.zone] : 0; }catch(e){}
    const surface = (RINGY() || 0) + zy;
    const inside = box.containsPoint(camPos);
    const frac = on/Math.max(1,total);
    const area = (on >= 8) ? ((maxX-minX)*(maxY-minY)) / (cv.width*cv.height) : 0;
    const why = [];
    if (frac < 0.25) why.push('only ' + (frac*100).toFixed(0) + '% of the body projects on screen');
    if (area < 0.02) why.push('the body occupies ' + (area*100).toFixed(1) + '% of the frame');
    if (camPos.y < surface) why.push('the camera is BELOW the surface (' + camPos.y.toFixed(2) + ' < ' + surface.toFixed(2) + ')');
    if (inside) why.push('the camera is INSIDE the subject bounds');
    return { valid: why.length === 0, why: why.join('; ') || 'framed',
             onScreenFrac:+frac.toFixed(3), frameFrac:+area.toFixed(4),
             camY:+camPos.y.toFixed(3), surfaceY:+surface.toFixed(3),
             px:[Math.round(minX), Math.round(minY), Math.round(maxX), Math.round(maxY)] };
  };

  // ── RENDER TRUTH: read the canvas INSIDE a frame ─────────────────────────────────────────────
  // The renderer has no preserveDrawingBuffer, so this samples from a rAF callback and caches the
  // result for the driver to collect. Reading from page.evaluate reads an empty buffer and reports
  // every body as pure black.
  window.__rtPx = {};
  window.__rtSample = function(idx){
    window.__rtPx[idx] = null;
    const A = FIGHTERS() || []; const f = A[idx]; if (!f || !f.model){ window.__rtPx[idx] = { err:'no model' }; return; }
    const sm = skinOf(f.model); const cam = CAMERA(); const cv = document.querySelector('canvas');
    if (!sm || !cam || !cv){ window.__rtPx[idx] = { err:'no mesh/camera/canvas' }; return; }
    requestAnimationFrame(function(){ requestAnimationFrame(function(){
      try{
        sm.updateMatrixWorld(true); cam.updateMatrixWorld(true);
        const pos = sm.geometry.attributes.position, n = pos.count, step = Math.max(1, Math.floor(n/1200));
        const p = V(), pts = [];
        let minX=1e9,maxX=-1e9,minY=1e9,maxY=-1e9;
        for (let i = 0; i < n; i += step){
          sm.boneTransform(i, p); p.applyMatrix4(sm.matrixWorld); p.project(cam);
          if (p.z < -1 || p.z > 1) continue;
          const x = Math.round((p.x*0.5+0.5)*cv.width), y = Math.round((-p.y*0.5+0.5)*cv.height);
          if (x < 1 || y < 1 || x >= cv.width-1 || y >= cv.height-1) continue;
          pts.push([x,y]); if(x<minX)minX=x; if(x>maxX)maxX=x; if(y<minY)minY=y; if(y>maxY)maxY=y;
        }
        if (pts.length < 20){ window.__rtPx[idx] = { err:'body off screen (' + pts.length + ' points)' }; return; }
        const off = document.createElement('canvas'); off.width = cv.width; off.height = cv.height;
        const ctx = off.getContext('2d', { willReadFrequently:true });
        ctx.drawImage(cv, 0, 0);
        const w = maxX-minX+1, h = maxY-minY+1;
        const img = ctx.getImageData(minX, minY, w, h).data;
        // THE WHOLE-CANVAS CONTROL. If the entire frame reads black then the READBACK failed and the
        // body's blackness says nothing — the instrument must be able to tell those two apart, which
        // is exactly what the first version could not do.
        const full = ctx.getImageData(0, 0, cv.width, cv.height).data;
        let fsum = 0, fn = 0;
        for (let i = 0; i < full.length; i += 4*997){ fsum += 0.2126*full[i] + 0.7152*full[i+1] + 0.0722*full[i+2]; fn++; }
        let sum = 0, cnt = 0, dark = 0, alpha0 = 0; const cols = {};
        for (const [x,y] of pts){
          const o = ((y-minY)*w + (x-minX)) * 4;
          const r = img[o], g = img[o+1], b = img[o+2], a = img[o+3];
          if (a === 0) alpha0++;
          const luma = 0.2126*r + 0.7152*g + 0.0722*b;
          sum += luma; cnt++; if (luma < 40) dark++;
          cols[(r>>4)+'/'+(g>>4)+'/'+(b>>4)] = 1;
        }
        window.__rtPx[idx] = { onScreen:cnt, meanLuma:+(sum/cnt).toFixed(1), darkFrac:+(dark/cnt).toFixed(3),
                               distinctColours:Object.keys(cols).length, alphaZero:alpha0,
                               canvasMeanLuma:+(fsum/Math.max(1,fn)).toFixed(1) };
      }catch(e){ window.__rtPx[idx] = { err:String(e && e.message).slice(0,120) }; }
    }); });
  };

  // ── SCENE TRUTH: name every large thing in frame that is not a fighter ───────────────────────
  // Owner: "Do not accept 'probably lighting.' A giant object in the middle of the ring is
  // discoverable." Enumerated by SCREEN AREA rather than by picking a pixel to raycast, so nothing
  // depends on me choosing where to look.
  window.__rtScene = function(){
    const S = SCENE(), cam = CAMERA(), cv = document.querySelector('canvas');
    if (!S || !cam || !cv) return { err:'no scene/camera/canvas' };
    const A = FIGHTERS() || [];
    const fighterRoots = A.map(f => f && f.model).filter(Boolean);
    const isFighter = o => { let p = o; while (p){ if (fighterRoots.indexOf(p) >= 0) return true; p = p.parent; } return false; };
    cam.updateMatrixWorld(true);
    const frustum = new THREE.Frustum().setFromProjectionMatrix(
      new THREE.Matrix4().multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse));
    const out = [], box = new THREE.Box3(), c = V();
    S.traverse(o => {
      if (!o.visible) return;
      if (!(o.isMesh || o.isPoints || o.isSprite || o.isLine)) return;
      if (isFighter(o)) return;
      let p = o, hidden = false;
      while (p){ if (p.visible === false){ hidden = true; break; } p = p.parent; }
      if (hidden) return;
      try{ box.setFromObject(o); }catch(e){ return; }
      if (!isFinite(box.min.x) || box.isEmpty()) return;
      if (!frustum.intersectsBox(box)) return;
      // project the 8 corners; screen area is what "giant in frame" actually means
      let minX=1e9,maxX=-1e9,minY=1e9,maxY=-1e9, any=false;
      for (let i = 0; i < 8; i++){
        c.set(i&1?box.max.x:box.min.x, i&2?box.max.y:box.min.y, i&4?box.max.z:box.min.z).project(cam);
        if (c.z < -1 || c.z > 1) continue;
        any = true;
        const x = (c.x*0.5+0.5)*cv.width, y = (-c.y*0.5+0.5)*cv.height;
        if (x<minX)minX=x; if (x>maxX)maxX=x; if (y<minY)minY=y; if (y>maxY)maxY=y;
      }
      if (!any) return;
      const area = ((Math.min(maxX,cv.width)-Math.max(minX,0)) * (Math.min(maxY,cv.height)-Math.max(minY,0)))
                 / (cv.width*cv.height);
      if (!(area > 0.03)) return;
      const s = box.getSize(V());
      const mat = Array.isArray(o.material) ? o.material[0] : o.material;
      out.push({ node:o.name || '(unnamed)', kind:o.type, chain:chainOf(o.parent),
                 geometry:(o.geometry && o.geometry.type) || '?',
                 material: mat ? (mat.type + (mat.color ? ' #' + mat.color.getHexString() : '') +
                                  (mat.map ? ' +map' : '') + (mat.transparent ? ' transparent' : '')) : 'none',
                 sizeM:[+s.x.toFixed(2), +s.y.toFixed(2), +s.z.toFixed(2)],
                 worldY:[+box.min.y.toFixed(2), +box.max.y.toFixed(2)],
                 frameFrac:+area.toFixed(3) });
    });
    out.sort((a,b) => b.frameFrac - a.frameFrac);
    // Every skinned mesh anywhere in the scene — a leaked preview body or a duplicate fighter is a
    // skinned mesh that belongs to nobody in `fighters`.
    const orphanSkins = [];
    S.traverse(o => { if (o.isSkinnedMesh && !isFighter(o))
      orphanSkins.push({ node:o.name || '(unnamed)', chain:chainOf(o.parent), visible:o.visible }); });
    return { big: out.slice(0, 10), orphanSkins: orphanSkins.slice(0, 10),
             nFighters: A.length, nBoundModels: fighterRoots.length };
  };

  window.__rtTier = function(t){ try{ window.BANNON_PERF_AUTO = false;
    if (window.BANNON_PERF && window.BANNON_PERF.setTier){ window.BANNON_PERF.setTier(t); return true; } }catch(e){} return false; };
  window.__rtFreeze = function(){ try{
    const C = new Function('return typeof Fighter!=="undefined"?Fighter:null')();
    if (C && C.prototype.update && !window.__rtFrozen){ const o = C.prototype.update;
      C.prototype.update = function(){ return; }; window.__rtFrozen = o; return true; } }catch(e){} return false; };
}

(async () => {
  const SECS = num('seconds', 6);
  const TIERS = String(str('tiers', '0,2,4')).split(',').map(Number).filter(n => n >= 0 && n <= 4);
  const port = 9600 + Math.floor(Math.random()*300);
  fs.mkdirSync(OUT, { recursive:true });
  const srv = await serve(port);
  const browser = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    args:['--use-gl=swiftshader','--no-sandbox','--no-proxy-server','--proxy-bypass-list=<-loopback>'] });
  const page = await browser.newPage({ viewport:{ width:412, height:915 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e.message).split('\n')[0].slice(0,140)));
  await page.addInitScript(PROBE);
  // NAMED PERTURBATIONS, INSTALLED BEFORE ANY MODULE RUNS. Banked law: a perturbation applied from an
  // interval can miss the thing it means to suppress and then the comparison proves nothing — so
  // these are set in the init script, and the report PRINTS which one armed.
  const PERTURB = str('perturb', 'none');
  if (PERTURB !== 'none') await page.addInitScript(p => {
    if (p === 'stateclip')  window.STATE_CLIP = false;         // BANNON_STATECLIP idle/walk/run clips
    if (p === 'nativepose') window.GLB_NATIVE_POSE = false;    // the bind-pose hold + the grounding snap
    if (p === 'footik')     window.FOOT_IK = false;
    if (p === 'gripik')     window.GRIP_IK = false;
    window.__rtPerturb = p;
  }, PERTURB);
  await page.goto(`http://127.0.0.1:${port}/BANNON_v150.html`, { waitUntil:'domcontentloaded', timeout:60000 });

  const gs = () => page.evaluate(() => { try{ return new Function('return gameState')(); }catch(e){ return null; } }).catch(()=>null);
  for (let i = 0; i < 300 && (await gs()) !== 'menu'; i++) await sleep(400);
  await page.evaluate(() => { const b = document.getElementById('btnFight'); if (b) b.click(); });
  for (let i = 0; i < 60; i++){ const ok = await page.evaluate(() => { const s=document.getElementById('csStart'); return !!(s && s.offsetParent !== null); }); if (ok) break; await sleep(400); }
  await page.evaluate(() => { const s = document.getElementById('csStart'); if (s) s.click(); });
  for (let i = 0; i < 90 && (await gs()) !== 'fight'; i++) await sleep(400);
  await page.evaluate(() => { try{ window.__SEQ_SKIP_ALL = true;
    if (window.BANNON_WALKOUT && window.BANNON_WALKOUT.skip) window.BANNON_WALKOUT.skip(); }catch(e){} });
  for (let i = 0; i < 60; i++){
    const live = await page.evaluate(() => { try{ return window.BANNON_PHASE ? window.BANNON_PHASE.officialMatch() : true; }catch(e){ return true; } });
    if (live) break; await sleep(400);
  }
  await sleep(SECS * 1000);

  // Did the perturbation actually take? A perturbation that did not change the variable is not
  // evidence, and this file's history has that mistake in it more than once.
  const armed = await page.evaluate(() => ({ tag: window.__rtPerturb || null,
    STATE_CLIP: window.STATE_CLIP, GLB_NATIVE_POSE: window.GLB_NATIVE_POSE,
    FOOT_IK: window.FOOT_IK, GRIP_IK: window.GRIP_IK }));

  // FREEZE FIRST — every tier must photograph the SAME pose or the comparison is between two moments.
  const froze = await page.evaluate(() => window.__rtFreeze());
  const rows = [];
  for (const t of TIERS){
    const set = await page.evaluate(tt => window.__rtTier(tt), t);
    await sleep(1300);
    for (const idx of [0,1]){
      const body = await page.evaluate(i => window.__rtFrame(i), idx);
      await sleep(1200);
      const cam = await page.evaluate(i => window.__rtCamCheck(i), idx);
      await page.evaluate(i => window.__rtSample(i), idx);
      let px = null;
      for (let k = 0; k < 40 && !px; k++){ await sleep(150); px = await page.evaluate(i => window.__rtPx[i], idx); }
      const mat = await page.evaluate(i => window.__rtMaterial(i), idx);
      const bind = await page.evaluate(i => window.__rtBind(i), idx);
      const scn = await page.evaluate(() => window.__rtScene());
      // find the white blob from THIS camera, before anything is hidden
      await page.evaluate(() => window.__rtBlob());
      let blob = null;
      for (let k = 0; k < 40 && !blob; k++){ await sleep(150); blob = await page.evaluate(() => window.__rtBlobR); }
      const tag = (cam && cam.valid) ? '' : '_INVALID';
      const p = path.join(OUT, 'tier' + t + '_fighter' + idx + tag + '.png');
      await page.screenshot({ path:p });
      // SOLO: the same camera with every other mesh hidden, so his pixels are unambiguously his.
      const hid = await page.evaluate(i => window.__rtSolo(i, true), idx);
      await sleep(700);
      await page.evaluate(i => window.__rtSample(i), idx);
      let solo = null;
      for (let k = 0; k < 40 && !solo; k++){ await sleep(150); solo = await page.evaluate(i => window.__rtPx[i], idx); }
      const sp = path.join(OUT, 'tier' + t + '_fighter' + idx + '_SOLO.png');
      await page.screenshot({ path:sp });
      await page.evaluate(i => window.__rtSolo(i, false), idx);
      await sleep(400);
      rows.push({ tier:t, tierSet:set, idx, body, cam, px, solo, hid, mat, bind, scene:scn, blob, shot:p, soloShot:sp });
    }
  }
  await page.evaluate(() => { try{ window.__camShot = null; }catch(e){} });
  try{ await browser.close(); }catch(e){} try{ srv.close(); }catch(e){}

  const P = s => console.log(s);
  let fails = 0, unknown = 0;
  P('\n===== RENDERED-CHARACTER BRING-UP GATE =====');
  P('  sim frozen for the comparison: ' + froze + '   tiers swept: ' + TIERS.join(', '));
  P('  perturbation: ' + PERTURB + (PERTURB === 'none' ? '' : '   armed in the page: ' + JSON.stringify(armed)));
  if (PERTURB !== 'none' && (!armed || armed.tag !== PERTURB))
    P('  THE PERTURBATION DID NOT ARM — do not read this run as a comparison.');

  P('\n  1. PLACEMENT TRUTH — lowest DRAWN vertex (world) vs the surface his own zone puts him on');
  P('  tier  fighter        mesh                state    skins    minY    maxY  surface   SUNK BY   modelY/yBase');
  const bodies = {};
  for (const r of rows){
    const b = r.body || {};
    if (b.err){ P('  ' + String(r.tier).padEnd(6) + ('fighter'+r.idx).padEnd(15) + 'ERROR: ' + b.err); unknown++; continue; }
    P('  ' + String(r.tier).padEnd(6) + String(b.name).padEnd(15) + String(b.mesh).slice(0,19).padEnd(20) +
      String(b.state).padEnd(9) + String(b.nSkins).padStart(5) + String(b.minY).padStart(8) +
      String(b.maxY).padStart(8) + String(b.surfaceY).padStart(9) + String(b.sunkM).padStart(10) +
      '   ' + b.modelLocalY + ' / ' + b.yBase);
    bodies[b.name] = b;
  }

  P('\n  2. MATERIAL TRUTH — is anything shading him, and did his textures actually decode');
  P('  tier  fighter        material                       colour     textures                 lights  sum(intensity)');
  for (const r of rows){
    const b = r.body || {}, m = r.mat || {};
    if (m.err || !m.materials){ P('  ' + String(r.tier).padEnd(6) + ('fighter'+r.idx).padEnd(15) + 'ERROR: ' + (m.err||'no materials')); unknown++; continue; }
    const skin = m.materials.find(x => x.nTextures > 0) || m.materials[0] || {};
    const tex = Object.entries(skin.textures || {}).map(([k,v]) => k + ':' + v).join(' ') || 'NONE';
    P('  ' + String(r.tier).padEnd(6) + String(b.name||r.idx).padEnd(15) +
      String((skin.type||'?') + (skin.name ? ' "' + skin.name + '"' : '')).slice(0,30).padEnd(31) +
      String(skin.color||'-').padEnd(11) + tex.slice(0,24).padEnd(25) +
      String((m.lights||[]).length).padStart(6) + String(m.litIntensity).padStart(15));
  }

  P('\n  2b. ASSET TRUTH — the BIND pose, straight off inverse(boneInverses). In a correct rig the');
  P('      feet are the LOWEST thing on the body. If they are not, no animation change can fix it.');
  P('  fighter        bones                     bind hips/foot/head        live hips/foot/head     feet below hips?');
  const seenBind = {};
  for (const r of rows){
    const b = r.body || {}, k = r.bind || {};
    if (seenBind[b.name]) continue; seenBind[b.name] = 1;
    if (k.err){ P('  ' + String(b.name||r.idx).padEnd(15) + 'ERROR: ' + k.err); unknown++; continue; }
    const trio = o => [o.hips, o.leftfoot, o.head].map(v => v == null ? '-' : v).join(' / ');
    P('  ' + String(b.name).padEnd(15) + String((k.bones||{}).leftfoot || '?').slice(0,25).padEnd(26) +
      trio(k.bindY||{}).padEnd(27) + trio(k.liveY||{}).padEnd(24) +
      'bind ' + k.bindFeetBelowHips + ' / live ' + k.liveFeetBelowHips);
    P('  ' + ''.padEnd(15) + 'bone bind span Y ' + (k.boneBindSpanY||[]).join(' .. ') +
      '   mesh bind span Y ' + (k.meshBindSpanY||[]).join(' .. ') + '   ' + k.nBones + ' bones');
  }

  P('\n  3. RENDER TRUTH — his OWN pixels. FULL FRAME can be reading the ropes in front of him, so');
  P('     SOLO (every other mesh hidden, lights untouched) is the reading that decides it.');
  P('  tier  fighter        which   onScreen  meanLuma  darkFrac  distinctCols  WHOLE-CANVAS mean');
  for (const r of rows){
    const b = r.body || {};
    for (const [lbl, p] of [['full', r.px], ['SOLO', r.solo]]){
      if (!p || p.err){ P('  ' + String(r.tier).padEnd(6) + String(b.name||r.idx).padEnd(15) + lbl.padEnd(8) + 'UNKNOWN: ' + ((p&&p.err)||'no sample')); unknown++; continue; }
      P('  ' + String(r.tier).padEnd(6) + String(b.name||r.idx).padEnd(15) + lbl.padEnd(8) + String(p.onScreen).padStart(8) +
        String(p.meanLuma).padStart(10) + String(p.darkFrac).padStart(10) + String(p.distinctColours).padStart(14) +
        String(p.canvasMeanLuma).padStart(19));
    }
  }

  P('\n  4. CAMERA TRUTH — the image is only evidence if it frames the subject that was measured');
  for (const r of rows){
    const b = r.body || {}, c = r.cam || {};
    P('   tier ' + r.tier + '  ' + String(b.name||r.idx).padEnd(14) + (c.valid ? 'VALID  ' : 'INVALID') +
      '  onScreen ' + (c.onScreenFrac != null ? (c.onScreenFrac*100).toFixed(0) + '%' : '-') +
      '  frame ' + (c.frameFrac != null ? (c.frameFrac*100).toFixed(1) + '%' : '-') +
      '  camY ' + c.camY + ' vs surface ' + c.surfaceY + '   ' + (c.valid ? '' : '<- ' + c.why));
    if (!c.valid) fails++;
  }

  P('\n  5. SCENE TRUTH — every large visible thing in frame that is NOT a fighter');
  const scn = (rows.find(r => r.scene && r.scene.big) || {}).scene || {};
  if (!scn.big){ P('   UNKNOWN: scene query did not run'); unknown++; }
  else {
    P('   ' + scn.nBoundModels + ' of ' + scn.nFighters + ' fighters have a bound model');
    if (!scn.big.length) P('   nothing over 3% of the frame besides the fighters');
    for (const o of scn.big)
      P('   ' + (o.frameFrac*100).toFixed(1).padStart(5) + '%  ' + String(o.node).slice(0,26).padEnd(27) +
        String(o.geometry).slice(0,18).padEnd(19) + String(o.material).slice(0,34).padEnd(35) +
        ' size ' + o.sizeM.join('x') + '  y ' + o.worldY.join('..') + '   < ' + String(o.chain).slice(0,60));
    // THE WHITE BLOB, IDENTIFIED BY RAY — the screen point is found (brightest near-white region
    // outside the HUD bands), never chosen by eye, and UNKNOWN is a FAIL rather than a shrug.
    const blobs = rows.map(r => r.blob).filter(x => x && x.hits && x.hits.length);
    if (!blobs.length){
      const none = rows.find(r => r.blob && r.blob.none);
      if (none) P('   no near-white region over 55% coverage anywhere outside the HUD (best ' + none.bestFrac + ') — no blob in these frames');
      else { unknown++; P('   UNKNOWN: the blob query did not return'); }
    } else {
      const bl = blobs[0];
      P('   WHITE REGION at pixel ' + bl.px.join(',') + ' (' + (bl.whiteFrac*100).toFixed(0) + '% near-white) — what the ray hits:');
      if (!bl.hits.length){ fails++; P('     UNKNOWN — the ray hit NOTHING. A bright region with no geometry behind it is a FAIL.'); }
      for (const h of bl.hits)
        P('     ' + String(h.dist).padStart(6) + 'm  ' + String(h.node).slice(0,24).padEnd(25) +
          String(h.geometry).slice(0,16).padEnd(17) + String(h.material).slice(0,42).padEnd(43) +
          ' centre ' + h.centre.join(',') + '  size ' + h.sizeM.join('x') + '   < ' + String(h.chain).slice(0,52));
    }
    if (scn.orphanSkins && scn.orphanSkins.length){
      fails++;
      P('   FAIL  ' + scn.orphanSkins.length + ' SKINNED BODY(IES) IN THE SCENE BELONG TO NO FIGHTER:');
      for (const o of scn.orphanSkins) P('         ' + o.node + '  visible=' + o.visible + '  < ' + o.chain);
    }
  }

  P('\n  VERDICTS');
  for (const nm in bodies){
    const b = bodies[nm];
    const k = (rows.find(r => (r.body||{}).name === nm) || {}).bind || {};
    if (k.bindFeetBelowHips === false){ fails++;
      P('   FAIL  ' + nm + ' IS BROKEN IN THE ASSET — in the BIND pose his feet (' + (k.bindY||{}).leftfoot +
        ') are ABOVE his hips (' + (k.bindY||{}).hips + '). That is the GLB, not the animation.'); }
    else if (k.bindFeetBelowHips === true && k.liveFeetBelowHips === false){ fails++;
      P('   FAIL  ' + nm + ' binds correctly (feet below hips) but his LIVE pose puts feet ' +
        ((k.liveY||{}).leftfoot) + ' above hips ' + ((k.liveY||{}).hips) + ' — the POSE PIPELINE inverts him.'); }
    else if (k.bindFeetBelowHips == null){ unknown++; P('   UNKNOWN  ' + nm + ' bind pose could not be read'); }
    if (b.nSkins > 1) { fails++; P('   FAIL  ' + nm + ' has ' + b.nSkins + ' skinned meshes in one model: ' + b.meshNames.join(', ')); }
    if (!b.ragdoll && !b.airborne && b.sunkM > 0.12){ fails++;
      P('   FAIL  ' + nm + ' is BURIED — his lowest drawn vertex is ' + b.sunkM + ' m BELOW the surface, in state "' + b.state + '"'); }
    else if (!b.ragdoll && !b.airborne && b.sunkM < -0.12){ fails++;
      P('   FAIL  ' + nm + ' is FLOATING — his lowest drawn vertex is ' + (-b.sunkM).toFixed(3) + ' m ABOVE the surface, in state "' + b.state + '"'); }
    else P('   ok    ' + nm + ' stands on the surface (' + b.sunkM + ' m)');
  }
  for (const idx of [0,1]){
    const at = t => (rows.find(r => r.tier === t && r.idx === idx) || {});
    const lo = TIERS[0], hi = TIERS[TIERS.length-1];
    const A = at(lo), B = at(hi);
    const nm = ((A.body||{}).name) || ('fighter'+idx);
    // SOLO decides it. The full-frame reading can be the ropes; the solo reading is his surface.
    const pa = A.solo || A.px, pb = B.solo || B.px;
    if (!pa || !pb || pa.err || pb.err){ P('   UNKNOWN  ' + nm + ' render comparison did not run'); unknown++; continue; }
    // THE READBACK CONTROL FIRST. If the whole canvas is black the body's blackness is meaningless.
    if (pa.canvasMeanLuma < 2 && pb.canvasMeanLuma < 2){
      unknown++; P('   UNKNOWN  ' + nm + ': the WHOLE CANVAS read black (' + pa.canvasMeanLuma + ') — the readback failed, this says nothing about the model');
      continue;
    }
    // THE BAR IS THE OTHER FIGHTER, MEASURED IN THE SAME SCENE UNDER THE SAME LIGHTS AND THE SAME
    // TIER. An absolute colour-count threshold is a number I would be inventing; a body showing an
    // ORDER OF MAGNITUDE fewer distinct colours than the body standing next to it is a comparison
    // the frame itself supplies. My first threshold was <=6 and it printed "ok" for a body showing
    // EIGHT colours beside one showing NINETY — a bar tuned so low it certified the defect.
    const other = (rows.find(r => r.tier === lo && r.idx !== idx) || {});
    const op = other.solo || other.px || {};
    const ref = (op && !op.err) ? op.distinctColours : null;
    const flat = c => (c.distinctColours <= 12 || c.darkFrac >= 0.9 ||
                       (ref != null && ref >= 30 && c.distinctColours <= ref/4));
    const ctx = ' (' + pa.distinctColours + ' colours at tier ' + lo + ', ' + pb.distinctColours + ' at tier ' + hi +
                (ref != null ? '; the other fighter in the same frame shows ' + ref : '') + ')';
    if (flat(pa) && flat(pb)){ fails++;
      P('   FAIL  ' + nm + ' renders as a FLAT SILHOUETTE at EVERY tier' + ctx + ' — the model/material, not the quality setting'); }
    else if (!flat(pa) && flat(pb)){ fails++;
      P('   FAIL  ' + nm + ' goes flat at tier ' + hi + ' only' + ctx + ' — a quality-tier rendering regression'); }
    else P('   ok    ' + nm + ' is shaded at every tier' + ctx);
  }
  if (errs.length) P('\n  page errors: ' + errs.slice(0,4).join(' | '));
  fs.writeFileSync(path.join(OUT, 'render_truth.json'), JSON.stringify({ froze, tiers:TIERS, rows, errs }, null, 1));
  P('\n  ' + (fails ? fails + ' FAILURE(S)' : 'no failure') + (unknown ? ', ' + unknown + ' UNKNOWN (a check that could not run is not a pass)' : '') +
    '\n  report -> ' + path.join(OUT, 'render_truth.json'));
  for (const r of rows) P('   ' + (((r.cam||{}).valid) ? 'evidence ' : 'INVALID  ') + 'tier ' + r.tier + ' ' + (((r.body||{}).name)||r.idx) + ' -> ' + r.shot);
  process.exitCode = (fails || unknown) ? 1 : 0;
})();
