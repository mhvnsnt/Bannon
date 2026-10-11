#!/usr/bin/env node
/**
 * BANNON pose-writer audit.
 *
 * This is a structural gate, not a substitute for a UE runtime build.
 * It searches Unreal C++ for whole-actor/whole-mesh transform writes that can
 * bypass the pose authority pipeline and reports them with file/line context.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..", "unreal", "Source");
const patterns = [
  /\bSetWorldLocation\s*\(/,
  /\bSetRelativeLocation\s*\(/,
  /\bSetActorLocation\s*\(/,
  /\bSetActorTransform\s*\(/
];

const allow = new Set([
  "BannonReferee.cpp"
]);

const findings = [];

function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const ent of fs.readdirSync(dir, {withFileTypes:true})) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p);
    else if (/\.cpp$/.test(ent.name)) scan(p);
  }
}

function scan(file) {
  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
  lines.forEach((line, i) => {
    if (line.includes("BannonProceduralSubmissions")) return;
    for (const re of patterns) {
      if (re.test(line) && !allow.has(path.basename(file))) {
        findings.push({file:path.relative(path.resolve(__dirname, ".."), file), line:i+1, text:line.trim()});
      }
    }
  });
}

walk(ROOT);

console.log("BANNON POSE-WRITER AUDIT");
console.log(`Whole-transform writer findings: ${findings.length}`);
for (const f of findings) console.log(`  ${f.file}:${f.line} — ${f.text}`);

if (findings.length) {
  console.error("POSE-WRITER AUDIT: REVIEW REQUIRED");
  process.exit(1);
}

console.log("POSE-WRITER AUDIT: PASS");
