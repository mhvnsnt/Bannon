// Copyright BANNON.
#include "BannonCrowd.h"

THIRD_PARTY_INCLUDES_START
#include "bannon_universe.h"
THIRD_PARTY_INCLUDES_END

int32 UBannonCrowd::React(EBannonCrowdEvent Event, float ImpactVel)
{
	bannon::CrowdEvent e = bannon::CE_NONE;
	switch (Event)
	{
		case EBannonCrowdEvent::WeaponImpact: e = bannon::CE_WEAPON_IMPACT; break;
		case EBannonCrowdEvent::HighArcThrow: e = bannon::CE_HIGH_ARC_THROW; break;
		case EBannonCrowdEvent::BotchOrStall: e = bannon::CE_BOTCH_OR_STALL; break;
		case EBannonCrowdEvent::DynamicPin:   e = bannon::CE_DYNAMIC_PIN; break;
		default: break;
	}
	const int32 pop = bannon::crowdReaction(e, ImpactVel);
	Excitement = FMath::Clamp(Excitement + pop * 0.06f, 0.f, 1.f);   // pops raise it, boos drop it
	return pop;
}

void UBannonCrowd::TickComponent(float Dt, ELevelTick TickType, FActorComponentTickFunction* Fn)
{
	Super::TickComponent(Dt, TickType, Fn);
	Excitement = FMath::FInterpTo(Excitement, 0.2f, Dt, 0.4f);   // settle toward idle hum
}
