#include "BannonMDickieAssetRegistry.h"

void UBannonMDickieAssetRegistry::InitializeDecryptedRegistry() {
    // Decryption loop for MDickie legacy assets
    EncryptedAssets.Empty();

    FMDickieAssetEntry Entry_wreck_patterson_fbx;
    Entry_wreck_patterson_fbx.AssetID = TEXT("wreck_patterson_fbx");
    Entry_wreck_patterson_fbx.AssetName = TEXT("Wreck_Patterson_Body.fbx");
    Entry_wreck_patterson_fbx.AssetType = TEXT("model");
    Entry_wreck_patterson_fbx.DriveFolder = TEXT("19k_jmuiUYsAubZyx_bUL0m8svyYmevM5");
    EncryptedAssets.Add(Entry_wreck_patterson_fbx);

    FMDickieAssetEntry Entry_master_sensei_fbx;
    Entry_master_sensei_fbx.AssetID = TEXT("master_sensei_fbx");
    Entry_master_sensei_fbx.AssetName = TEXT("Master_Sensei_Rig.fbx");
    Entry_master_sensei_fbx.AssetType = TEXT("rig");
    Entry_master_sensei_fbx.DriveFolder = TEXT("19k_jmuiUYsAubZyx_bUL0m8svyYmevM5");
    EncryptedAssets.Add(Entry_master_sensei_fbx);

    FMDickieAssetEntry Entry_titan_glb;
    Entry_titan_glb.AssetID = TEXT("titan_glb");
    Entry_titan_glb.AssetName = TEXT("Titan_Armor_Suits.glb");
    Entry_titan_glb.AssetType = TEXT("model");
    Entry_titan_glb.DriveFolder = TEXT("1chJYomdZW6E7jqUUHZTn1w9wLTakRfvG");
    EncryptedAssets.Add(Entry_titan_glb);

    FMDickieAssetEntry Entry_steel_steps_obj;
    Entry_steel_steps_obj.AssetID = TEXT("steel_steps_obj");
    Entry_steel_steps_obj.AssetName = TEXT("Arena_Steel_Steps.obj");
    Entry_steel_steps_obj.AssetType = TEXT("model");
    Entry_steel_steps_obj.DriveFolder = TEXT("1chJYomdZW6E7jqUUHZTn1w9wLTakRfvG");
    EncryptedAssets.Add(Entry_steel_steps_obj);

}
