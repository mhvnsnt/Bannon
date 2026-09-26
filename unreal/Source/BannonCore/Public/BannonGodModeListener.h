#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonGodModeListener.generated.h"

class FSocket;

UCLASS(ClassGroup=(BannonAnalytics), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonGodModeListener : public UActorComponent {
    GENERATED_BODY()
public:
    UBannonGodModeListener();

    virtual void BeginPlay() override;
    virtual void EndPlay(const EEndPlayReason::Type EndPlayReason) override;

private:
    FSocket* ListenSocket;
    bool bIsListening;
    void StartUDPListener();
    void ReceiveUDPData();
    void ApplyGodModeCommand(const FString& JsonPayload);
};
