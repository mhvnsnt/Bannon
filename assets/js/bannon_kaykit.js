/* bannon_kaykit.js — KayKit crowd + arena props for BANNON (convergence imports #1, #2).
 * CC0 1.0 Universal — Kay Lousberg / kaykit.dev, vendored via AshLane.
 * Provenance: docs/SOURCE_REGISTRY.md rows 1-2. License copies in
 * assets/models/crowd/KAYKIT_LICENSE.txt and assets/models/arena_props/KAYKIT_LICENSE.txt.
 *
 * WHAT: 32 low-poly spectators (9 types, round-robin pool — the AshLane rigFor pattern)
 * replace the front rows of the instanced box crowd; 23 KayKit dungeon props dress the
 * black void around the arena. Crowd plays Idle, crossfades to Cheer on window.__crowdHype.
 *
 * API: window.BANNON_KAYKIT.slots (sync, safe to read before init)
 *      window.BANNON_KAYKIT.init(arenaGroup) — call once from buildArena()
 *      window.BANNON_KAYKIT.update(t, dt) — call every frame from updateArenaAnim()
 */
(function(){
'use strict';

var TYPES = ['Knight','Rogue','Rogue_Hooded','Barbarian','Mage',
             'Skeleton_Warrior','Skeleton_Rogue','Skeleton_Minion','Skeleton_Mage'];
var CROWD_BASE = 'assets/models/crowd/';
var PROPS_BASE = 'assets/models/arena_props/';
var N_CROWD = 32;

function rng32(seed){
  var s = seed >>> 0;
  return function(){
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

// 32 front-row slots: 14 across the near band front, 9+9 inner columns of the end bands.
// Mirrors buildArena's tier height: gy=-0.05+max(0,(|z|-5)*0.06). Faces ring center.
function computeSlots(){
  var R = rng32(20261005), slots = [], i, x, z;
  for (i=0;i<14;i++){
    x = -9.75 + i*1.5 + (R()-0.5)*0.4; z = -6.0 + (R()-0.5)*0.5;
    slots.push({x:x, z:z, gy:-0.05+Math.max(0,(Math.abs(z)-5)*0.06), type:TYPES[i%TYPES.length]});
  }
  for (i=0;i<9;i++){
    z = -5 + i*1.25 + (R()-0.5)*0.4;
    x = -6.9 + (R()-0.5)*0.4;
    slots.push({x:x, z:z, gy:-0.05+Math.max(0,(Math.abs(z)-5)*0.06), type:TYPES[(i+2)%TYPES.length]});
    x =  6.9 + (R()-0.5)*0.4;
    slots.push({x:x, z:z+0.3, gy:-0.05+Math.max(0,(Math.abs(z)-5)*0.06), type:TYPES[(i+5)%TYPES.length]});
  }
  // 14 + 18 = 32; trim/pad defensively
  while (slots.length > N_CROWD) slots.pop();
  return slots;
}

// r128 ships no SkeletonUtils: clone the rig and re-bind every SkinnedMesh to the
// CLONED bones (a bare .clone() shares the source skeleton -> all clones deform as one).
function cloneRigged(src){
  var dst = src.clone(true);
  var pairs = [];
  (function walk(s,d){
    pairs.push([s,d]);
    for (var i=0;i<s.children.length;i++) walk(s.children[i], d.children[i]);
  })(src, dst);
  var boneMap = {};
  for (var i=0;i<pairs.length;i++) if (pairs[i][0].isBone) boneMap[pairs[i][0].uuid] = pairs[i][1];
  dst.updateMatrixWorld(true);
  for (var j=0;j<pairs.length;j++){
    var s = pairs[j][0], d = pairs[j][1];
    if (s.isSkinnedMesh && s.skeleton){
      var bones = [];
      for (var k=0;k<s.skeleton.bones.length;k++){
        var b = boneMap[s.skeleton.bones[k].uuid];
        if (!b) return null; // hierarchy mismatch — caller skips this clone
        bones.push(b);
      }
      d.skeleton = new THREE.Skeleton(bones, s.skeleton.boneInverses);
      // bindMatrix / bindMatrixInverse were copied from source by .clone() — keep them.
    }
  }
  return dst;
}

var K = window.BANNON_KAYKIT = {
  slots: computeSlots(),
  ready: false,
  failed: false,
  members: [],
  _mixers: []
};

K.init = function(arenaGroup){
  if (!window.THREE || !THREE.GLTFLoader){ K.failed = true; return; }
  var loader = new THREE.GLTFLoader();
  var loaded = {}, need = TYPES.length, done = 0, bad = 0;

  TYPES.forEach(function(t){
    loader.load(CROWD_BASE + t + '.glb', function(gltf){
      loaded[t] = gltf; done++;
      if (done + bad === need) K._populate(arenaGroup, loaded);
    }, undefined, function(err){
      bad++;
      try{ console.warn('[kaykit] crowd GLB failed: ' + t, err); }catch(e){}
      if (done + bad === need) K._populate(arenaGroup, loaded);
    });
  });

  K._props(arenaGroup, loader);
};

K._populate = function(arenaGroup, loaded){
  var R = rng32(777);
  K.slots.forEach(function(slot, i){
    var gltf = loaded[slot.type];
    if (!gltf) return; // type failed to load — slot stays empty, logged above
    var group = cloneRigged(gltf.scene);
    if (!group) return;
    group.position.set(slot.x, slot.gy, slot.z);
    group.rotation.y = Math.atan2(-slot.x, -slot.z) + (R()-0.5)*0.3;
    var s = 1.12; group.scale.set(s,s,s); // KayKit ~1.5m -> ~1.68m presence
    arenaGroup.add(group);
    var mixer = new THREE.AnimationMixer(group);
    var idleClip = null, cheerClip = null;
    for (var c=0;c<gltf.animations.length;c++){
      var n = gltf.animations[c].name;
      if (n === 'Idle') idleClip = gltf.animations[c];
      else if (n === 'Cheer') cheerClip = gltf.animations[c];
    }
    var idle = idleClip ? mixer.clipAction(idleClip) : null;
    var cheer = cheerClip ? mixer.clipAction(cheerClip) : null;
    if (idle) idle.play();
    K.members.push({group:group, mixer:mixer, idle:idle, cheer:cheer,
                    cheering:false, cheerAt:0.22 + R()*0.25, ph:R()*6.28});
    K._mixers.push(mixer);
  });
  K.ready = true;
  try{ console.log('[kaykit] crowd ready: ' + K.members.length + '/' + K.slots.length + ' members'); }catch(e){}
};

K.update = function(t, dt){
  if (!K.ready) return;
  var hype = 0;
  try{ hype = window.__crowdHype || 0; }catch(e){}
  for (var i=0;i<K.members.length;i++){
    var m = K.members[i];
    var want = hype > m.cheerAt;
    if (want && !m.cheering && m.cheer){
      m.cheering = true;
      if (m.idle) m.idle.fadeOut(0.35);
      m.cheer.reset().fadeIn(0.35).play();
    } else if (!want && m.cheering && m.idle){
      m.cheering = false;
      if (m.cheer) m.cheer.fadeOut(0.35);
      m.idle.reset().fadeIn(0.35).play();
    }
    // idle sway when neither clip is driving (mixerless safety)
    if (!m.idle && !m.cheer) m.group.position.y += Math.sin(t*1.4 + m.ph)*0.0006;
    m.mixer.update(Math.min(dt, 0.05));
  }
};

// --- arena props: dress the black void. Wall unit = 4 wide x 4 tall. ---
K._props = function(arenaGroup, loader){
  var root = new THREE.Group();
  arenaGroup.add(root);
  var cache = {};
  function put(name, x, y, z, ry){
    var src = cache[name];
    if (!src) return;
    var m = src.clone(true);
    m.position.set(x, y, z);
    m.rotation.y = ry || 0;
    root.add(m);
  }
  var files = ['wall','wall_arched','wall_corner','wall_gated','pillar','column',
               'torch','torch_mounted','banner_red','banner_patternA_red',
               'stairs','stairs_wood','floor_tile_large','barrel_large','barrel_small',
               'barrel_small_stack','box_large','box_small','barrier','table_small',
               'table_medium','stool'];
  var pending = files.length;
  files.forEach(function(name){
    loader.load(PROPS_BASE + name + '.gltf.glb', function(gltf){
      cache[name] = gltf.scene;
      if (--pending === 0) layout();
    }, undefined, function(){
      if (--pending === 0) layout();
      try{ console.warn('[kaykit] prop failed: ' + name); }catch(e){}
    });
  });

  function wallRun(x0, z0, x1, z1){
    // straight run of 4-wide walls from (x0,z0) to (x1,z1)
    var dx = x1-x0, dz = z1-z0, len = Math.sqrt(dx*dx+dz*dz);
    var n = Math.max(1, Math.round(len/4));
    for (var i=0;i<n;i++){
      var f = (i+0.5)/n;
      put('wall', x0+dx*f, 0, z0+dz*f, Math.atan2(dx, dz) + Math.PI/2);
    }
  }

  function layout(){
    // back wall (behind the far crowd) + arched centerpiece
    wallRun(-14, -19, 14, -19);
    put('wall_arched', 0, 0, -19, 0);
    // side walls
    wallRun(-15, -19, -15, 7);
    wallRun( 15, -19,  15, 7);
    // corners
    put('wall_corner', -15, 0, -19, 0);
    put('wall_corner',  15, 0, -19, Math.PI/2);
    // entrance gate flanking the ramp (+z), pillars + torches
    put('wall_gated', -3.2, 0, 9.5, 0);
    put('wall_gated',  3.2, 0, 9.5, 0);
    put('pillar', -5.2, 0, 9.5, 0);
    put('pillar',  5.2, 0, 9.5, 0);
    put('pillar', -15, 0, 7, 0);
    put('pillar',  15, 0, 7, 0);
    // mounted torches along the back wall
    [-10.5, -3.5, 3.5, 10.5].forEach(function(x){ put('torch_mounted', x, 2.4, -18.4, 0); });
    // standing torches flanking the entrance
    put('torch', -4.2, 0, 10.5, 0);
    put('torch',  4.2, 0, 10.5, 0);
    // banners on the side walls, facing the ring
    put('banner_red', -14.4, 2.2, -6, Math.PI/2);
    put('banner_red',  14.4, 2.2, -6, -Math.PI/2);
    put('banner_patternA_red', -14.4, 2.2, 0, Math.PI/2);
    put('banner_patternA_red',  14.4, 2.2, 0, -Math.PI/2);
    // entrance floor + staging dressing
    put('floor_tile_large', 0, 0.02, 11, 0);
    put('stairs', -6.5, 0, 10.5, 0.3);
    put('barrel_large', 7.5, 0, 11.5, 0);
    put('barrel_small', 8.4, 0, 10.8, 0);
    put('box_large', -7.8, 0, 11.2, 0.4);
    put('table_small', 6.8, 0, 13.2, -0.3);
    put('stool', -6.2, 0, 12.8, 0);
    put('barrier', 0, 0, 14.5, 0);
    try{ console.log('[kaykit] props placed'); }catch(e){}
  }
};

})();
