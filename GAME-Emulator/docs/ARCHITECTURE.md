# Architecture and boundaries

## Pipeline stages

1. **Select:** a person copies a local file into the inbox.
2. **Validate:** extension allowlist, regular file, size ceiling, valid provenance sidecar.
3. **Fingerprint:** SHA-256, byte size, timestamp, extension, and record ID.
4. **Review:** original remains unchanged; unsupported files are not processed.
5. **Inspect:** future adapters declare accepted formats, output schema, permissions, resource ceilings, and rights notes.
6. **Compose:** mod profiles reference content by hash and declare ordering/conflicts. Originals stay immutable.
7. **Run:** a compatible emulator core runs in a separate restricted process.

## Planned adapter contract

Adapters declare identifier/version/license, accepted signatures, read/write/execute permissions, output schema, CPU/memory/time ceilings, network requirements (denied by default), provenance requirements, and audit output.

No adapter may silently download missing game/firmware files, disable access controls, or execute imported packages during cataloging.

## Analysis tools

Ghidra and radare2 are optional, separately invoked analysis tools—not default intake steps. Use them only on material and for purposes you are authorized to analyze. Keep reports separate from the runtime library. This project does not automatically translate proprietary decompiler output into a substitute implementation.

AssetStudio is not a universal package extractor; support must be explicit per format/version. Playwright is for testing this application's UI. Browser automation must not defeat anti-bot protections or fetch protected binaries.

## Threat model

Treat filenames, sidecars, archives, and binaries as untrusted. Never shell-interpolate filenames. Avoid archive extraction in the intake process. Do not expose the inbox to the web server. Keep reports free of file contents and secrets. Add malware scanning and OS/container isolation before enabling any third-party analysis worker.