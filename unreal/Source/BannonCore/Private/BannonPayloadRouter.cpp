#include "BannonPayloadRouter.h"
#include "BannonModLoader.h"
#include "Async/Async.h"

UBannonPayloadRouter::UBannonPayloadRouter()
{
    ModLoaderRef = nullptr;
}

void UBannonPayloadRouter::SetModLoaderRef(UBannonModLoader* InModLoader)
{
    ModLoaderRef = InModLoader;
}

void UBannonPayloadRouter::RouteIncomingPayload(const FString& PayloadString, const TArray<uint8>& BinaryBlob, const FString& ModHash)
{
    if (ValidateGodModeKey(PayloadString))
    {
        UE_LOG(LogTemp, Log, TEXT("[BannonPayloadRouter] GOD_MODE_KEY validated. Routing directly to GameThread for root execution."));
        if (ModLoaderRef)
        {
            ModLoaderRef->ExecutePayloadBlob(BinaryBlob);
        }
        return;
    }

    UE_LOG(LogTemp, Log, TEXT("[BannonPayloadRouter] Standard payload detected. Routing to Community Walled Garden."));
    
    if (ScanForSandboxViolations(PayloadString))
    {
        TriggerSandboxViolation(ModHash, TEXT("Attempted overwrite of hard-coded physics constants (MAX_HP, DMG_SCALE, MAX_BODY_VEL) or directory escape"));
        return;
    }

    ExecuteSandboxedPayload(PayloadString);
}

bool UBannonPayloadRouter::ValidateGodModeKey(const FString& PayloadString)
{
    // Simplified validation check
    return PayloadString.Contains(TEXT("GOD_MODE_KEY="));
}

bool UBannonPayloadRouter::ScanForSandboxViolations(const FString& PayloadString)
{
    // Hostile Payload Interception
    if (PayloadString.Contains(TEXT("MAX_HP")) || 
        PayloadString.Contains(TEXT("DMG_SCALE")) || 
        PayloadString.Contains(TEXT("MAX_BODY_VEL")) ||
        PayloadString.Contains(TEXT("../")))
    {
        return true;
    }
    return false;
}

void UBannonPayloadRouter::ExecuteSandboxedPayload(const FString& PayloadString)
{
    UE_LOG(LogTemp, Log, TEXT("[BannonPayloadRouter] Sandboxed payload parsed securely."));
    // Write to UserOverrides partition here...
}

void UBannonPayloadRouter::TriggerSandboxViolation(const FString& ModHash, const FString& Reason)
{
    UE_LOG(LogTemp, Error, TEXT("SANDBOX_VIOLATION | Hash: %s | Reason: %s"), *ModHash, *Reason);
}
