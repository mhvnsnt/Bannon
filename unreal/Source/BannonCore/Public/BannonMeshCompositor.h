// AI ORIENTATION BLOCK v114
#pragma once
#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonMeshCompositor.generated.h"

UCLASS(ClassGroup=(BannonCAW), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonMeshCompositor : public UActorComponent {
    GENERATED_BODY()
public:
    UBannonMeshCompositor();

    UFUNCTION(BlueprintCallable, Category = "Bannon|CAW")
    void ApplyAttireLayer(int32 ZIndex, class USkeletalMeshComponent* AttireMesh, const FString& MaterialType, const TArray<FString>& HexColors);
    
    UFUNCTION(BlueprintCallable, Category = "Bannon|CAW")
    void ApplyBodyArtLayer(int32 ZIndex, const FVector2D& Translation, const FVector2D& Scale, float Rotation, float Opacity, class UTexture2D* DecalTexture);
    
    UFUNCTION(BlueprintCallable, Category = "Bannon|CAW")
    void EnforceJoltAntiClipping(class USkeletalMeshComponent* OuterLayer, class USkeletalMeshComponent* InnerLayer);

private:
    UPROPERTY()
    TArray<class USkeletalMeshComponent*> ActiveAttireLayers;
};
