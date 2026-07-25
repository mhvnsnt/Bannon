#pragma once
#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonTelemetryLogger.generated.h"

UCLASS(ClassGroup=(BannonAnalytics), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonTelemetryLogger : public UActorComponent {
    GENERATED_BODY()
public:
    UBannonTelemetryLogger();
    
    virtual void BeginPlay() override;

    UFUNCTION(BlueprintCallable, Category = "Bannon|Telemetry")
    void LogMatchEvent(const FString& EventType, FName BoneTarget, float ForceValue, float NewPoise);

private:
    FString LogFilePath;
    void WriteToJsonAsync(const FString& Payload);
    void BroadcastUdpAsync(const FString& Payload);
};
