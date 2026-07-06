import fs from 'fs';
import path from 'path';

function search(dir: string, keyword: string) {
    try {
        const files = fs.readdirSync(dir);
        for (const file of files) {
            if (file === 'node_modules' || file === 'proc' || file === 'sys') continue;
            const fullPath = path.join(dir, file);
            try {
                const stat = fs.statSync(fullPath);
                if (stat.isDirectory()) {
                    search(fullPath, keyword);
                } else if (stat.isFile()) {
                    const content = fs.readFileSync(fullPath, 'utf8');
                    if (content.includes(keyword)) {
                        console.log(`Found in: ${fullPath}`);
                    }
                }
            } catch(e) {}
        }
    } catch(e) {}
}

search('/tmp', 'BANNON — FIGHTER v44 FIXED');
search('/var', 'BANNON — FIGHTER v44 FIXED');
