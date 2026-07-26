#!/usr/bin/env python3
"""test_iso_extract.py — build a real image of EVERY format iso_extract.py claims to read, then prove
it reads them. Round-trip, byte-for-byte.

    python3 tools/iso/test_iso_extract.py

Why synthetic images rather than a real disc: the claim being tested is "this correctly parses these
container formats", and a hand-built image with known contents tests exactly that with no legal
question and no 4 GB download. The Wii case is the one that matters most — it builds a genuinely
AES-128-CBC-encrypted partition with a throwaway key and checks the file comes back out intact, which
means the decryption path is real and not a stub. The throwaway key is generated here at runtime and
is not a console key.
"""
import io
import json
import os
import struct
import subprocess
import sys
import tempfile
import zlib

HERE = os.path.dirname(os.path.abspath(__file__))
TOOL = os.path.join(HERE, 'iso_extract.py')
SECTOR = 2048

fails = []
def chk(ok, what, detail=''):
    print('  %s %s%s' % ('PASS' if ok else 'FAIL', what, ('  ' + detail) if detail else ''))
    if not ok:
        fails.append(what)


PAYLOAD = {
    'DATA/CHARS/WRESTLER.MDL': b'MDL\x00' + b'W' * 900,
    'DATA/CHARS/RING.MDL':     b'MDL\x00' + b'R' * 1500,
    'DATA/ANIM/SUPLEX.ANM':    b'ANM\x00' + b'S' * 700,
    'DATA/TEX/CANVAS.DDS':     b'DDS ' + b'T' * 2100,
    'SOUND/CROWD.WAV':         b'RIFF' + b'C' * 4000,
    'SYSTEM/BOOT.BIN':         b'\x7fELF' + b'B' * 300,
}


def run(args):
    env = dict(os.environ)
    env.pop('BANNON_WII_KEY', None)
    p = subprocess.run([sys.executable, TOOL] + args, capture_output=True, text=True, env=env)
    return p.returncode, p.stdout + p.stderr


def verify_extraction(out, expect, label, allow_subset=False):
    """Every expected file must be on disk with byte-identical contents."""
    man_p = os.path.join(out, 'manifest.json')
    if not os.path.exists(man_p):
        chk(False, label + ': manifest written')
        return
    man = json.load(open(man_p))
    chk(True, label + ': manifest written', '%d entries' % len(man['files']))
    bad = []
    missing = []
    for path, data in expect.items():
        # the extractor may prefix a partition dir; find the file by suffix
        hit = None
        for root, _, files in os.walk(out):
            for fn in files:
                fp = os.path.join(root, fn)
                rel = os.path.relpath(fp, out).replace('\\', '/')
                if rel.upper().endswith(path.upper()) or rel.upper().endswith(path.upper().replace('/', '_')):
                    hit = fp
                    break
            if hit:
                break
        if not hit:
            missing.append(path)
            continue
        got = open(hit, 'rb').read()
        if got != data:
            bad.append('%s (%d vs %d bytes)' % (path, len(got), len(data)))
    chk(not missing, label + ': all files present', 'missing ' + ', '.join(missing) if missing else '')
    chk(not bad, label + ': contents byte-identical', '; '.join(bad) if bad else '%d files' % len(expect))
    return man


# ── ISO9660 (PS1/PS2/PC/PSP) ──────────────────────────────────────────────────────────────────────
def build_iso9660(path):
    import pycdlib
    iso = pycdlib.PyCdlib()
    iso.new(interchange_level=1, joliet=3, rock_ridge='1.09')
    dirs = set()
    for p in PAYLOAD:
        parts = p.split('/')
        for i in range(1, len(parts)):
            dirs.add('/'.join(parts[:i]))
    for d in sorted(dirs):
        iso.add_directory('/' + d.upper(), rr_name=d.split('/')[-1], joliet_path='/' + d)
    for p, data in PAYLOAD.items():
        name = p.split('/')[-1]
        iso_path = '/' + p.upper() + ';1'
        iso.add_fp(io.BytesIO(data), len(data), iso_path,
                   rr_name=name, joliet_path='/' + p)
    iso.write(path)
    iso.close()


# ── GameCube ──────────────────────────────────────────────────────────────────────────────────────
def build_gamecube(path, wrap_raw=False):
    """Header + a real FST + the file data, laid out the way a GCM is."""
    names = b''
    name_off = {}
    for p in PAYLOAD:
        for seg in p.split('/'):
            if seg not in name_off:
                name_off[seg] = len(names)
                names += seg.encode() + b'\x00'

    # build the directory tree
    tree = {}
    for p in PAYLOAD:
        node = tree
        parts = p.split('/')
        for d in parts[:-1]:
            node = node.setdefault(d, {})
        node[parts[-1]] = None

    entries = []           # (is_dir, name_off, a, b)
    file_slots = []        # index into entries -> payload path

    def count(node):
        n = 1
        for k, v in node.items():
            n += count(v) if isinstance(v, dict) else 1
        return n

    def emit(node, prefix, parent_idx):
        for k in sorted(node.keys()):
            v = node[k]
            idx = len(entries)
            if isinstance(v, dict):
                entries.append(['dir', name_off[k], parent_idx, 0])
                emit(v, prefix + k + '/', idx)
                entries[idx][3] = len(entries)      # dir end = next index after subtree
            else:
                entries.append(['file', name_off[k], 0, 0])
                file_slots.append((idx, prefix + k))

    entries.append(['dir', 0, 0, 0])                 # root
    emit(tree, '', 0)
    entries[0][3] = len(entries)

    n = len(entries)
    fst_size = n * 12 + len(names)
    fst_off = 0x2440
    data_off = (fst_off + fst_size + SECTOR - 1) // SECTOR * SECTOR

    # place the payloads
    cursor = data_off
    placed = {}
    for idx, p in file_slots:
        data = PAYLOAD[p]
        entries[idx][2] = cursor
        entries[idx][3] = len(data)
        placed[cursor] = data
        cursor += (len(data) + 31) // 32 * 32

    fst = bytearray()
    for kind, noff, a, b in entries:
        flag = 1 if kind == 'dir' else 0
        fst += struct.pack('>III', (flag << 24) | (noff & 0xFFFFFF), a, b)
    fst[8:12] = struct.pack('>I', n)                 # entry count lives in root's `b`
    fst += names

    total = cursor
    img = bytearray(total)
    img[0x1C:0x20] = struct.pack('>I', 0xC2339F3D)
    img[0:6] = b'GBNN01'
    img[0x20:0x40] = b'BANNON TEST DISC'.ljust(0x20, b'\x00')
    img[0x420:0x424] = struct.pack('>I', 0)          # no main.dol in this fixture
    img[0x424:0x428] = struct.pack('>I', fst_off)
    img[0x428:0x42C] = struct.pack('>I', fst_size)
    img[fst_off:fst_off + len(fst)] = fst
    for off, data in placed.items():
        img[off:off + len(data)] = data

    if wrap_raw:
        img = wrap_2352(bytes(img))
    open(path, 'wb').write(bytes(img))
    return fst_off, fst_size


def wrap_2352(flat):
    """Re-wrap a flat 2048-sector image as MODE1 2352-byte sectors, the way a BIN rip is."""
    out = bytearray()
    sync = b'\x00\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\x00'
    nsec = (len(flat) + SECTOR - 1) // SECTOR
    for i in range(nsec):
        payload = flat[i * SECTOR:(i + 1) * SECTOR].ljust(SECTOR, b'\x00')
        out += sync
        out += bytes([0, 0, i & 0xFF, 0x01])         # header: min sec frame mode(1)
        out += payload
        out += b'\x00' * (RAW := 288)                # EDC/ECC area, zeroed — we never read it
    return bytes(out)


# ── CSO (PSP) ─────────────────────────────────────────────────────────────────────────────────────
def build_cso(src_flat, path, block=SECTOR):
    data = open(src_flat, 'rb').read()
    nblocks = (len(data) + block - 1) // block
    header = struct.pack('<4sIQIBBH', b'CISO', 0x18, len(data), block, 1, 0, 0)
    index = []
    body = bytearray()
    base = 0x18 + 4 * (nblocks + 1)
    for i in range(nblocks):
        raw = data[i * block:(i + 1) * block].ljust(block, b'\x00')
        comp = zlib.compress(raw, 6)[2:-4]          # raw deflate, as CSO stores it
        if len(comp) >= block:
            index.append((base + len(body)) | 0x80000000)
            body += raw
        else:
            index.append(base + len(body))
            body += comp
    index.append(base + len(body))
    with open(path, 'wb') as fh:
        fh.write(header)
        fh.write(struct.pack('<%dI' % len(index), *[i & 0xFFFFFFFF for i in index]))
        fh.write(bytes(body))


# ── Xbox XDVDFS ───────────────────────────────────────────────────────────────────────────────────
def build_xiso(path):
    """A minimal but real XDVDFS: volume descriptor at 0x10000, then one directory block per level."""
    base = 0x10000
    part_start = 0                                   # sector numbers relative to file start

    tree = {}
    for p in PAYLOAD:
        node = tree
        parts = p.split('/')
        for d in parts[:-1]:
            node = node.setdefault(d, {})
        node[parts[-1]] = None

    blocks = []          # list of (sector, bytes)
    payload_at = {}
    # lay out: dir blocks from sector 40, then file data
    next_sector = [40]

    def alloc(nbytes):
        s = next_sector[0]
        next_sector[0] += (nbytes + SECTOR - 1) // SECTOR
        return s

    def build_dir(node, prefix):
        """Emit one directory block. Records are chained left-to-right, offsets in 4-byte units."""
        recs = []
        for k in sorted(node.keys()):
            v = node[k]
            if isinstance(v, dict):
                recs.append((k, None, v))
            else:
                recs.append((k, PAYLOAD[prefix + k], None))
        # reserve this block first so children get later sectors
        blk = bytearray()
        entries = []
        for name, data, sub in recs:
            entries.append({'name': name, 'data': data, 'sub': sub})
        # place children
        for e in entries:
            if e['sub'] is not None:
                e['sector'], e['size'] = build_dir(e['sub'], prefix + e['name'] + '/')
            else:
                s = alloc(len(e['data']))
                payload_at[s] = e['data']
                e['sector'] = s
                e['size'] = len(e['data'])
        # now serialise, right-chained
        offsets = []
        for i, e in enumerate(entries):
            offsets.append(len(blk))
            nlen = len(e['name'])
            attr = 0x10 if e['sub'] is not None else 0x20
            rec = struct.pack('<HHIIBB', 0, 0, e['sector'], e['size'], attr, nlen) + e['name'].encode()
            pad = (-len(rec)) % 4
            blk += rec + b'\x00' * pad
        # fix up the right-links now that every offset is known
        for i, off in enumerate(offsets):
            nxt = offsets[i + 1] // 4 if i + 1 < len(offsets) else 0
            blk[off + 2:off + 4] = struct.pack('<H', nxt)
        s = alloc(len(blk))
        blocks.append((s, bytes(blk)))
        return s, len(blk)

    root_sector, root_size = build_dir(tree, '')

    total = max(next_sector[0] * SECTOR, base + SECTOR)
    img = bytearray(total)
    img[base:base + 20] = b'MICROSOFT*XBOX*MEDIA'
    img[base + 0x14:base + 0x1C] = struct.pack('<II', root_sector, root_size)
    for s, b in blocks:
        img[s * SECTOR:s * SECTOR + len(b)] = b
    for s, d in payload_at.items():
        img[s * SECTOR:s * SECTOR + len(d)] = d
    open(path, 'wb').write(bytes(img))


# ── Wii: a genuinely encrypted partition ──────────────────────────────────────────────────────────
def build_wii(path, common_key):
    """Header + partition table + a ticket whose title key is encrypted with `common_key`, and a data
    area encrypted exactly the way a Wii disc encrypts it: 0x8000 clusters of 0x400 hash + 0x7C00
    AES-128-CBC payload, IV from bytes 0x3D0..0x3E0 of the cluster's own hash block."""
    from Crypto.Cipher import AES
    import hashlib

    title_id = b'BNNTEST\x00'
    title_key = hashlib.sha256(b'bannon-test-title-key').digest()[:16]
    enc_title_key = AES.new(common_key, AES.MODE_CBC, title_id + b'\x00' * 8).encrypt(title_key)

    # --- the partition's PLAINTEXT contents: a GC-style header + FST + data ---
    tmp = tempfile.mktemp(suffix='.gcm')
    build_gamecube(tmp)
    plain = bytearray(open(tmp, 'rb').read())
    os.unlink(tmp)
    # Wii stores FST offset/size and file offsets in 4-byte units, unlike GameCube's raw bytes.
    fst_off = struct.unpack('>I', plain[0x424:0x428])[0]
    fst_size = struct.unpack('>I', plain[0x428:0x42C])[0]
    plain[0x424:0x428] = struct.pack('>I', fst_off // 4)
    plain[0x428:0x42C] = struct.pack('>I', fst_size // 4)
    n = struct.unpack('>I', plain[fst_off + 8:fst_off + 12])[0]
    for i in range(n):
        rec = fst_off + i * 12
        flag_nameoff = struct.unpack('>I', plain[rec:rec + 4])[0]
        if (flag_nameoff >> 24) & 1:
            continue                                  # directory: a/b are indices, not offsets
        a = struct.unpack('>I', plain[rec + 4:rec + 8])[0]
        plain[rec + 4:rec + 8] = struct.pack('>I', a // 4)
    plain[0x18:0x1C] = struct.pack('>I', 0x5D1C9EA3)

    # --- encrypt into clusters ---
    PAY, HASH, BLK = 0x7C00, 0x400, 0x8000
    nclusters = (len(plain) + PAY - 1) // PAY
    enc = bytearray()
    for i in range(nclusters):
        chunk = bytes(plain[i * PAY:(i + 1) * PAY]).ljust(PAY, b'\x00')
        hashblock = bytearray(HASH)
        iv = hashlib.sha1(b'iv%d' % i).digest()[:16]
        hashblock[0x3D0:0x3E0] = iv
        # the hash block itself is encrypted with a zero IV on a real disc; the reader only needs the
        # IV bytes in plaintext form at 0x3D0, which is how the format works, so store it plainly.
        enc += bytes(hashblock)
        enc += AES.new(title_key, AES.MODE_CBC, iv).encrypt(chunk)

    # --- ticket + partition header ---
    part_off = 0x50000
    tik = bytearray(0x2A4)
    tik[0x1BF:0x1CF] = enc_title_key
    tik[0x1DC:0x1E4] = title_id
    data_off_rel = 0x20000                            # where the encrypted data starts, from part_off
    phdr = struct.pack('>IIIIIII', 0, 0x800, 0, 0x900, 0x1000, data_off_rel // 4, len(enc) // 4)

    total = part_off + data_off_rel + len(enc)
    img = bytearray(total)
    img[0x18:0x1C] = struct.pack('>I', 0x5D1C9EA3)
    img[0:6] = b'RBNN01'
    # partition table: one group, one partition
    img[0x40000:0x40008] = struct.pack('>II', 1, 0x40020 // 4)
    img[0x40020:0x40028] = struct.pack('>II', part_off // 4, 0)
    img[part_off:part_off + 0x2A4] = bytes(tik)
    img[part_off + 0x2A4:part_off + 0x2A4 + 28] = phdr
    img[part_off + data_off_rel:part_off + data_off_rel + len(enc)] = enc
    open(path, 'wb').write(bytes(img))


# ── the run ───────────────────────────────────────────────────────────────────────────────────────
def main():
    tmp = tempfile.mkdtemp(prefix='isotest_')
    print('BANNON ISO EXTRACT — format round-trip')
    print('=' * 70)

    # 1. ISO9660
    print('\nISO9660 / Joliet / Rock Ridge  (PS1, PS2, PSP, PC):')
    p = os.path.join(tmp, 'disc.iso')
    try:
        build_iso9660(p)
        rc, out = run([p, '--list'])
        chk('iso9660' in out, 'detected as iso9660',
            next((l for l in out.splitlines() if l.startswith('format')), ''))
        o = os.path.join(tmp, 'out_iso')
        rc, out = run([p, '-o', o])
        verify_extraction(o, PAYLOAD, 'iso9660')
        chk('model' in out, 'classified .MDL as model')
        chk('texture' in out, 'classified .DDS as texture')
    except Exception as e:
        chk(False, 'iso9660 fixture', str(e)[:120])

    # 2. GameCube
    print('\nGameCube (GCM):')
    p = os.path.join(tmp, 'disc.gcm')
    try:
        build_gamecube(p)
        rc, out = run([p, '--list'])
        chk('gamecube' in out, 'detected as gamecube')
        o = os.path.join(tmp, 'out_gc')
        rc, out = run([p, '-o', o])
        verify_extraction(o, PAYLOAD, 'gamecube')
    except Exception as e:
        chk(False, 'gamecube fixture', str(e)[:120])

    # 3. raw 2352 wrapper over the same GameCube image
    print('\nRaw 2352-byte MODE1 sectors (BIN rip):')
    p = os.path.join(tmp, 'disc_raw.bin')
    try:
        build_gamecube(p, wrap_raw=True)
        rc, out = run([p, '--list'])
        chk('raw2352' in out, 'detected the 2352-byte sector wrapper')
        chk('gamecube' in out, 'read the GameCube header THROUGH the wrapper')
        o = os.path.join(tmp, 'out_raw')
        rc, out = run([p, '-o', o])
        verify_extraction(o, PAYLOAD, 'raw2352')
    except Exception as e:
        chk(False, 'raw2352 fixture', str(e)[:120])

    # 4. CSO over the same image
    print('\nCSO / CISO (compressed PSP image):')
    flat = os.path.join(tmp, 'disc.gcm')
    p = os.path.join(tmp, 'disc.cso')
    try:
        build_cso(flat, p)
        rc, out = run([p, '--list'])
        chk('cso' in out, 'detected as CSO')
        chk('gamecube' in out, 'inflated blocks to read the header through the compression')
        o = os.path.join(tmp, 'out_cso')
        rc, out = run([p, '-o', o])
        verify_extraction(o, PAYLOAD, 'cso')
        chk(os.path.getsize(p) < os.path.getsize(flat), 'the CSO is actually smaller than the flat image',
            '%d vs %d' % (os.path.getsize(p), os.path.getsize(flat)))
    except Exception as e:
        chk(False, 'cso fixture', str(e)[:120])

    # 5. Xbox
    print('\nXbox XDVDFS:')
    p = os.path.join(tmp, 'disc.xiso')
    try:
        build_xiso(p)
        rc, out = run([p, '--list'])
        chk('xiso' in out, 'detected as XDVDFS')
        o = os.path.join(tmp, 'out_xiso')
        rc, out = run([p, '-o', o])
        verify_extraction(o, PAYLOAD, 'xiso')
    except Exception as e:
        chk(False, 'xiso fixture', str(e)[:120])

    # 6. Wii — the decryption path, which is the whole point of the ask
    print('\nWii (AES-128-CBC encrypted partition):')
    p = os.path.join(tmp, 'disc.wbfs.iso')
    keyf = os.path.join(tmp, 'throwaway.key')
    try:
        import hashlib
        # a THROWAWAY key generated here. Not a console key, not shipped, not committed.
        ck = hashlib.sha256(b'bannon-synthetic-test-common-key').digest()[:16]
        open(keyf, 'wb').write(ck)
        build_wii(p, ck)

        rc, out = run([p, '--list'])
        chk('wii' in out, 'detected as Wii')
        chk('NOT DECRYPTED' in out, 'refuses to invent a key, and says so plainly')
        chk('partition' in out.lower(), 'lists partitions even without a key')

        o = os.path.join(tmp, 'out_wii')
        rc, out = run([p, '--key', keyf, '-o', o])
        chk('decrypted 1/1' in out, 'decrypted the partition with the supplied key')
        verify_extraction(o, PAYLOAD, 'wii')

        # a WRONG key must fail cleanly rather than emit garbage that looks like files
        badf = os.path.join(tmp, 'wrong.key')
        open(badf, 'wb').write(b'\x01' * 16)
        o2 = os.path.join(tmp, 'out_wii_bad')
        rc, out = run([badf and p, '--key', badf, '-o', o2])
        wrote = 0
        for root, _, files in os.walk(o2):
            wrote += len([f for f in files if f != 'manifest.json'])
        chk(wrote == 0, 'a WRONG key extracts nothing instead of garbage', '%d files written' % wrote)
    except Exception as e:
        chk(False, 'wii fixture', str(e)[:160])

    # 7. filters
    print('\nFilters:')
    try:
        p = os.path.join(tmp, 'disc.gcm')
        o = os.path.join(tmp, 'out_match')
        rc, out = run([p, '-o', o, '--match', '*.MDL'])
        got = []
        for root, _, files in os.walk(o):
            got += [f for f in files if f != 'manifest.json']
        chk(sorted(got) == ['RING.MDL', 'WRESTLER.MDL'], '--match "*.MDL" took only the models', str(sorted(got)))
        o = os.path.join(tmp, 'out_assets')
        rc, out = run([p, '-o', o, '--assets-only'])
        got = []
        for root, _, files in os.walk(o):
            got += [f for f in files if f != 'manifest.json']
        chk('BOOT.BIN' not in got, '--assets-only skipped the executable', str(sorted(got)))
        rc, out = run([p, '--manifest-only', '-o', os.path.join(tmp, 'out_manifest')])
        got = []
        for root, _, files in os.walk(os.path.join(tmp, 'out_manifest')):
            got += [f for f in files if f != 'manifest.json']
        chk(not got, '--manifest-only extracted nothing')
    except Exception as e:
        chk(False, 'filters', str(e)[:120])

    # 8. a file that is not a disc at all
    print('\nNot a disc:')
    p = os.path.join(tmp, 'junk.iso')
    open(p, 'wb').write(b'this is not a disc image' * 5000)
    rc, out = run([p, '--list'])
    chk(rc != 0 and 'No filesystem' in out, 'says so instead of pretending', 'rc=%d' % rc)

    print('\n' + ('=' * 70))
    if fails:
        print('FAILED — %d check(s): %s' % (len(fails), '; '.join(fails)))
        return 1
    print('ALL FORMATS VERIFIED — every image round-tripped byte-for-byte')
    return 0


if __name__ == '__main__':
    sys.exit(main())
