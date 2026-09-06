#pragma once
#include "CoreMinimal.h"
#include "GameFramework/GameModeBase.h"
#include "BannonMatchManager.generated.h"

UCLASS()
class BANNONCORE_API ABannonMatchManager : public AGameModeBase {
    GENERATED_BODY()
public:
    ABannonMatchManager();

protected:
    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Bannon|Components")
    class UBannonMatchStateLogic* MatchStateLogic;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Bannon|Components")
    class UBannonDirectorCamera* DirectorCamera;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Bannon|Components")
    class UBannonTelemetryLogger* TelemetryLogger;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Bannon|Components")
    class UBannonCrowdInstancer* CrowdInstancer;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Bannon|Components")
    class UBannonVerletRopesComponent* RingRopes;
};
