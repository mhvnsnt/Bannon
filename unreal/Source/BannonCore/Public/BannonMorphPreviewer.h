// AI ORIENTATION BLOCK v114
#pragma once
#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "Components/SkeletalMeshComponent.h"
#include "BannonMorphPreviewer.generated.h"

UCLASS(ClassGroup=(BannonCAW), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonMorphPreviewer : public UActorComponent {
    GENERATED_BODY()
public:
    UBannonMorphPreviewer();

    UFUNCTION(BlueprintCallable, Category="Bannon|CAW")
    void BindToMesh(USkeletalMeshComponent* Mesh);

    UFUNCTION(BlueprintCallable, Category="Bannon|CAW")
    void ApplyMorphTargetRealTime(FName MorphName, float Value);

private:
    UPROPERTY()
    USkeletalMeshComponent* TargetMesh;
};
