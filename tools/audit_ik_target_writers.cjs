#!/usr/bin/env node
const fs=require("fs"),path=require("path");
const ROOT=path.resolve(__dirname,"..","unreal","Source");
const forbidden=[
  /\bSetBoneTransformByName\s*\(/,
  /\bSetBoneRotationByName\s*\(/,
  /\bSetBoneLocationByName\s*\(/,
  /\bSetComponentTransform\s*\(/,
  /\bSetWorldTransform\s*\(/
];
const hits=[];
function walk(d){if(!fs.existsSync(d))return;for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);if(e.isDirectory())walk(p);else if(p.endsWith(".cpp"))scan(p)}}
function scan(f){fs.readFileSync(f,"utf8").split(/\r?\n/).forEach((l,i)=>{for(const re of forbidden)if(re.test(l))hits.push({f:path.relative(path.resolve(__dirname,".."),f),line:i+1,text:l.trim()})})}
walk(ROOT);
console.log("BANNON IK TARGET WRITER AUDIT");
console.log("Direct skeletal/component transform calls:",hits.length);
for(const h of hits)console.log(`  ${h.f}:${h.line} — ${h.text}`);
if(hits.length){console.error("REVIEW REQUIRED");process.exit(1)}
console.log("PASS: no forbidden direct IK transform writers found.");
