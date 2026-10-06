"""Quaternion / euler math for the Bannon generative pipeline. Pure numpy, no deps."""
import numpy as np

def euler_to_quat(rx_deg, ry_deg, rz_deg, order="XYZ"):
    """Euler degrees -> glTF quaternion (x, y, z, w).
    order 'XYZ' = intrinsic rotations about X, then new Y, then new Z
    (equivalently q = qx * qy * qz). Documented convention for this pipeline.
    """
    x, y, z = np.radians([rx_deg, ry_deg, rz_deg])
    cx, sx = np.cos(x / 2), np.sin(x / 2)
    cy, sy = np.cos(y / 2), np.sin(y / 2)
    cz, sz = np.cos(z / 2), np.sin(z / 2)
    qx = np.array([sx, 0.0, 0.0, cx])
    qy = np.array([0.0, sy, 0.0, cy])
    qz = np.array([0.0, 0.0, sz, cz])
    return quat_mul(quat_mul(qx, qy), qz)

def quat_mul(a, b):
    """Hamilton product a*b (apply b first, then a). Quats as (x, y, z, w)."""
    ax, ay, az, aw = a
    bx, by, bz, bw = b
    return np.array([
        aw * bx + ax * bw + ay * bz - az * by,
        aw * by - ax * bz + ay * bw + az * bx,
        aw * bz + ax * by - ay * bx + az * bw,
        aw * bw - ax * bx - ay * by - az * bz,
    ])

def quat_conj(q):
    return np.array([-q[0], -q[1], -q[2], q[3]])

def quat_rotate(q, v):
    """Rotate vector v by unit quaternion q."""
    qv = np.array([v[0], v[1], v[2], 0.0])
    return quat_mul(quat_mul(q, qv), quat_conj(q))[:3]

def quat_normalize(q):
    n = np.linalg.norm(q)
    return q / n if n > 1e-12 else np.array([0.0, 0.0, 0.0, 1.0])

def quat_from_to(a, b):
    """Unit quaternion rotating direction a onto direction b."""
    a = a / (np.linalg.norm(a) + 1e-12)
    b = b / (np.linalg.norm(b) + 1e-12)
    d = float(np.dot(a, b))
    if d > 0.999999:
        return np.array([0.0, 0.0, 0.0, 1.0])
    if d < -0.999999:
        # 180 deg: pick any orthogonal axis
        axis = np.cross(a, np.array([1.0, 0.0, 0.0]))
        if np.linalg.norm(axis) < 1e-6:
            axis = np.cross(a, np.array([0.0, 1.0, 0.0]))
        axis = axis / np.linalg.norm(axis)
        return np.array([axis[0], axis[1], axis[2], 0.0])
    axis = np.cross(a, b)
    return quat_normalize(np.array([axis[0], axis[1], axis[2], 1.0 + d]))

def slerp(q0, q1, t):
    q0 = quat_normalize(np.asarray(q0, dtype=float))
    q1 = quat_normalize(np.asarray(q1, dtype=float))
    d = float(np.dot(q0, q1))
    if d < 0.0:
        q1 = -q1
        d = -d
    if d > 0.9995:
        return quat_normalize(q0 + t * (q1 - q0))
    th = np.arccos(d)
    s = np.sin(th)
    return (np.sin((1 - t) * th) / s) * q0 + (np.sin(t * th) / s) * q1

# ---- easing for keyframe baking ----
def ease_linear(t): return t
def ease_smooth(t):  # smoothstep
    t = min(max(t, 0.0), 1.0)
    return t * t * (3 - 2 * t)
def ease_out(t):
    t = min(max(t, 0.0), 1.0)
    return 1 - (1 - t) ** 3
def ease_snap(t):  # fast attack, hard stop (strikes)
    t = min(max(t, 0.0), 1.0)
    return 1 - (1 - t) ** 6
def ease_in(t):
    t = min(max(t, 0.0), 1.0)
    return t ** 3

EASES = {"linear": ease_linear, "smooth": ease_smooth, "out": ease_out,
         "snap": ease_snap, "in": ease_in}
