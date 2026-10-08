#!/usr/bin/env node
/* decompress.cjs — strip EXT_meshopt_compression so minimal-reader tools can work.
 * Usage: node decompress.cjs <in.glb> <out.glb>
 */
'use strict';
const fs = require('fs');
const path = require('path');
const IN = process.argv[2], OUT = process.argv[3];
if (!IN || !OUT) { console.error('usage: node decompress.cjs <in.glb> <out.glb>'); process.exit(1); }
(async () => {
  const { NodeIO } = require('@gltf-transform/core');
  const { ALL_EXTENSIONS } = require('@gltf-transform/extensions');
  const { MeshoptEncoder, MeshoptDecoder } = require('meshoptimizer');
  await MeshoptEncoder.ready; await MeshoptDecoder.ready;
  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS)
    .registerDependencies({ 'meshopt.encoder': MeshoptEncoder, 'meshopt.decoder': MeshoptDecoder });
  const doc = await io.readBinary(fs.readFileSync(IN));
  for (const e of doc.getRoot().listExtensionsUsed()) if (/meshopt/i.test(e.extensionName)) e.dispose();
  // drop required flag too
  const json = JSON.parse(JSON.stringify(doc.getRoot()));
  await io.writeBinary(doc).then(b => fs.writeFileSync(OUT, Buffer.from(b)));
  console.log('wrote', OUT);
})().catch(e => { console.error('FATAL', e.message); process.exit(1); });
