// Copyright BANNON.

#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Character.h"
#include "BannonFighter.generated.h"

class UBannonRagdollComponent;
class UBannonGrappleGrip;

UCLASS()
class BANNONCORE_API ABannonFighter : public ACharacter
{
	GENERATED_BODY()

public:
	ABannonFighter();

	// the physical body driver (active ragdoll: poise-scaled motors / velocity-drive, MAX_BODY_VEL cap).
	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category="Bannon|Physics") 
	UBannonRagdollComponent* Ragdoll = nullptr;

	// the hand<->body grip used to lift/carry an opponent as a real physical load.
	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category="Bannon|Physics") 
	UBannonGrappleGrip* Grip = nullptr;

	UFUNCTION(BlueprintCallable, Category="Bannon|Combat")
	bool GrappleGrab(ABannonFighter* Victim, FName HandSocket);

	// Stats (two-layer health — poise drives crumple and is INDEPENDENT of HP)
	UPROPERTY(BlueprintReadOnly, Category="Bannon|State") float HP = 10000.0f; // MAX_HP
	UPROPERTY(BlueprintReadOnly, Category="Bannon|State") float Poise = 100.0f;
	UPROPERTY(BlueprintReadOnly, Category="Bannon|State") float Stamina = 440.0f;
	UPROPERTY(BlueprintReadOnly, Category="Bannon|State") bool bCrumpled = false;
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Bannon|Stats") float StrikeMass = 1.0f;

	// Combat Systems
	virtual void Tick(float DeltaTime) override;

	UPROPERTY(BlueprintReadOnly, Category="Bannon|Combat") float StunMeter = 0.0f;
	UPROPERTY(BlueprintReadOnly, Category="Bannon|Combat") bool bIsStunned = false;
	UPROPERTY(BlueprintReadOnly, Category="Bannon|Combat") float ReversalWindow = 0.0f;
	UPROPERTY(BlueprintReadOnly, Category="Bannon|Combat") float SubmissionProgress = 0.0f;
	UPROPERTY(BlueprintReadOnly, Category="Bannon|Combat") bool bIsSubmitting = false;
	UPROPERTY(BlueprintReadOnly, Category="Bannon|Combat") float HeadCut = 0.0f;
	UPROPERTY(BlueprintReadOnly, Category="Bannon|Combat") float TorsoBruise = 0.0f;
	UPROPERTY(BlueprintReadOnly, Category="Bannon|Combat") FName GroundPosition = "None";

	UFUNCTION(BlueprintCallable, Category="Bannon|Combat") void ApplyImpact(float Impact);
	UFUNCTION(BlueprintCallable, Category="Bannon|Combat") void RegenStamina(bool bIdle, float Dt);

	UFUNCTION(BlueprintCallable, Category="Bannon|Combat") void InitLockup(ABannonFighter* Target);
	void UpdateLockup(ABannonFighter* Target, float Dt);

	UFUNCTION(BlueprintCallable, Category="Bannon|Combat") void InitSubmission(ABannonFighter* Target);
	void UpdateSubmission(float Dt);

	UFUNCTION(BlueprintCallable, Category="Bannon|Combat") void TransitionGroundPosition(FName NewPosition);
	UFUNCTION(BlueprintCallable, Category="Bannon|Combat") void ExecuteReversal(FName ReversalType);
};
