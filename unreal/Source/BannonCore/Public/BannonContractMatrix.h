#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonContractMatrix.generated.h"

USTRUCT(BlueprintType)
struct FBannonContract {
    GENERATED_BODY()

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    float BaseSalary;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    float MerchMultiplier; // Scales with Crowd Heat

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    bool bCreativeControl; // Can reject scripted finishes

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    bool bHealthInsurance;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    int32 WeeksRemaining;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    float TravelAccommodationToll; // Economy travel degrades stamina
};

UCLASS()
class BANNONCORE_API UBannonContractMatrix : public UObject
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category = "Bannon|Economy")
    void ProcessWeeklyDecay(UPARAM(ref) FBannonContract& Contract, float CurrentHeat);

    UFUNCTION(BlueprintCallable, Category = "Bannon|Economy")
    bool RequestFinishOverride(const FBannonContract& Contract, float EgoRoll);
};
