export interface NormalizedInputFrame {
  ts: number;
  moveId: string | null;
  stickX: number;   // -1..1
  stickY: number;   // -1..1
  magnitude: number; // 0..1
}

/**
 * InputMatrix — normalizes raw client input events into a canonical schema
 * the rest of the daemon (replay validation, CombatAI training data,
 * anti-cheat) can reason about, independent of however the client's
 * actual joystick/keyboard code is wired up.
 */
export class InputMatrix {
  private buffer: NormalizedInputFrame[] = [];
  private readonly maxBuffer = 600; // ~10s at 60fps worth of frames per fighter

  constructor() {
    console.log("[Node 2] Input Matrix Initialized");
  }

  public normalize(raw: { moveId?: string; x?: number; y?: number }): NormalizedInputFrame {
    const stickX = clamp(raw.x ?? 0, -1, 1);
    const stickY = clamp(raw.y ?? 0, -1, 1);
    const frame: NormalizedInputFrame = {
      ts: Date.now(),
      moveId: raw.moveId ?? null,
      stickX,
      stickY,
      magnitude: +Math.min(1, Math.hypot(stickX, stickY)).toFixed(3),
    };
    this.buffer.push(frame);
    if (this.buffer.length > this.maxBuffer) this.buffer.shift();
    return frame;
  }

  /** Ordered list of move ids actually attempted this session — feeds CombatAI.recordSequence. */
  public getMoveSequence(): string[] {
    return this.buffer.filter(f => f.moveId).map(f => f.moveId as string);
  }

  public clear() {
    this.buffer = [];
  }
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}
