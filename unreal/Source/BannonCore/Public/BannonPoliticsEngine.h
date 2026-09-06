#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonPoliticsEngine.generated.h"

USTRUCT(BlueprintType)
struct FBannonRelationship {
    GENERATED_BODY()

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    TArray<FString> Friends;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    TArray<FString> Enemies;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    float Morale; // 0.0 to 1.0

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    float BossApproval;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    float FaceHeelAlignment; // 0 = Heel, 1 = Face
};

UCLASS()
class BANNONCORE_API UBannonPoliticsEngine : public UObject
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category = "Bannon|Politics")
    void EvaluateJobberMoralePenalty(UPARAM(ref) FBannonRelationship& Rel, float OpponentHeat, float PlayerHeat);

    UFUNCTION(BlueprintCallable, Category = "Bannon|Politics")
    void TriggerMidMatchBetrayal(UPARAM(ref) FBannonRelationship& Rel, const FString& PartnerID);
};
