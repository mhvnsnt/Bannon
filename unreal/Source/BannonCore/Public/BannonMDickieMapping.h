#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonMDickieMapping.generated.h"

USTRUCT(BlueprintType)
struct FMDickieCrosswalk
{
    GENERATED_BODY()

    UPROPERTY(BlueprintReadWrite, Category="Bannon|MDickie")
    FString BannonName;

    UPROPERTY(BlueprintReadWrite, Category="Bannon|MDickie")
    FString MDickieParodyName;

    UPROPERTY(BlueprintReadWrite, Category="Bannon|MDickie")
    FString LegacyModelPath;
};

UCLASS()
class BANNONCORE_API UBannonMDickieMapping : public UObject
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category="Bannon|MDickie")
    void InitializeMDickieCrosswalk(UPARAM(ref) TArray<FMDickieCrosswalk>& MappingTable);
};
