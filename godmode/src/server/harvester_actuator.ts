import fs from 'fs';
import path from 'path';
import * as cheerio from 'cheerio';
import https from 'https';

export function realityCompilerScraper() {
    console.log("[NEXUS] Activating External Node Ingestion Vector...");
    
    const targetUrl = "https://en.wikipedia.org/wiki/Professional_wrestling_attacks";
    
    https.get(targetUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
        let html = '';
        res.on('data', (chunk) => {
            html += chunk;
        });
        
        res.on('end', () => {
            console.log("[NEXUS] Parsing raw text arrays into clinical physics metrics...");
            const $ = cheerio.load(html);
            const moveLibrary: any[] = [];
            
            const contentArea: any = $('.mw-parser-output').length ? $('.mw-parser-output') : $.root();
            
            contentArea.find('li, dt').each((_, item) => {
                const el = $(item);
                const bTag = el.find('b').first();
                let text = '';
                
                if (bTag.length > 0) {
                    text = bTag.text().trim();
                } else {
                    text = el.text().split('\n')[0].trim();
                }
                
                if (!text || text.length > 80) return;
                
                let moveName = text.replace(/\[.*?\]/g, '').toUpperCase();
                
                const ignoreWords = ["EDIT", "WIKIPEDIA", "CONTENTS", "BIBLIOGRAPHY", "SEE ALSO", "REFERENCES", "^", "JUMP TO"];
                if (ignoreWords.some(w => moveName.includes(w))) return;
                if (moveName.length < 4) return;
                
                let category = "STRIKE";
                let limb = "RIGHT CROSS";
                let trajectory = "STRAIGHT";
                let height = "MID";
                let power = Math.floor(Math.random() * (70 - 40 + 1)) + 40;
                let speed = Math.floor(Math.random() * (90 - 50 + 1)) + 50;
                let follow = "RESET STANCE";
                let staminaCost = Math.floor(Math.random() * (15 - 8 + 1)) + 8;
                
                const isKick = ["KICK", "DROPKICK", "STOMP", "BIG BOOT", "KNEE"].some(w => moveName.includes(w));
                const isThrow = ["SLAM", "SUPLEX", "BOMB", "DRIVER", "BUSTER", "DDT", "PILEDRIVER"].some(w => moveName.includes(w));
                const isStrike = ["CLOTHESLINE", "LARIAT", "CHOP", "ELBOW", "PUNCH", "UPPERCUT"].some(w => moveName.includes(w));
                
                if (isKick) {
                    category = "KICK";
                    limb = "RIGHT KICK";
                    trajectory = "STRAIGHT";
                    height = moveName.includes("HIGH") ? "HIGH" : "MID";
                    power = Math.floor(Math.random() * (85 - 50 + 1)) + 50;
                    speed = Math.floor(Math.random() * (95 - 60 + 1)) + 60;
                    follow = "RESET STANCE";
                    staminaCost = Math.floor(Math.random() * (18 - 10 + 1)) + 10;
                } else if (isThrow) {
                    category = "THROW";
                    limb = "HEADBUTT";
                    trajectory = "OVERHAND";
                    height = "GROUND";
                    power = Math.floor(Math.random() * (100 - 75 + 1)) + 75;
                    speed = Math.floor(Math.random() * (60 - 30 + 1)) + 30;
                    follow = Math.random() > 0.5 ? "PIN" : "TAUNT";
                    staminaCost = Math.floor(Math.random() * (25 - 18 + 1)) + 18;
                } else if (isStrike) {
                    category = "STRIKE";
                    limb = moveName.includes("ELBOW") ? "ELBOW" : "RIGHT CROSS";
                    trajectory = moveName.includes("UPPERCUT") ? "UPPERCUT" : "HOOK";
                    height = "HIGH";
                    power = Math.floor(Math.random() * (80 - 45 + 1)) + 45;
                    speed = Math.floor(Math.random() * (85 - 55 + 1)) + 55;
                    follow = Math.random() > 0.8 ? "GRAPPLE" : "RESET STANCE";
                    staminaCost = Math.floor(Math.random() * (14 - 8 + 1)) + 8;
                }
                
                if (power > 90) {
                    category = "FINISHER";
                }
                
                const moveObject = {
                    name: moveName,
                    cat: category,
                    limb,
                    traj: trajectory,
                    height,
                    power,
                    speed,
                    style: "WRESTLING",
                    follow,
                    staminaCost
                };
                
                if (!moveLibrary.find(m => m.name === moveName)) {
                    moveLibrary.push(moveObject);
                }
            });
            
            const outputDir = path.resolve("./public/moves");
            const outputPath = path.join(outputDir, "infinite_moves.json");
            
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }
            
            fs.writeFileSync(outputPath, JSON.stringify(moveLibrary, null, 2), "utf8");
            console.log(`[SUCCESS] Reality field collapsed. Generated ${moveLibrary.length} physical move profiles at ${outputPath}`);
        });
    }).on('error', (e) => {
        console.error(`[ERROR] Node acquisition failed: ${e.message}`);
    });
}

if (require.main === module) {
    realityCompilerScraper();
}
