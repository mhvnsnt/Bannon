#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonFactionSystem.generated.h"

USTRUCT(BlueprintType)
struct FFactionData
{
    GENERATED_BODY()

    UPROPERTY(BlueprintReadWrite, Category="Bannon|Factions")
    FString FactionName;

    UPROPERTY(BlueprintReadWrite, Category="Bannon|Factions")
    TArray<FString> ActiveMembers;

    UPROPERTY(BlueprintReadWrite, Category="Bannon|Factions")
    TArray<FString> RivalFactions;

    UPROPERTY(BlueprintReadWrite, Category="Bannon|Factions")
    float Cohesion; // Scale 0.0 to 100.0
};

UCLASS()
class BANNONCORE_API UBannonFactionSystem : public UObject
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category="Bannon|Factions")
    void EvaluateFactionLoyalty(UPARAM(ref) FFactionData& Faction, const FString& EventTrigger, UPARAM(ref) TArray<FString>& OutDefectors);
};
