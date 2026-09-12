#include "bannon_referee.h"
#include <cstdio>
#include <cmath>
using namespace bannon;
int main(){
  int fails=0; char b[160];
  auto check=[&](const char*n,bool ok,const char*d){ printf("[%s] %s %s\n",ok?"ok":"FAIL",n,d); if(!ok)fails++; };

  // ── line of sight ──
  Vec3 eye(0,1.7f,0), facing(1,0,0), shoulders(2.5f,0.15f,0);
  check("los-clear", refHasLineOfSight(eye,facing,shoulders,nullptr,0), "open lane counts");
  Vec3 blocker[1] = { Vec3(1.25f,0.9f,0) };   // a body square on the sight line
  check("los-occluded", !refHasLineOfSight(eye,facing,shoulders,blocker,1), "body in lane blocks the count");
  Vec3 wide[1] = { Vec3(1.25f,0.9f,1.5f) };   // same depth, off the line
  check("los-occluder-off-line", refHasLineOfSight(eye,facing,shoulders,wide,1), "offset body doesn't block");
  check("los-behind-ref", !refHasLineOfSight(eye,Vec3(-1,0,0),shoulders,nullptr,0), "pin behind the ref = no count");

  // ── predictive avoidance ──
  Vec3 refPos(2,0,0.3f), mover(0,0,0), moverVel(3.5f,0,0);       // whip coming right at him
  Vec3 esc = refAvoidanceVelocity(refPos,mover,moverVel);
  snprintf(b,sizeof b,"esc=(%.2f,%.2f,%.2f)",esc.x,esc.y,esc.z);
  check("avoid-fires-in-path", esc.length()>0.3f, b);
  check("avoid-is-lateral", fabsf(esc.z)>fabsf(esc.x), "escape is perpendicular to travel, not backpedal");
  check("avoid-capped", esc.length()<=MAX_BODY_VEL*0.7f+1e-4f, "refs jog");
  check("avoid-idle-when-clear", refAvoidanceVelocity(Vec3(2,0,3),mover,moverVel).length()<1e-6f, "off the line = no reaction");
  check("avoid-idle-slow-mover", refAvoidanceVelocity(refPos,mover,Vec3(0.2f,0,0)).length()<1e-6f, "walkers aren't threats");

  // ── ref bump ──
  RefState ref;
  float down = refBump(ref, 3.2f);
  snprintf(b,sizeof b,"hp=%.0f poise=%.1f downFor=%.1fs",ref.hp,ref.poise,down);
  check("bump-floors-ref", ref.down && down>2.5f && ref.hp<1000.f, b);
  RefState ref2; float down2 = refBump(ref2, 0.8f);
  check("soft-contact-stays-up", !ref2.down && down2==0.f && ref2.poise<40.f, "brush costs poise only");

  // ── pin kickout tiers ──
  auto k1 = pinKickout(0.9f,0.9f, 0.5f, 1.f);
  auto k2 = pinKickout(0.9f,0.9f, 2.0f, 1.f);
  auto k29= pinKickout(0.9f,0.9f, 2.95f,1.f);
  snprintf(b,sizeof b,"burst 1ct=%.2f 2ct=%.2f 2.9=%.2f struggle=%.2f/%.2f/%.2f",k1.burstVel,k2.burstVel,k29.burstVel,k1.struggleTime,k2.struggleTime,k29.struggleTime);
  check("kickout-tiers", k1.burstVel>k2.burstVel && k2.burstVel>k29.burstVel && k29.struggleTime>k2.struggleTime && k2.struggleTime>k1.struggleTime, b);
  check("kickout-capped", k1.burstVel<=MAX_BODY_VEL+1e-4f, "MAX_BODY_VEL holds");
  auto dead = pinKickout(0.1f,0.05f, 2.0f, 1.f);
  check("spent-cant-kick", !dead.escaped && dead.burstVel==0.f, "no reserve = 3-count");
  auto heavy = pinKickout(0.5f,0.5f, 2.0f, 1.8f);
  auto light = pinKickout(0.5f,0.5f, 2.0f, 0.7f);
  snprintf(b,sizeof b,"underHeavy=%.2f underLight=%.2f",heavy.burstVel,light.burstVel);
  check("mass-delta-gravity", light.burstVel>heavy.burstVel, b);

  // ── submission: torque → limb HP → organic tap ──
  SubJoint arm{0.f, 1.2f, 1000.f};
  float stam = MAX_STAMINA;
  bool tapped=false; int steps=0;
  while(!tapped && steps<3000){ tapped = submissionStep(arm, 1.0f, 0.25f, stam, 1.f/120.f); steps++; }
  snprintf(b,sizeof b,"tapped@%.1fs rot=%.2f/%.2f limbHp=%.0f stam=%.0f",steps/120.f,arm.rotation,arm.rotationLimit,arm.limbHp,stam);
  check("hold-cranks-to-tap", tapped && arm.rotation>arm.rotationLimit*0.9f, b);
  SubJoint arm2{0.f, 1.2f, 1000.f};
  float stam2 = MAX_STAMINA; bool t2=false;
  for(int i=0;i<240 && !t2;i++) t2 = submissionStep(arm2, 0.3f, 1.0f, stam2, 1.f/120.f);
  snprintf(b,sizeof b,"2s full-resist: rot=%.2f tapped=%d",arm2.rotation,(int)t2);
  check("resist-holds-neutral", !t2 && arm2.rotation<0.2f, b);
  check("resisting-gasses", stam2<MAX_STAMINA, "fighting the hold costs stamina");

  printf(fails?"\n%d FAIL\n":"\nALL PASS\n",fails); return fails?1:0;
}
