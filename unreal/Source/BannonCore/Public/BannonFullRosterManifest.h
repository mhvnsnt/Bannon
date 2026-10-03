#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonFullRosterManifest.generated.h"

USTRUCT(BlueprintType)
struct FBookCharacterProfile
{
    GENERATED_BODY()

    UPROPERTY(BlueprintReadWrite, Category="Bannon|Roster")
    FString RealName;

    UPROPERTY(BlueprintReadWrite, Category="Bannon|Roster")
    FString RingName;

    UPROPERTY(BlueprintReadWrite, Category="Bannon|Roster")
    FString Archetype;

    UPROPERTY(BlueprintReadWrite, Category="Bannon|Roster")
    FString Faction;

    UPROPERTY(BlueprintReadWrite, Category="Bannon|Roster")
    int32 LifePath;

    UPROPERTY(BlueprintReadWrite, Category="Bannon|Roster")
    int32 DestinyExp;

    UPROPERTY(BlueprintReadWrite, Category="Bannon|Roster")
    int32 SoulUrge;
};

UCLASS()
class BANNONCORE_API UBannonFullRosterManifest : public UObject
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category="Bannon|Roster")
    void LoadBookCharacters(UPARAM(ref) TArray<FBookCharacterProfile>& OutRoster);
};
