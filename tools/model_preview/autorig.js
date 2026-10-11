/* BANNON canonical auto-rig — engine-agnostic (browser global `AutoRig`).
 * Turns ANY loaded model root into a driven humanoid:
 *   A. skinned    — model already has Bones -> used as-is (Mixamo/FBX/authored GLB).
 *   B. named-parts — mesh nodes named pelvis/chest/head/shL/… -> synthetic REST skeleton,
 *                    each part attached to its LIKE-NAMED joint (the Tripo "rigready" case).
 *   C. chunks      — several unnamed meshes -> nearest-centroid attach (Goro case).
 *   D. single-mesh — one mesh, no skeleton -> can't per-joint rig; flagged needsSplit.
 * Plus orientation-normalize (face +X = engine forward) and recenter (X/Z centered, feet at y=0).
 * Mirrors the engine's _bindFighterGltf so the tool and the game agree. */
(function (glob) {
  var REST = {
    pelvis:[0,0.90,0], chest:[0,1.30,0], head:[0,1.67,0],
    shL:[0.04,1.36,0.22], shR:[0.04,1.36,-0.22],
    elL:[0.14,1.024,0.232], elR:[0.14,0.968,-0.232],
    haL:[0.308,0.688,0.148], haR:[0.308,0.688,-0.148],
    hipL:[0,0.885,0.175], hipR:[0,0.885,-0.175],
    knL:[0.04,0.46,0.16], knR:[0.04,0.46,-0.16],
    ftL:[0.06,0.05,0.17], ftR:[0.06,0.05,-0.17]
  };
  var JKEYS = Object.keys(REST);
  var LINKS = [['pelvis',null],['chest','pelvis'],['head','chest'],['shL','chest'],['elL','shL'],
    ['haL','elL'],['shR','chest'],['elR','shR'],['haR','elR'],['hipL','pelvis'],['knL','hipL'],
    ['ftL','knL'],['hipR','pelvis'],['knR','hipR'],['ftR','knR']];
  var SEGS = [['pelvis','chest'],['chest','head'],['shL','elL'],['elL','haL'],['shR','elR'],
    ['elR','haR'],['hipL','knL'],['knL','ftL'],['hipR','knR'],['knR','ftR']];

  function worldBox(THREE, obj){
    obj.updateMatrixWorld(true);
    var box = new THREE.Box3(), tmp = new THREE.Box3(), any=false;
    obj.traverse(function(o){ if(o.isMesh && o.geometry){ if(!o.geometry.boundingBox)o.geometry.computeBoundingBox(); if(o.geometry.boundingBox){ tmp.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld); box.union(tmp); any=true; } } });
    return any?box:null;
  }

  // Normalize facing: figure the model's forward from shoulder Z-sign + hip span, rotate so it
  // faces +X (engine forward). Recenter X/Z, drop feet to y=0. Returns the wrapper Group.
  function normalize(THREE, obj){
    var box = worldBox(THREE, obj); if(!box) return obj;
    var ctr = box.getCenter(new THREE.Vector3());
    var g = new THREE.Group(); g.add(obj);
    // recenter X/Z, floor Y
    obj.position.x -= ctr.x; obj.position.z -= ctr.z; obj.position.y -= box.min.y;
    g.updateMatrixWorld(true);
    return g;
  }

  function collectMeshes(obj){ var a=[]; obj.traverse(function(o){ if(o.isMesh)a.push(o); }); return a; }
  function collectBones(obj){ var a=[]; obj.traverse(function(o){ if(o.isBone)a.push(o); }); return a; }

  function nameMap(obj){
    var by = {}, n = 0;
    obj.traverse(function(o){
      if(!o.isMesh || !o.name) return;
      var nm = o.name, tail = nm.replace(/^.*[_.:]/,'');
      for(var i=0;i<JKEYS.length;i++){ var k=JKEYS[i];
        if(by[k]) continue;
        if(nm===k || nm.toLowerCase()===k.toLowerCase() || tail===k || tail.toLowerCase()===k.toLowerCase()){ by[k]=o; n++; break; }
      }
    });
    return { by: by, n: n };
  }

  function buildSkeleton(THREE, obj, box){
    var H = (box.max.y-box.min.y)>1e-4 ? (box.max.y-box.min.y) : 1.6;
    var cx=(box.min.x+box.max.x)/2, cz=(box.min.z+box.max.z)/2, by=box.min.y, scl=H/1.60;
    var Pw={}; for(var j in REST){ var r=REST[j]; Pw[j]=new THREE.Vector3(cx+r[0]*scl, by+(r[1]-0.06)*scl, cz+r[2]*scl); }
    var BN={};
    LINKS.forEach(function(L){ var b=new THREE.Bone(); b.name='rig_'+L[0]; b.userData.boneKey='rig_'+L[0]; BN[L[0]]=b; });
    LINKS.forEach(function(L){ var b=BN[L[0]], pw=Pw[L[0]]; if(L[1]){ var ppw=Pw[L[1]]; b.position.set(pw.x-ppw.x,pw.y-ppw.y,pw.z-ppw.z); BN[L[1]].add(b);} else { b.position.copy(pw); obj.add(b);} });
    return BN;
  }

  // Main entry. Returns {root, mode, mapped, diag}
  function rig(THREE, root, opts){
    opts = opts || {};
    var diag = {};
    var bones = collectBones(root);
    var meshes = collectMeshes(root);
    diag.meshCount = meshes.length; diag.boneCount = bones.length;

    // A. already skinned
    if(bones.length > 0){
      diag.mode='skinned';
      var wrapped = opts.normalize!==false ? normalize(THREE, root) : root;
      return { root: wrapped, mode:'skinned', mapped:[], diag:diag };
    }

    var nm = nameMap(root); diag.namedParts = nm.n; diag.partKeys = Object.keys(nm.by);
    var mapped = [];

    // D. single un-named mesh -> static
    if(meshes.length <= 1 && nm.n < 6){
      diag.mode='single-static'; diag.needsSplit = true;
      var w1 = opts.normalize!==false ? normalize(THREE, root) : root;
      return { root:w1, mode:'single-static', mapped:[], diag:diag };
    }

    // B/C need the synthetic skeleton
    var box = worldBox(THREE, root); if(!box) box = new THREE.Box3(new THREE.Vector3(-0.3,0,-0.3), new THREE.Vector3(0.3,1.8,0.3));
    var BN = buildSkeleton(THREE, root, box);
    SEGS.forEach(function(s){ if(BN[s[0]]) mapped.push({ bone:BN[s[0]], fromJ:s[0], toJ:s[1] }); });
    root.updateMatrixWorld(true);
    var bw={}, tv=new THREE.Vector3(); for(var bj in BN){ BN[bj].getWorldPosition(tv); bw[bj]=tv.clone(); }

    meshes.forEach(function(mesh){
      // name-match first (Tripo), else nearest centroid (Goro)
      var named=null; for(var k in nm.by){ if(nm.by[k]===mesh){ named=BN[k]; break; } }
      if(named){ named.attach(mesh); return; }
      if(!mesh.geometry.boundingBox)mesh.geometry.computeBoundingBox();
      var c=mesh.geometry.boundingBox.getCenter(new THREE.Vector3()); mesh.localToWorld(c);
      var best=null, bd=Infinity; for(var k2 in bw){ var d=c.distanceToSquared(bw[k2]); if(d<bd){ bd=d; best=BN[k2]; } }
      if(best)best.attach(mesh);
    });

    diag.mode = nm.n>=6 ? 'named-parts' : 'chunks';
    diag.drivenSegments = mapped.length;
    var w2 = opts.normalize!==false ? normalize(THREE, root) : root;
    return { root:w2, mode:diag.mode, mapped:mapped, diag:diag };
  }

  // Pose test: rotate every mapped bone, measure how many meshes moved (statue detector).
  function poseTest(THREE, res){
    var before={}; res.root.updateMatrixWorld(true);
    res.root.traverse(function(o){ if(o.isMesh){ o.updateWorldMatrix(true,false); before[o.uuid]=o.getWorldPosition(new THREE.Vector3()).clone(); } });
    res.mapped.forEach(function(mp){ mp.bone.rotateZ(0.5); });
    res.root.updateMatrixWorld(true);
    var moved=0, maxd=0;
    res.root.traverse(function(o){ if(o.isMesh && before[o.uuid]){ var d=o.getWorldPosition(new THREE.Vector3()).distanceTo(before[o.uuid]); if(d>0.01)moved++; if(d>maxd)maxd=d; } });
    res.mapped.forEach(function(mp){ mp.bone.rotateZ(-0.5); });
    res.root.updateMatrixWorld(true);
    return { meshesMoved:moved, maxDisp:+maxd.toFixed(3) };
  }

  glob.AutoRig = { rig: rig, poseTest: poseTest, REST: REST, JKEYS: JKEYS };
})(typeof window!=='undefined'?window:this);
