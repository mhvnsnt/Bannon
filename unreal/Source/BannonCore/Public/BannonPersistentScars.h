#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonPersistentScars.generated.h"

UCLASS()
class BANNONCORE_API UBannonPersistentScars : public UObject
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category="Bannon|Medical")
    void ApplyLacerationToRecord(const FString& WrestlerID, const FString& BodyPart, float LacerationSeverity, UPARAM(ref) TMap<FString, float>& InOutScarData);

    UFUNCTION(BlueprintCallable, Category="Bannon|Medical")
    void CalculateMorphTargetIntensity(float TotalScarSeverity, UPARAM(ref) float& OutMorphTargetWeight);
};
