#pragma once
#include "CoreMinimal.h"
#include "GameFramework/Character.h"
#include "BannonCharacter.generated.h"

UCLASS()
class BANNONCORE_API ABannonCharacter : public ACharacter {
    GENERATED_BODY()
public:
    ABannonCharacter();
    virtual void BeginPlay() override;

protected:
    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Bannon|Components")
    class UBannonCombatAnimator* CombatAnimator;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Bannon|Components")
    class UBannonGNMBalancer* GNMBalancer;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Bannon|Components")
    class UBannonSoftBodyDynamics* SoftBodyDynamics;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Bannon|Components")
    class UBannonHairDynamics* HairDynamics;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Bannon|Components")
    class UBannonDNAParser* DNAParser;
};
