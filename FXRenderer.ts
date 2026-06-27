export interface FXCue {
  screenShake: number;   // 0..1 intensity
  slowMoMs: number;      // duration of hit-stop/slow-mo
  bloodChance: number;   // 0..1
  particle: 'impact' | 'dust' | 'sweat' | 'blood' | 'none';
}

/**
 * FXRenderer — decides WHICH visual effect cue an impact should trigger,
 * as plain data. Actual Three.js particle/shader work stays entirely in
 * the client renderer; this node's job is just the decision so cue
 * selection is consistent and (later) shareable across spectators in any
 * networked match.
 */
export class FXRenderer {
  constructor() {
    console.log("[Node 8] FX Renderer Initialized");
  }

  public cueForImpact(damage: number, category: string, fighterHpPct: number): FXCue {
    const intensity = Math.min(1, damage / 26);
    return {
      screenShake: +(intensity * (category === 'slam' ? 1 : 0.6)).toFixed(2),
      slowMoMs: damage > 18 ? 220 : damage > 10 ? 90 : 0,
      bloodChance: +(Math.max(0, (1 - fighterHpPct) * intensity * 0.5)).toFixed(2),
      particle: damage > 18 ? 'blood' : damage > 6 ? 'impact' : category === 'grapple' ? 'sweat' : 'dust',
    };
  }
}
