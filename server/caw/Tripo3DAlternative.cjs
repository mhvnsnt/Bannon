class Tripo3DAlternative {
    constructor() { this.dnaPayload = null; }
    loadDNAPayload(dna) { this.dnaPayload = dna; console.log("[CAW Pipeline] Loaded DNA Payload:", dna); }
    generateGLBMorphs(opts) { console.log("[CAW Pipeline] Generating Base GLB Morphs using DNA modifiers for " + (opts ? opts.character : 'base') + "..."); return "/models/caw_generated_base.glb"; }
}
module.exports = { Tripo3DAlternative };
