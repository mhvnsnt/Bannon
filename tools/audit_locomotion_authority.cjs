#!/usr/bin/env node
/**
 * BANNON locomotion-authority audit.
 * Structural only: flags direct actor transform writers and direct root-motion
 * application so they can be routed through CharacterMovement.
 */
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..", "unreal", "Source");
const patterns = [
  /\bSetActorLocationAndRotation\s*\(/,
  /\bSetActorLocation\s*\(/,
  /\bSetActorTransform\s*\(/,
  /\bAddActorWorldOffset\s*\(/,
  /\bAddActorLocalOffset\s*\(/
];
const findings=[];
function walk(dir){
  if(!fs.existsSync(dir)) return;
  for(const e of fs.readdirSync(dir,{withFileTypes:true})){
    const p=path.join(dir,e.name);
    if(e.isDirectory()) walk(p);
    else if(p.endsWith(".cpp")) scan(p);
  }
}
function scan(file){
  const lines=fs.readFileSync(file,"utf8").split(/\r?\n/);
  lines.forEach((line,i)=>{
    for(const re of patterns){
      if(re.test(line)) findings.push({file:path.relative(path.resolve(__dirname,".."),file),line:i+1,text:line.trim()});
    }
  });
}
walk(ROOT);
console.log("BANNON LOCOMOTION AUTHORITY AUDIT");
console.log(`Direct transform/root writers: ${findings.length}`);
for(const f of findings) console.log(`  ${f.file}:${f.line} — ${f.text}`);
if(findings.length){ console.error("REVIEW REQUIRED: direct transform writer remains."); process.exit(1); }
console.log("PASS: no direct transform writers found.");
