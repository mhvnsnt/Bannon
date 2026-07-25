#include "BannonNetworkDiagnostics.h"

void UBannonNetworkDiagnostics::EvaluateNetworkHealth(float PingMs, float PacketLossPercentage, int32 RollbackFrames, FString& OutHealthStatus, FLinearColor& OutStatusColor)
{
    // Evaluates the current peer-to-peer GGPO connection stability
    if (PingMs > 150.0f || PacketLossPercentage > 5.0f || RollbackFrames > 10)
    {
        OutHealthStatus = TEXT("CRITICAL DESYNC");
        OutStatusColor = FLinearColor::Red;
    }
    else if (PingMs > 80.0f || RollbackFrames > 3)
    {
        OutHealthStatus = TEXT("UNSTABLE");
        OutStatusColor = FLinearColor::Yellow;
    }
    else
    {
        OutHealthStatus = TEXT("STABLE (FRAME PERFECT)");
        OutStatusColor = FLinearColor::Green;
    }
}
