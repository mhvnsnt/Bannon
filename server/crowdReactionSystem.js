
class ProceduralCrowdReaction {
    constructor() { this.baseVolume = 0.5; this.chantQueue = []; }
    evaluateHit(hitSeverity, rivalryRating, matchPace) {
        const intensity = (hitSeverity * 0.5) + (rivalryRating * 0.3) + (matchPace * 0.2);
        if (intensity > 0.8) { this.triggerStadiumStrobes(); this.queueCrowdChant('holy_s_chant.wav'); } 
        else if (intensity > 0.5) { this.queueCrowdChant('ooh_pop.wav'); }
    }
    evaluateNearFall(countTime, rivalryRating) {
        if (countTime > 2.8) {
            this.queueCrowdChant('gasp_shock.wav');
            if (rivalryRating > 0.8) this.triggerStadiumStrobes('rapid');
        }
    }
    queueCrowdChant(audioClip) { console.log("[Crowd] Queued chant: " + audioClip); this.chantQueue.push(audioClip); }
    triggerStadiumStrobes(pattern = 'flash') { console.log("[Lighting] Triggering stadium strobe pattern: " + pattern); }
}
module.exports = { ProceduralCrowdReaction };
