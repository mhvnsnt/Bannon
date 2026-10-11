#!/usr/bin/env node
/* fbx2glb.cjs — convert Mixamo-style FBX (skeleton + animation) to GLB.
 * Uses three.js FBXLoader + GLTFExporter (both MIT) in Node.
 * Output: GLB with the skeleton nodes and embedded animation clips.
 * Usage: node fbx2glb.cjs <in.fbx> <out.glb>
 */
'use strict';
const fs = require('fs');

async function main() {
  const [inF, outF] = process.argv.slice(2);
  if (!inF || !outF) { console.error('Usage: node fbx2glb.cjs <in.fbx> <out.glb>'); process.exit(1); }

  // Minimal document stub: some FBX files embed textures; FBXLoader touches
  // document.createElementNS for them. Meshes are stripped anyway, so textures
  // may fail — the stub lets parsing continue.
  if (typeof globalThis.document === 'undefined') {
    globalThis.document = {
      createElementNS: () => ({
        addEventListener(){}, removeEventListener(){}, style: {}, width: 0, height: 0,
        set src(v){ const self=this; setTimeout(()=>self.onerror&&self.onerror(new Error('stubbed')),0); },
        get src(){ return ''; },
      }),
    };
  }

  // Node polyfill for GLTFExporter's texture path (browser FileReader)
  if (typeof globalThis.FileReader === 'undefined') {    globalThis.FileReader = class {
      constructor() { this.result = null; this.onload = null; this.onerror = null; this.onloadend = null; }
      _done(result) { this.result = result;
        if (this.onload) this.onload({ target: this });
        if (this.onloadend) this.onloadend({ target: this }); }
      _fail(e) { if (this.onerror) this.onerror(e); }
      readAsArrayBuffer(blob) {
        blob.arrayBuffer().then(b => this._done(b)).catch(e => this._fail(e));
      }
      readAsDataURL(blob) {
        blob.arrayBuffer().then(b => this._done(
          'data:' + (blob.type || 'application/octet-stream') + ';base64,' + Buffer.from(b).toString('base64')
        )).catch(e => this._fail(e));
      }
    };
  }

  const THREE = await import('three');
  const { FBXLoader } = await import('three/examples/jsm/loaders/FBXLoader.js');
  const { GLTFExporter } = await import('three/examples/jsm/exporters/GLTFExporter.js');

  const buf = fs.readFileSync(inF);
  // FBXLoader wants ArrayBuffer; handle both binary and ASCII FBX
  const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  const loader = new FBXLoader();
  const obj = loader.parse(ab, '');
  console.log('parsed:', inF.split('/').pop(),
    '| animations:', obj.animations.length,
    '| clips:', obj.animations.map(a => `${a.name}(${a.duration.toFixed(2)}s)`).join(', '));

  // Keep only the bone hierarchy + animations: strip meshes/materials/textures
  // (we need the motion, not the Mixamo character mesh).
  const bones = [];
  obj.traverse(o => { if (o.isBone) bones.push(o); });
  // find common root: the bone with no bone ancestor
  let root = bones[0];
  while (root.parent && root.parent.isBone) root = root.parent;
  // detach root from the loaded group so only the skeleton exports
  obj.remove(root);
  const scene = new THREE.Group();
  scene.add(root);
  console.log('skeleton bones:', bones.length, '| root:', root.name);

  const exporter = new GLTFExporter();
  const glb = await exporter.parseAsync(scene, { binary: true, animations: obj.animations });
  const outBuf = Buffer.isBuffer(glb) ? glb : Buffer.from(glb);
  fs.writeFileSync(outF, outBuf);
  console.log('wrote:', outF, outBuf.length, 'bytes');
}

main().catch(e => { console.error('FATAL', e.message); process.exit(1); });
