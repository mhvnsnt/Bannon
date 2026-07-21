#include "RTIKSolver.h"

FRTIKSolver::FRTIKSolver() {}
FRTIKSolver::~FRTIKSolver() {}

void FRTIKSolver::Initialize(const FTransform& ComponentTransform)
{
	BaseTransform = ComponentTransform;
}

void FRTIKSolver::SolveIK(TArray<FTransform>& InOutBoneTransforms, float DeltaTime, float ConstraintStiffness)
{
	// Generic FABRIK/CCD implementation goes here.
	// We expose this so external engines can override constraints.
}

void FRTIKSolver::SetJointLimits(int32 BoneIndex, const FVector& MinAngles, const FVector& MaxAngles)
{
}
