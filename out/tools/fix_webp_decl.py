import json, struct, sys
def patch(f):
    with open(f,'rb') as fh: data = fh.read()
    assert data[:4] == b'glTF', 'not a glb'
    off = 12; new_chunks = []
    while off < len(data):
        l, t = struct.unpack('<II', data[off:off+8])
        body = data[off+8:off+8+l]
        if t == 0x4E4F534A:
            js = json.loads(body)
            if any('EXT_texture_webp' in (tx.get('extensions') or {}) for tx in js.get('textures',[])):
                eu = js.get('extensionsUsed') or []
                if 'EXT_texture_webp' not in eu: eu.append('EXT_texture_webp')
                js['extensionsUsed'] = eu
            body = json.dumps(js, separators=(',',':')).encode()
            body += b' ' * ((4 - len(body)%4) % 4)
        new_chunks.append((t, body))
        off += 8+l
    total = 12 + sum(8+len(b) for _,b in new_chunks)
    out = struct.pack('<III', 0x46546C67, 2, total)
    for t, b in new_chunks:
        out += struct.pack('<II', len(b), t) + b
    assert len(out) == total and out[:4] == b'glTF'
    with open(f,'wb') as fh: fh.write(out)
    print('patched OK', f)
for f in sys.argv[1:]: patch(f)
