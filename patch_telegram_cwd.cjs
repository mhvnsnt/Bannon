const fs = require('fs');
let code = fs.readFileSync('/tmp/bannon2/src/services/TelegramBotService.ts', 'utf8');

code = code.replace(/process\.cwd\(\)/g, "(__dirname.replace('/src/services', ''))");

fs.writeFileSync('/tmp/bannon2/src/services/TelegramBotService.ts', code);
