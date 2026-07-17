// Copyright BANNON.
// A fighter: an ACharacter carrying the native two-layer health (HP + poise, decoupled) and stamina.
// The physical body is a PhysicsAsset ragdoll (set up in the editor); this class owns the STATE and
// applies the native laws. Rendering/skeleton use a SkeletalMesh skinned with the A-pose rules from
// bannon_anim_bridge; the retarget uses UBannonLaws::RollStableAim in a Control Rig.
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
	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category="Bannon|Physics") UBannonRagdollComponent* Ragdoll = nullptr;
	// the hand<->body grip used to lift/carry an opponent as a real physical load.
	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category="Bannon|Physics") UBannonGrappleGrip* Grip = nullptr;

	// grab VICTIM: blend the victim's ragdoll up so it's simulating, then grip the nearest body to our
	// hand socket. Returns true if the grip took (a real physical catch, not a canned attach).
	UFUNCTION(BlueprintCallable, Category="Bannon|Combat")
	bool GrappleGrab(ABannonFighter* Victim, FName HandSocket);

	// two-layer health — poise drives crumple and is INDEPENDENT of HP (never couple them).
	UPROPERTY(BlueprintReadOnly, Category="Bannon|State") float HP = 10000.0f;      // MAX_HP
	UPROPERTY(BlueprintReadOnly, Category="Bannon|State") float Poise = 100.0f;
	UPROPERTY(BlueprintReadOnly, Category="Bannon|State") float Stamina = 440.0f;   // MAX_STAMINA
	UPROPERTY(BlueprintReadOnly, Category="Bannon|State") bool  bCrumpled = false;

	// strike mass proxy (height x build), drives weight-transfer power/knockback (see registerHit).
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Bannon|Stats") float StrikeMass = 1.0f;

	// apply an incoming impact — poise-driven crumple, HP damage through DMG_SCALE. Mirrors the
	// native applyImpact law (native/src/wrestler_state.cpp) so tuning stays in one place.
	UFUNCTION(BlueprintCallable, Category="Bannon|Combat")
	void ApplyImpact(float Impact);

	// idle regen (call each tick with whether idle).
	UFUNCTION(BlueprintCallable, Category="Bannon|Combat")
	void RegenStamina(bool bIdle, float Dt);
};
