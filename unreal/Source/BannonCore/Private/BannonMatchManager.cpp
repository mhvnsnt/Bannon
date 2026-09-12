#include "BannonMatchManager.h"
#include "BannonMatchStateLogic.h"
#include "BannonDirectorCamera.h"
#include "BannonTelemetryLogger.h"
#include "BannonCrowdInstancer.h"
#include "BannonVerletRopesComponent.h"

ABannonMatchManager::ABannonMatchManager() {
    // Natively binding all environmental and systemic managers to the core game mode loop.
    MatchStateLogic = CreateDefaultSubobject<UBannonMatchStateLogic>(TEXT("MatchStateLogic"));
    DirectorCamera = CreateDefaultSubobject<UBannonDirectorCamera>(TEXT("DirectorCamera"));
    TelemetryLogger = CreateDefaultSubobject<UBannonTelemetryLogger>(TEXT("TelemetryLogger"));
    CrowdInstancer = CreateDefaultSubobject<UBannonCrowdInstancer>(TEXT("CrowdInstancer"));
    RingRopes = CreateDefaultSubobject<UBannonVerletRopesComponent>(TEXT("RingRopes"));
}
