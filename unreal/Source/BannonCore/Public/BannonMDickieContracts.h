#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonMDickieContracts.generated.h"

USTRUCT(BlueprintType)
struct FMDickieContract
{
    GENERATED_BODY()

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Bannon|MDickie")
    float WeeklySalary;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Bannon|MDickie")
    int32 WeeksRemaining;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Bannon|MDickie")
    bool bCreativeControl;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Bannon|MDickie")
    bool bHealthInsurance;
};

UCLASS()
class BANNONCORE_API UBannonMDickieContracts : public UObject
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category="Bannon|MDickie")
    void NegotiateContract(const FString& WrestlerName, UPARAM(ref) FMDickieContract& ProposedContract, UPARAM(ref) bool& bIsAccepted);

    UFUNCTION(BlueprintCallable, Category="Bannon|MDickie")
    void EvaluateBookingRating(float MatchQuality, float Controversy, UPARAM(ref) float& PromotionRating);
};
