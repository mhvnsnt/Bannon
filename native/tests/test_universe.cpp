#include "bannon_universe.h"
#include <cstdio>
#include <cmath>
using namespace bannon;
int main(){
  int fails=0; char b[160];
  auto check=[&](const char*n,bool ok,const char*d){ printf("[%s] %s %s\n",ok?"ok":"FAIL",n,d); if(!ok)fails++; };

  // ── trait subtypes bend the mass law without breaking MAX_BODY_VEL ──
  auto std290 = traitMods(131.f, T_NONE);          // 290 lbs standard heavyweight
  auto agile  = traitMods(131.f, T_AGILE_HEAVY);
  auto tech   = traitMods(82.f,  T_MAT_TECH);
  snprintf(b,sizeof b,"hw vel=%.2f agile=%.2f(tax %.1fx) tech=%.2f(+%.0f poise, tax %.1fx)",std290.velScale,agile.velScale,agile.staminaTax,tech.velScale,tech.poiseBonus,tech.staminaTax);
  check("agile-heavy-bypass", agile.velScale>std290.velScale && agile.aerialUnlock && !std290.aerialUnlock, b);
  check("agile-pays-in-gas", agile.staminaTax==2.5f, "2.5x stamina tax");
  check("agile-never-super-cruiser", agile.velScale<=1.0f, "cap: never faster than a fresh cruiser");
  check("mat-tech-trade", tech.velScale<traitMods(82.f,T_NONE).velScale && tech.poiseBonus==15.f && tech.staminaTax==0.8f, b);

  // ── TLC tables ──
  auto big = tableImpact(120.f, 3.5f);             // heavyweight driven down
  auto soft= tableImpact(70.f,  1.2f);             // light bump
  snprintf(b,sizeof b,"big: shatter=%d poise=%.0f spine=%.0f | soft: shatter=%d",big.shattered,big.poiseShock,big.spineDamage,soft.shattered);
  check("table-threshold", big.shattered && !soft.shattered, b);
  check("shatter-is-poise-bomb", big.poiseShock>soft.poiseShock*3.f && big.spineDamage>0.f && soft.spineDamage==0.f, "spine damage only on break");
  // ladder gate
  check("ladder-close-facing", canBindLadderClimb(Vec3(0,0,0),Vec3(0.6f,0,0),Vec3(1,0,0),0.8f), "climb binds");
  check("ladder-too-far", !canBindLadderClimb(Vec3(0,0,0),Vec3(2,0,0),Vec3(1,0,0),0.8f), "distance gate");
  check("ladder-facing-away", !canBindLadderClimb(Vec3(0,0,0),Vec3(0.6f,0,0),Vec3(-1,0,0),0.8f), "facing gate");
  check("ladder-gassed", !canBindLadderClimb(Vec3(0,0,0),Vec3(0.6f,0,0),Vec3(1,0,0),0.05f), "no gas = no climb");

  // ── iron man wear ──
  WrestlerState loser; loser.hp = 300.f; loser.stamina = MAX_STAMINA;
  float s1 = ironManFallReset(loser, 1);
  snprintf(b,sizeof b,"after fall 1: hp=%.0f stam=%.0f",loser.hp,s1);
  check("ironman-reset+wear", loser.hp==MAX_HP && fabsf(s1-(MAX_STAMINA*0.65f))<0.5f, b);
  float s3 = ironManFallReset(loser, 3);
  check("ironman-compounds", s3<s1 && s3>=MAX_STAMINA*0.1f-1e-3f, "later falls hit harder, floor holds");

  // ── crowd kinetics ──
  snprintf(b,sizeof b,"chair@3.5=%d throw@3.7=%d botch=%d pin=%d",crowdReaction(CE_WEAPON_IMPACT,3.5f),crowdReaction(CE_HIGH_ARC_THROW,3.7f),crowdReaction(CE_BOTCH_OR_STALL,0),crowdReaction(CE_DYNAMIC_PIN,0));
  check("crowd-scales-on-velocity", crowdReaction(CE_WEAPON_IMPACT,3.5f)>crowdReaction(CE_WEAPON_IMPACT,1.f) && crowdReaction(CE_HIGH_ARC_THROW,3.7f)==10, b);
  check("botch-draws-heat", crowdReaction(CE_BOTCH_OR_STALL,0)<0, "boos are negative");

  // ── GM booking math ──
  auto tame = scoreShow(false, 2.0f, false, 0);
  auto carnage = scoreShow(true, 3.7f, true, 2);
  snprintf(b,sizeof b,"tame=%.0f($%.0f) carnage=%.0f($%.0f, morale %.0f)",tame.rating,tame.revenue,carnage.rating,carnage.revenue,carnage.moraleDelta);
  check("booking-math", carnage.rating>tame.rating && carnage.revenue==carnage.rating*15000.f && carnage.moraleDelta<-25.f, b);
  check("rating-capped", scoreShow(true,3.8f,true,0).rating<=100.f, "cap 100");

  // ── friction politics ──
  PoliticsState p;
  auto e1 = processAction(p, false);               // first shoot spot
  auto e2 = processAction(p, false);               // second — cooperation 100→60→20
  snprintf(b,sizeof b,"coop=%.0f heat=%.0f shoot=%d slow=%d mutiny=%.2f",p.cooperation,p.heat,e2.shootAI,e2.slowCounts,e2.mutinyChance);
  check("script-break-escalates", !e1.shootAI && e2.shootAI && e2.slowCounts && e2.mutinyChance>0.f, b);
  PoliticsState calm; processAction(calm, true);
  check("scripted-stays-cool", calm.cooperation==100.f && calm.heat==0.f, "playing ball keeps peace");

  // ── god within consequences ──
  auto minor = matchConsequence(true, 0.1f);
  auto brutal= matchConsequence(true, 1.0f);
  auto clean = matchConsequence(false, 1.0f);
  snprintf(b,sizeof b,"minor=%dmo(strip %d) brutal=%dmo(strip %d) clean=%dmo",minor.injuryMonths,minor.stripTitles,brutal.injuryMonths,brutal.stripTitles,clean.injuryMonths);
  check("consequence-scales", minor.injuryMonths<brutal.injuryMonths && brutal.stripTitles && !minor.stripTitles && brutal.revengeSeed, b);
  check("no-break-no-story", clean.injuryMonths==0 && !clean.revengeSeed, "clean matches leave no scars");

  printf(fails?"\n%d FAIL\n":"\nALL PASS\n",fails); return fails?1:0;
}
