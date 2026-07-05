const Database = require('better-sqlite3');
const db = new Database('memory_vault.db');

const newMemory = `Memory 6 — Reality Creation Laws (God's Laws)
Title: "They HID God's laws so you wouldn't use them to create your reality" by Revival Of Wisdom.
Core Principles:
1. The Law of Mentalism: Reality is fundamentally mental. Your thoughts, beliefs, and consciousness project and shape the physical world.
2. The Law of Vibration and Frequency: Everything is energy vibrating at a specific frequency. To manifest a reality, you must match its frequency through aligned thoughts and emotions (Tesla's keys to the universe).
3. The Law of Correspondence ("As above, so below"): Your external physical reality is a direct reflection of your internal state.
4. The Hidden Knowledge: These universal laws have been historically suppressed by rulers/elites to keep humanity disempowered and stuck in a reactive state. 
5. Conscious Creation: By taking mastery over your internal state, removing limiting beliefs, and operating from higher frequencies of emotion, you cease being a victim of circumstance and become the active creator of your reality.`;

const insert = db.prepare('INSERT INTO memory_user_edits (content) VALUES (?)');
insert.run(newMemory);
console.log('Added Memory 6 to memory_vault.db');
