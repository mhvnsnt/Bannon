// BANNON native game module. Depends on Chaos + PhysicsControl (the ragdoll), ControlRig (the
// retarget), and adds ../../../native/include so the SAME header-only combat/physics laws the web
// engine runs (bannon_core/rig/strike/grapple/weapon/referee/universe/anim_bridge .h) compile here.
using UnrealBuildTool;
using System.IO;

public class BannonCore : ModuleRules
{
	public BannonCore(ReadOnlyTargetRules Target) : base(Target)
	{
		PCHUsage = PCHUsageMode.UseExplicitOrSharedPCHs;
		CppStandard = CppStandardVersion.Cpp20;

		PublicDependencyModuleNames.AddRange(new string[] {
			"Core", "CoreUObject", "Engine", "InputCore", "EnhancedInput",
			"Chaos", "ChaosCore", "PhysicsCore"
		});
		PrivateDependencyModuleNames.AddRange(new string[] {
			"ControlRig", "RigVM", "AnimGraphRuntime"
		});

		// THE BRIDGE: the engine-agnostic laws live in the repo's native/ core (one source of truth
		// for both the Three.js build and this one). Header-only, so just add the include path.
		string NativeInclude = Path.GetFullPath(Path.Combine(ModuleDirectory, "..", "..", "..", "native", "include"));
		PublicIncludePaths.Add(NativeInclude);
	}
}
