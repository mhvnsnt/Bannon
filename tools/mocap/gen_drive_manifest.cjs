#!/usr/bin/env node
/* gen_drive_manifest.cjs — list every banked wrestling-move mocap FBX in assets/mocap/drive/ into
 * assets/mocap/drive_manifest.json. BANNON_LOAD_FBX_LIBRARY reads this so ALL move clips auto-load
 * offline (APK / GitHub Pages) with no daemon. Run after adding/removing drive mocap files. */
const fs = require('fs'), path = require('path');
const dir = path.join(__dirname, '..', '..', 'assets', 'mocap', 'drive');
const files = fs.readdirSync(dir).filter(f => /\.fbx$/i.test(f)).sort();
const out = {
  _note: 'Complete list of banked wrestling-move mocap FBX in assets/mocap/drive/. Consumed by ' +
    'BANNON_LOAD_FBX_LIBRARY so ALL move clips auto-load offline (APK/Pages) without a daemon. ' +
    'Regenerate: node tools/mocap/gen_drive_manifest.cjs',
  count: files.length, files,
};
fs.writeFileSync(path.join(dir, '..', 'drive_manifest.json'), JSON.stringify(out, null, 0));
console.log('wrote drive_manifest.json:', files.length, 'files');
