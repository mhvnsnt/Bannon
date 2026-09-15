#include "NativeAudioBridge.h"
#include "Kismet/GameplayStatics.h"

ANativeAudioBridge::ANativeAudioBridge()
{
    PrimaryActorTick.bCanEverTick = true;
    SpatialAudioComponent = CreateDefaultSubobject<UAudioComponent>(TEXT("SpatialAudioComponent"));
    RootComponent = SpatialAudioComponent;
    SpatialAudioComponent->bOverrideAttenuation = true;
    // Godmode 3D spatial settings bound to coordinate space
}

void ANativeAudioBridge::BindAudioStreamToRagdoll(const FString& CharId, const TArray<uint8>& AudioByteStream, AActor* TargetRagdoll)
{
    if (!TargetRagdoll) return;

    // Attach the audio component directly to the ragdoll's head/root bone
    AttachToActor(TargetRagdoll, FAttachmentTransformRules::SnapToTargetNotIncludingScale, TEXT("head"));
    
    // Engine mapping logic: stream AudioByteStream to USoundWaveProcedural
    UE_LOG(LogTemp, Warning, TEXT("[NativeAudioBridge] Receiving %d bytes from Node.js for %s"), AudioByteStream.Num(), *CharId);
    UE_LOG(LogTemp, Warning, TEXT("[NativeAudioBridge] Binding spatial audio to %s's coordinate space."), *TargetRagdoll->GetName());
    
    SpatialAudioComponent->Play();
}
