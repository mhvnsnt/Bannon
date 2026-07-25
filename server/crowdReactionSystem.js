class ProceduralCrowdReaction {
    constructor() { 
        this.baseVolume = 0.5; 
        this.chantQueue = []; 
        this.matrixActive = true;
    }

    evaluateReactionMatrix(hitSeverity, matchPace, rivalryRating) {
        // Core ProceduralCrowdReaction matrix evaluation
        const popValue = (hitSeverity * 0.4) + (matchPace * 0.3) + (rivalryRating * 0.3);
        
        if (popValue >= 0.85) {
            this.triggerStadiumStrobes('extreme');
            this.queueCrowdChant('holy_s_chant.wav');
        } else if (popValue >= 0.6) {
            this.queueCrowdChant('massive_pop.wav');
        } else if (popValue >= 0.4) {
            this.queueCrowdChant('ooh_pop.wav');
        }
    }

    evaluateHit(hitSeverity, rivalryRating, matchPace) {
        this.evaluateReactionMatrix(hitSeverity, matchPace, rivalryRating);
    }

    evaluateNearFall(countTime, rivalryRating, matchPace) {
        if (countTime > 2.8) {
            this.queueCrowdChant('gasp_shock.wav');
            if (rivalryRating > 0.8 || matchPace > 0.8) {
                this.triggerStadiumStrobes('rapid');
                this.queueCrowdChant('this_is_awesome.wav');
            }
        }
    }

    queueCrowdChant(audioClip) { 
        console.log("[Crowd] Queued precise audio queue: " + audioClip); 
        this.chantQueue.push(audioClip); 
    }

    triggerStadiumStrobes(pattern = 'flash') { 
        console.log("[Lighting] Triggering stadium strobe lighting sequence: " + pattern); 
    }
}

module.exports = { ProceduralCrowdReaction };
