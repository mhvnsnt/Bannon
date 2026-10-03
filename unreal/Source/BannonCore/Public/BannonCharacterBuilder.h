// AI ORIENTATION BLOCK v114
#pragma once
#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonCharacterBuilder.generated.h"

UCLASS(ClassGroup=(BannonCAW), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonCharacterBuilder : public UActorComponent {
    GENERATED_BODY()
public:
    UBannonCharacterBuilder();

    UFUNCTION(BlueprintCallable, Category = "Bannon|CAW")
    void UpdateMorphAnatomy(FName Region, float Depth, float Width, float Angle, float Height, class USkeletalMeshComponent* TargetMesh);
    
    UFUNCTION(BlueprintCallable, Category = "Bannon|CAW")
    void RecalculatePoise(float TorsoVolume, float NeckVolume, class ABannonCharacter* TargetCharacter);
    
    UFUNCTION(BlueprintCallable, Category = "Bannon|CAW")
    void ApplyTwoToneDye(class USkeletalMeshComponent* HairMesh, const FString& BaseHex, const FString& TipHex, float BlendPos, float BlendSharpness);
};
