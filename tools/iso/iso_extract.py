#!/usr/bin/env python3
"""iso_extract.py — disc images into the BANNON asset pipeline, the same shape as the MDickie tools.

WHY THIS EXISTS
  Owner: "we need a way to decrypt and use iso files the way we did mdickie games."
  The MDickie route was pull_apk.mjs -> decode_zf3d.mjs / unity_extract.py -> GLB + manifest.json.
  A disc image needs the same three stages, and the first one is the part that was missing: you cannot
  decode a file you cannot get out of the image. So this is stage one done properly — identify the
  image, walk its real filesystem, decrypt it when the format is encrypted, extract, and CLASSIFY what
  came out so the existing converters have something to chew on.

WHAT IT READS  (detected by magic, never by file extension — .iso lies constantly)
  ISO9660 / Joliet / Rock Ridge   PS1, PS2, PSP, PC, and most "just a data disc" images   [pycdlib]
  UDF                             DVD-video and hybrid discs                              [pycdlib/bsdtar]
  GameCube (GCM)                  magic 0xC2339F3D @ 0x1C — plaintext FST, walked natively
  Wii                             magic 0x5D1C9EA3 @ 0x18 — partitioned AND ENCRYPTED (see KEYS)
  Xbox / Xbox 360 (XDVDFS)        "MICROSOFT*XBOX*MEDIA" @ 0x10000 (and 0x FD90000 / 0x2080000 offsets)
  CISO/CSO                        compressed PSP images — transparently inflated per block
  Raw 2352-byte MODE1/MODE2 BIN   the sector-with-headers form, unwrapped to 2048 on the fly

KEYS — READ THIS
  Wii partitions are AES-128-CBC encrypted. This tool DOES NOT CONTAIN, EMBED OR DOWNLOAD ANY KEY, and
  it never will: shipping a console master key is not something a repository should do. You supply one:

      --key /path/to/common-key.bin        (16 raw bytes)
      or set BANNON_WII_KEY=/path/to/key   (kept out of git like every other secret here)

  Without a key, Wii images still list their partitions and metadata so you know what is on the disc —
  it just cannot decrypt the data. That is the correct behaviour, not a failure.

LEGAL POSTURE, stated plainly because it matters for what gets committed
  Use this on discs you own, for assets the project is licensed to use, exactly as the MDickie pipeline
  operates under the owner's explicit permission from MDickie. Extracted third-party assets are
  reference/bases and are morphed into proprietary BANNON assets — never shipped as someone else's IP.
  Nothing this tool extracts is committed by default; it all lands in an ignored staging directory.

USAGE
  python3 tools/iso/iso_extract.py <image> --list                       # what is on the disc
  python3 tools/iso/iso_extract.py <image> -o staging/                  # extract everything
  python3 tools/iso/iso_extract.py <image> -o staging/ --assets-only    # only likely 3D/audio assets
  python3 tools/iso/iso_extract.py <image> -o staging/ --match "*.dat,*model*"
  python3 tools/iso/iso_extract.py <image> --key key.bin -o staging/    # Wii
  python3 tools/iso/iso_extract.py <image> --manifest-only -o staging/  # catalogue, extract nothing

Writes <out>/manifest.json in the same shape the MDickie tools emit, so the downstream converters and
the asset audits can read a disc the way they read an APK.
"""
import argparse
import fnmatch
import io
import json
import os
import struct
import sys
import zlib
from collections import Counter

SECTOR = 2048
RAW_SECTOR = 2352            # MODE1/MODE2 with sync+header+ECC


# ── image access ──────────────────────────────────────────────────────────────────────────────────
class Image:
    """Random access to the logical 2048-byte sector stream, whatever the container really is.

    A disc image is often NOT a flat run of 2048-byte sectors: BIN/raw rips carry 2352-byte sectors
    with sync marks and error correction around the payload, and PSP CSO images are per-block deflated.
    Everything above this class works in logical sectors and is spared all of that.
    """

    def __init__(self, path):
        self.path = path
        self.f = open(path, 'rb')
        self.size = os.path.getsize(path)
        self.mode = 'flat'
        self.cso = None
        self._sniff()

    def _sniff(self):
        head = self.f.read(24)
        if head[:4] in (b'CISO', b'ZISO'):
            self._init_cso()
            self.mode = 'cso'
            return
        # A raw 2352-byte sector opens with the CD sync pattern. If it is there, every read has to
        # step 2352 and skip the 16/24-byte header — get this wrong and every offset in the image is
        # subtly off, which reads as "corrupt disc" when the disc is fine.
        self.f.seek(0)
        if self.f.read(12) == b'\x00\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\x00':
            self.mode = 'raw2352'

    def _init_cso(self):
        self.f.seek(0)
        # '<4sIQIBB' is 4+4+8+4+1+1 = 22 bytes. Reading 26 made struct.unpack raise on every CSO.
        magic, hdr_size, total_bytes, block_size, ver, align = struct.unpack('<4sIQIBB', self.f.read(22))
        self.f.seek(0x18)
        self.cso = {'total': total_bytes, 'block': block_size, 'align': align}
        nblocks = (total_bytes + block_size - 1) // block_size
        self.f.seek(0x18)
        idx = struct.unpack('<%dI' % (nblocks + 1), self.f.read(4 * (nblocks + 1)))
        self.cso['index'] = idx
        self.size = total_bytes

    def read_at(self, offset, length):
        """Byte-accurate read from the LOGICAL image."""
        if self.mode == 'flat':
            self.f.seek(offset)
            return self.f.read(length)
        if self.mode == 'raw2352':
            out = bytearray()
            while length > 0:
                lba, within = divmod(offset, SECTOR)
                # MODE1 payload starts at 16; MODE2/FORM1 at 24. Sniff the mode byte in the header.
                self.f.seek(lba * RAW_SECTOR + 15)
                m = self.f.read(1)
                skip = 24 if m == b'\x02' else 16
                self.f.seek(lba * RAW_SECTOR + skip + within)
                chunk = self.f.read(min(SECTOR - within, length))
                if not chunk:
                    break
                out += chunk
                offset += len(chunk)
                length -= len(chunk)
            return bytes(out)
        if self.mode == 'cso':
            out = bytearray()
            bs = self.cso['block']
            idx = self.cso['index']
            align = self.cso['align']
            while length > 0:
                blk, within = divmod(offset, bs)
                if blk + 1 >= len(idx):
                    break
                start = (idx[blk] & 0x7FFFFFFF) << align
                end = (idx[blk + 1] & 0x7FFFFFFF) << align
                plain = bool(idx[blk] & 0x80000000)
                self.f.seek(start)
                raw = self.f.read(max(0, end - start))
                data = raw if plain else zlib.decompress(raw, -15)
                take = data[within:within + length]
                if not take:
                    break
                out += take
                offset += len(take)
                length -= len(take)
            return bytes(out)
        raise RuntimeError('unknown image mode')

    def sector(self, lba, count=1):
        return self.read_at(lba * SECTOR, SECTOR * count)

    def close(self):
        try:
            self.f.close()
        except Exception:
            pass


# ── format detection ──────────────────────────────────────────────────────────────────────────────
GC_MAGIC = 0xC2339F3D
WII_MAGIC = 0x5D1C9EA3
XISO_MAGIC = b'MICROSOFT*XBOX*MEDIA'
XISO_OFFSETS = (0x10000, 0x1FB20000, 0x18300000, 0x02080000, 0xFD90000)


def detect(img):
    """Return a list of format tags, most specific first. A disc can be more than one thing."""
    tags = []
    head = img.read_at(0, 0x40)
    if len(head) >= 0x20:
        if struct.unpack('>I', head[0x18:0x1C])[0] == WII_MAGIC:
            tags.append('wii')
        if struct.unpack('>I', head[0x1C:0x20])[0] == GC_MAGIC:
            tags.append('gamecube')
    for off in XISO_OFFSETS:
        if img.read_at(off, len(XISO_MAGIC)) == XISO_MAGIC:
            tags.append('xiso:%d' % off)
            break
    # ISO9660's primary volume descriptor sits at LBA 16; UDF announces itself in the same area.
    for lba in (16, 17, 18):
        d = img.sector(lba)
        if d[1:6] == b'CD001':
            if 'iso9660' not in tags:
                tags.append('iso9660')
        if d[1:6] == b'BEA01' or d[1:6] == b'NSR02' or d[1:6] == b'NSR03':
            if 'udf' not in tags:
                tags.append('udf')
    if img.mode == 'cso':
        tags.append('cso')
    if img.mode == 'raw2352':
        tags.append('raw2352')
    return tags or ['unknown']


# ── GameCube / Wii filesystem (FST) ───────────────────────────────────────────────────────────────
# Both use the same FST layout; on Wii it lives INSIDE an encrypted partition, which is the only real
# difference and the reason the key matters.
def read_fst(read, fst_off, fst_size, name_hint='disc'):
    """Walk a GC/Wii FST. `read(offset, length)` reads the (already decrypted) partition data."""
    fst = read(fst_off, fst_size)
    if len(fst) < 12:
        return []
    n_entries = struct.unpack('>I', fst[8:12])[0]
    if n_entries == 0 or n_entries * 12 > len(fst):
        return []
    str_base = n_entries * 12
    entries = []

    def name_at(off):
        end = fst.find(b'\x00', str_base + off)
        if end < 0:
            end = len(fst)
        return fst[str_base + off:end].decode('latin-1', 'replace')

    out = []

    def walk(i, prefix, end):
        while i < end:
            rec = fst[i * 12:(i + 1) * 12]
            if len(rec) < 12:
                return i + 1
            flag_nameoff = struct.unpack('>I', rec[0:4])[0]
            is_dir = (flag_nameoff >> 24) & 1
            nm = name_at(flag_nameoff & 0xFFFFFF)
            a = struct.unpack('>I', rec[4:8])[0]
            b = struct.unpack('>I', rec[8:12])[0]
            if is_dir:
                sub_end = b
                i = walk(i + 1, prefix + nm + '/', sub_end)
            else:
                out.append({'path': prefix + nm, 'offset': a, 'size': b})
                i += 1
        return i

    walk(1, '', n_entries)
    return out


def gamecube_files(img):
    hdr = img.read_at(0, 0x460)
    dol_off = struct.unpack('>I', hdr[0x420:0x424])[0]
    fst_off = struct.unpack('>I', hdr[0x424:0x428])[0]
    fst_size = struct.unpack('>I', hdr[0x428:0x42C])[0]
    files = read_fst(lambda o, l: img.read_at(o, l), fst_off, fst_size)
    if dol_off:
        files.append({'path': 'sys/main.dol', 'offset': dol_off, 'size': max(0, fst_off - dol_off)})
    return files, (lambda o, l: img.read_at(o, l))


# ── Wii: partitions and decryption ────────────────────────────────────────────────────────────────
class WiiPartition:
    """One Wii partition, presented as a plaintext byte stream.

    A Wii partition's data area is AES-128-CBC in 0x8000 clusters: 0x400 bytes of hashes then 0x7C00
    of encrypted payload, with the IV taken from bytes 0x3D0..0x3E0 of the cluster's own hash block.
    The title key itself is encrypted with the common key, so you need the common key to get the title
    key to get the data. That is the "decrypt" in the ask.
    """

    BLOCK = 0x8000
    PAYLOAD = 0x7C00
    HASH = 0x400

    def __init__(self, img, part_off, common_key):
        self.img = img
        self.base = part_off
        self.ok = False
        self.title_key = None
        tik = img.read_at(part_off, 0x2A4)
        if len(tik) < 0x2A4:
            return
        enc_key = tik[0x1BF:0x1CF]
        title_id = tik[0x1DC:0x1E4]
        self.title_id = title_id.hex()
        tmd_size, tmd_off, cert_size, cert_off, h3_off, data_off, data_size = struct.unpack(
            '>IIIIIII', img.read_at(part_off + 0x2A4, 28))
        self.data_off = part_off + data_off * 4
        self.data_size = data_size * 4
        if not common_key:
            return
        from Crypto.Cipher import AES
        iv = title_id + b'\x00' * 8
        self.title_key = AES.new(common_key, AES.MODE_CBC, iv).decrypt(enc_key)
        self.ok = True

    def read(self, offset, length):
        """Plaintext read inside the partition's data area."""
        if not self.ok:
            return b''
        from Crypto.Cipher import AES
        out = bytearray()
        while length > 0:
            blk, within = divmod(offset, self.PAYLOAD)
            raw = self.img.read_at(self.data_off + blk * self.BLOCK, self.BLOCK)
            if len(raw) < self.BLOCK:
                break
            iv = raw[0x3D0:0x3E0]
            dec = AES.new(self.title_key, AES.MODE_CBC, iv).decrypt(raw[self.HASH:])
            take = dec[within:within + length]
            if not take:
                break
            out += take
            offset += len(take)
            length -= len(take)
        return bytes(out)


def wii_partitions(img, common_key):
    """The partition table lives at 0x40000: up to four groups of (count, offset>>2)."""
    tbl = img.read_at(0x40000, 0x20)
    parts = []
    for i in range(4):
        cnt, off = struct.unpack('>II', tbl[i * 8:i * 8 + 8])
        if cnt == 0 or cnt > 32:
            continue
        ent = img.read_at(off * 4, cnt * 8)
        for j in range(cnt):
            p_off, p_type = struct.unpack('>II', ent[j * 8:j * 8 + 8])
            parts.append({'offset': p_off * 4, 'type': p_type, 'group': i})
    out = []
    for p in parts:
        wp = WiiPartition(img, p['offset'], common_key)
        p['decrypted'] = wp.ok
        p['title_id'] = getattr(wp, 'title_id', None)
        p['files'] = []
        if wp.ok:
            hdr = wp.read(0, 0x460)
            if len(hdr) >= 0x42C:
                fst_off = struct.unpack('>I', hdr[0x424:0x428])[0] * 4
                fst_size = struct.unpack('>I', hdr[0x428:0x42C])[0] * 4
                p['files'] = read_fst(wp.read, fst_off, fst_size)
        p['_reader'] = wp.read if wp.ok else None
        out.append(p)
    return out


# ── Xbox XDVDFS ───────────────────────────────────────────────────────────────────────────────────
def xiso_files(img, base):
    """XDVDFS: a volume descriptor at `base`, then a binary-tree directory of 14-byte-headed records."""
    vd = img.read_at(base, 0x20)
    root_sector, root_size = struct.unpack('<II', vd[0x14:0x1C])
    part_start = base - 0x10000            # sector numbers are relative to the partition start
    out = []

    def walk(sector, size, prefix, depth=0):
        if depth > 32 or size == 0:
            return
        data = img.read_at(part_start + sector * SECTOR, size)
        # Records are laid out in a tree via left/right offsets in units of 4 bytes within the block.
        def rec(pos):
            if pos + 14 > len(data):
                return
            # left(2) right(2) startSector(4) size(4) attributes(1) nameLength(1) then the name.
            l, r, start, sz, attr, nlen = struct.unpack('<HHIIBB', data[pos:pos + 14])
            name = data[pos + 14:pos + 14 + nlen].decode('latin-1', 'replace')
            if l == 0xFFFF or not name:
                return
            if l:
                rec(l * 4)
            if attr & 0x10:                # directory
                walk(start, sz, prefix + name + '/', depth + 1)
            else:
                out.append({'path': prefix + name,
                            'offset': part_start + start * SECTOR, 'size': sz})
            if r:
                rec(r * 4)
        rec(0)

    walk(root_sector, root_size, '')
    return out, (lambda o, l: img.read_at(o, l))


# ── ISO9660 / UDF via pycdlib ─────────────────────────────────────────────────────────────────────
def iso9660_files(path, img):
    try:
        import pycdlib
    except ImportError:
        return None, None
    # pycdlib wants a flat 2048-sector stream. If the container is raw/CSO, hand it a normalised copy
    # in memory rather than pretending — a 700 MB CD is fine, and a DVD-sized raw rip is rare.
    if img.mode == 'flat':
        fh = open(path, 'rb')
    else:
        buf = io.BytesIO()
        step = SECTOR * 512
        off = 0
        while off < img.size:
            chunk = img.read_at(off, step)
            if not chunk:
                break
            buf.write(chunk)
            off += len(chunk)
        buf.seek(0)
        fh = buf
    iso = pycdlib.PyCdlib()
    try:
        iso.open_fp(fh)
    except Exception:
        try:
            fh.close()
        except Exception:
            pass
        return None, None
    # prefer the richest namespace available: Rock Ridge and Joliet keep real filenames, the plain
    # ISO9660 namespace mangles them to 8.3 with ";1" version suffixes
    kind = 'iso'
    if iso.has_rock_ridge():
        kind = 'rr'
    elif iso.has_joliet():
        kind = 'joliet'
    out = []
    walk_root = {'rr': '/', 'joliet': '/', 'iso': '/'}[kind]
    for root, dirs, files in iso.walk(**{{'rr': 'rr_path', 'joliet': 'joliet_path', 'iso': 'iso_path'}[kind]: walk_root}):
        for fn in files:
            p = (root.rstrip('/') + '/' + fn)
            sz = None
            try:
                kw = {{'rr': 'rr_path', 'joliet': 'joliet_path', 'iso': 'iso_path'}[kind]: p}
                sz = iso.get_record(**kw).get_data_length()
            except Exception:
                pass
            out.append({'path': p.lstrip('/'), 'offset': None, 'size': sz, '_iso': p})

    def reader(entry, _iso=iso, _kind=kind):
        bio = io.BytesIO()
        kw = {{'rr': 'rr_path', 'joliet': 'joliet_path', 'iso': 'iso_path'}[_kind]: entry['_iso']}
        _iso.get_file_from_iso_fp(bio, **kw)
        return bio.getvalue()

    return out, reader


# ── classification: what came off the disc, and is it worth converting ────────────────────────────
# Deliberately by EXTENSION AND MAGIC both. Console games rename everything, so magic is the tiebreak.
ASSET_CLASSES = [
    ('model',    ['.glb', '.gltf', '.fbx', '.obj', '.dae', '.smd', '.md5mesh', '.mdl', '.nif', '.brres',
                  '.bmd', '.bdl', '.cmdl', '.nsbmd', '.xnb', '.mesh', '.geo', '.gmo', '.gno', '.rmdl']),
    ('anim',     ['.bvh', '.anm', '.anim', '.bck', '.cska', '.nsbca', '.mot', '.gmo', '.trk', '.ska']),
    ('texture',  ['.dds', '.tga', '.png', '.jpg', '.jpeg', '.bmp', '.tpl', '.txd', '.gtx', '.tim',
                  '.tm2', '.gim', '.tex', '.pvr', '.ktx']),
    ('audio',    ['.wav', '.ogg', '.mp3', '.adx', '.brstm', '.ast', '.dsp', '.vag', '.vgs', '.at3',
                  '.sfd', '.bnk', '.xwb', '.pss', '.hps']),
    ('archive',  ['.arc', '.zip', '.pak', '.wad', '.rarc', '.szs', '.u8', '.bin', '.dat', '.big',
                  '.pkg', '.cpk', '.afs', '.hd', '.bd', '.pac', '.rsc', '.res', '.bundle']),
    ('video',    ['.bik', '.thp', '.pss', '.usm', '.sfd', '.mpg', '.m2v', '.pmf']),
    ('script',   ['.lua', '.txt', '.xml', '.json', '.ini', '.cfg', '.rb']),
    ('exe',      ['.dol', '.elf', '.xbe', '.xex', '.self', '.bin', '.rel', '.dll', '.so']),
]
MAGICS = [
    (b'glTF',                 'model'),
    (b'Kaydara FBX Binary',   'model'),
    (b'DDS ',                 'texture'),
    (b'\x89PNG',              'texture'),
    (b'\xff\xd8\xff',         'texture'),
    (b'RIFF',                 'audio'),
    (b'OggS',                 'audio'),
    (b'PK\x03\x04',           'archive'),
    (b'RARC',                 'archive'),
    (b'Yaz0',                 'archive'),
    (b'U\xaa8-',              'archive'),   # Nintendo U8
    (b'THP\x00',              'video'),
    (b'BIKi',                 'video'),
    (b'\x7fELF',              'exe'),
    (b'XBEH',                 'exe'),
]


def classify(name, head=b''):
    low = name.lower()
    for cls, exts in ASSET_CLASSES:
        for e in exts:
            if low.endswith(e):
                # a generic container extension is a weak signal; let magic override it below
                if e in ('.bin', '.dat', '.pss', '.sfd', '.gmo'):
                    break
                return cls
    for magic, cls in MAGICS:
        if head.startswith(magic):
            return cls
    for cls, exts in ASSET_CLASSES:
        if any(low.endswith(e) for e in exts):
            return cls
    return 'other'


LIKELY_ASSET = {'model', 'anim', 'texture', 'audio', 'archive'}
# Extensions that appear on more than one class list, or that games use as a dumping ground. A name
# ending in one of these decides nothing — the magic has to.
_AMBIG = ('.bin', '.dat', '.pss', '.sfd', '.gmo', '.res', '.rsc', '.pak', '.arc')
def AMBIGUOUS_EXT(name):
    low = name.lower()
    return any(low.endswith(e) for e in _AMBIG)


# ── main ──────────────────────────────────────────────────────────────────────────────────────────
def human(n):
    for u in ('B', 'KB', 'MB', 'GB'):
        if n < 1024 or u == 'GB':
            return '%.1f %s' % (n, u)
        n /= 1024.0


def load_key(args):
    p = args.key or os.environ.get('BANNON_WII_KEY')
    if not p:
        return None
    if not os.path.exists(p):
        print('key file not found: %s' % p, file=sys.stderr)
        return None
    k = open(p, 'rb').read()
    # accept raw 16 bytes or a 32-char hex line, because both are how people keep these
    if len(k) >= 32:
        try:
            k = bytes.fromhex(k[:32].decode('ascii').strip())
        except Exception:
            k = k[:16]
    if len(k) != 16:
        print('key must be 16 bytes (or 32 hex chars); got %d' % len(k), file=sys.stderr)
        return None
    return k


def main():
    ap = argparse.ArgumentParser(description='Extract disc images into the BANNON asset pipeline.')
    ap.add_argument('image')
    ap.add_argument('-o', '--out', help='staging directory to extract into')
    ap.add_argument('--list', action='store_true', help='list contents and exit')
    ap.add_argument('--manifest-only', action='store_true', help='write manifest.json, extract nothing')
    ap.add_argument('--assets-only', action='store_true', help='only extract model/anim/texture/audio/archive')
    ap.add_argument('--match', help='comma-separated glob(s) on the path, e.g. "*.arc,*model*"')
    ap.add_argument('--key', help='16-byte Wii common key file (NEVER committed; see module docstring)')
    ap.add_argument('--limit', type=int, default=0, help='stop after N files (for a quick look)')
    ap.add_argument('--max-size', type=float, default=0, help='skip files larger than this many MB')
    args = ap.parse_args()

    if not os.path.exists(args.image):
        print('no such image: %s' % args.image, file=sys.stderr)
        return 2

    img = Image(args.image)
    tags = detect(img)
    print('%s  %s' % (os.path.basename(args.image), human(img.size)))
    print('format: %s%s' % (', '.join(tags), '  (container: %s)' % img.mode if img.mode != 'flat' else ''))

    key = load_key(args)
    files = []
    readers = {}          # path -> callable(entry)->bytes
    partitions = []

    if 'wii' in tags:
        parts = wii_partitions(img, key)
        for pi, p in enumerate(parts):
            partitions.append({'index': pi, 'type': p['type'], 'group': p['group'],
                               'offset': p['offset'], 'decrypted': p['decrypted'],
                               'title_id': p['title_id'], 'file_count': len(p['files'])})
            for e in p['files']:
                e = dict(e)
                e['path'] = 'p%d/%s' % (pi, e['path'])
                e['_part'] = pi
                files.append(e)
                readers[e['path']] = (lambda ent, rd=p['_reader']: rd(ent['offset'] * 4, ent['size']))
        if not key:
            print('\nWii image, %d partition(s) found, NOT DECRYPTED — supply --key to read the files.' % len(parts))
            print('This tool ships no key by design. See the module docstring.')
        else:
            print('decrypted %d/%d partition(s)' % (sum(1 for p in parts if p['decrypted']), len(parts)))

    elif 'gamecube' in tags:
        gf, rd = gamecube_files(img)
        files = gf
        for e in files:
            readers[e['path']] = (lambda ent, rd=rd: rd(ent['offset'], ent['size']))

    else:
        xt = [t for t in tags if t.startswith('xiso:')]
        if xt:
            base = int(xt[0].split(':')[1])
            xf, rd = xiso_files(img, base)
            files = xf
            for e in files:
                readers[e['path']] = (lambda ent, rd=rd: rd(ent['offset'], ent['size']))
        if not files and ('iso9660' in tags or 'udf' in tags or 'unknown' in tags):
            isof, rd = iso9660_files(args.image, img)
            if isof:
                files = isof
                for e in files:
                    readers[e['path']] = (lambda ent, rd=rd: rd(ent))

    if not files:
        print('\nNo filesystem could be read. Formats handled: ISO9660/Joliet/RockRidge, UDF, GameCube,')
        print('Wii (with --key), Xbox XDVDFS, PSP CSO, raw 2352-byte sector images.')
        print('If this is something else, say what game it is and the format can be added.')
        img.close()
        return 1

    # filter
    pats = [p.strip() for p in (args.match or '').split(',') if p.strip()]
    sel = []
    for e in files:
        if pats and not any(fnmatch.fnmatch(e['path'].lower(), p.lower()) for p in pats):
            continue
        sel.append(e)

    # classify (peeking at the head of each file, which is what makes this reliable on renamed assets)
    counts = Counter()
    total = 0
    for e in sel:
        # by NAME here; the magic-based correction happens on write, when the bytes are in hand.
        e['class'] = classify(e['path'])
        counts[e['class']] += 1
        total += (e.get('size') or 0)

    print('\n%d file(s), %s' % (len(sel), human(total)))
    for cls, n in counts.most_common():
        print('  %-9s %d' % (cls, n))
    if partitions:
        print('\npartitions:')
        for p in partitions:
            print('  p%d  type=%s  files=%d  decrypted=%s' % (p['index'], p['type'], p['file_count'], p['decrypted']))

    if args.list:
        print()
        for e in sorted(sel, key=lambda x: -(x.get('size') or 0))[:400]:
            print('  %-9s %10s  %s' % (e['class'], human(e['size']) if e.get('size') else '?', e['path']))
        if len(sel) > 400:
            print('  ... and %d more' % (len(sel) - 400))
        img.close()
        return 0

    if not args.out:
        print('\n(nothing extracted: pass -o <dir>)')
        img.close()
        return 0

    os.makedirs(args.out, exist_ok=True)
    manifest = {'image': os.path.basename(args.image), 'bytes': img.size, 'formats': tags,
                'container': img.mode, 'partitions': partitions, 'files': []}

    written = 0
    if not args.manifest_only:
        cap = args.max_size * 1024 * 1024 if args.max_size else 0
        for e in sel:
            if cap and (e.get('size') or 0) > cap:
                continue
            if args.limit and written >= args.limit:
                break
            # Cheap name-based reject first, but ONLY when the name is unambiguous. A generic container
            # extension tells you nothing: BOOT.BIN is on both the archive and exe lists, so by name it
            # read as an asset and slipped through --assets-only. Its magic is \x7fELF.
            if args.assets_only and e['class'] not in LIKELY_ASSET and not AMBIGUOUS_EXT(e['path']):
                continue
            try:
                data = readers[e['path']](e)
            except Exception as ex:
                manifest['files'].append({'path': e['path'], 'class': e['class'], 'error': str(ex)[:120]})
                continue
            if not data:
                manifest['files'].append({'path': e['path'], 'class': e['class'], 'error': 'empty'})
                continue
            # NOW the magic is knowable, so classify properly — and only now can --assets-only be honest
            e['class'] = classify(e['path'], data[:32])
            if args.assets_only and e['class'] not in LIKELY_ASSET:
                manifest['files'].append({'path': e['path'], 'class': e['class'], 'skipped': 'not an asset'})
                continue
            safe = e['path'].replace('\\', '/').lstrip('/')
            safe = '/'.join(s for s in safe.split('/') if s not in ('.', '..'))
            dst = os.path.join(args.out, safe)
            os.makedirs(os.path.dirname(dst) or '.', exist_ok=True)
            with open(dst, 'wb') as fh:
                fh.write(data)
            manifest['files'].append({'path': e['path'], 'class': e['class'], 'bytes': len(data)})
            written += 1
    else:
        for e in sel:
            manifest['files'].append({'path': e['path'], 'class': e['class'], 'bytes': e.get('size')})

    with open(os.path.join(args.out, 'manifest.json'), 'w') as fh:
        json.dump(manifest, fh, indent=1)

    print('\nextracted %d file(s) to %s' % (written, args.out))
    print('manifest: %s' % os.path.join(args.out, 'manifest.json'))
    if written:
        by = Counter(f['class'] for f in manifest['files'] if 'bytes' in f)
        print('on disk: ' + ', '.join('%s %d' % (k, v) for k, v in by.most_common()))
        nxt = by.get('model', 0) + by.get('anim', 0)
        if nxt:
            print('\n%d model/anim file(s) are next for conversion. The pipeline that handles them:' % nxt)
            print('  tools/mdickie_scraper/decode_zf3d.mjs     .zf3d  -> GLB')
            print('  tools/mdickie_scraper/unity_extract.py    Unity  -> GLB')
            print('  tools/mocap/ingest.cjs                    FBX/BVH clips -> the move library')
            print('  tools/assets/optimize_gltf.cjs            shrink whatever comes out')
        if by.get('archive'):
            print('\n%d archive(s) hold more inside them. Nested containers are not unpacked here —' % by['archive'])
            print('name the game and the container format can be added rather than guessed at.')
    img.close()
    return 0


if __name__ == '__main__':
    sys.exit(main())
