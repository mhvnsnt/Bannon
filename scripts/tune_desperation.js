const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, '../config/ai_desperation.json');

function initializeConfig() {
    const dir = path.dirname(CONFIG_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    
    const defaultConfig = {
        POISE_THRESHOLD: 20.0,
        FLEE_PROBABILITY: 0.75,
        ROPE_LEVERAGE_PROBABILITY: 0.60
    };
    
    if (!fs.existsSync(CONFIG_PATH)) {
        fs.writeFileSync(CONFIG_PATH, JSON.stringify(defaultConfig, null, 4));
        console.log("[CONFIG] Initialized default AI desperation thresholds.");
    }
}

function tuneDesperation(poiseThreshold, fleeProb, ropeProb) {
    initializeConfig();
    let config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    
    if (poiseThreshold) config.POISE_THRESHOLD = parseFloat(poiseThreshold);
    if (fleeProb) config.FLEE_PROBABILITY = parseFloat(fleeProb);
    if (ropeProb) config.ROPE_LEVERAGE_PROBABILITY = parseFloat(ropeProb);
    
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 4));
    console.log("[CONFIG] Updated AI desperation thresholds:");
    console.log(JSON.stringify(config, null, 4));
    console.log("[CONFIG] Values will be hot-reloaded into Domain Epsilon behavior trees.");
}

const args = process.argv.slice(2);
if (args.length > 0) {
    tuneDesperation(args[0], args[1], args[2]);
} else {
    console.log("Usage: node tune_desperation.js <POISE_THRESHOLD> <FLEE_PROBABILITY> <ROPE_LEVERAGE_PROBABILITY>");
    initializeConfig();
}
