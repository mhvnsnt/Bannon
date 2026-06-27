import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { BodyConfigPayload } from './types.js';
import { FighterEvolution } from './FighterEvolution.js';
import { frequencyForMove, planeForFrequency } from './Cosmology.js';
import { mirrorToCloud } from './CloudPersistence.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FORGE_FILE = path.join(__dirname, 'forged_characters.json');

/**
 * CharacterForge — our own proprietary "Create A Wrestler", aimed at WWE 2K-level
 * depth without any of 2K's proprietary tech. Everything here is a normalized
 * morph/material spec the BANNON engine already understands (it extends
 * types.ts/BodyConfigPayload), so a forged character is data the renderer can
 * actually build a believable body from — not a separate art pipeline.
 *
 * The forge is deliberately wide: regional body morphs, a full face morph map,
 * layered skin/material realism, attire, and a fighting identity that plugs
 * straight into the cosmology (a creator picks an archetype -> a starting plane
 * and signature frequency) and the evolution roster (the character then grows
 * and learns moves like everyone else).
 */

// Per-region muscle/fat/size morphs — the slider bank a creator actually moves.
export interface BodyMorphs {
  height: number;        // 0..1 (1.5m .. 2.2m mapped by the client)
  mass: number;          // 0..1 overall body mass
  muscularity: number;   // 0..1 lean .. bodybuilder
  bodyFat: number;       // 0..1 ripped .. heavyweight soft-power
  // regional definition multipliers (1 = neutral), the "deep" part of realism
  neck: number; shoulders: number; chest: number; arms: number; forearms: number;
  abs: number; waist: number; hips: number; thighs: number; calves: number;
  backWidth: number; trapSize: number;
}

// Face morph map — the expensive, identity-defining layer (2K-style face sculpting).
export interface FaceMorphs {
  skullWidth: number; skullLength: number; jawWidth: number; jawLength: number;
  chinSize: number; cheekbones: number; cheekFullness: number;
  browHeight: number; browDepth: number; orbitalDepth: number;
  eyeSize: number; eyeSpacing: number; eyeDepth: number; eyeTilt: number;
  noseWidth: number; noseLength: number; noseBridge: number; nostrilFlare: number;
  mouthWidth: number; lipFullness: number; philtrumDepth: number;
  earSize: number; earProtrusion: number;
  faceAsymmetry: number; // a touch of asymmetry is what reads as "real" vs "CG mannequin"
}

// Layered skin/material realism — the thing that makes a model look authored, not plastic.
export interface SkinMaterial {
  baseColor: number;          // hex diffuse
  complexion: 'fair' | 'light' | 'tan' | 'olive' | 'brown' | 'dark' | 'deep';
  roughnessDry: number;       // 0..1 base roughness (modulated DOWN as sweat builds)
  roughnessSweat: number;     // roughness floor at max exertion (slick sheen)
  metalness: number;          // subtle, for oiled/sweaty highlight
  subsurface: number;         // 0..1 fake-SSS strength (ears/nose translucency, fleshy reads)
  freckles: number; scars: number; tattooCoverage: number; vascularity: number; // detail maps 0..1
}

export interface Attire {
  gearStyle: string;          // 'trunks' | 'tights' | 'singlet' | 'streetwear' | 'mma' | custom
  primaryColor: number; secondaryColor: number; accentColor: number;
  boots: string; kneePads: boolean; elbowPads: boolean; wrists: string;
  facePaint?: string;         // optional, ties to character/faction
}

export interface ForgedCharacter {
  id: string;
  displayName: string;
  archetype: string;          // sets starting plane/frequency + style bias
  faction?: string;           // ties into the 5 OTTR factions
  body: BodyMorphs;
  face: FaceMorphs;
  skin: SkinMaterial;
  attire: Attire;
  // engine-ready compaction of the morphs (what types.ts/BodyConfigPayload wants)
  engineConfig: BodyConfigPayload;
  // fighting identity
  startingFrequency: number;  // where on the 10 planes they begin
  signatureMoveSeed?: string; // a named finisher they enter the world already owning
  createdAt: string;
  updatedAt: string;
}

// Archetypes map a creative choice to a starting plane (frequency) + body defaults.
const ARCHETYPES: Record<string, { freq: number; mass: number; musc: number; note: string }> = {
  brawler:     { freq: 0.05, mass: 0.55, musc: 0.6,  note: 'dense physical plane — raw strikes' },
  technician:  { freq: 0.34, mass: 0.4,  musc: 0.5,  note: 'lower-mental plane — counters and submissions' },
  powerhouse:  { freq: 0.48, mass: 0.85, musc: 0.85, note: 'causal plane — slams and setups' },
  highFlyer:   { freq: 0.70, mass: 0.3,  musc: 0.45, note: 'atmic plane — aerial finishers' },
  enigma:      { freq: 0.90, mass: 0.5,  musc: 0.6,  note: 'logoic plane — the dark-matter wildcard' },
  freeAgent:   { freq: 0.42, mass: 0.5,  musc: 0.65, note: 'BANNON-class — adapts across the planes' },
};

function neutralBody(): BodyMorphs {
  return {
    height: 0.5, mass: 0.5, muscularity: 0.5, bodyFat: 0.4,
    neck: 1, shoulders: 1, chest: 1, arms: 1, forearms: 1,
    abs: 1, waist: 1, hips: 1, thighs: 1, calves: 1, backWidth: 1, trapSize: 1,
  };
}
function neutralFace(): FaceMorphs {
  return {
    skullWidth: 0.5, skullLength: 0.5, jawWidth: 0.5, jawLength: 0.5,
    chinSize: 0.5, cheekbones: 0.5, cheekFullness: 0.5,
    browHeight: 0.5, browDepth: 0.5, orbitalDepth: 0.5,
    eyeSize: 0.5, eyeSpacing: 0.5, eyeDepth: 0.5, eyeTilt: 0.5,
    noseWidth: 0.5, noseLength: 0.5, noseBridge: 0.5, nostrilFlare: 0.5,
    mouthWidth: 0.5, lipFullness: 0.5, philtrumDepth: 0.5,
    earSize: 0.5, earProtrusion: 0.5, faceAsymmetry: 0.08,
  };
}
function neutralSkin(): SkinMaterial {
  return {
    baseColor: 0xc8987a, complexion: 'tan',
    roughnessDry: 0.42, roughnessSweat: 0.18, metalness: 0.05,
    subsurface: 0.35, freckles: 0, scars: 0, tattooCoverage: 0, vascularity: 0.3,
  };
}
function neutralAttire(): Attire {
  return {
    gearStyle: 'trunks', primaryColor: 0x202028, secondaryColor: 0x8a1f1f, accentColor: 0xffb000,
    boots: 'mid', kneePads: false, elbowPads: false, wrists: 'tape',
  };
}

/** Fold the rich morphs down to the compact BodyConfigPayload the renderer consumes. */
function toEngineConfig(body: BodyMorphs, face: FaceMorphs, skin: SkinMaterial): BodyConfigPayload {
  return {
    torsoHeight: +(0.85 + body.height * 0.4).toFixed(3),
    torsoWidth: +(0.8 + body.mass * 0.5 + body.muscularity * 0.15).toFixed(3),
    limbLengthUpper: +(0.9 + body.height * 0.25).toFixed(3),
    limbLengthLower: +(0.9 + body.height * 0.25).toFixed(3),
    skinBaseColor: skin.baseColor,
    defaultRoughness: skin.roughnessDry,
    defaultMetalness: skin.metalness,
    faceMeshId: 'proc',
    facialMorphs: {
      jawWidth: +(0.7 + face.jawWidth * 0.6).toFixed(3),
      headScale: +(0.92 + face.skullWidth * 0.16).toFixed(3),
    },
  };
}

export class CharacterForge {
  private chars: Record<string, ForgedCharacter>;
  private evolution: FighterEvolution;

  constructor(evolution: FighterEvolution) {
    console.log('[Node 11] Character Forge Initialized — proprietary AAA CAW online');
    this.evolution = evolution;
    this.chars = this.load();
  }

  private load(): Record<string, ForgedCharacter> {
    try {
      if (fs.existsSync(FORGE_FILE)) return JSON.parse(fs.readFileSync(FORGE_FILE, 'utf-8'));
    } catch (_) { /* reseed empty */ }
    return {};
  }

  private persist() {
    fs.writeFileSync(FORGE_FILE, JSON.stringify(this.chars, null, 2), 'utf-8');
    void mirrorToCloud('bannon_daemon', 'forged_characters', this.chars);
  }

  /** Blank-slate spec a client can render the CAW UI from (all neutral defaults + the option lists). */
  public blankTemplate() {
    return {
      body: neutralBody(),
      face: neutralFace(),
      skin: neutralSkin(),
      attire: neutralAttire(),
      archetypes: Object.entries(ARCHETYPES).map(([k, v]) => ({ id: k, startingPlane: planeForFrequency(v.freq).index, ...v })),
      complexions: ['fair', 'light', 'tan', 'olive', 'brown', 'dark', 'deep'],
      gearStyles: ['trunks', 'tights', 'singlet', 'streetwear', 'mma'],
    };
  }

  /** Forge a character. Partial input is merged over neutral defaults + archetype, then it enters the roster. */
  public create(input: Partial<ForgedCharacter> & { displayName: string }): ForgedCharacter {
    const id = (input.id || input.displayName).toUpperCase().replace(/[^A-Z0-9]/g, '_');
    const arche = ARCHETYPES[input.archetype || 'freeAgent'] || ARCHETYPES.freeAgent;
    const body = { ...neutralBody(), mass: arche.mass, muscularity: arche.musc, ...(input.body || {}) };
    const face = { ...neutralFace(), ...(input.face || {}) };
    const skin = { ...neutralSkin(), ...(input.skin || {}) };
    const attire = { ...neutralAttire(), ...(input.attire || {}) };
    const startingFrequency = input.startingFrequency ?? arche.freq;

    const character: ForgedCharacter = {
      id,
      displayName: input.displayName,
      archetype: input.archetype || 'freeAgent',
      faction: input.faction,
      body, face, skin, attire,
      engineConfig: toEngineConfig(body, face, skin),
      startingFrequency,
      signatureMoveSeed: input.signatureMoveSeed,
      createdAt: this.chars[id]?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.chars[id] = character;

    // Plug into the living roster: seed the fighter at the chosen plane so a
    // forged character grows/learns like the rest of the cast from match one.
    const f = this.evolution.getFighter(id);
    f.signatureFreq = Math.max(f.signatureFreq, startingFrequency);
    if (character.signatureMoveSeed && !f.signatureMoves.includes(character.signatureMoveSeed)) {
      f.signatureMoves.push(character.signatureMoveSeed);
    }

    this.persist();
    return character;
  }

  public update(id: string, patch: Partial<ForgedCharacter>): ForgedCharacter | null {
    const key = id.toUpperCase();
    const existing = this.chars[key];
    if (!existing) return null;
    const merged: ForgedCharacter = {
      ...existing,
      ...patch,
      body: { ...existing.body, ...(patch.body || {}) },
      face: { ...existing.face, ...(patch.face || {}) },
      skin: { ...existing.skin, ...(patch.skin || {}) },
      attire: { ...existing.attire, ...(patch.attire || {}) },
      updatedAt: new Date().toISOString(),
    };
    merged.engineConfig = toEngineConfig(merged.body, merged.face, merged.skin);
    this.chars[key] = merged;
    this.persist();
    return merged;
  }

  public get(id: string): ForgedCharacter | null {
    return this.chars[id.toUpperCase()] || null;
  }

  public list(): ForgedCharacter[] {
    return Object.values(this.chars);
  }
}
