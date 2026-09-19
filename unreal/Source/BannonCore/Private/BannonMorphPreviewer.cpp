// AI ORIENTATION BLOCK v114
#include "BannonMorphPreviewer.h"

UBannonMorphPreviewer::UBannonMorphPreviewer() {
    PrimaryComponentTick.bCanEverTick = false;
}

void UBannonMorphPreviewer::BindToMesh(USkeletalMeshComponent* Mesh) {
    TargetMesh = Mesh;
}

void UBannonMorphPreviewer::ApplyMorphTargetRealTime(FName MorphName, float Value) {
    if (TargetMesh) {
        TargetMesh->SetMorphTarget(MorphName, Value);
        // Force bounds recalculation to prevent culling issues with extreme morphs (GNM creatures)
        TargetMesh->UpdateBounds(); 
    }
}
