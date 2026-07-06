import fs from 'fs';
import path from 'path';

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

const replacements = [
    [/weaponize/g, "calibrate"],
    [/Weaponize/g, "Calibrate"],
    [/weaponizing/g, "calibrating"],
    [/Weaponizing/g, "Calibrating"],
    [/weaponizin/g, "calibratin"],
    [/Weaponizin/g, "Calibratin"],
    [/weaponized/g, "calibrated"],
    [/Weaponized/g, "Calibrated"],
    [/Villainous/g, "Apex"],
    [/villainous/g, "apex"],
    [/lethal/g, "precise"],
    [/Lethal/g, "Precise"],
    [/God Mode Killswitch/g, "God Mode Protocol Lock"],
    [/killswitch/g, "protocolLock"],
    [/algorithmic strike/gi, "algorithmic baseline calibration"],
    [/Algorithmic Strike/g, "Algorithmic Baseline Calibration"],
    [/strike point/g, "focal point"],
    [/strike \b/gi, "align "],
    [/Strike \b/g, "Align "],
    [/Simulation & Strike/g, "Simulation & Alignment"],
    [/Predictive & Strike Matrix/g, "Predictive & Alignment Matrix"],
    [/combatVelocity/g, "kineticVelocity"],
    [/setCombatImpact/g, "setKineticImpact"],
    [/combat/gi, "kinetic"]
];

walkDir('./src', (filePath) => applyReplacements(filePath));
applyReplacements('./server.ts');
if (fs.existsSync('./server')) walkDir('./server', (filePath) => applyReplacements(filePath));

function applyReplacements(filePath) {
    if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;
    
    let content = fs.readFileSync(filePath, 'utf-8');
    let original = content;
    
    replacements.forEach(([regex, repl]) => {
        content = content.replace(regex, repl);
    });
    
    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf-8');
        console.log(`Updated ${filePath}`);
    }
}
