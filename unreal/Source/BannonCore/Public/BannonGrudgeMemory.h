#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonGrudgeMemory.generated.h"

USTRUCT(BlueprintType)
struct FBannonMatchTelemetry {
    GENERATED_BODY()

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    float TotalTimeInCrumpleState;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    FName MostDamagedJoint;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    float PeakImpactForceReceived;
};

UCLASS()
class BANNONCORE_API UBannonGrudgeMemory : public UObject
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category="Bannon|Telemetry")
    FBannonMatchTelemetry ExportTelemetryForPromo();

    UFUNCTION(BlueprintCallable, Category="Bannon|Telemetry")
    void EvaluatePersistentGrudge(const FString& EntityA, const FString& EntityB, UPARAM(ref) float& AggressionMultiplier);
};
