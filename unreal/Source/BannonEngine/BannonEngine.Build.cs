// BANNON high-level wrestling gameplay module.
//
// WHY THIS FILE EXISTS: BannonEngine has 31 source files and, until now, no
// Build.cs and no entry in Bannon.uproject's Modules array — so UnrealBuildTool
// never saw it. Everything it declares was invisible to the engine.
//
// That mattered far more than a missing module usually does, because this module
// owns the ENTIRE Unreal content schema. All four UPrimaryDataAsset classes
// (MovesetLibrary, Entrance, Arena, CreationPart) live here; BannonCore has
// none. With the module unbuilt those asset types do not exist as engine
// classes, so no .uasset could be authored against them. The repository's
// missing content layer is downstream of this file's absence.
//
// Dependencies are deliberately minimal and were derived from actual usage, not
// copied from BannonCore: this module uses only CoreMinimal, Engine/DataAsset,
// GameFramework Actor/Character/CharacterMovementComponent, and the
// USkeletalMesh / UAnimMontage / UStaticMesh types — all of which live in
// Engine. It does NOT include the native/ law headers (measured: 0 files), so
// unlike BannonCore it needs no native include path.

using UnrealBuildTool;

public class BannonEngine : ModuleRules
{
	public BannonEngine(ReadOnlyTargetRules Target) : base(Target)
	{
		PCHUsage = PCHUsageMode.UseExplicitOrSharedPCHs;
		CppStandard = CppStandardVersion.Cpp20;

		PublicDependencyModuleNames.AddRange(new string[] {
			"Core", "CoreUObject", "Engine", "InputCore"
		});
	}
}
