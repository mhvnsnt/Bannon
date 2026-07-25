#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonNetworkDiagnostics.generated.h"

UCLASS()
class BANNONCORE_API UBannonNetworkDiagnostics : public UObject
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category="Bannon|Diagnostics")
    void EvaluateNetworkHealth(float PingMs, float PacketLossPercentage, int32 RollbackFrames, UPARAM(ref) FString& OutHealthStatus, UPARAM(ref) FLinearColor& OutStatusColor);
};
