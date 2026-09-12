#pragma once
// BANNON native math — no web deps. Header-only Vec3 / Quaternion for the physics + IK core.
#include <cmath>

namespace bannon {

struct Vec3 {
    float x, y, z;
    Vec3() : x(0), y(0), z(0) {}
    Vec3(float x_, float y_, float z_) : x(x_), y(y_), z(z_) {}

    Vec3 operator+(const Vec3& v) const { return {x + v.x, y + v.y, z + v.z}; }
    Vec3 operator-(const Vec3& v) const { return {x - v.x, y - v.y, z - v.z}; }
    Vec3 operator*(float s)      const { return {x * s, y * s, z * s}; }
    Vec3& operator+=(const Vec3& v) { x += v.x; y += v.y; z += v.z; return *this; }
    Vec3& operator-=(const Vec3& v) { x -= v.x; y -= v.y; z -= v.z; return *this; }

    float dot(const Vec3& v) const { return x * v.x + y * v.y + z * v.z; }
    Vec3  cross(const Vec3& v) const { return {y*v.z - z*v.y, z*v.x - x*v.z, x*v.y - y*v.x}; }
    float lengthSq() const { return x*x + y*y + z*z; }
    float length()   const { return std::sqrt(lengthSq()); }
    Vec3  normalized() const { float m = length(); return m > 1e-8f ? (*this) * (1.0f / m) : Vec3(); }

    // clamp magnitude — the native MAX_BODY_VEL cap lives here
    Vec3 clampedLength(float maxLen) const {
        float l2 = lengthSq();
        if (l2 > maxLen * maxLen && l2 > 1e-12f) return (*this) * (maxLen / std::sqrt(l2));
        return *this;
    }
};

struct Quat {
    float x, y, z, w;
    Quat() : x(0), y(0), z(0), w(1) {}
    Quat(float x_, float y_, float z_, float w_) : x(x_), y(y_), z(z_), w(w_) {}

    void normalize() {
        float m = std::sqrt(x*x + y*y + z*z + w*w);
        if (m > 1e-8f) { x /= m; y /= m; z /= m; w /= m; }
    }

    Quat operator*(const Quat& q) const {
        return {
            w*q.x + x*q.w + y*q.z - z*q.y,
            w*q.y - x*q.z + y*q.w + z*q.x,
            w*q.z + x*q.y - y*q.x + z*q.w,
            w*q.w - x*q.x - y*q.y - z*q.z
        };
    }

    Quat conjugate() const { return {-x, -y, -z, w}; }

    // rotate a vector by this quaternion
    Vec3 rotate(const Vec3& v) const {
        Vec3 u(x, y, z);
        return u * (2.0f * u.dot(v)) + v * (w*w - u.lengthSq()) + u.cross(v) * (2.0f * w);
    }

    static Quat fromAxisAngle(const Vec3& axis, float rad) {
        Vec3 a = axis.normalized();
        float s = std::sin(rad * 0.5f);
        return {a.x * s, a.y * s, a.z * s, std::cos(rad * 0.5f)};
    }
};

// quaternion from three orthonormal basis vectors (right, up, forward) — matrix→quat, no renderer.
inline Quat quatFromBasis(const Vec3& r, const Vec3& u, const Vec3& f) {
    float m00=r.x, m10=r.y, m20=r.z, m01=u.x, m11=u.y, m21=u.z, m02=f.x, m12=f.y, m22=f.z;
    float tr = m00 + m11 + m22; Quat q;
    if (tr > 0) { float s = std::sqrt(tr + 1.0f) * 2.0f; q.w = 0.25f*s; q.x = (m21-m12)/s; q.y = (m02-m20)/s; q.z = (m10-m01)/s; }
    else if (m00 > m11 && m00 > m22) { float s = std::sqrt(1.0f+m00-m11-m22)*2.0f; q.w=(m21-m12)/s; q.x=0.25f*s; q.y=(m01+m10)/s; q.z=(m02+m20)/s; }
    else if (m11 > m22) { float s = std::sqrt(1.0f+m11-m00-m22)*2.0f; q.w=(m02-m20)/s; q.x=(m01+m10)/s; q.y=0.25f*s; q.z=(m12+m21)/s; }
    else { float s = std::sqrt(1.0f+m22-m00-m11)*2.0f; q.w=(m10-m01)/s; q.x=(m02+m20)/s; q.y=(m12+m21)/s; q.z=0.25f*s; }
    q.normalize(); return q;
}

// smallest rotation taking `from` to `to` (used by PD controllers to compute joint error)
inline Quat rotationBetween(const Vec3& from, const Vec3& to) {
    Vec3 f = from.normalized(), t = to.normalized();
    float d = f.dot(t);
    if (d >= 1.0f - 1e-6f) return Quat();
    if (d <= -1.0f + 1e-6f) {
        Vec3 axis = Vec3(1,0,0).cross(f);
        if (axis.lengthSq() < 1e-6f) axis = Vec3(0,1,0).cross(f);
        return Quat::fromAxisAngle(axis.normalized(), 3.14159265f);
    }
    Vec3 c = f.cross(t);
    Quat q(c.x, c.y, c.z, 1.0f + d);
    q.normalize();
    return q;
}

} // namespace bannon
