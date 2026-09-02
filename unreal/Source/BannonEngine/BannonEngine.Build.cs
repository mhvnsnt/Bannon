// Copyright BANNON.

using UnrealBuildTool;
using System.IO;

public class BannonEngine : ModuleRules
{
    public BannonEngine(ReadOnlyTargetRules Target) : base(Target)
    {
        PCHUsage = PCHUsageMode.UseExplicitOrSharedPCHs;
        CppStandard = CppStandardVersion.Cpp20;

        PublicDependencyModuleNames.AddRange(new string[] {
            "Core", "CoreUObject", "Engine", "InputCore", "EnhancedInput",
            "BannonCore"
        });

        PrivateDependencyModuleNames.AddRange(new string[] {
            "ControlRig", "RigVM", "AnimGraphRuntime"
        });
        
        string NativeInclude = Path.GetFullPath(Path.Combine(ModuleDirectory, "..", "..", "..", "native", "include"));
        PublicIncludePaths.Add(NativeInclude);
    }
}
