// AUTOMATIC skinning-quality gate. For each GLB: load it, pose the arms/spine/leg into a canonical
// ACTION pose, and measure how far each skinned vertex flies from the RIGID motion of its dominant
// bone. Good weights => vertices ride their bone (low residual). Bad weights (skin.cjs) => vertices
// smear across the body (high residual). Uses the model's OWN bind geometry as ground truth — no
// eyeballing. PASS/FAIL per model. Batchable.
const { chromium } = require('/opt/node22/lib/node_modules/playwright/node_modules/playwright-core');
const { spawn } = require('child_process');
(async () => {
  const dir=__dirname;
  const srv = spawn('/opt/node22/bin/node', ['-e', `
    const http=require('http'),fs=require('fs'),p=require('path');const root='${dir}',md='/home/user/Bannon/assets/models';
    const T={'.html':'text/html','.js':'text/javascript','.glb':'model/gltf-binary'};
    http.createServer((req,res)=>{let f=decodeURIComponent(req.url.split('?')[0]);
      let fp=f.startsWith('/m/')?p.join(md,f.slice(3)):p.join(root,f==='/'?'/test.html':f);
      fs.readFile(fp,(e,d)=>{if(e){res.writeHead(404);res.end('nf');return;}res.writeHead(200,{'content-type':T[p.extname(fp)]||'application/octet-stream'});res.end(d);});}).listen(8084);
  `], { stdio:'ignore' });
  await new Promise(r=>setTimeout(r,700));
  const browser = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args:['--use-gl=swiftshader','--no-sandbox'] });
  const page = await browser.newPage(); const perr=[]; page.on('pageerror',e=>perr.push(String(e)));
  await page.goto('http://localhost:8084/test.html', { waitUntil:'domcontentloaded' });
  await page.waitForTimeout(3500);
  const models = process.argv.slice(2);
  for(const mf of models){
    const r = await page.evaluate(async (u)=>{
      function load(url){ return new Promise((res,rej)=>{ new THREE.GLTFLoader().load(url, g=>res(g), undefined, e=>rej(e)); }); }
      let g; try{ g = await load('m/'+u); }catch(e){ return {err:String(e)}; }
      let sk=null; g.scene.traverse(o=>{ if(o.isSkinnedMesh && !sk) sk=o; });
      if(!sk) return {noSkin:true};
      g.scene.updateMatrixWorld(true);
      const geo=sk.geometry, pos=geo.attributes.position, skIdx=geo.attributes.skinIndex, skW=geo.attributes.skinWeight; const comp=(a,i,w)=>w===0?a.getX(i):w===1?a.getY(i):w===2?a.getZ(i):a.getW(i);
      const skel=sk.skeleton; const bones=skel.bones;
      // bbox height for normalization
      const bb=new THREE.Box3().setFromObject(sk); const H=Math.max(0.5,(bb.max.y-bb.min.y));
      // capture bind (rest) bone world matrices
      g.scene.updateMatrixWorld(true); skel.update();
      const bindBoneMat=bones.map(b=>b.matrixWorld.clone());
      // dominant bone per vertex + rigid bind position of that vertex under its dominant bone
      const N=pos.count; const step=Math.max(1,Math.floor(N/4000)); // sample ~4000 verts
      const vtmp=new THREE.Vector3(), sPos=new THREE.Vector3();
      // helper: full linear-blend skin of a vertex at current skeleton state
      const boneMat=new THREE.Matrix4(), skinned=new THREE.Vector3(), acc=new THREE.Vector3(), temp=new THREE.Vector3();
      const bindMatrixInv = sk.bindMatrixInverse, bindMatrix=sk.bindMatrix;
      function skinVertex(i, boneMatrices){
        skinned.set(0,0,0);
        vtmp.fromBufferAttribute(pos,i).applyMatrix4(bindMatrix);
        for(let w=0;w<4;w++){ const bi=comp(skIdx,i,w), wt=comp(skW,i,w); if(wt===0) continue;
          temp.copy(vtmp).applyMatrix4(boneMatrices[bi]).multiplyScalar(wt); skinned.add(temp); }
        skinned.applyMatrix4(bindMatrixInv);
        return skinned.clone();
      }
      // bind bone offset matrices (boneMatrices used by skinning = boneWorld * boneInverse)
      function offsetMats(){ const om=[]; for(let k=0;k<bones.length;k++){ const m=new THREE.Matrix4().multiplyMatrices(bones[k].matrixWorld, skel.boneInverses[k]); om.push(m);} return om; }
      const bindOff=offsetMats();
      // record dominant bone + bind skinned pos
      const dom=new Int32Array(N), bindP=[];
      for(let i=0;i<N;i+=step){ let bw=-1,bb2=0; for(let w=0;w<4;w++){ const wt=comp(skW,i,w); if(wt>bw){bw=wt;bb2=comp(skIdx,i,w);} } dom[i]=bb2; bindP[i]=skinVertex(i,bindOff); }
      // find key bones by name
      const byName={}; bones.forEach(b=>{ byName[b.name.replace(/mixamorig[:_]?/i,'').toLowerCase()]=b; });
      function pick(subs){ for(const s of subs){ for(const k in byName){ if(k.indexOf(s)>=0) return byName[k]; } } return null; }
      const lArm=pick(['leftarm','left_arm']), rArm=pick(['rightarm','right_arm']), spine=pick(['spine1','spine']), lLeg=pick(['leftupleg','left_up','leftthigh']);
      // ACTION pose: swing arms forward, hinge spine, raise one knee
      if(lArm) lArm.rotation.z += 1.4; if(rArm) rArm.rotation.z -= 1.4;
      if(spine) spine.rotation.x += 0.5; if(lLeg) lLeg.rotation.x -= 0.8;
      const _hand=pick(['lefthand','left_hand'])||lArm; const _hbind=new THREE.Vector3(); if(_hand){_hand.getWorldPosition(_hbind);}
      g.scene.updateMatrixWorld(true); skel.update();
      const _hpose=new THREE.Vector3(); if(_hand){_hand.getWorldPosition(_hpose);}
      const handMoved=+_hbind.distanceTo(_hpose).toFixed(3);
      const poseOff=offsetMats();
      // residual: |LBS posed vertex - rigid(domBone) applied to bind skinned pos|
      let resid=[], maxR=0;
      for(let i=0;i<N;i+=step){ const lbs=skinVertex(i,poseOff);
        // rigid motion of dominant bone from bind->pose:  M = poseOff[dom] * bindOff[dom]^-1 ; apply to bindP
        const rigid=new THREE.Matrix4().multiplyMatrices(poseOff[dom[i]], new THREE.Matrix4().copy(bindOff[dom[i]]).invert());
        const rp=bindP[i].clone().applyMatrix4(rigid);
        const d=lbs.distanceTo(rp)/H; resid.push(d); if(d>maxR)maxR=d;
      }
      resid.sort((a,b)=>a-b); const p=(q)=>resid[Math.min(resid.length-1,Math.floor(resid.length*q))];
      const bb3=new THREE.Box3().setFromObject(sk); const posedH=bb3.max.y-bb3.min.y, posedW=bb3.max.x-bb3.min.x, posedD=bb3.max.z-bb3.min.z;
      return { joints:bones.length, verts:N, p50:+p(0.5).toFixed(4), p95:+p(0.95).toFixed(4), max:+maxR.toFixed(4),
               bboxRatioWH:+(posedW/Math.max(0.01,posedH)).toFixed(2), keyBones:{lArm:!!lArm,rArm:!!rArm,spine:!!spine,lLeg:!!lLeg}, handMoved };
    }, mf);
    const verdict = r.p95!=null ? (r.p95<0.06 ? 'PASS' : (r.p95<0.12?'WEAK':'FAIL')) : 'ERR';
    console.log(verdict.padEnd(5), mf.padEnd(30), JSON.stringify(r));
  }
  console.log('pageerrors', perr.length, perr.slice(0,2).join('|'));
  await browser.close(); srv.kill(); process.exit(0);
})().catch(e=>{console.error('CRASH',e);process.exit(1);});
