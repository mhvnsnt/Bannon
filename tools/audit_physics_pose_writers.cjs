#!/usr/bin/env node
const fs=require("fs"),path=require("path");
const ROOT=path.resolve(__dirname,"..","unreal","Source");
const patterns=[
 /\bSetSimulatePhysics\s*\(/,
 /\bSetAllBodiesBelowSimulatePhysics\s*\(/,
 /\bSetAllBodiesBelowPhysicsBlendWeight\s*\(/,
 /\bAddImpulseToAllBodiesBelow\s*\(/,
 /\bAddImpulse\s*\(/,
 /\bSetLinearVelocity\s*\(/,
 /\bSetAngularVelocity\s*\(/
];
const hits=[];
function walk(d){if(!fs.existsSync(d))return;for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);if(e.isDirectory())walk(p);else if(p.endsWith(".cpp"))scan(p)}}
function scan(f){fs.readFileSync(f,"utf8").split(/\r?\n/).forEach((l,i)=>{for(const re of patterns)if(re.test(l))hits.push({f:path.relative(path.resolve(__dirname,".."),f),line:i+1,text:l.trim()})})}
walk(ROOT);
console.log("BANNON PHYSICAL POSE WRITER INVENTORY");
console.log(`Physical writer calls: ${hits.length}`);
for(const h of hits)console.log(`  ${h.f}:${h.line} — ${h.text}`);
console.log("This is an INVENTORY, not an automatic failure: physical animation/ragdoll is allowed only in an explicit physical-response state.");
