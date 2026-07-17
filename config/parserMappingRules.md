# Bannon Engine Asset Parser Matrix

## Ingestion Filters & Target Scope

| Source File Category | Legacy Paradigms | Target Destination Architecture |
| :--- | :--- | :--- |
| `AI.bb`, `Gameplay.bb` | State machines, behavior flags, priority calculations | Native C++ Brawler State Machines (`src/native/ai/`) |
| `Attacks.bb`, `Moves.bb`, `Anims.bb` | Frame data, hitboxes, recoil times, force data | C++ Rigid Body Physics & Poise Engine Parameters |
| `Career.bb`, `Negotiations.bb`, `News.bb` | Contract logic, weekly finance loops, text strings | Node.js Meta Engine Backend (`src/meta/`) |
| `Promos.bb`, `Texts.bb` | Branching dialogue text pools, dialogue options | Firestore Static Data Repositories & Dialog Engines |

## Code Conversion Guardrails
1. **Flatten Hierarchies:** Convert procedural global multi-file arrays into clean, isolated database schemas or localized runtime vectors.
2. **Hard-Code Constants:** Strip out fluid frame-rate logic and lock calculations directly to absolute performance constants (e.g., `MAX_BODY_VEL = 3.8 m/s`).
3. **Poise Isolation:** Ensure that any defensive or knock-down functions extracted from old files are mapped exclusively to the separate Poise Engine, leaving the `MAX_HP` math uncoupled.
