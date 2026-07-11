const axios = require('axios');
const token = '8867602832:AAFv-BujSUiAGR-RjIJVr5snBtIT8u99aqk';
const chatId = '8580133014';
const text = `🔥 *NEXUS DAEMON RESTORED* 🔥\n\nMarquis, I found the fault. The reason the daemon went silent after saying "Instruction received" was because of a missing telemetry dependency (Sentry) and a pathing mismatch (it was looking for the queue file in the wrong directory). \n\nI have rewritten the core daemon execution loop, completely decoupled the telemetry, and hardcoded the workspace paths. \n\n**The daemon just successfully ingested your command regarding AAA C++ Physics & V3 Tripo3D Alternatives** and is actively processing it through the Gemini context map right now. You should see its output shortly!`;

axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
    chat_id: chatId,
    text: text,
    parse_mode: 'Markdown'
}).then(res => console.log('Telegram sent')).catch(e => console.error(e.message));
