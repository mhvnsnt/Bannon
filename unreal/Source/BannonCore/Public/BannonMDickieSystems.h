#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonMDickieSystems.generated.h"

USTRUCT(BlueprintType)
struct FMDickieStats
{
    GENERATED_BODY()

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Bannon|MDickie")
    int32 Popularity;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Bannon|MDickie")
    int32 Attitude;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Bannon|MDickie")
    int32 Strength;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Bannon|MDickie")
    int32 Agility;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Bannon|MDickie")
    int32 Skill;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Bannon|MDickie")
    int32 Stamina;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Bannon|MDickie")
    int32 Toughness;
};

UCLASS()
class BANNONCORE_API UBannonMDickieSystems : public UObject
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category="Bannon|MDickie")
    void ApplyMDickieStats(const FString& CharacterName, const FMDickieStats& LegacyStats);

    UFUNCTION(BlueprintCallable, Category="Bannon|MDickie")
    void CalculateLimbDamage(float BaseDamage, bool bIsSubmission, UPARAM(ref) float& LeftArm, UPARAM(ref) float& RightArm, UPARAM(ref) float& LeftLeg, UPARAM(ref) float& RightLeg, UPARAM(ref) float& Core, UPARAM(ref) float& Head);
};
