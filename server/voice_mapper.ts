import fs from 'fs';
import path from 'path';

export interface VoiceParameters {
    tone: string;
    pitch: number;
    cadence: number;
    distortion: string | null;
}

export class VoiceMapper {
    private referenceDir: string;

    constructor() {
        this.referenceDir = path.join(process.cwd(), 'assets', 'voice_references');
    }

    public getReferenceFile(charId: string): string {
        const file = path.join(this.referenceDir, `${charId}.wav`);
        if (fs.existsSync(file)) return file;
        return path.join(this.referenceDir, 'generic.wav');
    }

    public getBaseParameters(charId: string): VoiceParameters {
        const params: VoiceParameters = { tone: 'neutral', pitch: 1.0, cadence: 1.0, distortion: null };
        
        if (charId === 'hollow') {
            params.distortion = 'robotic_soulless_modulation';
            params.pitch = 0.8;
        } else if (charId === 'cipher') {
            params.tone = 'erratic_whisper_scream';
            params.cadence = 1.2;
        }
        
        return params;
    }

    public triggerGodWithinRealityCheck(charId: string): VoiceParameters {
        const params = this.getBaseParameters(charId);
        
        if (charId === 'queen_tyneshia') {
            params.distortion = 'lower_slower_register_deliberate';
            params.pitch = 0.7;
            params.cadence = 0.8;
        } else if (charId === 'bannon' || charId === 'maime') {
            params.distortion = 'out_of_control_manic_distortion';
            params.pitch = 1.3;
            params.cadence = 1.5;
        } else {
            params.distortion = 'intense_revelatory_echo_distortion';
        }
        
        return params;
    }
}
