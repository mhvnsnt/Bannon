const { Tripo3DAlternative } = require('./Tripo3DAlternative');
const { RiggingPipeline } = require('./RiggingPipeline');

class CharacterGenerator {
    constructor() {
        this.tripo = new Tripo3DAlternative();
        this.rigger = new RiggingPipeline();
        
        this.excludeCharacters = ["Cipher", "Echo", "Static", "Hollow", "Onyx_Teammate_5"];
        this.bookCharacters = ["BookChar_A", "BookChar_B"];
        this.gameOnlyCharacters = ["Fighter_X", "Fighter_Y", "Boss_Z"];
    }
    
    runGenerationQueue() {
        console.log("[CharacterGenerator] Starting Tripo 3D Alternative Generation Queue...");
        
        for (const char of this.gameOnlyCharacters) {
            if (this.excludeCharacters.includes(char) || this.bookCharacters.includes(char)) {
                console.log(`[CharacterGenerator] Skipping ${char} (Excluded or Book Character)`);
                continue;
            }
            console.log(`[CharacterGenerator] Generating model for: ${char}`);
            let baseMesh = this.tripo.generateGLBMorphs({ character: char });
            let riggedMesh = this.rigger.autoAttachRig(baseMesh);
            
            let meshDataMock = { vertices: [ { y: 0.5, boneWeights: [{boneName: 'Pelvis', weight: 0.4}, {boneName: 'Leg_L', weight: 0.6}] } ] };
            this.rigger.applyAnatomicalWeightClamps(meshDataMock);
            console.log(`[CharacterGenerator] Completed generation for: ${char}`);
        }
        console.log("[CharacterGenerator] Queue Empty. All valid game-only characters processed.");
    }
}

if (require.main === module) {
    const gen = new CharacterGenerator();
    gen.runGenerationQueue();
}
module.exports = { CharacterGenerator };
