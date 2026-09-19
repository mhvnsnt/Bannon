#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonCharacterRegistry.generated.h"

USTRUCT(BlueprintType)
struct FBannonCharacterBio
{
    GENERATED_BODY()

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Bannon|Roster")
    FString RingName;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Bannon|Roster")
    FString Archetype;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Bannon|Roster")
    FString ModelFBXPath;
};

UCLASS()
class BANNONCORE_API UBannonCharacterRegistry : public UObject
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category="Bannon|Roster")
    void InitializeCoreRoster(UPARAM(ref) TMap<FString, FBannonCharacterBio>& RosterDatabase);
};
