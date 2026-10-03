#pragma once

#include "CoreMinimal.h"
#include "Animation/AnimNotifies/AnimNotify.h"
#include "BannonAnimNotify_ImpactTaunt.generated.h"

UCLASS()
class BANNONCORE_API UBannonAnimNotify_ImpactTaunt : public UAnimNotify
{
    GENERATED_BODY()

public:
    UPROPERTY(EditAnywhere, Category="Bannon|Taunts")
    FString TauntType; // e.g., "Ginga", "Spinaroony"

    UPROPERTY(EditAnywhere, Category="Bannon|Taunts")
    float BaseDamage;

    virtual void Notify(USkeletalMeshComponent* MeshComp, UAnimSequenceBase* Animation, const FAnimNotifyEventReference& EventReference) override;
};
