#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonGGPORollback.generated.h"

USTRUCT(BlueprintType)
struct FBannonGGPOInput
{
	GENERATED_BODY()

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Bannon|Netcode")
	int32 Frame;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Bannon|Netcode")
	uint8 ButtonMask;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Bannon|Netcode")
	FVector2D MovementAxes;
};

UCLASS()
class BANNONCORE_API UBannonGGPORollback : public UObject
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category="Bannon|Netcode")
    void SaveStateFrame(int32 FrameNumber, const FVector& Position, const FVector& Velocity, UPARAM(ref) TMap<int32, FVector>& OutPositionBuffer, UPARAM(ref) TMap<int32, FVector>& OutVelocityBuffer);

    UFUNCTION(BlueprintCallable, Category="Bannon|Netcode")
    void LoadStateFrame(int32 FrameNumber, const TMap<int32, FVector>& PositionBuffer, const TMap<int32, FVector>& VelocityBuffer, UPARAM(ref) FVector& OutRestoredPosition, UPARAM(ref) FVector& OutRestoredVelocity);

	// Registration of strike inputs to support peer-to-peer GGPO rollback mechanics
	UFUNCTION(BlueprintCallable, Category="Bannon|Netcode")
	void RegisterStrikePrediction(int32 Frame, int32 AttackerID, int32 TargetID, const FName& AttackBone, const FVector& StrikeVelocity);

	// Resolves conflicting strike frames upon rollback re-simulation
	UFUNCTION(BlueprintCallable, Category="Bannon|Netcode")
	bool ResolveRollbackStrike(int32 Frame, int32 ConfirmedAttackerID, int32 ConfirmedTargetID, FName& OutFinalResolvedState);

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Bannon|Netcode")
	TMap<int32, FBannonGGPOInput> InputHistory;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Bannon|Netcode")
	int32 CurrentConfirmedFrame;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Bannon|Netcode")
	int32 FrameDivergenceLimit;
};
