#!/usr/bin/env node
/* black_frames.cjs — THE SCREEN FLASHING BLACK, AS A COUNT.
 *
 *   node tools/harness/black_frames.cjs
 *
 * OWNER: "I kept telling you the screen was flashing black."
 * He has said it more than once and it has never been measured, only reasoned about. A flash is
 * invisible to a screenshot (you have to be looking on exactly the wrong frame) and invisible to
 * fps (a black frame is still a frame). So this reads the CANVAS ITSELF every frame.
 *
 * Method: after every composed frame, downsample the drawing buffer into a 16x16 2D canvas and
 * take the mean luminance. A frame under the threshold is a BLACK frame. Each one is stamped with
 * the game state, the current tier, and whatever the game did in the preceding 250 ms — tier
 * change, composer resize, arena rebuild, light cull — so the report names a CAUSE rather than
 * just a symptom.
 *
 * Reading pixels back from a WebGL canvas is itself expensive, so this is a diagnostic harness and
 * never something the game ships.
 */
const { chromium } = require('playwright');
const http = require('http'); const fs = require('fs'); const path = require('path');
const ROOT = path.dirname(path.dirname(__dirname));
const OUT = path.join(ROOT, 'dist', 'playtest');
const MIME = { '.html':'text/html','.js':'text/javascript','.json':'application/json','.glb':'model/gltf-binary',
  '.fbx':'application/octet-stream','.bin':'application/octet-stream','.png':'image/png','.jpg':'image/jpeg',
  '.webp':'image/webp','.mp3':'audio/mpeg','.wav':'audio/wav','.ogg':'audio/ogg','.css':'text/css',
  '.svg':'image/svg+xml','.jgz':'application/octet-stream' };
const sleep = ms => new Promise(r => setTimeout(r, ms));

function WATCH(){
  window.__B = { t0: performance.now(), frames:0, black:[], events:[], lum:[] };
  const B = window.__B;
  const now = () => +((performance.now() - B.t0)/1000).toFixed(2);
  const st = () => { try{ return new Function('return gameState')(); }catch(e){ return '?'; } };
  const ev = (what, detail) => B.events.push({ at: now(), what, detail });

  // name the things that could plausibly blank a frame, so a black frame gets a CAUSE
  const armHooks = () => {
    try{
      const C = window.__composer;
      if (C && !C.__bfHooked){
        C.__bfHooked = true;
        ['setSize','setPixelRatio','reset'].forEach(k => {
          if (typeof C[k] !== 'function') return;
          const o = C[k].bind(C);
          C[k] = function(){ ev('composer.' + k, Array.prototype.slice.call(arguments).join('x')); return o.apply(null, arguments); };
        });
      }
    }catch(e){}
    try{
      if (window.BANNON_PERF && window.BANNON_PERF.setTier && !window.BANNON_PERF.setTier.__bf){
        const o = window.BANNON_PERF.setTier;
        const w = function(n){ ev('tier', String(n)); return o.apply(this, arguments); };
        w.__bf = 1; window.BANNON_PERF.setTier = w;
      }
    }catch(e){}
    try{
      if (typeof window.buildArena === 'function' && !window.buildArena.__bf){
        const o = window.buildArena;
        const w = function(){ ev('buildArena', ''); return o.apply(this, arguments); };
        w.__bf = 1; window.buildArena = w;
      }
    }catch(e){}
    // the renderer is the only place that can tell us a frame was COMPOSED at all
    try{
      const R = new Function('return typeof renderer!=="undefined"?renderer:null')();
      if (R && !R.__bfHooked){
        R.__bfHooked = true;
        const cv = R.domElement;
        const s = document.createElement('canvas'); s.width = s.height = 16;
        const c2 = s.getContext('2d', { willReadFrequently:true });
        const sampleAfter = () => {
          try{
            c2.drawImage(cv, 0, 0, 16, 16);
            const d = c2.getImageData(0,0,16,16).data;
            let sum = 0;
            for (let i=0;i<d.length;i+=4) sum += (d[i]*0.299 + d[i+1]*0.587 + d[i+2]*0.114);
            const lum = sum / (d.length/4);
            B.frames++;
            if (B.frames % 5 === 0) B.lum.push(+lum.toFixed(1));
            if (lum < 3){
              const recent = B.events.filter(e => now() - e.at < 0.25).map(e => e.what);
              B.black.push({ at: now(), lum:+lum.toFixed(2), state: st(),
                tier: (window.BANNON_PERF && window.BANNON_PERF.tier) ? window.BANNON_PERF.tier() : '?',
                after: recent });
            }
          }catch(e){}
        };
        // sample AFTER the frame is composed: a rAF registered now runs after the game's own
        const loop = () => { requestAnimationFrame(loop); sampleAfter(); };
        requestAnimationFrame(loop);
      }
    }catch(e){}
  };
  armHooks(); setInterval(armHooks, 400);
}

(async () => {
  const port = 9950 + Math.floor(Math.random()*40);
  const srv = http.createServer((q,s)=>{ let p=decodeURIComponent(q.url.split('?')[0]); if(p==='/')p='/BANNON_v150.html';
    const f=path.join(ROOT,p); if(!f.startsWith(ROOT)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){s.writeHead(404);return s.end('no');}
    s.writeHead(200,{'Content-Type':MIME[path.extname(f).toLowerCase()]||'application/octet-stream','Cache-Control':'no-cache'});
    fs.createReadStream(f).pipe(s); });
  await new Promise(r => srv.listen(port, r));
  const br = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    args:['--use-gl=swiftshader','--no-sandbox','--no-proxy-server','--proxy-bypass-list=<-loopback>'] });
  const pg = await br.newPage({ viewport:{ width:412, height:915 }, deviceScaleFactor:2.5, isMobile:true, hasTouch:true });
  await pg.addInitScript(WATCH);
  const errs = []; pg.on('pageerror', e => errs.push(String(e.message).slice(0,140)));
  await pg.goto(`http://127.0.0.1:${port}/BANNON_v150.html`, { waitUntil:'domcontentloaded', timeout:60000 });
  const gs = () => pg.evaluate(()=>{try{return new Function('return gameState')();}catch(e){return null;}}).catch(()=>null);
  for (let i=0;i<400 && (await gs())!=='menu'; i++) await sleep(500);
  await sleep(4000);
  await pg.evaluate(() => { const b=document.getElementById('btnFight'); if(b) b.click(); });
  for (let i=0;i<60;i++){ if (await pg.evaluate(()=>{const s=document.getElementById('csStart');return !!(s&&s.offsetParent!==null);})) break; await sleep(400); }
  await sleep(2500);
  await pg.evaluate(() => { const s=document.getElementById('csStart'); if(s) s.click(); });
  for (let i=0;i<120 && (await gs())!=='fight'; i++) await sleep(500);
  // play through the entrance and into the match — the entrance is where the arena, both bodies,
  // the pyro and the tron all arrive at once, which is the likeliest place to blank a frame
  for (let i=0;i<30;i++){
    await pg.evaluate(() => { ['j','k','w','d'].forEach(k => {
      dispatchEvent(new KeyboardEvent('keydown',{key:k,bubbles:true}));
      setTimeout(()=>dispatchEvent(new KeyboardEvent('keyup',{key:k,bubbles:true})), 80); }); });
    await sleep(1000);
  }
  const B = await pg.evaluate(() => window.__B);
  await br.close(); srv.close();

  fs.mkdirSync(OUT, { recursive:true });
  fs.writeFileSync(path.join(OUT,'black_frames.json'), JSON.stringify(B, null, 1));
  const byState = {}, byCause = {};
  B.black.forEach(b => { byState[b.state] = (byState[b.state]||0)+1;
    const c = b.after.length ? b.after.join('+') : '(nothing in the last 250ms)';
    byCause[c] = (byCause[c]||0)+1; });
  console.log('\n===== BLACK FRAMES =====');
  console.log('  frames sampled  ' + B.frames);
  console.log('  BLACK frames    ' + B.black.length + '   (' + (100*B.black.length/Math.max(1,B.frames)).toFixed(1) + '%)');
  console.log('  by game state   ' + JSON.stringify(byState));
  console.log('  what happened in the 250ms before each:');
  Object.entries(byCause).sort((a,b)=>b[1]-a[1]).forEach(([k,v]) => console.log('    ' + String(v).padStart(4) + '  ' + k));
  console.log('  first 12 black frames:');
  B.black.slice(0,12).forEach(b => console.log('    t=' + String(b.at).padStart(6) + 's  lum ' + String(b.lum).padStart(5)
    + '  ' + b.state.padEnd(12) + ' tier ' + String(b.tier).padEnd(7) + ' after: ' + (b.after.join(',')||'-')));
  console.log('  luminance trace (every 5th frame): ' + B.lum.slice(0,60).join(' '));
  console.log('  events: ' + JSON.stringify(B.events.slice(0,20)));
  console.log('  page errors ' + errs.length);
  console.log('  report -> ' + path.join(OUT,'black_frames.json'));
})();
