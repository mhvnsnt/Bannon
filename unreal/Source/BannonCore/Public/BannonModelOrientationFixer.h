#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonModelOrientationFixer.generated.h"

UCLASS()
class BANNONCORE_API UBannonModelOrientationFixer : public UObject
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category="Bannon|Pipeline")
    void BatchCorrectGLBOrientation(const TArray<FString>& TargetMeshPaths, UPARAM(ref) int32& OutFixedCount);
};
