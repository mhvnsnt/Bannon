#!/usr/bin/env node
// BANNON Drive watcher — the owner drops models/animations into the public Drive folder; this pulls
// anything new into the repo automatically. Run manually or via the drive-sync GitHub Action (cron).
//   node tools/drive_sync/sync.mjs [--dry]
// GLBs land in assets/models/incoming/ (then get identified/split/banked), FBX in assets/mocap/drive/,
// zips in imports/incoming/. A manifest (tools/drive_sync/manifest.json) remembers what's synced.
// Truncated Drive uploads (file smaller than its GLB header claims) are SKIPPED with a warning so a
// broken upload never lands in the repo.
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const FOLDER = process.env.BANNON_DRIVE_FOLDER || '19k_jmuiUYsAubZyx_bUL0m8svyYmevM5';
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const MANIFEST = path.join(ROOT, 'tools/drive_sync/manifest.json');
const DRY = process.argv.includes('--dry');

const DEST = (name) => {
  const n = name.toLowerCase();
  if (n.endsWith('.fbx')) return path.join(ROOT, 'assets/mocap/drive', name);
  if (n.endsWith('.zip')) return path.join(ROOT, 'imports/incoming', name);
  return path.join(ROOT, 'assets/models/incoming', name);
};

function fetchText(url) {
  return execSync(`curl -sS -L "${url}"`, { maxBuffer: 64 * 1024 * 1024 }).toString('utf8');
}

function listFolder() {
  const html = fetchText(`https://drive.google.com/drive/folders/${FOLDER}`);
  const out = {};
  let m;
  // Drive's grid DOM (2026 format): each file row carries data-id="<fileId>[-0-N]" and the name lives
  // in aria-label="<name.ext> <TYPE> …". Pair each aria-label filename with the nearest preceding
  // 33-char base file id. Robust to lazy-load ordering; dedupe by the base id.
  const ids = []; const idRe = /data-id="([-\w]{28,44}?)(?:-\d+-\d+)?"/g;
  while ((m = idRe.exec(html))) ids.push({ id: m[1], idx: m.index });
  const nmRe = /aria-label="((?:[^"\\]|\\.){3,120}?\.(?:glb|gltf|fbx|zip|blend))(?=[ "])/gi;
  const seen = new Set();
  while ((m = nmRe.exec(html))) {
    const name = m[1].replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"');
    let best = null; for (const p of ids) { if (p.idx < m.index) best = p; else break; }
    if (best && !seen.has(best.id) && !out[name]) { out[name] = best.id; seen.add(best.id); }
  }
  // legacy JS-island fallback (older Drive HTML)
  if (Object.keys(out).length === 0) {
    const re = /\["([-\w]{25,44})",\["[-\w]{25,44}"\],"((?:[^"\\]|\\.){3,90}?\.(?:glb|gltf|fbx|zip|blend))"/gi;
    while ((m = re.exec(html))) { const name = JSON.parse('"' + m[2] + '"'); if (!out[name]) out[name] = m[1]; }
  }
  return out;
}

function glbHeaderOk(file) {
  try {
    const fd = fs.openSync(file, 'r'); const b = Buffer.alloc(12); fs.readSync(fd, b, 0, 12, 0); fs.closeSync(fd);
    if (b.readUInt32LE(0) !== 0x46546C67) return false;
    return b.readUInt32LE(8) === fs.statSync(file).size;
  } catch (e) { return false; }
}

function main() {
  const manifest = fs.existsSync(MANIFEST) ? JSON.parse(fs.readFileSync(MANIFEST, 'utf8')) : {};
  const files = listFolder();
  const names = Object.keys(files);
  console.log(`[drive-sync] folder lists ${names.length} files; manifest has ${Object.keys(manifest).length}`);
  let synced = 0, skipped = 0, failed = 0;
  for (const name of names) {
    const id = files[name];
    if (manifest[name] && manifest[name].id === id && manifest[name].ok) continue;  // already synced this exact upload
    const dest = DEST(name);
    if (DRY) { console.log(`[dry] would fetch: ${name} (${id})`); continue; }
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    try {
      execSync(`curl -sS -L -o "${dest}" "https://drive.usercontent.google.com/download?id=${id}&export=download&confirm=t"`, { timeout: 300000 });
      const sz = fs.statSync(dest).size;
      const isGlb = /\.glb$/i.test(name);
      if (sz < 2048 || (isGlb && !glbHeaderOk(dest))) {
        console.warn(`[drive-sync] SKIP ${name} — truncated/incomplete upload on Drive (${sz} bytes${isGlb ? ', GLB header mismatch' : ''}). Re-upload it.`);
        fs.unlinkSync(dest);
        manifest[name] = { id, ok: false, reason: 'truncated', at: new Date().toISOString() };
        skipped++;
      } else {
        console.log(`[drive-sync] synced ${name} -> ${path.relative(ROOT, dest)} (${sz} bytes)`);
        manifest[name] = { id, ok: true, size: sz, at: new Date().toISOString() };
        synced++;
      }
    } catch (e) {
      console.error(`[drive-sync] FAILED ${name}: ${e.message.split('\n')[0]}`); failed++;
    }
  }
  if (!DRY) fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 1));
  console.log(`[drive-sync] done: ${synced} new, ${skipped} skipped (broken upload), ${failed} failed`);
}
main();
