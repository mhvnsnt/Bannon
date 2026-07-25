// BANNON — game target. Mirrors the UE5.8 blank template (BuildSettings V7, include order 5_8).
using UnrealBuildTool;
using System.Collections.Generic;

public class BannonTarget : TargetRules
{
	public BannonTarget(TargetInfo Target) : base(Target)
	{
		Type = TargetType.Game;
		DefaultBuildSettings = BuildSettingsVersion.V7;
		IncludeOrderVersion = EngineIncludeOrderVersion.Unreal5_8;
		ExtraModuleNames.Add("BannonCore");
	}
}
