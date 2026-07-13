// Copyright BANNON.
#include "BannonGameMode.h"

THIRD_PARTY_INCLUDES_START
#include "bannon_universe.h"
THIRD_PARTY_INCLUDES_END

FBannonShowResult ABannonGameMode::ScoreShow(bool bExtremeStips, float MaxImpactVel, bool bCriticalInjury, int32 FrictionSpikes) const
{
	bannon::ShowResult r = bannon::scoreShow(bExtremeStips, MaxImpactVel, bCriticalInjury, FrictionSpikes);
	FBannonShowResult Out;
	Out.Rating = r.rating; Out.Revenue = r.revenue; Out.MoraleDelta = r.moraleDelta;
	return Out;
}

void ABannonGameMode::MatchConsequence(bool bConstraintBroken, float OverTorque01, int32& OutInjuryMonths, bool& bOutStripTitles, bool& bOutRevengeSeed) const
{
	bannon::Consequence c = bannon::matchConsequence(bConstraintBroken, OverTorque01);
	OutInjuryMonths = c.injuryMonths; bOutStripTitles = c.stripTitles; bOutRevengeSeed = c.revengeSeed;
}
