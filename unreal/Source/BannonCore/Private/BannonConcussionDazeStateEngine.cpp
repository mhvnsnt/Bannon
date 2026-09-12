#include "BannonConcussionDazeStateEngine.h"

UBannonConcussionDazeStateEngine::UBannonConcussionDazeStateEngine()
{
    PrimaryComponentTick.bCanEverTick = false;
}

void UBannonConcussionDazeStateEngine::BeginPlay()
{
    Super::BeginPlay();
}
