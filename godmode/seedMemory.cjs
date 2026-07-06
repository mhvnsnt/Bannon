const Database = require('better-sqlite3');
const db = new Database('memory_vault.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS memory_user_edits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

const initialMemories = [
  "Memory 1 — Identity\nArtist name M. Heaven$ent. Projects CRASH, Shed 5, Tears Of Beauty And Rejoice. YouTube @m2villainous. Numerological seeds 5, 14, 19. Maternal bloodline Royal Georgia Clay, paternal Whitacre European Steel.",
  "Memory 2 — Tech Stack\nLiving Nexus built on React/TypeScript, server.ts at 178KB, SQLite RAG vault, Firebase, OpenRouter wired to Qwen 2.5 Coder 32b, Socket.IO, isomorphic-git.",
  "Memory 3 — Roadmap State\nPhase 0 complete. engine_config.json hot-reloading every 1000ms. Phase 1 in progress — telemetry emitter diff delivered into loop(now) targeting ws://localhost:3001. MobileBodyProxy and VoiceProxy built. Phases 2-9 not started. physics_spec.json does not exist yet.",
  "Memory 4 — Bannon DNA\nAll core physics constants at their current values. Known instability flagged: RAGDOLL_PULL above 0.14 breaks joint integrity.",
  "Memory 5 — Communication fingerprint\nHow you talk, what your signals mean, what \\"keep working\\" triggers, what \\"and that's the whole truth\\" means, how to read short messages correctly."
];

const check = db.prepare('SELECT count(*) as count FROM memory_user_edits').get();
if (check.count === 0) {
  const insert = db.prepare('INSERT INTO memory_user_edits (content) VALUES (?)');
  const transaction = db.transaction((mems) => {
    for (const mem of mems) insert.run(mem);
  });
  transaction(initialMemories);
  console.log('Seeded initial memories.');
} else {
  console.log('Memory vault already initialized.');
}
