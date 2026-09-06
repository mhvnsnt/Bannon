// AI ORIENTATION BLOCK v114
#pragma once
#include "CoreMinimal.h"
#include "GameFramework/Character.h"
#include "BannonPhysicsLaws.h"
#include "BannonCharacter.generated.h"

UCLASS()
class BANNONCORE_API ABannonCharacter : public ACharacter {
    GENERATED_BODY()
public:
    ABannonCharacter();
    virtual void BeginPlay() override;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Bannon|Stats")
    float Health = bannon::MAX_HP;

    bannon::PoiseState Poise;

    UFUNCTION(BlueprintCallable, Category="Bannon|Combat")
    void ApplyHit(const FHitResult& Hit, float RawDamage);

    UFUNCTION(BlueprintCallable, Category="Bannon|CAW")
    void UpdateMorph(float Torso, float Neck);

    bannon::HitStop CurrentHitStop;

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
