#!/usr/bin/env node
/**
 * Structural gate for the Unreal project wiring.
 *
 * WHY THIS EXISTS. `unreal/Source/BannonEngine` sat with 31 source files, no
 * Build.cs and no entry in Bannon.uproject's Modules array, so UnrealBuildTool
 * never saw it. Nothing failed — it was silently not built, and because that
 * module owns all four UPrimaryDataAsset classes, no .uasset could ever be
 * authored against them. A missing module is invisible; a missing module that
 * owns the content schema looks exactly like "we have no content yet".
 *
 * WHAT IT DOES NOT DO. It does not compile. A real build needs a licensed
 * ~100GB engine install, which no hosted runner has — that is what the M.
 * Engine Unreal remote worker (tools/unreal-worker) is for. This checks only
 * what is checkable without the engine, and says so rather than implying a
 * compile happened.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const UPROJECT = path.join(ROOT, 'unreal', 'Bannon.uproject');
const SOURCE = path.join(ROOT, 'unreal', 'Source');

const problems = [];
const notes = [];

function fail(msg) { problems.push(msg); }

if (!fs.existsSync(UPROJECT)) {
  fail(`no .uproject at ${path.relative(ROOT, UPROJECT)}`);
} else {
  let project;
  try {
    project = JSON.parse(fs.readFileSync(UPROJECT, 'utf8'));
  } catch (e) {
    fail(`Bannon.uproject is not valid JSON: ${e.message}`);
  }

  if (project) {
    notes.push(`EngineAssociation: ${project.EngineAssociation ?? '(unset)'}`);

    const declared = (project.Modules || []).map((m) => m.Name);
    if (declared.length === 0) fail('Bannon.uproject declares no Modules');

    // Every module directory carrying a Build.cs is something UBT could build.
    // If it is not declared, it silently is not built — the exact defect above.
    const onDisk = fs.existsSync(SOURCE)
      ? fs.readdirSync(SOURCE, { withFileTypes: true })
          .filter((d) => d.isDirectory())
          .map((d) => d.name)
          .filter((n) => fs.existsSync(path.join(SOURCE, n, `${n}.Build.cs`)))
      : [];

    for (const name of onDisk) {
      if (!declared.includes(name)) {
        fail(`module ${name} has a Build.cs but is NOT declared in Bannon.uproject — UBT will never build it`);
      }
    }

    // And the reverse: a declared module with no Build.cs fails the build outright.
    for (const name of declared) {
      const buildCs = path.join(SOURCE, name, `${name}.Build.cs`);
      if (!fs.existsSync(buildCs)) {
        fail(`module ${name} is declared in Bannon.uproject but has no ${name}/${name}.Build.cs`);
      }
    }

    // A module directory holding C++ but no Build.cs is dead source.
    if (fs.existsSync(SOURCE)) {
      for (const d of fs.readdirSync(SOURCE, { withFileTypes: true })) {
        if (!d.isDirectory()) continue;
        const dir = path.join(SOURCE, d.name);
        if (fs.existsSync(path.join(dir, `${d.name}.Build.cs`))) continue;
        const count = countSources(dir);
        if (count > 0) {
          fail(`unreal/Source/${d.name} holds ${count} C++ files but has no ${d.name}.Build.cs — it is not a module and is never compiled`);
        }
      }
    }

    for (const name of declared) {
      notes.push(`module ${name}: ${countSources(path.join(SOURCE, name))} C++ files`);
    }

    // A project with no target cannot be built at all.
    const targets = fs.existsSync(SOURCE)
      ? fs.readdirSync(SOURCE).filter((f) => f.endsWith('.Target.cs'))
      : [];
    if (targets.length === 0) fail('no .Target.cs under unreal/Source');
    else notes.push(`targets: ${targets.join(', ')}`);
  }
}

function countSources(dir) {
  if (!fs.existsSync(dir)) return 0;
  let n = 0;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) n += countSources(p);
    else if (/\.(cpp|h)$/.test(e.name)) n += 1;
  }
  return n;
}

for (const n of notes) console.log(`  ${n}`);
if (problems.length) {
  console.error('\nUNREAL MODULE WIRING: FAIL');
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}
console.log('\nUNREAL MODULE WIRING: OK');
console.log('NOTE: structure only. No compile happened — that needs a licensed');
console.log('engine via tools/unreal-worker. This gate cannot prove the C++ builds.');
