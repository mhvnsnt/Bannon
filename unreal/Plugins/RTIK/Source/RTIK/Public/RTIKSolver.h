#pragma once

#include "CoreMinimal.h"
#include "Animation/AnimNodeBase.h"

class RTIK_API FRTIKSolver
{
public:
	FRTIKSolver();
	~FRTIKSolver();

	void Initialize(const FTransform& ComponentTransform);
	void SolveIK(TArray<FTransform>& InOutBoneTransforms, float DeltaTime, float ConstraintStiffness = 1.0f);
	
	// Expose raw constraints for external systems
	void SetJointLimits(int32 BoneIndex, const FVector& MinAngles, const FVector& MaxAngles);
	
private:
	FTransform BaseTransform;
};
