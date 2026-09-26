// Copyright BANNON.
#include "BannonCreationManager.h"

void UBannonCreationManager::LoadProfile(FName ProfileID)
{
    UE_LOG(LogTemp, Log, TEXT("Loading creation profile: %s"), *ProfileID.ToString());
}

void UBannonCreationManager::SaveProfile(const FCreationSaveProfile& Profile)
{
    UE_LOG(LogTemp, Log, TEXT("Saving creation profile: %s"), *Profile.ProfileID.ToString());
}
