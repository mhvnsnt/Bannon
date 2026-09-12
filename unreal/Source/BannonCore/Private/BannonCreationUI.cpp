// AI ORIENTATION BLOCK v114
#include "BannonCreationUI.h"
#include "BannonPhysicsLaws.h"
#include "BannonSaveSystem.h"
#include "Kismet/GameplayStatics.h"
#include "Engine/GameInstance.h"

void UBannonCreationUI::SetIdentity(const FString& SuperstarName, const FString& EntranceName) {
    CurrentSuperstarName = SuperstarName;
    CurrentEntranceName = EntranceName;
}

void UBannonCreationUI::AllocateAttributes(float HP, float Speed, float DamageModifier) {
    AssignedHP = FMath::Clamp(HP, 0.0f, bannon::MAX_HP);
    AssignedSpeed = FMath::Clamp(Speed, 0.0f, bannon::MAX_BODY_VEL);
    AssignedDamage = FMath::Clamp(DamageModifier, 0.0f, bannon::DMG_SCALE);
}

void UBannonCreationUI::CommitCreationToDisk() {
    UBannonSaveSystem* SaveSystem = GetGameInstance()->GetSubsystem<UBannonSaveSystem>();
    if (SaveSystem) {
        FString JsonPayload = FString::Printf(TEXT("{\"identity\":{\"name\":\"%s\",\"entrance\":\"%s\"},\"physics\":{\"hp\":%f,\"speed\":%f,\"dmg\":%f}}"),
            *CurrentSuperstarName, *CurrentEntranceName, AssignedHP, AssignedSpeed, AssignedDamage);
        
        SaveSystem->SaveCharacterToDisk(JsonPayload);
    }
}
