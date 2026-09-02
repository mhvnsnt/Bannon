// Small utility to compute per-clip scale based on canonical bone lengths
export interface ClipFrame { pose: { [joint: string]: [number, number, number] } }

export function distance(a: [number, number, number], b: [number, number, number]) {
  const dx = a[0]-b[0], dy = a[1]-b[1], dz = a[2]-b[2];
  return Math.sqrt(dx*dx+dy*dy+dz*dz);
}

export function computeClipScale(clip: { keys?: ClipFrame[] }, jointA = 'shR', jointB = 'elR', canonicalLen = 0.30): number {
  const keys = clip.keys || [];
  if (!keys.length) return 1.0;
  // use first frame with both joints present
  let rest: ClipFrame | null = null;
  for (const k of keys) {
    if (k.pose && k.pose[jointA] && k.pose[jointB]) { rest = k; break; }
  }
  if (!rest) return 1.0;
  const a = rest.pose[jointA] as [number, number, number];
  const b = rest.pose[jointB] as [number, number, number];
  const boneLen = distance(a, b) || 1e-6;
  const scale = canonicalLen / boneLen;
  return scale;
}

export function applyScaleToDistance(raw: number, scale: number) { return raw * scale; }
