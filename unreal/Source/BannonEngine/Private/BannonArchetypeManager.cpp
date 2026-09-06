// Copyright BANNON.
#include "BannonArchetypeManager.h"
#include "GameFramework/Character.h"
#include "GameFramework/CharacterMovementComponent.h"

void UBannonArchetypeManager::ApplyArchetype(AActor* Fighter, EBannonArchetype Archetype)
{
    ACharacter* Char = Cast<ACharacter>(Fighter);
    if (!Char) return;

    UCharacterMovementComponent* MoveComp = Char->GetCharacterMovement();
    if (!MoveComp) return;

    switch(Archetype)
    {
        case EBannonArchetype::Powerhouse:
            MoveComp->MaxWalkSpeed = 300.0f; // Heavy, slow
            UE_LOG(LogTemp, Log, TEXT("Applied Powerhouse: Reduced Speed, Increased Strength"));
            break;
        case EBannonArchetype::HighFlyer:
            MoveComp->JumpZVelocity = 1200.0f; // High agility
            UE_LOG(LogTemp, Log, TEXT("Applied HighFlyer: Increased Jump"));
            break;
        default:
            MoveComp->MaxWalkSpeed = 600.0f;
            break;
    }
}
