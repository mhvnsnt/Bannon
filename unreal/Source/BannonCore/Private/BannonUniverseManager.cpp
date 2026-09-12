// Copyright BANNON.

#include "BannonUniverseManager.h"
#include "GameFramework/Character.h"

UBannonUniverseManager::UBannonUniverseManager()
{
	PrimaryComponentTick.bCanEverTick = false;
}

void UBannonUniverseManager::CalculateTVRating(float MatchQuality, int32 NearFalls, bool bBloodDrawn)
{
	// E.g. Near falls increase drama multiplier. Blood drawn shifts demographic rating.
	float BaseRating = 2.5f; 
	float FinalRating = BaseRating + (NearFalls * 0.1f) + (bBloodDrawn ? 0.3f : 0.0f);
	
	// Feeds back into federation budget for pyro and talent acquisition.
}

void UBannonUniverseManager::AutoBookMatchCard()
{
	// Pulls from BannonPromoBattleEngine rivalry graphs to generate PPV main events.
	// Auto-assigns run-ins based on allied factions.
}

void UBannonUniverseManager::RegisterTitleChange(ACharacter* NewChampion, FName TitleID)
{
	if (!NewChampion) return;
	// Appends to an immutable ledger (e.g. tracking days held) 
}
