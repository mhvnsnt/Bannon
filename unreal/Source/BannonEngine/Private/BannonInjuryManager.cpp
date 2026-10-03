// Copyright BANNON.
#include "BannonInjuryManager.h"
#include "GameFramework/Character.h"
#include "GameFramework/CharacterMovementComponent.h"

void UBannonInjuryManager::RegisterInjury(AActor* Fighter, FName BodyPart, float Severity)
{
    ACharacter* Char = Cast<ACharacter>(Fighter);
    if (Char && BodyPart == FName("Leg"))
    {
        float NewSpeed = FMath::Clamp(600.0f * (1.0f - (Severity * 0.5f)), 100.0f, 600.0f);
        Char->GetCharacterMovement()->MaxWalkSpeed = NewSpeed;
        UE_LOG(LogTemp, Log, TEXT("Applied Leg Injury Penalty: Speed %f"), NewSpeed);
    }
}
