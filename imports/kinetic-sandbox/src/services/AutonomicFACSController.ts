export interface PhysiologicalState {
    systemSaturation: number;
    currentStrain: number;
    metabolicHeat: number;
    tissueTrauma: number;
    calculatedFriction: number;
    hypothalamicClock: number; // Pleasure/Arousal
    entityHeartRate: number;
    time: number;
    delta: number;
    fatigueState: number;
    lastSaccadeVector: { x: number, y: number };
}

export interface FACSOutput {
    blendshapes: Record<string, number>;
    saccadeVector: { x: number, y: number };
    pupilDilation: number;
    jawOffset: number;
    jawRotationZ: number;
    newFatigueState: number;
}

export class AutonomicFACSEngine {
    static calculateFACS(state: PhysiologicalState): FACSOutput {
        const out: FACSOutput = {
            blendshapes: {},
            saccadeVector: { x: 0, y: 0 },
            pupilDilation: 1.0,
            jawOffset: 0.0,
            jawRotationZ: 0.0,
            newFatigueState: state.fatigueState
        };

        const {
            systemSaturation: sat,
            currentStrain: strain,
            metabolicHeat: heat,
            tissueTrauma: trauma,
            calculatedFriction: friction,
            hypothalamicClock: pleasure,
            entityHeartRate: heartRate,
            time,
            delta,
            fatigueState
        } = state;

        // 1. FACS Neural Fatigue (Lactic Acid Simulation)
        const rawGrimace = Math.min(1.0, trauma * 1.5 + friction * 0.5);
        let newFatigue = fatigueState;
        if (rawGrimace > 0.5) {
            newFatigue = Math.min(1.0, fatigueState + delta * 0.05 * rawGrimace); // Accumulate fatigue
        } else {
            newFatigue = Math.max(0.0, fatigueState - delta * 0.02); // Recover
        }
        out.newFatigueState = newFatigue;

        // Tremor & Noise Generation
        const overloadThreshold = 0.8;
        const isOverloaded = strain > overloadThreshold; // Activate when currentStrain exceeds a high threshold

        // High-frequency, low-amplitude noise modifier for AU4, AU7, and AU20
        const neuromuscularTwitch = isOverloaded ? Math.sin(time * 60) * (strain * 0.15) : 0;
        const rapidTwitch = isOverloaded ? (Math.random() - 0.5) * 0.15 : (newFatigue > 0.7 && Math.random() > 0.8 ? (Math.random() - 0.5) * 0.1 : 0);

        // Nociceptive (Pain) Reflex (AU4, AU7, AU9, AU20)
        // Simulate unilateral nerve firing (Asymmetric)
        const isAsymmetric = Math.sin(time * 0.2) > 0; // Deterministic pseudo-random asymmetry based on time
        const leftBias = isAsymmetric ? 1.0 : 0.2;
        const rightBias = !isAsymmetric ? 1.0 : 0.2;

        const droopL = newFatigue > 0.3 ? (Math.random() * newFatigue * 0.5) : 0;
        const droopR = newFatigue > 0.5 ? (Math.random() * newFatigue * 0.8) : 0;
        const fatigueScalerL = 1.0 - droopL;
        const fatigueScalerR = 1.0 - droopR;

        const apply = (name: string, val: number, addNoise = 0) => {
            out.blendshapes[name] = Math.max(0, Math.min(1.0, val + addNoise));
        };

        const grimaceL = (rawGrimace * leftBias) * fatigueScalerL;
        const grimaceR = (rawGrimace * rightBias) * fatigueScalerR;

        // Apply high frequency, low amplitude noise modifier strictly to AU4, AU7, and AU20
        apply('browDownLeft', grimaceL, neuromuscularTwitch);      // AU4
        apply('browDownRight', grimaceR, neuromuscularTwitch);     // AU4
        apply('eyeSquintLeft', grimaceL, neuromuscularTwitch);     // AU7
        apply('eyeSquintRight', grimaceR, neuromuscularTwitch);    // AU7
        apply('mouthStretchLeft', grimaceL, neuromuscularTwitch);  // AU20
        apply('mouthStretchRight', grimaceR, neuromuscularTwitch); // AU20
        
        apply('noseSneerLeft', grimaceL, 0);                       // AU9
        apply('noseSneerRight', grimaceR, 0);                      // AU9

        // Arousal / Sensory Overload
        const parasympatheticDecay = 1.0 - sat;
        const jawDropPulse = Math.max(0, Math.sin(time * 2.0 * parasympatheticDecay));
        const arousalOverload = pleasure > 0.8;
        
        const baseJaw = Math.min(1.0, (pleasure * 0.5) + (trauma * 0.8));
        apply('jawOpen', arousalOverload ? (0.7 + jawDropPulse * 0.3) : baseJaw, 0);

        const eyeFlutter = arousalOverload ? (Math.random() > 0.8 ? 1.0 : 0.2) : 0;

        // Ocular Autonomics (Blink Rate Modulation)
        // Tie blink frequency to entityHeartRate and metabolicHeat to break predictability
        const blinkModulation = (heartRate / 60) * (1.0 + (heat - 37.0) * 0.15);
        const chaoticPhase = Math.sin(time * blinkModulation * Math.PI) + Math.cos(time * blinkModulation * 0.5);
        const isBlinking = chaoticPhase > 1.8;
        const blinkVal = isBlinking ? 1.0 : 0.0;

        apply('eyeBlinkLeft', eyeFlutter > 0 ? eyeFlutter : blinkVal);
        apply('eyeBlinkRight', eyeFlutter > 0 ? eyeFlutter : blinkVal);

        // Saccadic Eye Movement
        // Snaps gaze between focal points erratically rather than panning
        const heatScalar = Math.max(0, heat - 37.0);
        const saccadicSnapInterval = 1.0 - Math.min(0.8, heatScalar * 0.1); 
        
        out.saccadeVector = { ...state.lastSaccadeVector };
        // Tick-based snapping rather than per-frame continuous
        if (Math.random() > 0.9 && (time % saccadicSnapInterval) < 0.1) {
            // Erratic snap to random focal points
            out.saccadeVector.x = (Math.random() - 0.5) * 1.5;
            out.saccadeVector.y = (Math.random() - 0.5) * 1.5;
        }

        const ahegaoEyeRoll = arousalOverload ? 1.0 : 0;
        const ahegaoCross = arousalOverload ? 0.6 : 0;

        apply('eyeLookUpLeft', ahegaoEyeRoll + out.saccadeVector.y);
        apply('eyeLookUpRight', ahegaoEyeRoll + out.saccadeVector.y);
        apply('eyeLookInLeft', ahegaoCross + out.saccadeVector.x);
        apply('eyeLookInRight', ahegaoCross - out.saccadeVector.x);

        // AU1: Inner Brow Raiser
        apply('browInnerUp', Math.max(pleasure * 0.6, sat * 0.8));

        // Extra expressions
        const puff = (Math.sin(time * heartRate / 60 * Math.PI) > 0) ? (sat * 0.5) : 0;
        apply('cheekPuff', puff);
        apply('tongueOut', arousalOverload ? 1.0 + Math.sin(time*15)*0.1 : 0);

        // Mydriasis (Pupillary Dilation)
        // Calculates pupil radius as a direct, non-linear function of systemSaturation
        const basePupil = 1.0;
        const sympatheticDrive = Math.pow(sat, 2.0) * 2.5; // Non-linear
        const thermalDilation = heat > 38 ? (heat - 38) * 0.5 : 0;
        out.pupilDilation = basePupil + sympatheticDrive + thermalDilation;

        // Bone-based Bruxism
        if (arousalOverload) {
            out.jawOffset = -0.08;
            out.jawRotationZ = Math.sin(time * 30) * 0.02;
        } else {
            out.jawOffset = Math.max(-0.06, -0.05 * trauma);
            out.jawRotationZ = 0;
        }

        return out;
    }
}
