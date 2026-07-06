export interface Vec3 { x: number; y: number; z: number; }
export interface RingConfig { centerX: number; centerZ: number; halfWidth: number; halfDepth: number; floorY: number; ropeHeight: number; }

/**
 * PhysicsCollider — framework-agnostic spatial/physics math the daemon can
 * use server-side (replay validation, future server-authoritative
 * multiplayer) without depending on Three.js. Mirrors the geometry rules
 * already used by the client renderer; does not touch or replace it.
 */
export class PhysicsCollider {
  constructor() {
    console.log("[Node 6] Physics Collider Initialized");
  }

  public distance(a: Vec3, b: Vec3): number {
    return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
  }

  public inGrappleRange(a: Vec3, b: Vec3, range = 1.4): boolean {
    return this.distance(a, b) <= range;
  }

  public isInRing(pos: Vec3, ring: RingConfig): boolean {
    return Math.abs(pos.x - ring.centerX) <= ring.halfWidth &&
           Math.abs(pos.z - ring.centerZ) <= ring.halfDepth &&
           pos.y >= ring.floorY - 0.05;
  }

  public isNearRopes(pos: Vec3, ring: RingConfig, margin = 0.4): boolean {
    const dx = ring.halfWidth - Math.abs(pos.x - ring.centerX);
    const dz = ring.halfDepth - Math.abs(pos.z - ring.centerZ);
    return Math.min(dx, dz) <= margin;
  }

  /** Server-side sanity check before trusting a client-reported hit: were the two fighters even close enough? */
  public validateHitClaim(attacker: Vec3, defender: Vec3, moveReach: number): boolean {
    return this.distance(attacker, defender) <= moveReach * 1.15; // small tolerance for network/physics jitter
  }
}
