// BANNON — game target.
using UnrealBuildTool;
using System.Collections.Generic;

public class BannonTarget : TargetRules
{
    public BannonTarget(TargetInfo Target) : base(Target)
    {
        Type = TargetType.Game;
        DefaultBuildSettings = BuildSettingsVersion.V7;
        IncludeOrderVersion = EngineIncludeOrderVersion.Unreal5_5;
        ExtraModuleNames.Add("BannonCore");
        ExtraModuleNames.Add("BannonEngine");
    }
}
