# tools/iso — disc images into the BANNON pipeline

Owner ask: *"we need a way to decrypt and use iso files the way we did mdickie games."*

The MDickie route is three stages: **get the container open** → **decode the asset formats inside** →
**GLB + manifest.json**. Stages two and three already exist (`decode_zf3d.mjs`, `unity_extract.py`,
`tools/mocap/ingest.cjs`). Stage one for disc images did not, and you cannot decode a file you cannot
get out of the image. This is stage one.

## Use it

```bash
python3 tools/iso/iso_extract.py disc.iso --list                    # what is on the disc
python3 tools/iso/iso_extract.py disc.iso -o iso_staging/           # extract everything
python3 tools/iso/iso_extract.py disc.iso -o iso_staging/ --assets-only
python3 tools/iso/iso_extract.py disc.iso -o iso_staging/ --match "*.arc,*model*"
python3 tools/iso/iso_extract.py disc.wbfs --key common.key -o iso_staging/   # Wii
python3 tools/iso/iso_extract.py disc.iso --manifest-only -o iso_staging/     # catalogue only
```

`--limit N` stops early for a quick look. `--max-size N` skips anything over N MB.

## Formats, and how each one is detected

Detection is by **magic bytes, never by file extension** — `.iso` is used for at least five unrelated
container layouts and lies constantly.

| Format | Detection | Notes |
|---|---|---|
| ISO9660 / Joliet / Rock Ridge | `CD001` at LBA 16 | PS1, PS2, PSP, PC. Read via `pycdlib`; prefers Rock Ridge then Joliet so filenames are real and not 8.3 with `;1` suffixes |
| UDF | `BEA01`/`NSR0x` at LBA 16-18 | DVD and hybrid discs |
| GameCube (GCM) | `0xC2339F3D` at `0x1C` | Plaintext FST, walked natively |
| **Wii** | `0x5D1C9EA3` at `0x18` | Partitioned **and AES-128-CBC encrypted** — see Keys |
| Xbox / 360 (XDVDFS) | `MICROSOFT*XBOX*MEDIA` at `0x10000` (+4 alternate offsets) | Binary-tree directory records |
| CSO / CISO | `CISO`/`ZISO` at 0 | Compressed PSP images, inflated per block on the fly |
| Raw 2352-byte MODE1/MODE2 | CD sync pattern at 0 | BIN rips. Unwrapped to logical 2048 sectors transparently, so every layer above is spared it |

## Keys

Wii partition data is AES-128-CBC. The title key is itself encrypted with the console common key, so
you need the common key to get the title key to get the data. **This tool contains no key, embeds no
key, and downloads no key**, and it is not going to: a repository should not ship a console master key.
You supply one:

```bash
--key /path/to/common-key.bin          # 16 raw bytes, or 32 hex chars
export BANNON_WII_KEY=/path/to/key     # same thing, and gitignored like every other secret here
```

Without a key a Wii image still reports its partitions, types and title IDs, so you can see what is on
the disc. That is correct behaviour, not a failure. A **wrong** key extracts nothing rather than writing
garbage that looks like files — verified in the test suite.

## What comes out

`<out>/manifest.json`, in the same shape the MDickie tools emit, plus the files themselves in their
original tree. Everything is classified — `model` / `anim` / `texture` / `audio` / `archive` / `video` /
`script` / `exe` / `other` — by extension **and** magic, with magic winning, because console games rename
everything and a `.bin` could be a mesh, an archive or an executable. The classification happens after
the bytes are read for exactly that reason.

## Then what

```
tools/mdickie_scraper/decode_zf3d.mjs     .zf3d  -> GLB
tools/mdickie_scraper/unity_extract.py    Unity bundles -> GLB
tools/mocap/ingest.cjs                    FBX / BVH clips -> the move library
tools/assets/optimize_gltf.cjs            shrink whatever comes out
```

Nested containers (`.arc`, `.pak`, `.cpk`, `.afs`, RARC, U8, Yaz0) are **identified but not unpacked**.
Each one is a different format and guessing produces silent corruption; name the game and the container
gets added properly.

## Verify it

```bash
python3 tools/iso/test_iso_extract.py
```

Builds a real image of every listed format — including a genuinely AES-encrypted Wii partition using a
throwaway key generated at runtime — and asserts every file round-trips **byte-for-byte**. It also
asserts the negatives: a wrong key writes nothing, a non-disc file says so instead of pretending, and
`--assets-only` correctly rejects `BOOT.BIN` on its `\x7fELF` magic despite `.bin` being on the archive
extension list.

## Legal posture

Use this on discs you own, for assets the project is licensed to use — the same footing as the MDickie
pipeline, which runs under MDickie's explicit permission to the owner. Extracted third-party assets are
reference and bases, morphed into proprietary BANNON assets, never shipped as someone else's IP.
Images, extracted contents and key files are all gitignored; nothing this tool touches is committed.
