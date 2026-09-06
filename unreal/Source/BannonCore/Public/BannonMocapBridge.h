#pragma once
#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonMocapBridge.generated.h"

UCLASS(ClassGroup=(BannonCombat), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonMocapBridge : public UActorComponent {
    GENERATED_BODY()
public:
    UBannonMocapBridge();
    UFUNCTION(BlueprintCallable, Category="Bannon|Mocap")
    FVector ExtractAndClampRootMotion(FVector RawRootDelta, float DeltaTime);
};
