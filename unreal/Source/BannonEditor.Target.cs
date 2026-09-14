// BANNON — editor target.
using UnrealBuildTool;
using System.Collections.Generic;

public class BannonEditorTarget : TargetRules
{
    public BannonEditorTarget(TargetInfo Target) : base(Target)
    {
        Type = TargetType.Editor;
        DefaultBuildSettings = BuildSettingsVersion.V7;
        IncludeOrderVersion = EngineIncludeOrderVersion.Unreal5_6;
        ExtraModuleNames.Add("BannonCore");
        ExtraModuleNames.Add("BannonEngine");
    }
}
