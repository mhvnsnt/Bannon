#include "BannonSanitizer.h"
#include "BannonModLoader.h"
#include "Math/UnrealMathUtility.h"

UBannonSanitizer::UBannonSanitizer()
{
    ModLoaderRef = nullptr;
}

void UBannonSanitizer::SetModLoaderRef(UBannonModLoader* InModLoader)
{
    ModLoaderRef = InModLoader;
}

void UBannonSanitizer::PrePhysicsTickScan(float DeltaTime)
{
    // In a real implementation, we would iterate through active physics bodies
    // Here we simulate the scan for NaN vectors and velocity breaches
}

bool UBannonSanitizer::ValidateKineticVector(FVector InVector)
{
    if (InVector.ContainsNaN())
    {
        TriggerMemoryRollback(TEXT("NaN detected in kinetic vector calculation"));
        return false;
    }

    if (InVector.Size() > MAX_BODY_VEL)
    {
        // Check for catastrophic breach (e.g. well over the cap)
        if (InVector.Size() > MAX_BODY_VEL * 10.0f) 
        {
            TriggerMemoryRollback(TEXT("Catastrophic velocity breach detected"));
            return false;
        }
    }
    
    return true;
}

void UBannonSanitizer::TriggerMemoryRollback(const FString& FaultContext)
{
    UE_LOG(LogTemp, Error, TEXT("[BannonSanitizer] FAULT DETECTED: %s. Blocking execution frame."), *FaultContext);
    
    if (ModLoaderRef)
    {
        UE_LOG(LogTemp, Warning, TEXT("[BannonSanitizer] Triggering instant rollback to last verified stable state."));
        ModLoaderRef->RestoreCoreVariables();
    }
    
    // Package exact fault parameters for L.I.O.N.T.A.M.E.R. handoff
    BroadcastCriticalFault(TEXT("0xUNKNOWN"), TEXT("KineticVector"), FaultContext);
}

void UBannonSanitizer::BroadcastCriticalFault(const FString& Address, const FString& Variable, const FString& StackTrace)
{
    UE_LOG(LogTemp, Error, TEXT("CRITICAL_PHYSICS_FAULT | Address: %s | Variable: %s | Stack: %s"), *Address, *Variable, *StackTrace);
}
