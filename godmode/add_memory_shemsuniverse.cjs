const Database = require('better-sqlite3');
const db = new Database('memory_vault.db');

const newMemory = `Memory 7 — Wealth Magnetism via Astrology & Numerology
Title: "How To Become a Wealth Magnet With Astrology & Numerology" by Shemsuniverse.
Core Principles:
1. Energetic Alignment: Astrology and numerology act as blueprints for understanding your natural energetic frequencies and life path.
2. Wealth Magnetism: By aligning your actions, career choices, and mindset with your specific astrological placements and numerological life path numbers, you remove friction and attract abundance.
3. Synchronizing with Universal Laws: Just as mentalism and vibration shape reality, these esoteric systems provide a personalized map to tune your vibration for wealth and prosperity.
4. Active Participation: Wealth is not just "destined"; it requires consciously leveraging the strengths and mitigating the challenges shown in your chart and numbers to become a magnet for resources.`;

const insert = db.prepare('INSERT INTO memory_user_edits (content) VALUES (?)');
insert.run(newMemory);
console.log('Added Memory 7 to memory_vault.db');
