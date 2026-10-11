// Copyright BANNON.
#include "BannonPromotionManager.h"

void ABannonPromotionManager::BookMatch(ABannonFighterCharacter* F1, ABannonFighterCharacter* F2, FName MatchType)
{
    if (F1 && F2) {
        float Rating = (F1->StrikeMass + F2->StrikeMass) * 0.5f; 
        if (MatchType == "TitleMatch") Rating *= 1.5f;
        UE_LOG(LogTemp, Log, TEXT("Booked match: %s vs %s. MatchType: %s. Rating: %f"), *F1->GetName(), *F2->GetName(), *MatchType.ToString(), Rating);
    }
}
