// Copyright BANNON.
// Match director. Show rating / revenue / morale and injury consequences come straight from the
// native universe laws (bannon_universe.h scoreShow + matchConsequence) so GM/Universe mode uses the
// same booking math the web build validates.
#pragma once

#include "CoreMinimal.h"
#include "GameFramework/GameModeBase.h"
#include "BannonGameMode.generated.h"

USTRUCT(BlueprintType)
struct FBannonShowResult
{
	GENERATED_BODY()
	UPROPERTY(BlueprintReadOnly, Category="Bannon") float Rating = 0.f;
	UPROPERTY(BlueprintReadOnly, Category="Bannon") float Revenue = 0.f;
	UPROPERTY(BlueprintReadOnly, Category="Bannon") float MoraleDelta = 0.f;
};

UCLASS()
class BANNONCORE_API ABannonGameMode : public AGameModeBase
{
	GENERATED_BODY()

public:
	// booking math for a completed match (native scoreShow).
	UFUNCTION(BlueprintCallable, Category="Bannon|GM")
	FBannonShowResult ScoreShow(bool bExtremeStips, float MaxImpactVel, bool bCriticalInjury, int32 FrictionSpikes) const;

	// career consequence of a broken-limb finish (native matchConsequence): injury months + title strip.
	UFUNCTION(BlueprintCallable, Category="Bannon|GM")
	void MatchConsequence(bool bConstraintBroken, float OverTorque01, int32& OutInjuryMonths, bool& bOutStripTitles, bool& bOutRevengeSeed) const;
};
