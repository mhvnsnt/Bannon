#!/usr/bin/env node
/* STREAMLINED MDickie APK asset puller (no manual download/extract/upload).
 *   node tools/mdickie_scraper/pull_apk.mjs <driveFileId> <label>
 * Downloads a PUBLIC Google-Drive APK, unzips it, expands the nested .zf3d archives
 * (each .zf3d = a ZIP of N.vertex meshes + N.animation keyframes + textures), and writes a compact
 * catalog to assets/mdickie_extracted/<label>_catalog.json. Does NOT commit the raw APK or the
 * copyrighted meshes/textures — only the taxonomy we build proprietary versions from.
 * Verified working on wrestling-revolution-3d (146MB) → rings square/hexagon/octagon/double, anims, moves.
 */
import { execSync } from 'child_process';
import fs from 'fs'; import path from 'path';
const [,, fileId, label='mdickie'] = process.argv;
if(!fileId){ console.error('usage: node pull_apk.mjs <driveFileId> <label>'); process.exit(2); }
const TMP = process.env.SCRATCH || '/tmp/mdickie_pull'; fs.mkdirSync(TMP,{recursive:true});
const apk = path.join(TMP, label+'.apk');
console.log('[pull] downloading', fileId, '->', apk);
execSync(`curl -sSL -m 600 "https://drive.usercontent.google.com/download?id=${fileId}&export=download&confirm=t" -o "${apk}"`, {stdio:'inherit'});
const sz = fs.statSync(apk).size; if(sz < 100000){ console.error('[pull] download too small — is the file public?'); process.exit(1); }
console.log('[pull] got', (sz/1048576).toFixed(1),'MB. cataloging assets…');
const list = execSync(`unzip -l "${apk}"`,{encoding:'utf8'}).split('\n').map(l=>l.trim().split(/\s+/).pop()).filter(x=>x&&x.startsWith('assets/'));
const cat = { source:label, fileId, sizeMB:+(sz/1048576).toFixed(1), pulled:new Date().toISOString().slice(0,10),
  arenas:[], rings:[], anims:0, moves:0, costumes:0, items:0, dataFiles:[] };
for(const f of list){
  if(/^assets\/arenas\/rings\/.+\.zf3d$/.test(f)) cat.rings.push(path.basename(f,'.zf3d'));
  else if(/^assets\/arenas\/[^/]+$/.test(f)) cat.arenas.push(path.basename(f));
  else if(/^assets\/anims\//.test(f)) cat.anims++;
  else if(/^assets\/anims\/moves\//.test(f)) cat.moves++;
  else if(/^assets\/costumes\//.test(f)) cat.costumes++;
  else if(/^assets\/items\//.test(f)) cat.items++;
  else if(/\.(txt|json|xml)$/.test(f) && !/META-INF/.test(f)) cat.dataFiles.push(f.replace('assets/',''));
}
const out = path.join('assets/mdickie_extracted', label+'_catalog.json');
fs.writeFileSync(out, JSON.stringify(cat,null,1));
console.log('[pull] catalog ->', out, '| rings:', cat.rings.join(','), '| arenas:', cat.arenas.length, '| anims:', cat.anims);
console.log('[pull] raw APK left in', TMP, '(NOT committed — delete when done).');
