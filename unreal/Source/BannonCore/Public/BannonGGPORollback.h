#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonGGPORollback.generated.h"

UCLASS()
class BANNONCORE_API UBannonGGPORollback : public UObject
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category="Bannon|Netcode")
    void SaveStateFrame(int32 FrameNumber, const FVector& Position, const FVector& Velocity, UPARAM(ref) TMap<int32, FVector>& OutPositionBuffer, UPARAM(ref) TMap<int32, FVector>& OutVelocityBuffer);

    UFUNCTION(BlueprintCallable, Category="Bannon|Netcode")
    void LoadStateFrame(int32 FrameNumber, const TMap<int32, FVector>& PositionBuffer, const TMap<int32, FVector>& VelocityBuffer, UPARAM(ref) FVector& OutRestoredPosition, UPARAM(ref) FVector& OutRestoredVelocity);
};
