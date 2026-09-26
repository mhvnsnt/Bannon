#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonMultiBodyReplication.generated.h"

UCLASS()
class BANNONCORE_API UBannonMultiBodyReplication : public UObject
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category="Bannon|Netcode")
    void ReplicatePileupPhysics(float ClientDeviationTolerance, const FVector& ServerCenterOfMass, const FVector& ClientCenterOfMass, UPARAM(ref) bool& bForceClientSnap);
};
