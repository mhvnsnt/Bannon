// Copyright BANNON.

#include "BannonPromoBattleEngine.h"
#include "GameFramework/Character.h"

UBannonPromoBattleEngine::UBannonPromoBattleEngine()
{
	PrimaryComponentTick.bCanEverTick = false;
}

void UBannonPromoBattleEngine::ProcessPromoKeywords(const TArray<FString>& DialogueKeywords, ACharacter* Speaker)
{
	if (!Speaker) return;
	
	for (const FString& Word : DialogueKeywords) {
		if (Word.Equals("Betrayal", ESearchCase::IgnoreCase)) {
			// Apply crowd heat multiplier
		}
	}
}

void UBannonPromoBattleEngine::ShiftRivalryGraph(ACharacter* Attacker, ACharacter* Victim)
{
	if (!Attacker || !Victim) return;
	
	// Increment hostility meter between characters based on backstage assaults.
	// Feeds into the Match Card Booking Engine.
}
