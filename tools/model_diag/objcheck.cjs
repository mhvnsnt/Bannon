const { chromium } = require('/opt/node22/lib/node_modules/playwright/node_modules/playwright-core');
const { spawn } = require('child_process');
(async () => {
  const dir='/tmp/claude-0/-home-user-Bannon/4ac21f6b-97dc-53a8-9769-7e549fb88a44/scratchpad/pwtest';
  const srv = spawn('/opt/node22/bin/node', ['-e', `
    const http=require('http'),fs=require('fs'),p=require('path');const root='${dir}',md='/home/user/Bannon/assets/models';
    const T={'.html':'text/html','.js':'text/javascript','.glb':'model/gltf-binary'};
    http.createServer((req,res)=>{let f=decodeURIComponent(req.url.split('?')[0]);
      let fp=f.startsWith('/m/')?p.join(md,f.slice(3)):p.join(root,f==='/'?'/test.html':f);
      fs.readFile(fp,(e,d)=>{if(e){res.writeHead(404);res.end('nf');return;}res.writeHead(200,{'content-type':T[p.extname(fp)]||'application/octet-stream'});res.end(d);});}).listen(8079);
  `], { stdio:'ignore' });
  await new Promise(r=>setTimeout(r,700));
  const browser = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist','--no-sandbox'] });
  const page = await browser.newPage(); const perr=[]; page.on('pageerror',e=>perr.push(String(e)));
  await page.goto('http://localhost:8079/test.html', { waitUntil:'domcontentloaded' });
  await page.waitForTimeout(4200);
  await page.evaluate(()=>{ window.AUTO_CHAR_MODELS=false; window.MATCH_SETUP={p1Name:'BANNON',p2Name:'FINXSSE',p1Control:'YOU',p2Control:'CPU'}; startFight(); });
  await page.waitForTimeout(1200);
  // reference: procedural rig joint world positions (the thing that renders correctly)
  const ref = await page.evaluate(()=>{ const p=fighters[0]; const wj=n=>{ const v=p.worldJoint&&p.worldJoint(n); return v?[+v.x.toFixed(3),+v.y.toFixed(3),+v.z.toFixed(3)]:null; };
    return { haL:wj('haL'), haR:wj('haR'), ftL:wj('ftL'), ftR:wj('ftR'), chest:wj('chest'), head:wj('head'), dir:p.dir }; });
  // now bind the GLB and read its DRIVEN mapped-bone world positions in the same idle frame
  await page.evaluate(()=>{ loadFighterModel('p1','m/BANNON_rigged.glb','X'); });
  let ok=false; for(let i=0;i<25;i++){ await page.waitForTimeout(1000); if(await page.evaluate(()=>!!fighters[0].model)){ok=true;break;} }
  await page.waitForTimeout(1500);
  const got = await page.evaluate(()=>{ const p=fighters[0], c=p.model; if(!c) return {noModel:true};
    c.updateWorldMatrix(true,true);
    const B={}; c.traverse(o=>{ if(o.isBone){ const n=o.name.replace(/mixamorig[:_]?/i,''); B[n]=o; } });
    const wp=n=>{ const b=B[n]; if(!b) return null; const v=new THREE.Vector3(); b.getWorldPosition(v); return [+v.x.toFixed(3),+v.y.toFixed(3),+v.z.toFixed(3)]; };
    // mesh vertex Y range per skinned mesh to see if FEET geometry exists low
    let minVY=1e9,maxVY=-1e9, vTotal=0, lowVerts=0; const box=new THREE.Box3();
    c.traverse(o=>{ if(o.isMesh&&o.geometry){ o.updateWorldMatrix(true,false); const pos=o.geometry.attributes.position; if(!pos)return;
      const v=new THREE.Vector3(); for(let i=0;i<pos.count;i+=17){ v.fromBufferAttribute(pos,i).applyMatrix4(o.matrixWorld); minVY=Math.min(minVY,v.y);maxVY=Math.max(maxVY,v.y); vTotal++; if(v.y<0.25)lowVerts++; box.expandByPoint(v); } } });
    return { LeftHand:wp('LeftHand'), RightHand:wp('RightHand'), LeftFoot:wp('LeftFoot'), RightFoot:wp('RightFoot'), Head:wp('Head'),
      meshMinY:+minVY.toFixed(3), meshMaxY:+maxVY.toFixed(3), lowVertsPct:+(lowVerts/Math.max(1,vTotal)*100).toFixed(1) }; });
  console.log('PROCEDURAL RIG (reference, dir='+ref.dir+'):', JSON.stringify(ref));
  console.log('GLB DRIVEN BONES:', JSON.stringify(got));
  console.log('pageerrors:', perr.length, perr.slice(0,3));
  await browser.close(); srv.kill(); process.exit(0);
})().catch(e=>{console.error('CRASH',e);process.exit(1);});
