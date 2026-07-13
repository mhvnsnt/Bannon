// Copyright BANNON.
#include "BannonLaws.h"
#include "BannonBridge.h"

THIRD_PARTY_INCLUDES_START
#include "bannon_referee.h"
THIRD_PARTY_INCLUDES_END

float UBannonLaws::MaxHP()       { return bannon::MAX_HP; }
float UBannonLaws::DmgScale()    { return bannon::DMG_SCALE; }
float UBannonLaws::MaxBodyVel()  { return bannon::MAX_BODY_VEL; }
float UBannonLaws::MaxStamina()  { return bannon::MAX_STAMINA; }

FQuat UBannonLaws::RollStableAim(FVector RestFwd, FVector TargetDir)
{
	bannon::Quat q = bannon::rollStableAim(BannonBridge::ToNative(RestFwd), BannonBridge::ToNative(TargetDir));
	return BannonBridge::ToUE(q);
}

bool UBannonLaws::SubmissionStep(float& JointRotation, float RotationLimit, float& LimbHP,
                                 float AttackerCrank, float DefenderResist, float& DefenderStamina, float Dt)
{
	bannon::SubJoint j{ JointRotation, RotationLimit, LimbHP };
	bool tapped = bannon::submissionStep(j, AttackerCrank, DefenderResist, DefenderStamina, Dt);
	JointRotation = j.rotation; LimbHP = j.limbHp;
	return tapped;
}

bool UBannonLaws::PinKickout(float HpFrac, float StamFrac, float KickTime, float MassDelta,
                             float& OutBurstVel, float& OutStruggleTime)
{
	bannon::KickoutResult r = bannon::pinKickout(HpFrac, StamFrac, KickTime, MassDelta);
	OutBurstVel = r.burstVel; OutStruggleTime = r.struggleTime;
	return r.escaped;
}
