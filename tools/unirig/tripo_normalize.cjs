const fs = require('fs');

// BANNON ENGINE — UNIRIG PHASE 1: TRIPO MESH NORMALIZATION DIRECTIVE
// Calculates the exact C++ transformation matrix payload from raw Tripo 3D Bounding Boxes.

function processTripoBounds(inputFile, outputFile) {
    if (!fs.existsSync(inputFile)) {
        console.error(`[UNIRIG ERROR] Missing Tripo input file: ${inputFile}`);
        return;
    }

    try {
        const rawData = JSON.parse(fs.readFileSync(inputFile, 'utf-8'));
        
        // Extract absolute maximum Y-axis vertex coordinate (Tripo_Y_Max)
        const tripoYMax = rawData.boundingBox ? rawData.boundingBox.yMax : (rawData.tripo_y_max || 0);
        
        if (!tripoYMax || tripoYMax <= 0) {
             console.error("[UNIRIG ERROR] Invalid Tripo_Y_Max. Cannot calculate scaling.");
             return;
        }

        // Calculate the baseline scale multiplier: Scale_M = 1.88 / Tripo_Y_Max
        const TARGET_MDQ_HEIGHT = 1.88;
        const scaleM = TARGET_MDQ_HEIGHT / tripoYMax;

        // Calculate the exact floor-anchor offset: Y_Offset = (Tripo_Y_Max * Scale_M) / 2
        // Wait, the prompt says: Y_Offset = (Tripo_Y_Max * Scale_M) / 2
        const yOffset = (tripoYMax * scaleM) / 2.0;

        // MDQ collision presence multiplier (1.25x) exclusively to X and Z axes
        const COLLISION_XZ_MULTIPLIER = 1.25;

        // Generate the standardized bounding box transformation matrix payload
        // This math is destined for the C++ native physical bounds handler.
        const matrixPayload = {
            _note: "ROUTED DIRECTLY TO C++ NATIVE PHYSICS BOUNDS HANDLER. NO THREE.JS CONTAMINATION.",
            source_mesh: rawData.mesh_name || "UNKNOWN_TRIPO_MESH",
            tripo_raw: {
                y_max: tripoYMax
            },
            normalization_matrix: {
                uniform_scale: scaleM,
                translation: {
                    x: 0.0,
                    y: yOffset,
                    z: 0.0
                },
                collision_hull_multipliers: {
                    x: COLLISION_XZ_MULTIPLIER,
                    y: 1.0,
                    z: COLLISION_XZ_MULTIPLIER
                }
            }
        };

        fs.writeFileSync(outputFile, JSON.stringify(matrixPayload, null, 2));
        console.log(`[UNIRIG SUCCESS] Normalized Matrix Payload written to ${outputFile}`);
        console.log(`- Uniform Scale (1.88m target): ${scaleM.toFixed(4)}`);
        console.log(`- Floor Y-Translation Offset: +${yOffset.toFixed(4)}`);

    } catch(e) {
        console.error("[UNIRIG FATAL] Failed to parse Tripo mesh JSON:", e.message);
    }
}

// If run directly with args: node tripo_normalize.cjs <input.json> <output.json>
if (require.main === module) {
    const args = process.argv.slice(2);
    if (args.length < 2) {
        console.log("Usage: node tripo_normalize.cjs <raw_tripo.json> <matrix_out.json>");
        
        // Generate a sample for the operator
        const sampleIn = 'sample_tripo.json';
        const sampleOut = 'sample_matrix.json';
        fs.writeFileSync(sampleIn, JSON.stringify({
            mesh_name: "TRIPO_BASE_MALE_01",
            boundingBox: { yMax: 5.42 }
        }, null, 2));
        console.log(`\nNo arguments provided. Generating sample run with Tripo_Y_Max = 5.42...`);
        processTripoBounds(sampleIn, sampleOut);
    } else {
        processTripoBounds(args[0], args[1]);
    }
}
