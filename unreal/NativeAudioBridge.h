#pragma once
#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "Components/AudioComponent.h"
#include "NativeAudioBridge.generated.h"

UCLASS()
class BANNON_API ANativeAudioBridge : public AActor
{
    GENERATED_BODY()
public:
    ANativeAudioBridge();
    
    UFUNCTION(BlueprintCallable, Category="Audio|Godmode")
    void BindAudioStreamToRagdoll(const FString& CharId, const TArray<uint8>& AudioByteStream, AActor* TargetRagdoll);

protected:
    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category="Components")
    UAudioComponent* SpatialAudioComponent;
};
