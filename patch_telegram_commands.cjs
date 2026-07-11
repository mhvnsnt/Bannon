const fs = require('fs');

let code = fs.readFileSync('/tmp/bannon2/src/services/TelegramBotService.ts', 'utf8');

// Fix includes('status') and includes('scrape') to strict equals or startsWith
code = code.replace(/if \(incomingText\.includes\('status'\)\)/g, "if (incomingText === 'status' || incomingText === '/status')");
code = code.replace(/} else if \(incomingText\.includes\('scrape'\)\)/g, "} else if (incomingText === 'scrape' || incomingText === '/scrape')");

// Fix the auto-lock to not eat the user's first prompt if they typed a command, OR just let them know.
// Actually, if we just remove the `return;` after the auto-lock, it will continue processing the message!
code = code.replace(/await this\.bot\.sendMessage\(senderChatId, \n\s*`🟢 \*Autonomous Authorization Locked!\*(.|\n)*?return;/m, (match) => {
    return match.replace('return;', '// return removed so the first prompt is also processed');
});

// Also, the /agent prefix shouldn't be strictly required, but since we have an `else` at the very end, any text that falls through will be pushed to the queue!
// Wait, the else block pushes to queue, but does it say "Instruction received"? Yes.

fs.writeFileSync('/tmp/bannon2/src/services/TelegramBotService.ts', code);
console.log("Patched Telegram commands to be strict.");
