#include "bannon_anim_bridge.h"
#include "bannon_rig.h"
#include <cstdio>
#include <cmath>
using namespace bannon;
int main(){
  int fails=0; char b[200];
  auto check=[&](const char*n,bool ok,const char*d){ printf("[%s] %s %s\n",ok?"ok":"FAIL",n,d); if(!ok)fails++; };

  // ── roll-stable aim: points the bone at the target with a DETERMINISTIC roll ──
  Vec3 restFwd(0,-1,0);                       // a leg's rest forward = straight down
  Vec3 target = Vec3(0.2f,-1.0f,-0.3f);       // aim slightly forward/side
  Quat q = rollStableAim(restFwd, target);
  Vec3 aimed = q.rotate(restFwd).normalized(), tn = target.normalized();
  snprintf(b,sizeof b,"aimed=(%.2f,%.2f,%.2f) target=(%.2f,%.2f,%.2f)",aimed.x,aimed.y,aimed.z,tn.x,tn.y,tn.z);
  check("aim-hits-target", (aimed-tn).length()<1e-3f, b);
  // determinism: same inputs → identical quaternion (no random roll flip)
  Quat q2 = rollStableAim(restFwd, target);
  check("aim-deterministic", std::fabs(q.x-q2.x)+std::fabs(q.y-q2.y)+std::fabs(q.z-q2.z)+std::fabs(q.w-q2.w)<1e-6f, "same in → same out");
  // the pathological near-vertical case that spiraled the leg with a bare shortest-arc:
  Vec3 down=Vec3(0,-1,0), nearDown=Vec3(0.02f,-1.0f,0.01f);
  Vec3 a2 = rollStableAim(down, nearDown).rotate(down).normalized();
  check("aim-near-vertical-stable", (a2-nearDown.normalized()).length()<1e-3f, "no flip on a straight-down limb");

  // ── limb-family separation: the A-pose hand-on-thigh case ──
  // Build arm + leg segments from the rig rest layout. Then place a vertex where the A-pose HAND
  // rests against the THIGH and confirm it classifies as LEG (not arm) — the whole point of v4.4.
  Vec3 armA[2]={ JOINT_REST[J_SHL], JOINT_REST[J_ELL] }, armB[2]={ JOINT_REST[J_ELL], JOINT_REST[J_HAL] };
  Vec3 legA[2]={ JOINT_REST[J_HIPL], JOINT_REST[J_KNL] }, legB[2]={ JOINT_REST[J_KNL], JOINT_REST[J_FTL] };
  Vec3 torA[2]={ JOINT_REST[J_PELVIS], JOINT_REST[J_CHEST] }, torB[2]={ JOINT_REST[J_CHEST], JOINT_REST[J_HEAD] };
  FamilySegments seg{ armA,armB,2, legA,legB,2, torA,torB,2 };
  // a thigh-surface vertex ~ near the upper leg segment
  Vec3 thigh(0.16f, 0.75f, 0.06f);
  Vec3 hand (0.34f, 0.90f, 0.00f);            // right on the hand joint
  Vec3 chest(0.02f, 1.30f, 0.05f);
  snprintf(b,sizeof b,"thigh→%d hand→%d chest→%d (arm=0 leg=1 tor=2)",limbFamily(thigh,seg),limbFamily(hand,seg),limbFamily(chest,seg));
  check("thigh-is-leg", limbFamily(thigh,seg)==LF_LEG, b);
  check("hand-is-arm",  limbFamily(hand,seg)==LF_ARM, b);
  check("chest-is-torso",limbFamily(chest,seg)==LF_TORSO, b);

  // edge-cut + seed rules: arm↔leg severed, torso links kept, cross-family seeding blocked
  check("cut-arm-leg", isCrossLimbEdge(LF_ARM,LF_LEG) && isCrossLimbEdge(LF_LEG,LF_ARM), "sever the contact bridge");
  check("keep-torso-links", !isCrossLimbEdge(LF_ARM,LF_TORSO) && !isCrossLimbEdge(LF_LEG,LF_TORSO), "arm/leg↔torso stay");
  check("seed-gate", !seedAllowed(LF_ARM,LF_LEG) && !seedAllowed(LF_LEG,LF_ARM) && seedAllowed(LF_ARM,LF_TORSO), "no cross-family seeds");

  // segment distance sanity
  check("segdist", std::fabs(segmentDist(Vec3(0,0,0), Vec3(-1,1,0), Vec3(1,1,0)) - 1.0f)<1e-4f, "point to segment = 1.0");

  printf(fails?"\n%d FAIL\n":"\nALL PASS\n",fails); return fails?1:0;
}
