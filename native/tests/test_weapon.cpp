#include "bannon_weapon.h"
#include <cstdio>
#include <cmath>
using namespace bannon;
int main(){
  int fails=0; char b[160];
  auto check=[&](const char*n,bool ok,const char*d){ printf("[%s] %s %s\n",ok?"ok":"FAIL",n,d); if(!ok)fails++; };

  Vec3 fwd(1,0,0);
  // A=SLAM drives DOWN harder than gravity start; B=DROP adds nothing; X=THROW is flat+far; Y=TOSS spins.
  auto slam=releaseImpulse(R_SLAM,fwd,1.f,1.f), drop=releaseImpulse(R_DROP,fwd,1.f,1.f);
  auto thrw=releaseImpulse(R_THROW,fwd,1.f,1.f), toss=releaseImpulse(R_TOSS,fwd,1.f,1.f);
  snprintf(b,sizeof b,"slam vy=%.2f drop |v|=%.2f",slam.velocity.y,drop.velocity.length());
  check("slam-down/drop-zero", slam.velocity.y<-1.5f && drop.velocity.length()<1e-6f, b);
  snprintf(b,sizeof b,"throw vx=%.2f vy=%.2f toss vy=%.2f ang=%.2f",thrw.velocity.x,thrw.velocity.y,toss.velocity.y,toss.angular);
  check("throw-flat/toss-arc", thrw.velocity.x>toss.velocity.x && toss.velocity.y>thrw.velocity.y && toss.angular>thrw.angular, b);
  check("toss-costs-most", toss.staminaCost>thrw.staminaCost && thrw.staminaCost>drop.staminaCost, "stamina ordering");
  check("gassed-toss-botches", releaseImpulse(R_TOSS,fwd,0.15f,1.f).botchRisk && !toss.botchRisk, "botch gate");
  check("velocity-capped", releaseImpulse(R_THROW,fwd,1.f,0.4f).velocity.length()<=MAX_BODY_VEL+1e-4f, "MAX_BODY_VEL holds");

  // weapons
  Weapon chair{3.5f, 1.1f, 100.f}, steps{18.f, 0.8f, 300.f};
  float hit=swingStaminaCost(chair,3.0f,false,false,1.f);
  float whiff=swingStaminaCost(chair,3.0f,true,false,1.f);
  float hurt=swingStaminaCost(chair,3.0f,false,false,0.15f);
  snprintf(b,sizeof b,"hit=%.1f whiff=%.1f(×%.2f) hurtArm=%.1f",hit,whiff,whiff/hit,hurt);
  check("whiff-2.5x", fabsf(whiff/hit-2.5f)<0.01f, b);
  check("injury-drag", hurt>hit*1.5f, b);
  check("heavy-costs-more", swingStaminaCost(steps,3.f,false,false,1.f)>hit*3.f, "steps >> chair");
  check("wrecked-arm-caps-swing", swingVelocityCap(0.f)<MAX_BODY_VEL*0.7f && swingVelocityCap(1.f)==MAX_BODY_VEL, "vel cap");
  bool dropped=false; float dmg=weaponImpact(chair,3.5f,1.f,dropped);
  bool dropped2=false; weaponImpact(steps,3.5f,0.2f,dropped2);
  snprintf(b,sizeof b,"chair dmg=%.0f integ=%.0f weakGripDrops=%d",dmg,chair.integrity,dropped2);
  check("impact-dmg+deform+drop", dmg>50.f && chair.integrity<100.f && dropped2 && !dropped, b);
  // universal move stamina
  float mBase=moveStaminaCost(60,false,false,1.f), mMiss=moveStaminaCost(60,true,false,1.f), mRev=moveStaminaCost(60,false,true,1.f);
  snprintf(b,sizeof b,"base=%.1f miss=%.1f rev=%.1f",mBase,mMiss,mRev);
  check("all-moves-tax", mMiss==mBase*2.f && mRev>mBase, b);

  printf(fails?"\n%d FAIL\n":"\nALL PASS\n",fails); return fails?1:0;
}
