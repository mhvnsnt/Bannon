import { Vec3, RingConfig } from './PhysicsCollider.js';

export type RingZone = 'center' | 'near_ropes' | 'turnbuckle' | 'apron' | 'outside';

/**
 * SpatialEnvironment — arena/ring layout queries shared between the daemon
 * and (eventually) the client renderer, so "where am I standing" logic has
 * one source of truth instead of being re-derived ad hoc at every call site.
 */
export class SpatialEnvironment {
  public ring: RingConfig;
  private readonly turnbuckleMargin = 0.6;

  constructor(ring?: Partial<RingConfig>) {
    console.log("[Node 4] Spatial Environment Initialized");
    this.ring = {
      centerX: 0, centerZ: 0, halfWidth: 4.5, halfDepth: 4.5, floorY: 0, ropeHeight: 1.0,
      ...ring,
    };
  }

  public classifyZone(pos: Vec3): RingZone {
    const dx = Math.abs(pos.x - this.ring.centerX);
    const dz = Math.abs(pos.z - this.ring.centerZ);
    if (dx > this.ring.halfWidth || dz > this.ring.halfDepth) return 'outside';
    const nearCornerX = dx > this.ring.halfWidth - this.turnbuckleMargin;
    const nearCornerZ = dz > this.ring.halfDepth - this.turnbuckleMargin;
    if (nearCornerX && nearCornerZ) return 'turnbuckle';
    if (dx > this.ring.halfWidth - 0.4 || dz > this.ring.halfDepth - 0.4) return 'near_ropes';
    if (dx > this.ring.halfWidth + 0.1 || dz > this.ring.halfDepth + 0.1) return 'apron';
    return 'center';
  }

  public distanceToNearestRope(pos: Vec3): number {
    const dx = this.ring.halfWidth - Math.abs(pos.x - this.ring.centerX);
    const dz = this.ring.halfDepth - Math.abs(pos.z - this.ring.centerZ);
    return Math.max(0, Math.min(dx, dz));
  }
}
