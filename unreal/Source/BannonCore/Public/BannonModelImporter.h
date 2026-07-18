#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonModelImporter.generated.h"

UCLASS()
class BANNONCORE_API UBannonModelImporter : public UObject
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category="Bannon|MDickie")
    void DecryptAndPortLegacyModel(const FString& LegacyFormatPath, UPARAM(ref) FString& OutUnrealAssetPath);
};
