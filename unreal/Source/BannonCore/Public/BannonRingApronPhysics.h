#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "GameFramework/Character.h"
#include "BannonRingApronPhysics.generated.h"

UCLASS(ClassGroup=(Custom), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonRingApronPhysics : public UActorComponent
{
    GENERATED_BODY()

public:
    UBannonRingApronPhysics();

    UFUNCTION(BlueprintCallable, Category = "Physics|Ring")
    void CalculateApronCollision(ACharacter* Defender, FVector PushVelocity, float RingEdgeZ);

protected:
    virtual void BeginPlay() override;
};
