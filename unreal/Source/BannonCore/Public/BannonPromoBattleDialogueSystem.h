#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonPromoBattleDialogueSystem.generated.h"

// Phase 5 #44: Promo Battle Dialogue System
UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonPromoBattleDialogueSystem : public UActorComponent
{
    GENERATED_BODY()

public:    
    UBannonPromoBattleDialogueSystem();

protected:
    virtual void BeginPlay() override;
};
