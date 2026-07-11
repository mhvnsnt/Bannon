#include "bannon_persona.h"
#include <cstdio>

using namespace bannon;

int main() {
    int fails = 0;
    auto check = [&](const char* n, bool ok, const char* d){ printf("[%s] %s %s\n", ok?"ok":"FAIL", n, d); if(!ok)fails++; };
    char b[160];

    PersonaMods mq = personaMods(P_MARQUIS), bn = personaMods(P_BANNON), mm = personaMods(P_MAIME);

    // Marquis: lowest damage, best counter window.
    bool mqOk = mq.damageMult < bn.damageMult && mq.damageMult < mm.damageMult && mq.counterWindow > bn.counterWindow && mq.counterWindow > mm.counterWindow;
    snprintf(b, sizeof b, "dmg %.2f (< %.2f,%.2f)  counter %.2f (best)", mq.damageMult, bn.damageMult, mm.damageMult, mq.counterWindow);
    check("marquis-technical", mqOk, b);

    // Bannon: highest stagger resistance.
    bool bnOk = bn.staggerThreshold > mq.staggerThreshold && bn.staggerThreshold > mm.staggerThreshold;
    snprintf(b, sizeof b, "stagger thr %.1f (> %.1f,%.1f)", bn.staggerThreshold, mq.staggerThreshold, mm.staggerThreshold);
    check("bannon-resilient", bnOk, b);

    // Maime: highest damage + only one with dash jitter.
    bool mmOk = mm.damageMult > bn.damageMult && mm.dashJitter > 0.0f && bn.dashJitter == 0.0f && mq.dashJitter == 0.0f;
    snprintf(b, sizeof b, "dmg %.2f (highest)  jitter %.2f (only Maime)", mm.damageMult, mm.dashJitter);
    check("maime-feral", mmOk, b);

    // applyPersona scales force; Maime drives the connect to the impact cap.
    Strike base{ J_HEAD, 6.0f, 2.0f };
    float fMarquis = applyPersona(P_MARQUIS, base).baseForce;
    Strike sMaime = applyPersona(P_MAIME, base);
    bool scaleOk = applyPersona(P_BANNON, base).baseForce > fMarquis && sMaime.limbVelocity == mm.impactVelCap;
    snprintf(b, sizeof b, "force marquis %.2f < bannon %.2f ; maime connect vel=%.2f (cap)", fMarquis, applyPersona(P_BANNON,base).baseForce, sMaime.limbVelocity);
    check("apply-persona-strike", scaleOk, b);

    // Stagger gate: a 2.5 impact staggers Marquis but NOT Bannon.
    bool stag = staggers(P_MARQUIS, 2.5f) && !staggers(P_BANNON, 2.5f);
    snprintf(b, sizeof b, "impact 2.5 staggers marquis=%d bannon=%d", staggers(P_MARQUIS,2.5f), staggers(P_BANNON,2.5f));
    check("stagger-gate", stag, b);

    // Dash jitter: Maime's dash is perturbed off the clean vector; Marquis/Bannon unchanged.
    Vec3 dash(1.0f, 0.0f, 0.0f);
    Vec3 mqDash = applyDashJitter(P_MARQUIS, dash, 42u);
    Vec3 mmDash = applyDashJitter(P_MAIME, dash, 42u);
    bool jitOk = (mqDash - dash).length() < 1e-6f && (mmDash - dash).length() > 0.01f;
    snprintf(b, sizeof b, "marquis dev=%.4f (0) maime dev=%.4f (>0)", (mqDash-dash).length(), (mmDash-dash).length());
    check("dash-jitter", jitOk, b);

    printf(fails ? "\n%d FAIL\n" : "\nALL PASS\n", fails);
    return fails ? 1 : 0;
}
