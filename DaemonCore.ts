import express from 'express';
import { CombatAI, MOVE_PRIMITIVES } from './CombatAI.js';
import { MatchDirector } from './MatchDirector.js';
import { AudioSynth } from './AudioSynth.js';
import { FXRenderer } from './FXRenderer.js';
import { InputMatrix } from './InputMatrix.js';
import { PhysicsCollider } from './PhysicsCollider.js';
import { SpatialEnvironment } from './SpatialEnvironment.js';
import { FighterEvolution } from './FighterEvolution.js';
import { PLANES } from './Cosmology.js';

/**
 * DaemonCore — "BANNON SENSES" heartbeat. Owns one instance of every other
 * node and exposes them over HTTP so the client (BANNON_v150.html) can read
 * suggestions/lore/fx decisions and report outcomes back, instead of those
 * systems only existing as dead TypeScript with no caller.
 */
export class DaemonCore {
  public router: express.Router;
  public combatAI: CombatAI;
  public matchDirector: MatchDirector;
  public audioSynth: AudioSynth;
  public fxRenderer: FXRenderer;
  public physics: PhysicsCollider;
  public spatial: SpatialEnvironment;
  public evolution: FighterEvolution;
  private inputMatrices: Map<string, InputMatrix> = new Map();

  constructor() {
    console.log("[Node 12] Daemon Core Initialized — BANNON SENSES online");
    this.combatAI = new CombatAI();
    this.matchDirector = new MatchDirector(this.combatAI);
    this.audioSynth = new AudioSynth();
    this.fxRenderer = new FXRenderer();
    this.physics = new PhysicsCollider();
    this.spatial = new SpatialEnvironment();
    this.evolution = new FighterEvolution();
    this.router = express.Router();
    this.setupRoutes();
  }

  private getInputMatrix(fighterId: string): InputMatrix {
    if (!this.inputMatrices.has(fighterId)) this.inputMatrices.set(fighterId, new InputMatrix());
    return this.inputMatrices.get(fighterId)!;
  }

  private setupRoutes() {
    // ---- CombatAI: move-learning (bandit suggestions + genetic content growth) ----
    this.router.get('/api/learn/primitives', (_req, res) => {
      res.json(MOVE_PRIMITIVES);
    });

    this.router.post('/api/learn/suggest-move', (req, res) => {
      const { availableMoveIds, lastMoveId } = req.body || {};
      if (!Array.isArray(availableMoveIds) || !availableMoveIds.length) {
        return res.status(400).json({ error: 'availableMoveIds (non-empty array) required' });
      }
      res.json({ moveId: this.combatAI.suggestNextMove(availableMoveIds, lastMoveId) });
    });

    this.router.post('/api/learn/record-outcome', (req, res) => {
      const { moveId, hit, damageDealt, won } = req.body || {};
      if (!moveId) return res.status(400).json({ error: 'moveId required' });
      this.combatAI.recordMoveOutcome(moveId, { hit: !!hit, damageDealt: Number(damageDealt) || 0, won: !!won });
      res.json({ success: true });
    });

    this.router.get('/api/learn/content', (_req, res) => {
      res.json(this.combatAI.getLearnedContent());
    });

    this.router.get('/api/learn/fitness', (_req, res) => {
      res.json(this.combatAI.getFitnessSnapshot());
    });

    this.router.post('/api/learn/evolve', (_req, res) => {
      res.json(this.combatAI.evolveContent());
    });

    // ---- MatchDirector + FighterEvolution: one match result drives BOTH the global
    // move-learning (bandit/genetic) AND the per-fighter ascension/style evolution. ----
    this.router.post('/api/match/report-result', (req, res) => {
      const { winner, loser, date, type, moveSequence, dominantCategory } = req.body || {};
      if (!winner || !loser) return res.status(400).json({ error: 'winner and loser required' });
      const result = this.matchDirector.reportFightResult({
        winner, loser, date: date || new Date().toISOString().split('T')[0], type: type || 'ko', moveSequence,
      });

      // Per-fighter evolution: winner ascends the planes + collapses a new move,
      // loser drifts toward what beat them, signatures leak across branes.
      const evo = this.evolution.processMatchResult({
        winnerId: winner, loserId: loser, winnerMoveSeq: moveSequence, dominantCategoryUsed: dominantCategory,
      });

      // Any brand-new combos the genetic layer just bred become permanent named
      // library moves, credited to the winner as their signature.
      const registered: string[] = [];
      if (result.evolved && result.newContent?.newCombos?.length) {
        for (const combo of result.newContent.newCombos) {
          const lib = this.evolution.registerSynthesizedMove(combo, winner);
          registered.push(lib.name);
        }
      }

      res.json({ ...result, evolution: evo, newLibraryMoves: registered });
    });

    this.router.get('/api/match/rivalry-heat', (req, res) => {
      const { a, b } = req.query;
      if (!a || !b) return res.status(400).json({ error: 'query params a and b required' });
      res.json({
        heat: this.matchDirector.getRivalryHeat(String(a), String(b)),
        beat: this.matchDirector.getStorylineBeat(String(a), String(b)),
      });
    });

    // ---- FXRenderer: impact cue decisions (client still owns the actual particle/shader work) ----
    this.router.post('/api/fx/impact-cue', (req, res) => {
      const { damage, category, fighterHpPct } = req.body || {};
      res.json(this.fxRenderer.cueForImpact(Number(damage) || 0, category || 'strike', fighterHpPct != null ? Number(fighterHpPct) : 1));
    });

    // ---- InputMatrix: per-fighter normalized input buffering, feeds CombatAI.recordSequence ----
    this.router.post('/api/input/:fighterId/frame', (req, res) => {
      const im = this.getInputMatrix(req.params.fighterId);
      res.json(im.normalize(req.body || {}));
    });

    this.router.get('/api/input/:fighterId/sequence', (req, res) => {
      const im = this.getInputMatrix(req.params.fighterId);
      res.json({ sequence: im.getMoveSequence() });
    });

    // ---- SpatialEnvironment / PhysicsCollider: ring zone + range queries ----
    this.router.post('/api/spatial/zone', (req, res) => {
      const { x, y, z } = req.body || {};
      res.json({ zone: this.spatial.classifyZone({ x: Number(x) || 0, y: Number(y) || 0, z: Number(z) || 0 }) });
    });

    this.router.post('/api/physics/in-range', (req, res) => {
      const { a, b, range } = req.body || {};
      if (!a || !b) return res.status(400).json({ error: 'a and b (Vec3) required' });
      res.json({ inRange: this.physics.inGrappleRange(a, b, range != null ? Number(range) : undefined) });
    });

    // ---- FighterEvolution: persistent roster that ascends the 10 planes ----
    // The cosmology blueprint itself (string-theory dimensions <-> Hermetic heavens).
    this.router.get('/api/cosmology/planes', (_req, res) => {
      res.json(PLANES);
    });

    // Full roster with current planes/records/movesets.
    this.router.get('/api/evolution/roster', (_req, res) => {
      res.json(this.evolution.getRoster());
    });

    // The growing move library (primitives + synthesized combos + brane-leaked moves).
    this.router.get('/api/evolution/library', (_req, res) => {
      res.json(this.evolution.getLibrary());
    });

    // One fighter's progression card: plane, unlocked moveset, signatures, and the
    // moves currently surfacing out of their probability ocean toward being learned.
    this.router.get('/api/evolution/fighter/:id', (req, res) => {
      res.json(this.evolution.getFighterCard(req.params.id));
    });
  }
}
