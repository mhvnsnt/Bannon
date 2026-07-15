// Copyright BANNON.
#pragma once
#include "CoreMinimal.h"
#include "GameFramework/Character.h"
#include "BannonFighter.generated.h"

UCLASS()
class BANNONCORE_API ABannonFighter : public ACharacter
{
	GENERATED_BODY()
public:
	ABannonFighter();

	// Stats
	UPROPERTY(BlueprintReadOnly, Category="Bannon|State") float HP = 10000.0f;
	UPROPERTY(BlueprintReadOnly, Category="Bannon|State") float Poise = 100.0f;
	UPROPERTY(BlueprintReadOnly, Category="Bannon|State") float Stamina = 440.0f;
	UPROPERTY(BlueprintReadOnly, Category="Bannon|State") bool bCrumpled = false;
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Bannon|Stats") float StrikeMass = 1.0f;

	// Combat Systems
	UPROPERTY(BlueprintReadOnly, Category="Bannon|Combat") float StunMeter = 0.0f;
	UPROPERTY(BlueprintReadOnly, Category="Bannon|Combat") bool bIsStunned = false;
	UPROPERTY(BlueprintReadOnly, Category="Bannon|Combat") float ReversalWindow = 0.0f;
	UPROPERTY(BlueprintReadOnly, Category="Bannon|Combat") float SubmissionProgress = 0.0f;
	UPROPERTY(BlueprintReadOnly, Category="Bannon|Combat") bool bIsSubmitting = false;
	UPROPERTY(BlueprintReadOnly, Category="Bannon|Combat") float HeadCut = 0.0f;
	UPROPERTY(BlueprintReadOnly, Category="Bannon|Combat") float TorsoBruise = 0.0f;
	virtual void Tick(float DeltaTime) override;

	UPROPERTY(BlueprintReadOnly, Category="Bannon|Combat") float SubmissionProgress = 0.0f;
	UPROPERTY(BlueprintReadOnly, Category="Bannon|Combat") bool bIsSubmitting = false;

	UFUNCTION(BlueprintCallable, Category="Bannon|Combat") void ApplyImpact(float Impact);
	UFUNCTION(BlueprintCallable, Category="Bannon|Combat") void RegenStamina(bool bIdle, float Dt);

	UFUNCTION(BlueprintCallable, Category="Bannon|Combat") void InitLockup(ABannonFighter* Target);
	void UpdateLockup(ABannonFighter* Target, float Dt);

	UFUNCTION(BlueprintCallable, Category="Bannon|Combat") void InitSubmission(ABannonFighter* Target);
	void UpdateSubmission(float Dt);
};
