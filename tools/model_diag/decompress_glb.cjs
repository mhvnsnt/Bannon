#!/usr/bin/env node
/* decompress_glb.cjs — write a GLB that a hand-rolled reader can actually parse.
 *
 *   node tools/model_diag/decompress_glb.cjs <in.glb> <out.glb>
 *
 * EVERY model in assets/models uses EXT_meshopt_compression, and several tools in this repo
 * (transfer_weights.cjs above all) walk the GLB by hand rather than through gltf-transform. A
 * hand-rolled reader has no idea the buffer views are compressed, so it reads the compressed bytes
 * as raw floats. The two ways that shows up are both recorded in this project's notes:
 *   - it CRASHES: "RangeError: offset out of range ... Received 1581576" (accessor runs off the end)
 *   - or, worse, it SUCCEEDS on garbage: a source model measured 6.74e+38 tall and the tool
 *     cheerfully reported a completed weight transfer.
 * The second is why this exists as an explicit step instead of a try/catch somewhere.
 *
 * Disposing the extension makes gltf-transform fall back to plain buffer views on write. Geometry,
 * skins, inverse bind matrices, morph targets and textures are untouched — only the storage changes.
 */
const fs = require('fs');
const { NodeIO } = require('@gltf-transform/core');
const { ALL_EXTENSIONS, EXTMeshoptCompression } = require('@gltf-transform/extensions');
const { MeshoptDecoder, MeshoptEncoder } = require('meshoptimizer');

const [IN, OUT] = process.argv.slice(2);
if (!IN || !OUT){ console.error('usage: decompress_glb.cjs <in.glb> <out.glb>'); process.exit(2); }

(async () => {
  await MeshoptDecoder.ready; await MeshoptEncoder.ready;
  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS)
    .registerDependencies({ 'meshopt.decoder': MeshoptDecoder, 'meshopt.encoder': MeshoptEncoder });
  const doc = await io.read(IN);
  const before = doc.getRoot().listExtensionsUsed().map(e => e.extensionName);
  for (const ext of doc.getRoot().listExtensionsUsed())
    if (ext.extensionName === EXTMeshoptCompression.EXTENSION_NAME) ext.dispose();
  await io.write(OUT, doc);

  // RE-READ THE WRITTEN BYTES and confirm, rather than trusting the write. Same rule the asset
  // optimiser follows: a tool that reports success without reading back what it shipped is how a
  // broken file gets banked.
  const io2 = new NodeIO().registerExtensions(ALL_EXTENSIONS);
  const back = await io2.read(OUT);
  let verts = 0, joints = 0;
  for (const m of back.getRoot().listMeshes()) for (const p of m.listPrimitives()){
    const P = p.getAttribute('POSITION'); if (P) verts += P.getCount(); }
  for (const s of back.getRoot().listSkins()) joints = Math.max(joints, s.listJoints().length);
  console.log('  decompressed ' + IN + ' -> ' + OUT);
  console.log('    extensions ' + JSON.stringify(before) + ' -> ' +
              JSON.stringify(back.getRoot().listExtensionsUsed().map(e => e.extensionName)));
  console.log('    verts ' + verts + '  joints ' + joints + '  ' +
              (fs.statSync(OUT).size/1048576).toFixed(2) + ' MB');
})();
