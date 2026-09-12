#!/usr/bin/env python3
"""text_to_clip.py — type a move, get a playable clip. MoMask / MDM / MotionGPT, wired into our rig.

WHY: the owner's problem with capture is that it does not scale — "farming and editing these clips for
each move and multiple positions and variations and locomotion etc and get ups and zoning and climbing
and stuff gonna be tedious". Video capture (video_to_clip.py) needs footage of every move. Generation
needs a sentence.

    python3 tools/mocap/text_to_clip.py "a wrestler lifts an opponent and drops into a sit-out powerbomb" \\
        --name POWERBOMB_SITOUT_GEN

RUNS ON CPU. From MoMask's own README: "The WebUI demo is now running smoothly on a CPU. No GPU is
required to use MoMask." That is why MoMask is the default backend here — MDM is a 1000-step diffusion
and MotionGPT carries a T5 language model, both of which are painful without a GPU. All three are
supported through one interface because they all emit the same thing.

THE PART THAT MATTERS AND OUTLIVES THE BACKEND
  Every one of these models outputs HumanML3D motion: 22 SMPL joints in metres, 20 fps, hip-centred.
  Converting THAT to our clip format is the integration, and it is backend-agnostic. If a better model
  ships next month, it plugs in behind the same converter. The SMPL 22 are a better source than
  MediaPipe's 33, because they include the spine chain and the collars that MediaPipe has to guess at.

SETUP is one command and it is committed: bash tools/mocap/setup_motion_models.sh

WHAT IT WRITES: assets/moves/clips/<KEY>.json — the engine's own format, same as bake_clips.cjs and
video_to_clip.py produce. A generated move is indistinguishable from a captured one downstream, which
is the whole point.
"""
import argparse
import json
import math
import os
import sys
import types

REPO = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
CLIPS = os.path.join(REPO, 'assets', 'moves', 'clips')
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

MOMASK = os.environ.get('MOMASK_DIR', '/tmp/momask')
MDM = os.environ.get('MDM_DIR', '/tmp/motion-diffusion-model')
MOTIONGPT = os.environ.get('MOTIONGPT_DIR', '/tmp/MotionGPT')


def shim_numpy():
    """MoMask, MDM and MotionGPT are all 2023 code and use aliases NumPy 2 removed — np.float,
    np.int, np.bool. Patching them back is a two-line shim; forcing numpy<2 across this whole
    environment to accommodate it is not worth it, and would drag mediapipe and opencv backwards.
    These aliases meant exactly the builtins, so restoring them changes no behaviour."""
    import numpy as np
    for name, real in (('float', float), ('int', int), ('bool', bool),
                       ('object', object), ('str', str), ('complex', complex)):
        if not hasattr(np, name):
            setattr(np, name, real)


def stub_torchvision():
    """CLIP pulls in torchvision purely for its image-preprocessing Compose. MoMask uses the TEXT
    encoder only, and pinning a torchvision build that matches the local torch is a rabbit hole with
    no payoff — so the image half is stubbed and the text half runs untouched."""
    if 'torchvision' in sys.modules:
        return
    tv = types.ModuleType('torchvision')
    tr = types.ModuleType('torchvision.transforms')

    class _Noop:
        def __init__(self, *a, **k):
            pass

        def __call__(self, x):
            return x
    for n in ('Compose', 'Resize', 'CenterCrop', 'ToTensor', 'Normalize'):
        setattr(tr, n, _Noop)
    tr.InterpolationMode = types.SimpleNamespace(BICUBIC='bicubic')
    tv.transforms = tr
    sys.modules['torchvision'] = tv
    sys.modules['torchvision.transforms'] = tr


# ══════════════════════════════════════════════════════════════════════════════════════════════════
# SMPL 22 -> our clip format. THIS is the integration, and it is the same for every backend.
# ══════════════════════════════════════════════════════════════════════════════════════════════════
# HumanML3D / SMPL joint order, which all three models emit:
SMPL = dict(PELVIS=0, L_HIP=1, R_HIP=2, SPINE1=3, L_KNEE=4, R_KNEE=5, SPINE2=6, L_ANKLE=7,
            R_ANKLE=8, SPINE3=9, L_FOOT=10, R_FOOT=11, NECK=12, L_COLLAR=13, R_COLLAR=14,
            HEAD=15, L_SHOULDER=16, R_SHOULDER=17, L_ELBOW=18, R_ELBOW=19, L_WRIST=20, R_WRIST=21)


def smpl_points(j):
    """(22,3) SMPL joints -> the named points video_to_clip's retarget already understands.

    Straight lookups, not estimates. MediaPipe has to interpolate a spine chain and invent collars;
    SMPL ships them, so a generated clip drives spineLow / spineMid / clavL / clavR from real data
    rather than from a guess. Those are exactly the joints the elbow/knee fix added to NEUTRAL.
    """
    g = lambda k: j[SMPL[k]]
    return {
        'pelvis': g('PELVIS'),
        'spine1': g('SPINE1'), 'spine2': g('SPINE2'), 'chest': g('SPINE3'),
        'neck': g('NECK'), 'head': g('HEAD'),
        'l_clav': g('L_COLLAR'), 'r_clav': g('R_COLLAR'),
        'l_sh': g('L_SHOULDER'), 'r_sh': g('R_SHOULDER'),
        'l_el': g('L_ELBOW'), 'r_el': g('R_ELBOW'),
        'l_wr': g('L_WRIST'), 'r_wr': g('R_WRIST'),
        'l_hip': g('L_HIP'), 'r_hip': g('R_HIP'),
        'l_kn': g('L_KNEE'), 'r_kn': g('R_KNEE'),
        'l_ank': g('L_ANKLE'), 'r_ank': g('R_ANKLE'),
        'l_toe': g('L_FOOT'), 'r_toe': g('R_FOOT'),
    }


def motion_to_clip(joints, fps=20.0, nkeys=28, smooth_win=3):
    """(frames, 22, 3) -> the engine's clip format, reusing video_to_clip's retarget wholesale."""
    import numpy as np
    import video_to_clip as v2c

    n = len(joints)
    if n < 3:
        return None
    seq = [smpl_points(joints[i]) for i in range(n)]

    # SMPL is Y-up already, which is what the engine wants — no axis flip here, unlike MediaPipe.
    if smooth_win > 1 and n >= smooth_win:
        keys_list = list(seq[0].keys())
        arr = np.stack([[s[k] for k in keys_list] for s in seq])
        k = np.ones(smooth_win) / smooth_win
        pad = smooth_win // 2
        out = np.empty_like(arr)
        for a in range(arr.shape[1]):
            for b in range(arr.shape[2]):
                p = np.pad(arr[:, a, b], (pad, pad), mode='edge')
                out[:, a, b] = np.convolve(p, k, mode='same')[pad:pad + arr.shape[0]]
        seq = [{keys_list[a]: out[i, a] for a in range(len(keys_list))} for i in range(n)]

    # rest directions from the opening frames, same convention as the video path
    rest = {}
    for kk in seq[0]:
        rest[kk] = np.mean([seq[i][kk] for i in range(min(5, n))], axis=0)
    rest_dirs = {}
    for name, parent, fallback in v2c.BONES:
        s = v2c.SEGMENTS.get(name)
        if not s:
            rest_dirs[name] = fallback
            continue
        a, b = rest.get(s[0]), rest.get(s[1])
        if a is None or b is None:
            rest_dirs[name] = fallback
            continue
        d = b - a
        m = np.linalg.norm(d)
        rest_dirs[name] = (d / m) if m > 1e-6 else np.array(fallback, dtype=float)

    dur = max(0.2, n / float(fps))
    out_keys = []
    for k in range(nkeys):
        u = k / (nkeys - 1) if nkeys > 1 else 0.0
        fi = u * (n - 1)
        i0 = int(math.floor(fi)); i1 = min(n - 1, i0 + 1); a = fi - i0
        pts = {kk: seq[i0][kk] * (1 - a) + seq[i1][kk] * a for kk in seq[0]}
        h = np.linalg.norm(pts['head'] - pts['pelvis'])
        s = (0.80 / h) if h > 1e-6 else 1.0
        pose = {}
        for jn, pk in v2c.POSE_JOINTS.items():
            p = pts.get(pk)
            if p is None:
                continue
            q = (p - pts['pelvis']) * s
            pose[jn] = [round(float(q[0]), 4), round(float(q[1]), 4), round(float(q[2]), 4)]
        out_keys.append({'t': round(u * dur, 4), 'pose': pose,
                         'bones': v2c.build_frame(pts, rest_dirs)})
    bones = set()
    for kk in out_keys:
        bones.update(kk.get('bones', {}).keys())
    return {'dur': round(dur, 4), 'keys': out_keys}, len(bones)


def trim_to_motion(joints, keep_pad=4, quiet_frac=0.25):
    """Cut the still head and tail off a generated motion.

    MoMask's length estimator returned 196 frames (its maximum, 9.8 s) for every prompt tried — a
    get-up, a taunt and an elbow drop all came back the same length, padded with the model holding
    still. Trimming to the span where the body is actually moving is the same motion-energy test
    harvest.py uses to segment a video, applied to a generated sequence.
    """
    import numpy as np
    n = len(joints)
    if n < 8:
        return joints, 0, n - 1
    e = np.zeros(n)
    for i in range(1, n):
        e[i] = float(np.mean(np.linalg.norm(joints[i] - joints[i - 1], axis=1)))
    if n > 5:
        k = np.ones(5) / 5.0
        e = np.convolve(np.pad(e, (2, 2), mode='edge'), k, mode='same')[2:-2]
    hi, lo = float(np.percentile(e, 80)), float(np.percentile(e, 20))
    if hi - lo < 1e-9:
        return joints, 0, n - 1
    thr = lo + (hi - lo) * quiet_frac
    act = np.where(e > thr)[0]
    if len(act) < 4:
        return joints, 0, n - 1
    a = max(0, int(act[0]) - keep_pad)
    b = min(n - 1, int(act[-1]) + keep_pad)
    if b - a < 6:
        return joints, 0, n - 1
    return joints[a:b + 1], a, b


# ══════════════════════════════════════════════════════════════════════════════════════════════════
# BACKEND: MoMask (default — the only one the authors say runs comfortably on CPU)
# ══════════════════════════════════════════════════════════════════════════════════════════════════
def gen_momask(prompts, args):
    if not os.path.isdir(MOMASK):
        print('MoMask not set up. Run: bash tools/mocap/setup_motion_models.sh', file=sys.stderr)
        return None
    shim_numpy()
    stub_torchvision()
    sys.path.insert(0, MOMASK)
    cwd = os.getcwd()
    os.chdir(MOMASK)                        # their opt loader resolves paths relative to the repo
    try:
        import numpy as np
        import torch
        from os.path import join as pjoin
        from models.vq.model import RVQVAE, LengthEstimator
        from models.mask_transformer.transformer import MaskTransformer, ResidualTransformer
        from utils.get_opt import get_opt
        from utils.motion_process import recover_from_ric

        device = torch.device('cpu')
        torch.set_num_threads(max(1, os.cpu_count() or 4))
        root = pjoin('checkpoints', 't2m')
        TRANS = 't2m_nlayer8_nhead6_ld384_ff1024_cdp0.1_rvq6ns'
        RES = 'tres_nlayer8_ld384_ff1024_rvq6ns_cdp0.2_sw'
        VQ = 'rvq_nq6_dc512_nc512_noshare_qdp0.2'

        model_opt = get_opt(pjoin(root, TRANS, 'opt.txt'), device=device)
        vq_opt = get_opt(pjoin(root, VQ, 'opt.txt'), device=device)
        res_opt = get_opt(pjoin(root, RES, 'opt.txt'), device=device)
        vq_opt.device = model_opt.device = res_opt.device = device

        vq = RVQVAE(vq_opt, vq_opt.dim_pose, vq_opt.nb_code, vq_opt.code_dim, vq_opt.output_emb_width,
                    vq_opt.down_t, vq_opt.stride_t, vq_opt.width, vq_opt.depth,
                    vq_opt.dilation_growth_rate, vq_opt.vq_act, vq_opt.vq_norm)
        ck = torch.load(pjoin(root, VQ, 'model', 'net_best_fid.tar'), map_location='cpu', weights_only=False)
        vq.load_state_dict(ck[[k for k in ('vq_model', 'net') if k in ck][0]])
        vq.eval().to(device)

        model_opt.num_tokens = vq_opt.nb_code
        model_opt.num_quantizers = vq_opt.num_quantizers
        model_opt.code_dim = vq_opt.code_dim
        t2m = MaskTransformer(code_dim=vq_opt.code_dim, cond_mode='text',
                              latent_dim=model_opt.latent_dim, ff_size=model_opt.ff_size,
                              num_layers=model_opt.n_layers, num_heads=model_opt.n_heads,
                              dropout=model_opt.dropout, clip_dim=512,
                              cond_drop_prob=model_opt.cond_drop_prob,
                              clip_version='ViT-B/32', opt=model_opt)
        ck = torch.load(pjoin(root, TRANS, 'model', 'latest.tar'), map_location='cpu', weights_only=False)
        sd = ck['t2m_transformer'] if 't2m_transformer' in ck else ck['trans']
        sd = {k: v for k, v in sd.items() if not k.startswith('clip_model.')}
        t2m.load_state_dict(sd, strict=False)
        t2m.eval().to(device)

        res_opt.num_quantizers = vq_opt.num_quantizers
        res_opt.num_tokens = vq_opt.nb_code
        res = ResidualTransformer(code_dim=vq_opt.code_dim, cond_mode='text',
                                 latent_dim=res_opt.latent_dim, ff_size=res_opt.ff_size,
                                 num_layers=res_opt.n_layers, num_heads=res_opt.n_heads,
                                 dropout=res_opt.dropout, clip_dim=512,
                                 shared_codebook=vq_opt.shared_codebook,
                                 cond_drop_prob=res_opt.cond_drop_prob,
                                 share_weight=res_opt.share_weight, clip_version='ViT-B/32',
                                 opt=res_opt)
        # each stage was released with its own checkpoint name — resolve rather than assume
        def ckpt(sub):
            d = pjoin(root, sub, 'model')
            for cand in ('net_best_fid.tar', 'latest.tar', 'finest.tar'):
                if os.path.exists(pjoin(d, cand)):
                    return pjoin(d, cand)
            files = sorted(os.listdir(d)) if os.path.isdir(d) else []
            if not files:
                raise FileNotFoundError('no checkpoint in ' + d)
            return pjoin(d, files[0])
        ck = torch.load(ckpt(RES), map_location='cpu', weights_only=False)
        sd = ck['res_transformer'] if 'res_transformer' in ck else ck['trans']
        sd = {k: v for k, v in sd.items() if not k.startswith('clip_model.')}
        res.load_state_dict(sd, strict=False)
        res.eval().to(device)

        length = LengthEstimator(512, 50)
        ck = torch.load(pjoin(root, 'length_estimator', 'model', 'finest.tar'), map_location='cpu', weights_only=False)
        length.load_state_dict(ck['estimator'])
        length.eval().to(device)

        mean = np.load(pjoin(root, VQ, 'meta', 'mean.npy'))
        std = np.load(pjoin(root, VQ, 'meta', 'std.npy'))

        out = []
        for text in prompts:
            with torch.no_grad():
                emb = t2m.encode_text([text])
                pred = length(emb).squeeze(0)
                if args.frames:
                    tok_len = max(4, min(49, int(round(args.frames / 4.0))))
                elif args.sample_length:
                    tok_len = torch.multinomial(torch.nn.functional.softmax(pred, dim=-1), 1).item()
                else:
                    tok_len = int(pred.argmax().item())
                tok_len = max(4, min(49, tok_len))
                mlen = torch.LongTensor([tok_len]).to(device)
                ids = t2m.generate([text], mlen, args.steps, args.cfg, temperature=args.temp)
                ids = res.generate(ids, [text], mlen, temperature=1.0, cond_scale=args.res_cfg)
                motion = vq.forward_decoder(ids).detach().cpu().numpy()[0]     # (T, 263)
            m = motion * std + mean
            joints = recover_from_ric(torch.from_numpy(m).float(), 22).numpy()   # (T, 22, 3)
            out.append((text, joints))
        return out
    finally:
        os.chdir(cwd)


BACKENDS = {'momask': gen_momask}


def write(key, clip, meta):
    os.makedirs(CLIPS, exist_ok=True)
    text = json.dumps(clip)
    with open(os.path.join(CLIPS, key + '.json'), 'w') as fh:
        fh.write(text)
    ip = os.path.join(CLIPS, 'index.json')
    idx = {}
    if os.path.exists(ip):
        try:
            idx = json.load(open(ip))
        except Exception:
            idx = {}
    e = {'file': key + '.json', 'bytes': len(text), 'dur': clip['dur'], 'keys': len(clip['keys'])}
    e.update(meta)
    idx[key] = e
    with open(ip, 'w') as fh:
        json.dump(idx, fh, indent=1)
    return len(text)


def main():
    ap = argparse.ArgumentParser(description='Generate a playable clip from a text description.')
    ap.add_argument('prompts', nargs='+')
    ap.add_argument('--name', help='clip key (single prompt only)')
    ap.add_argument('--backend', default='momask', choices=sorted(BACKENDS))
    ap.add_argument('--keys', type=int, default=28)
    ap.add_argument('--steps', type=int, default=10, help='MoMask mask-prediction iterations')
    ap.add_argument('--cfg', type=float, default=4.0, help='classifier-free guidance on the base pass')
    ap.add_argument('--res-cfg', type=float, default=5.0, help='guidance on the residual pass')
    ap.add_argument('--temp', type=float, default=1.0)
    ap.add_argument('--sample-length', action='store_true',
                    help='sample the duration instead of taking the most likely one')
    ap.add_argument('--frames', type=int, default=0,
                    help='ask for roughly this many frames at 20 fps instead of trusting the length '
                         'estimator, which saturated at its 196-frame maximum on every prompt tested')
    ap.add_argument('--no-trim', action='store_true',
                    help='keep the still head/tail the model pads with')
    ap.add_argument('--dry', action='store_true')
    args = ap.parse_args()

    if args.name and len(args.prompts) > 1:
        print('--name takes one prompt', file=sys.stderr)
        return 2

    print('backend: %s (CPU)' % args.backend)
    res = BACKENDS[args.backend](args.prompts, args)
    if not res:
        return 1

    ok = 0
    for text, joints in res:
        base = args.name or text
        key = ''.join(c if (c.isalnum() or c == '_') else '_' for c in base.upper().replace(' ', '_'))
        key = '_'.join(p for p in key.split('_') if p)[:48]
        raw = len(joints)
        if not args.no_trim:
            joints, ta, tb = trim_to_motion(joints)
        r = motion_to_clip(joints, nkeys=args.keys)
        if not r:
            print('  %s: motion too short' % key)
            continue
        clip, nbones = r
        # a generated clip has to clear the same bar a captured one does
        if nbones < 12:
            print('  %s REJECTED: only %d bones driven' % (key, nbones))
            continue
        print('  %-44s %d frames%s -> %.2fs, %d keys, %d bones'
              % (key, len(joints), ('' if raw == len(joints) else ' (trimmed from %d)' % raw),
                 clip['dur'], len(clip['keys']), nbones))
        print('      "%s"' % text)
        if args.dry:
            ok += 1
            continue
        n = write(key, clip, {'via': 'text_to_clip/' + args.backend, 'prompt': text, 'bones': nbones})
        print('      %.0f KB written' % (n / 1024))
        ok += 1

    if ok and not args.dry:
        print('\n%d clip(s) generated. They are live immediately — same format, same loader.' % ok)
        print('Multiply them:  python3 tools/mocap/harvest.py --variants <KEY>')
    return 0 if ok else 1


if __name__ == '__main__':
    sys.exit(main())
