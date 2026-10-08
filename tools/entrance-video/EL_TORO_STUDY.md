# EL TORO DE ORO — Frame-by-Frame Study

Reference: ~/workspace/promo-work/EL_TORO_DE_ORO/EL_TORO_DE_ORO.mp4 (50.0s, 1920x1080)
25 frames extracted at 2s intervals → /tmp/eltoro_v2/

## Shot-by-shot breakdown

| Time | Frame | What's happening |
|------|-------|------------------|
| 0-5s | f_01 | Near-black. Faint blue rim light hints. Slow fade-in (INTENTIONAL per owner). Spotlight pool forming on floor. |
| 5-8s | f_02 | Character revealed standing in BLUE spotlight pool on dark reflective floor. Blue rim on shoulders/horns. Camera slightly low, full body centered. |
| 8-12s | f_04 | Arms spreading, one leg lifted (taunt pose). RED rim light on right side now. Key from front-left. Starfield background visible. Floor: blue/red gradient. |
| 12-14s | f_06 | CLOSE-UP 3/4 shot. Camera moved closer + to the side. Red rim on horns/shoulders prominent. |
| 14-18s | f_08 | Character walking toward camera, hand on chest. Floor has red/blue gradient with circular ring patterns. Spotlight follows. |
| 18-22s | f_10 | SIDE PROFILE, arms spread wide (crucifix taunt). Dramatic red light pool, long shadow. Medium distance. |
| 22-26s | f_12 | Medium shot, gesturing with hand. Warm orange/red spotlight pool. |
| 26-30s | f_14 | Slightly closer, hand extended toward camera. Warm spotlight. |
| 30-34s | f_16 | WIDE shot — character small in frame. VOLUMETRIC LIGHT BEAMS (god rays) from above. Golden spotlight. Taunt pose, arms out. |
| 34-38s | f_18 | Wide shot, golden volumetric beams, character flexing. |
| 38-42s | f_20 | **TITLE CARD**: "EL TORO DE ORO" — huge bold italic display font, GOLD fill, thick BLACK outline, RED outer glow. Thin RED horizontal rule underneath. Character visible behind text. |
| 42-46s | f_22 | Same title + "ASHLANE" in white bold below the red rule. Character arm raised behind text. |
| 46-50s | f_24/25 | **END CARD**: "ASHLANE" white bold italic, black outline, GOLD glow. "URBAN REIGN 2 • 2026" in gold below. Character posing behind. |

## What makes each shot work

### 1. Lighting (the signature look)
- **3-point setup**: warm key light (front-left), RED rim light (back-right, the signature), cool blue fill
- **Volumetric god-ray beams** from above in wide shots — warm golden color
- **Spotlight pool** on the floor that SHIFTS COLOR through the video: blue → red/blue → warm orange → gold
- Floor is dark and slightly reflective, catching the light pools
- Character is NEVER flat-lit. Always sculpted by the rim + key contrast.

### 2. Camera (never static, never boring)
- Constant reframing: wide → full → medium → close-up 3/4 → side profile → low angle → wide
- Slightly LOW angle default (character looks powerful)
- 3/4 angles preferred over straight-on or pure profile
- Each cut lands on a beat. No shot holds longer than ~4s.

### 3. Character performance
- REAL animated poses: walk cycle, arms-spread taunt, hand gestures, flexing
- NOT T-pose, NOT sliding. Feet planted. Weight shifts visible.
- The character PERFORMS for the camera.

### 4. Background / atmosphere
- Pure black void + subtle STARFIELD (tiny white dots, very dim)
- NO environment geometry — just the floor light pool and void
- Depth comes from: volumetric beams + floor gradient + rim light separation

### 5. Title card design (the critical detail)
- **Font**: bold italic DISPLAY font, collegiate/wrestling style (heavy weight, slight slant)
- **Fill**: gold/yellow (NOT white, NOT flat)
- **Stroke**: thick BLACK outline (~8-10px at 1080p)
- **Glow**: RED outer glow, soft, extending ~30px
- **Layout**: centered horizontally, upper-middle vertically, LARGE (spans ~70% of frame width)
- **Rule**: thin RED horizontal line below the name, ~60% of text width
- **Secondary**: white bold (smaller), below the rule — e.g. "ASHLANE"
- **NO background panel** — text floats directly over the 3D scene
- **Character visible behind/around text** — text does NOT cover the character's face

### 6. End card
- "ASHLANE": white fill, black outline, GOLD glow (same font treatment)
- Sub-line: "URBAN REIGN 2 • 2026" in gold, smaller, below
- Same no-panel floating treatment

### 7. Pacing / transitions
- 0-5s: fade from black (slow, intentional)
- Cuts are HARD (no dissolves) except the opening fade
- Every cut on a beat
- Title card holds ~4s, end card holds ~4s

### 8. Color grading
- Warm golds + deep reds + cool blues. High contrast. Blacks are TRUE black.
- Skin tones warm. No flat/desaturated look.

## Replication checklist for our pipeline
- [ ] Volumetric light beams (Blender: spot lights + volumetrics, or composited god-ray planes)
- [ ] Color-shifting spotlight pool on floor (animate light color through shots)
- [ ] Starfield background (particle system or texture)
- [ ] Camera: 7+ distinct framings per 50s, slightly low default, 3/4 preferred
- [ ] Title cards via PIL: display font + gold fill + black stroke + red glow + red rule
- [ ] Character performs real poses (fixed retarget, feet planted)
- [ ] Hard cuts on beats, 5s fade-in opening
- [ ] True blacks, warm grade
