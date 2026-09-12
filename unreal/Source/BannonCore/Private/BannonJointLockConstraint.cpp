// Copyright BANNON.

#include "BannonJointLockConstraint.h"
#include "GameFramework/Character.h"
#include "Components/SkeletalMeshComponent.h"

UBannonJointLockConstraint::UBannonJointLockConstraint()
{
	PrimaryComponentTick.bCanEverTick = false;
	TearThresholdTorque = 1200.0f;
}

void UBannonJointLockConstraint::ApplyJointTorque(ACharacter* Attacker, ACharacter* Defender, FName TargetBone, float BaseTorque)
{
	if (!Attacker || !Defender) return;
	
	float Leverage = CalculateLeverageMultiplier(Attacker, Defender);
	float FinalTorque = BaseTorque * Leverage;

	UE_LOG(LogTemp, Log, TEXT("Bannon Submission: Attacker %s applying submission hold torque (%f N-m) on defender's %s bone."),
		*Attacker->GetName(), FinalTorque, *TargetBone.ToString());

	// Update joint stress based on applied torque
	float DeltaTime = GetWorld() ? GetWorld()->GetDeltaSeconds() : 0.016f;
	UpdateTearingStress(TargetBone, FinalTorque, DeltaTime);
}

float UBannonJointLockConstraint::CalculateLeverageMultiplier(ACharacter* Attacker, ACharacter* Defender)
{
	if (!Attacker || !Defender) return 1.0f;
	
	// Real leverage scaling based on wrestler height and weight delta (taller/heavier wrestlers generate more torque)
	float HeightDelta = Attacker->GetDefaultHalfHeight() - Defender->GetDefaultHalfHeight();
	
	float LeverageScale = 1.0f;
	if (HeightDelta > 0.0f)
	{
		LeverageScale += (HeightDelta / 50.0f) * 0.15f; // Scale up to +15% torque
	}
	
	return LeverageScale;
}

void UBannonJointLockConstraint::UpdateTearingStress(FName TargetBone, float TorqueApplied, float DeltaTime)
{
	if (!JointStressMap.Contains(TargetBone))
	{
		FBannonJointStressData NewStress;
		NewStress.CurrentStress = 0.0f;
		NewStress.StressLimit = 150.0f; // Limit before tear
		NewStress.bIsTorn = false;
		NewStress.bIsDislocated = false;
		JointStressMap.Add(TargetBone, NewStress);
	}

	FBannonJointStressData& Stress = JointStressMap[TargetBone];
	if (Stress.bIsTorn) return;

	// Stress increases proportionally to torque exceeding the joint stiffness threshold
	float ExceedingForce = TorqueApplied - 400.0f; // Passive resistance of joints
	if (ExceedingForce > 0.0f)
	{
		Stress.CurrentStress += (ExceedingForce * DeltaTime) * 0.4f;
		
		UE_LOG(LogTemp, Log, TEXT("Bannon Submission: Bone %s joint stress building: %f / %f"), 
			*TargetBone.ToString(), Stress.CurrentStress, Stress.StressLimit);

		if (Stress.CurrentStress >= Stress.StressLimit)
		{
			TriggerJointTear(TargetBone);
		}
	}
	else
	{
		// Passive recovery of stress if let go
		Stress.CurrentStress = FMath::Max(0.0f, Stress.CurrentStress - (15.0f * DeltaTime));
	}
}

void UBannonJointLockConstraint::TriggerJointTear(FName TargetBone)
{
	if (JointStressMap.Contains(TargetBone))
	{
		FBannonJointStressData& Stress = JointStressMap[TargetBone];
		Stress.bIsTorn = true;
		Stress.bIsDislocated = true;
		
		UE_LOG(LogTemp, Error, TEXT("Bannon Submission: JOINT CONSTRAINT TEAR DETECTED! Joint '%s' has been hyper-extended/dislocated!"), 
			*TargetBone.ToString());

		// Trigger visual and auditory cues
		ACharacter* Owner = Cast<ACharacter>(GetOwner());
		if (Owner)
		{
			// Apply localized structural scaling penalty to indicate broken/limp limb
			USkeletalMeshComponent* Mesh = Owner->GetMesh();
			if (Mesh)
			{
				Mesh->SetAllMotorsAngularDriveParams(0.0f, 0.0f, 0.0f); // Disable joint motors
			}
		}
	}
}
