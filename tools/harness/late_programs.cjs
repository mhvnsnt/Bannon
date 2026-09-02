#!/usr/bin/env node
/* late_programs.cjs — WHICH SHADER PROGRAMS LINK AFTER THE BELL, AND WHAT OWNS THEM?
 *
 *   node tools/harness/late_programs.cjs
 *
 * stall_autopsy proved the freeze is gl.linkWait — 1,762 ms total, 731 ms in ONE frame at the
 * bell — and this game already has TWO shader pre-warm systems (BANNON_PREWARM and
 * BANNON_PERF.prewarm), both calling renderer.compile(scene, camera). So the question is not
 * "should we pre-warm" but "what is pre-warm MISSING". Guessing at that is how the last two
 * attempts went; this reads it.
 *
 * Method: wrap WebGLProgram creation at the GL level (createProgram/linkProgram) and stamp each
 * one with the wall-clock time, the game state, and the three.js material that was being set up
 * when it happened. Then diff the list at the bell against the list at the end.
 */
const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');
const ROOT = path.dirname(path.dirname(__dirname));
const MIME = { '.html':'text/html','.js':'text/javascript','.json':'application/json','.glb':'model/gltf-binary',
  '.fbx':'application/octet-stream','.bin':'application/octet-stream','.png':'image/png','.jpg':'image/jpeg',
  '.jpeg':'image/jpeg','.webp':'image/webp','.mp3':'audio/mpeg','.wav':'audio/wav','.ogg':'audio/ogg',
  '.css':'text/css','.svg':'image/svg+xml','.jgz':'application/octet-stream' };
const sleep = ms => new Promise(r => setTimeout(r, ms));

function WATCH(){
  window.__P = { t0: performance.now(), progs: [], marks: [] };
  const P = window.__P;
  const st = () => { try{ return new Function('return gameState')(); }catch(e){ return '?'; } };
  const hook = () => {
    const proto = window.WebGL2RenderingContext ? WebGL2RenderingContext.prototype : WebGLRenderingContext.prototype;
    if (proto.__lpHooked) return; proto.__lpHooked = true;
    const link = proto.linkProgram;
    proto.linkProgram = function(p){
      const a = performance.now();
      const r = link.call(this, p);
      const b = performance.now();
      // The FRAGMENT source is what distinguishes one material from another. Its first #define
      // lines are the three.js feature flags, which name the material far better than any label
      // we could invent — USE_SKINNING, USE_MAP, TONE_MAPPING, and so on.
      let tag = '?', defines = [];
      try{
        const sh = this.getAttachedShaders(p) || [];
        for (const s of sh){
          const src = this.getShaderSource(s) || '';
          if (src.indexOf('gl_FragColor') >= 0 || src.indexOf('pc_fragColor') >= 0){
            defines = (src.match(/^#define \w+/gm) || []).map(x => x.slice(8)).slice(0, 14);
            tag = (src.match(/SHADER_NAME (\w+)/) || [,''])[1] || 'shader';
          }
        }
      }catch(e){}
      P.progs.push({ at:+((b - P.t0)/1000).toFixed(2), ms:+(b-a).toFixed(1), state:st(), tag, defines });
      return r;
    };
  };
  hook(); setInterval(hook, 300);
  window.__mark = n => P.marks.push({ n, at:+((performance.now() - P.t0)/1000).toFixed(2) });
}

(async () => {
  const port = 9700 + Math.floor(Math.random()*200);
  const srv = http.createServer((q, s) => {
    let p = decodeURIComponent(q.url.split('?')[0]); if (p === '/') p = '/BANNON_v150.html';
    const f = path.join(ROOT, p);
    if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()){ s.writeHead(404); return s.end('no'); }
    s.writeHead(200, { 'Content-Type': MIME[path.extname(f).toLowerCase()]||'application/octet-stream', 'Cache-Control':'no-cache' });
    fs.createReadStream(f).pipe(s);
  });
  await new Promise(r => srv.listen(port, r));
  const br = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    args:['--use-gl=swiftshader','--no-sandbox','--no-proxy-server','--proxy-bypass-list=<-loopback>'] });
  const pg = await br.newPage({ viewport:{ width:412, height:915 } });
  await pg.addInitScript(WATCH);
  await pg.goto(`http://127.0.0.1:${port}/BANNON_v150.html`, { waitUntil:'domcontentloaded', timeout:60000 });
  const gs = () => pg.evaluate(() => { try{ return new Function('return gameState')(); }catch(e){ return null; } }).catch(()=>null);
  for (let i=0;i<400 && (await gs())!=='menu'; i++) await sleep(500);
  await pg.evaluate(() => { window.__mark('menu'); try{ window.BANNON_PERF.setTier(4); window.BANNON_PERF_AUTO=false; }catch(e){} });
  await pg.evaluate(() => { const b=document.getElementById('btnFight'); if(b) b.click(); });
  for (let i=0;i<60;i++){ if (await pg.evaluate(()=>{const s=document.getElementById('csStart');return !!(s&&s.offsetParent!==null);})) break; await sleep(400); }
  await pg.evaluate(() => { window.__mark('select'); const s=document.getElementById('csStart'); if(s) s.click(); });
  for (let i=0;i<120 && (await gs())!=='fight'; i++) await sleep(500);
  await pg.evaluate(() => window.__mark('bell'));
  // play for a while, driving inputs so new materials (fx, blood, props) get their first draw
  for (let i=0;i<40;i++){
    await pg.evaluate(() => { ['j','k','l','u','i','w','a','s','d'].forEach(k => {
      dispatchEvent(new KeyboardEvent('keydown',{key:k,bubbles:true}));
      setTimeout(()=>dispatchEvent(new KeyboardEvent('keyup',{key:k,bubbles:true})), 90); }); });
    await sleep(900);
  }
  await pg.evaluate(() => window.__mark('end'));
  const R = await pg.evaluate(() => window.__P);
  await br.close(); srv.close();

  const bell = (R.marks.find(m => m.n === 'bell') || { at: 0 }).at;
  const late = R.progs.filter(p => p.at > bell);
  const totLate = late.reduce((n,p) => n + p.ms, 0);
  console.log('\n===== SHADER PROGRAMS =====');
  console.log('  marks           ' + JSON.stringify(R.marks));
  console.log('  total programs  ' + R.progs.length + '   linked BEFORE the bell ' + (R.progs.length - late.length)
            + '   AFTER ' + late.length);
  console.log('  link time after the bell: ' + totLate.toFixed(0) + ' ms');
  console.log('\n  EVERY PROGRAM LINKED AFTER THE BELL (this is the freeze):');
  late.sort((a,b) => b.ms - a.ms).slice(0, 30).forEach(p =>
    console.log('   t=' + String(p.at).padStart(6) + 's  ' + String(p.ms.toFixed(0)).padStart(5) + 'ms  '
              + p.state.padEnd(6) + ' ' + p.tag.padEnd(18) + ' ' + p.defines.join(' ')));
  const byDef = {};
  late.forEach(p => { const k = p.defines.join(' ') || '(none)'; byDef[k] = (byDef[k]||0) + p.ms; });
  console.log('\n  GROUPED BY FEATURE FLAGS (ms of link time after the bell):');
  Object.entries(byDef).sort((a,b)=>b[1]-a[1]).slice(0,14).forEach(([k,v]) =>
    console.log('   ' + String(v.toFixed(0)).padStart(6) + 'ms  ' + (k || '(none)').slice(0,150)));
  fs.mkdirSync(path.join(ROOT,'dist','playtest'), { recursive:true });
  fs.writeFileSync(path.join(ROOT,'dist','playtest','late_programs.json'), JSON.stringify(R, null, 1));
})();
