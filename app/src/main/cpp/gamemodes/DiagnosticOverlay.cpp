#include "DiagnosticOverlay.h"
#include <iostream>

void DiagnosticOverlay::renderCollisionHulls() {
    std::cout << "[DiagnosticOverlay] Rendering active ragdoll collision hulls.\n";
    std::cout << "[DiagnosticOverlay] Real-time visual feedback on physics solver precision active.\n";
}

void DiagnosticOverlay::renderBoneWeightDistributions() {
    std::cout << "[DiagnosticOverlay] Rendering bone weight distributions over current meshes.\n";
}
