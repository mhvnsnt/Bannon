'use strict';
// dump_worst.cjs <glb> — print the 3 verts (pos + weights) of the worst spike triangle
const fs = require('fs');
const F = process.argv[2];
(async()=>{
  const { NodeIO } = require('@gltf-transform/core');
  const { ALL_EXTENSIONS } = require('@gltf-transform/extensions');
  const { MeshoptDecoder } = require('meshoptimizer');
  await MeshoptDecoder.ready;
  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.decoder':MeshoptDecoder});
  const doc = await io.readBinary(fs.readFileSync(F));
  const root = doc.getRoot();
  const prim = root.listMeshes()[0].listPrimitives()[0];
  const pos = prim.getAttribute('POSITION').getArray();
  const idx = prim.getIndices() ? prim.getIndices().getArray() : null;
  const ji = prim.getAttribute('JOINTS_0').getArray(), w = prim.getAttribute('WEIGHTS_0').getArray();
  const skin = root.listSkins()[0], joints = skin.listJoints();
  const ibm = skin.getInverseBindMatrices().getArray();
  const jn = i => joints[i].getName().split(':').pop();
  const M4=()=>[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];
  const mul=(a,b)=>{const o=new Array(16);for(let r=0;r<4;r++)for(let c=0;c<4;c++)o[r*4+c]=a[r*4]*b[c]+a[r*4+1]*b[4+c]+a[r*4+2]*b[8+c]+a[r*4+3]*b[12+c];return o;};
  const fT=(t,q,s)=>{const[x,y,z,w2]=q,x2=x+x,y2=y+y,z2=z+z,xx=x*x2,xy=x*y2,xz=x*z2,yy=y*y2,yz=y*z2,zz=z*z2,wx=w2*x2,wy=w2*y2,wz=w2*z2;
    return[(1-(yy+zz))*s[0],(xy+wz)*s[0],(xz-wy)*s[0],0,(xy-wz)*s[1],(1-(xx+zz))*s[1],(yz+wx)*s[1],0,(xz+wy)*s[2],(yz-wx)*s[2],(1-(xx+yy))*s[2],0,t[0],t[1],t[2],1];};
  const wm=new Map(), pw=(n,ac)=>{const m=mul(ac,fT(n.getTranslation(),n.getRotation(),n.getScale()));wm.set(n,m);n.listChildren().forEach(c=>pw(c,m));};
  root.listScenes()[0].listChildren().forEach(c=>pw(c,M4()));
  const POSE={Hips:[0,0,0],Spine:[0.1,0,0],LeftUpLeg:[0,0,0.5],RightUpLeg:[0,0,-0.5],LeftArm:[0,0,0.9],RightArm:[0,0,-0.9],LeftForeArm:[0,0,0.4],RightForeArm:[0,0,-0.4]};
  const qm=(a,b)=>[a[3]*b[0]+a[0]*b[3]+a[1]*b[2]-a[2]*b[1],a[3]*b[1]-a[0]*b[2]+a[1]*b[3]+a[2]*b[0],a[3]*b[2]+a[0]*b[1]-a[1]*b[0]+a[2]*b[3],a[3]*b[3]-a[0]*b[0]-a[1]*b[1]-a[2]*b[2]];
  const pm2=new Map(), pw2=(n,ac)=>{let T=n.getTranslation(),Q=n.getRotation(),S=n.getScale();const nm2=n.getName().split(':').pop();
    if(POSE[nm2]){const e=POSE[nm2],ax=[e[0]?1:0,e[1]?1:0,e[2]?1:0],an=Math.max(Math.abs(e[0]),Math.abs(e[1]),Math.abs(e[2])),h=an/2,s=Math.sin(h);
      Q=qm([ax[0]*s,ax[1]*s,ax[2]*s,Math.cos(h)],Q);}
    const m=mul(ac,fT(T,Q,S));pm2.set(n,m);n.listChildren().forEach(c=>pw2(c,m));};
  root.listScenes()[0].listChildren().forEach(c=>pw2(c,M4()));
  const jm=joints.map((nn,i)=>mul(pm2.get(nn),Array.from(ibm.slice(i*16,i*16+16))));
  const xf=(m,p)=>{const[x,y,z]=p,w2=m[3]*x+m[7]*y+m[11]*z+m[15];return[(m[0]*x+m[4]*y+m[8]*z+m[12])/w2,(m[1]*x+m[5]*y+m[9]*z+m[13])/w2,(m[2]*x+m[6]*y+m[10]*z+m[14])/w2];};
  const sp=(v)=>{const o=[0,0,0];for(let k=0;k<4;k++){const j=ji[v*4+k],wt=w[v*4+k];if(wt<=0||j>=jm.length)continue;
    const p=xf(jm[j],[pos[v*3],pos[v*3+1],pos[v*3+2]]);o[0]+=p[0]*wt;o[1]+=p[1]*wt;o[2]+=p[2]*wt;}return o;};
  const el=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);
  const tris=[]; if(idx) for(let t=0;t<idx.length;t+=3) tris.push([idx[t],idx[t+1],idx[t+2]]);
  else for(let v=0;v<pos.length/3;v+=3) tris.push([v,v+1,v+2]);
  let worst=0,wt=null;
  for(const[a,b,c]of tris){
    const rest=el([pos[a*3],pos[a*3+1],pos[a*3+2]],[pos[b*3],pos[b*3+1],pos[b*3+2]])+el([pos[b*3],pos[b*3+1],pos[b*3+2]],[pos[c*3],pos[c*3+1],pos[c*3+2]])+el([pos[c*3],pos[c*3+1],pos[c*3+2]],[pos[a*3],pos[a*3+1],pos[a*3+2]]);
    if(rest<1e-6) continue;
    const A=sp(a),B=sp(b),C=sp(c), pr=el(A,B)+el(B,C)+el(C,A), r=pr/rest;
    if(r>worst){worst=r;wt=[a,b,c];}
  }
  console.log('worst', worst.toFixed(1));
  for(const v of wt){const ws=[];for(let k=0;k<4;k++)if(w[v*4+k]>0)ws.push(jn(ji[v*4+k])+':'+w[v*4+k].toFixed(2));
    console.log(`v${v} (${pos[v*3].toFixed(3)},${pos[v*3+1].toFixed(3)},${pos[v*3+2].toFixed(3)}) ${ws.join(' ')}`);}
})();
