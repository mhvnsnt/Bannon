#!/usr/bin/env bash
# Verify every Unreal API our C++ calls actually exists in the engine source, with the signature we
# assume. This is the check that catches the class of bug that shipped in BannonPhysicalAnimation.cpp:
# invented field names (Data.JointStrength, Data.SkeletalMeshComponentBudget) and a nonexistent method
# (ApplyPhysicalAnimationData) that could never have compiled — written confidently, never verified.
#
# We cannot BUILD Unreal in CI (it needs ~100GB and hours), but the full engine source is available at
# mhvnsnt/UnrealEngine, so we can grep the real headers. That turns "carefully written" into "verified".
#
#   UE_ROOT=/workspace/unrealengine scripts/verify_ue_api.sh
#
# Exit 0 = every symbol found. Exit 1 = at least one is missing/renamed (a real UE upgrade break).

set -uo pipefail

UE_ROOT="${UE_ROOT:-/workspace/unrealengine}"
if [ ! -d "$UE_ROOT/Engine/Source/Runtime/Engine" ]; then
  echo "SKIP: Unreal source not present at $UE_ROOT (set UE_ROOT). Not a failure."
  exit 0
fi

E="$UE_ROOT/Engine/Source/Runtime/Engine"
PA="$E/Classes/PhysicsEngine/PhysicalAnimationComponent.h"
BI="$E/Classes/PhysicsEngine/BodyInstance.h"
CI="$E/Classes/PhysicsEngine/ConstraintInstance.h"
SK="$E/Classes/Components/SkeletalMeshComponent.h"
PC="$E/Classes/Components/PrimitiveComponent.h"
# USkeletalMeshComponent inherits from Skinned -> Mesh -> Primitive -> SceneComponent -> ActorComponent,
# so several calls we make are declared on a BASE class, not on SkeletalMeshComponent itself. Checking
# them against the wrong header is what produced 4 spurious FAILs the first time this script ran.
SKN="$E/Classes/Components/SkinnedMeshComponent.h"
AC="$E/Classes/Components/ActorComponent.h"
PAS="$E/Classes/PhysicsEngine/PhysicsAsset.h"
PCT="$E/Classes/PhysicsEngine/PhysicsConstraintTemplate.h"

fails=0
ck() { # ck <description> <file> <regex>
  if grep -qE "$3" "$2" 2>/dev/null; then
    printf '  PASS %s\n' "$1"
  else
    printf '  FAIL %s   (missing: %s in %s)\n' "$1" "$3" "$(basename "$2")"
    fails=$((fails+1))
  fi
}

echo "UE version: $(grep -m1 MajorVersion "$UE_ROOT/Engine/Build/Build.version" 2>/dev/null | tr -d ' ,"')$(grep -m1 MinorVersion "$UE_ROOT/Engine/Build/Build.version" 2>/dev/null | tr -d ' ,"')"

echo "FPhysicalAnimationData fields (UBannonRagdollComponent + BannonPhysicalAnimation):"
# bIsLocalSimulation is a BITFIELD (uint8 bIsLocalSimulation : 1;) so it has no ';' straight after the
# name — match either form rather than assuming a plain member.
for f in BodyName bIsLocalSimulation OrientationStrength AngularVelocityStrength PositionStrength VelocityStrength MaxLinearForce MaxAngularForce; do
  ck "field $f" "$PA" "[[:space:]]$f[[:space:]]*(;|:[[:space:]]*[0-9]+;)"
done
echo "  (these replaced the invented JointStrength / SkeletalMeshComponentBudget / bIsLocalSpaceSimulation)"

echo "UPhysicalAnimationComponent methods:"
ck "ApplyPhysicalAnimationSettings" "$PA" "ApplyPhysicalAnimationSettings\("
ck "SetSkeletalMeshComponent"      "$PA" "SetSkeletalMeshComponent\("

echo "FBodyInstance (velocity cap + impulses):"
ck "GetUnrealWorldVelocity"        "$BI" "GetUnrealWorldVelocity\("
ck "SetLinearVelocity"             "$BI" "SetLinearVelocity\("
ck "AddImpulse"                    "$BI" "AddImpulse\("
ck "IsInstanceSimulatingPhysics"   "$BI" "IsInstanceSimulatingPhysics\("

echo "FConstraintInstance (SetJointStiffness + PhysicsAsset setup):"
ck "SetAngularDriveParams"         "$CI" "SetAngularDriveParams\("
ck "SetLinearDriveParams"          "$CI" "SetLinearDriveParams\("
ck "SetOrientationDriveSLERP"      "$CI" "SetOrientationDriveSLERP\("
ck "SetAngularSwing1Limit"         "$CI" "SetAngularSwing1Limit\("
ck "SetAngularSwing2Limit"         "$CI" "SetAngularSwing2Limit\("
ck "SetAngularTwistLimit"          "$CI" "SetAngularTwistLimit\("
ck "SetLinearLimits"               "$CI" "SetLinearLimits\("
ck "ConstraintBone1"               "$CI" "ConstraintBone1;"

echo "USkeletalMeshComponent (blend / impulse / COM / bodies):"
ck "SetAllBodiesBelowPhysicsBlendWeight" "$SK" "SetAllBodiesBelowPhysicsBlendWeight\("
ck "AddImpulseToAllBodiesBelow"          "$SK" "AddImpulseToAllBodiesBelow\("
ck "SetCenterOfMass (on PrimitiveComponent)" "$PC"  "SetCenterOfMass\("
ck "GetBodyInstance"                     "$SK" "GetBodyInstance\("
ck "GetPhysicsAsset (on SkinnedMesh)"    "$SKN" "GetPhysicsAsset\("
ck "public Bodies array"                 "$SK" "TArray<struct FBodyInstance\*> Bodies;"
ck "public Constraints array"            "$SK" "TArray<struct FConstraintInstance\*> Constraints;"
ck "RecreatePhysicsState (on ActorComponent)" "$AC" "RecreatePhysicsState\("

echo "UPhysicsAsset / constraint templates:"
ck "ConstraintSetup"                     "$PAS" "ConstraintSetup;"
ck "DefaultInstance"                     "$PCT" "FConstraintInstance DefaultInstance;"

echo
if [ "$fails" -eq 0 ]; then
  echo "ALL UE APIS VERIFIED against real engine source."
  exit 0
fi
echo "FAILED: $fails UE symbol(s) missing or renamed — the UE build would break."
exit 1
