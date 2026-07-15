// Copyright BANNON.
#include "BannonArchetypeManager.h"
#include "GameFramework/CharacterMovementComponent.h"

void UBannonArchetypeManager::ApplyArchetype(AActor* Fighter, EBannonArchetype Archetype)
{
    ACharacter* Char = Cast<ACharacter>(Fighter);
    if (!Char) return;

    if (Archetype == EBannonArchetype::Powerhouse)
    {
        // Example: Powerhouse gets strength boost
        Char->GetCharacterMovement()->MaxWalkSpeed = 400.0f; // Slower, heavier
        UE_LOG(LogTemp, Log, TEXT("Applied Powerhouse stat modifiers"));
    }
    else if (Archetype == EBannonArchetype::HighFlyer)
    {
        Char->GetCharacterMovement()->JumpZVelocity = 800.0f; // Higher jump
        UE_LOG(LogTemp, Log, TEXT("Applied HighFlyer stat modifiers"));
    }
}
