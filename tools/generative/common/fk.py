"""Forward kinematics for glTF/GLB skeletons. Reads node hierarchy + skin joints.
Pure numpy. Used to verify generated animations visually (stick figures)."""
import numpy as np
from .quat import quat_mul, quat_rotate, quat_normalize

IDENT_Q = np.array([0.0, 0.0, 0.0, 1.0])

def decompose_matrix(M):
    """glTF column-major 4x4 -> (translation (3,), quaternion (x,y,z,w), scale (3,)).
    Handles TRS (no skew)."""
    M = np.asarray(M, dtype=float).reshape(4, 4, order="F")
    t = M[:3, 3].copy()
    R = M[:3, :3].copy()
    sx = np.linalg.norm(R[:, 0]); sy = np.linalg.norm(R[:, 1]); sz = np.linalg.norm(R[:, 2])
    s = np.array([sx, sy, sz])
    if sx > 1e-12: R[:, 0] /= sx
    if sy > 1e-12: R[:, 1] /= sy
    if sz > 1e-12: R[:, 2] /= sz
    # rotation matrix -> quaternion (Shepards method)
    tr = np.trace(R)
    if tr > 0:
        ss = np.sqrt(tr + 1.0) * 2
        w = 0.25 * ss
        x = (R[2, 1] - R[1, 2]) / ss
        y = (R[0, 2] - R[2, 0]) / ss
        z = (R[1, 0] - R[0, 1]) / ss
    elif R[0, 0] > R[1, 1] and R[0, 0] > R[2, 2]:
        ss = np.sqrt(1.0 + R[0, 0] - R[1, 1] - R[2, 2]) * 2
        w = (R[2, 1] - R[1, 2]) / ss
        x = 0.25 * ss
        y = (R[0, 1] + R[1, 0]) / ss
        z = (R[0, 2] + R[2, 0]) / ss
    elif R[1, 1] > R[2, 2]:
        ss = np.sqrt(1.0 + R[1, 1] - R[0, 0] - R[2, 2]) * 2
        w = (R[0, 2] - R[2, 0]) / ss
        x = (R[0, 1] + R[1, 0]) / ss
        y = 0.25 * ss
        z = (R[1, 2] + R[2, 1]) / ss
    else:
        ss = np.sqrt(1.0 + R[2, 2] - R[0, 0] - R[1, 1]) * 2
        w = (R[1, 0] - R[0, 1]) / ss
        x = (R[0, 2] + R[2, 0]) / ss
        y = (R[1, 2] + R[2, 1]) / ss
        z = 0.25 * ss
    q = np.array([x, y, z, w])
    n = np.linalg.norm(q)
    return t, (q / n if n > 1e-12 else IDENT_Q.copy()), s

class Skeleton:
    def __init__(self, nodes):
        """nodes: list of dicts with name/translation/rotation/children (glTF node JSON)."""
        self.nodes = nodes
        self.n = len(nodes)
        self.name2idx = {nd.get("name", f"node_{i}"): i for i, nd in enumerate(nodes)}
        self.parent = [-1] * self.n
        for i, nd in enumerate(nodes):
            for c in nd.get("children", []) or []:
                self.parent[c] = i
        self.local_t = np.zeros((self.n, 3))
        self.local_q = np.tile(IDENT_Q, (self.n, 1))
        for i, nd in enumerate(nodes):
            if nd.get("matrix"):
                t, q, _s = decompose_matrix(nd["matrix"])
                self.local_t[i] = t
                self.local_q[i] = q
            else:
                if nd.get("translation"):
                    self.local_t[i] = nd["translation"]
                if nd.get("rotation"):
                    self.local_q[i] = quat_normalize(np.asarray(nd["rotation"], dtype=float))

    def fk(self, bone_rotations=None, root_offset=None):
        """bone_rotations: {node_idx: quat} local-space key rotations (composed over rest).
        Returns (world_pos (n,3), world_quat (n,4))."""
        P = np.zeros((self.n, 3))
        Q = np.tile(IDENT_Q, (self.n, 1))
        order = self._topo_order()
        for i in order:
            q_local = quat_mul(self.local_q[i], bone_rotations.get(i, IDENT_Q)) \
                if bone_rotations else self.local_q[i]
            p = self.parent[i]
            if p < 0:
                Q[i] = q_local
                P[i] = self.local_t[i] + (root_offset if root_offset is not None else 0)
            else:
                Q[i] = quat_mul(Q[p], q_local)
                P[i] = P[p] + quat_rotate(Q[p], self.local_t[i])
        return P, Q

    def _topo_order(self):
        order, seen = [], set()
        def visit(i):
            if i in seen: return
            seen.add(i)
            if self.parent[i] >= 0: visit(self.parent[i])
            order.append(i)
        for i in range(self.n): visit(i)
        return order

    def joint_world_rest(self, names):
        P, _ = self.fk()
        return {nm: P[self.name2idx[nm]] for nm in names if nm in self.name2idx}


def load_skeleton_from_glb_json(js):
    return Skeleton(js["nodes"])
