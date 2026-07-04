import { VoidCompressionEngine } from './src/server/voidEngine';

// Build a mock 5000 line file with 10 functions
let mockFile = '';
for (let i = 1; i <= 10; i++) {
    if (i === 5) {
        mockFile += 'function updatePhysics() {\n';
        mockFile += '  // physics gravity loop content\n';
        mockFile += '  let gravity = -9.81;\n';
        for (let j = 0; j < 496; j++) {
             mockFile += `  // physics loop simulation line ${j}\n`;
        }
        mockFile += '}\n';
    } else {
        mockFile += `function dummyFunction${i}() {\n`;
        for (let j = 0; j < 498; j++) {
             mockFile += `  // dummy line ${j}\n`;
        }
        mockFile += '}\n';
    }
}

async function runValidation() {
    const engine = new VoidCompressionEngine(null);
    const result = await engine.compressForTask(mockFile, "Update the physics gravity loop", 16000);
    
    console.log('=== STATS ===');
    console.log(`Original Tokens: ${result.stats.originalTokens}`);
    console.log(`Compressed Tokens: ${result.stats.compressedTokens}`);
    console.log(`Token Savings: ${result.stats.savingsPercentage.toFixed(2)}%`);
    console.log('\n=== ACTIVE CHUNKS IDENTIFIED ===');
    console.log(result.active_chunk_ids);

    console.log('\n=== PRESERVED TARGET FUNCTION (updatePhysics) ===');
    const lines = result.content.split('\n');
    const startIndex = lines.findIndex(l => l.includes('function updatePhysics'));
    if (startIndex !== -1) {
        // Log function header and first 10 lines, followed by function end
        console.log(lines.slice(startIndex, startIndex + 15).join('\n'));
        console.log('...');
        // Find end of updatePhysics
        const endIndex = lines.findIndex((l, idx) => idx > startIndex && l.trim() === '}');
        if (endIndex !== -1) {
             console.log(lines.slice(endIndex - 3, endIndex + 1).join('\n'));
        }
    } else {
        console.log('ERROR: function updatePhysics not found in output!');
    }
}

runValidation();
