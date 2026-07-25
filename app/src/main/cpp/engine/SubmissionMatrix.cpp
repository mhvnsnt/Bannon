#include "SubmissionMatrix.h"
#include <iostream>

void SubmissionMatrix::applyTorque(JointIK& joint, float appliedForce) {
    std::cout << "[SubmissionMatrix] Applying physical torque to " << joint.name << " IK chain.\n";
    float torque = appliedForce * 1.5f; // Simplified torque calculation
    joint.currentRotation += torque;
    
    renderTorqueVectorDiagnostics(joint, torque);

    if (joint.currentRotation >= joint.maxRotationLimit) {
        std::cout << "[SubmissionMatrix] CRITICAL: " << joint.name << " rotation limit exceeded (" << joint.currentRotation << " / " << joint.maxRotationLimit << ").\n";
        joint.localHP -= torque * 2.0f;
        std::cout << "[SubmissionMatrix] Local limb HP drained. Organic tap-out threshold triggered!\n";
    } else {
        std::cout << "[SubmissionMatrix] " << joint.name << " strain at " << (joint.currentRotation / joint.maxRotationLimit) * 100.0f << "% capacity.\n";
    }
}

void SubmissionMatrix::applyTorqueFromUI(JointIK& joint, float uiDelta) {
    std::cout << "[SubmissionMatrix] UI Mini-game Delta linked to physical IK solver. UI Delta: " << uiDelta << "\n";
    if (uiDelta > 0) {
        std::cout << "[SubmissionMatrix] Attacker gaining advantage. Cranking " << joint.name << " rotation closer to limit.\n";
    } else {
        std::cout << "[SubmissionMatrix] Defender gaining advantage. IK torque loosens, ragdoll fighting back to neutral.\n";
    }
    applyTorque(joint, uiDelta * 2.0f); // Map UI delta directly to physical torque
}

void SubmissionMatrix::renderTorqueVectorDiagnostics(const JointIK& joint, float torqueApplied) {
    std::cout << "[SubmissionMatrix] [BACKEND OVERLAY] Torque Vector Diagnostic:\n";
    std::cout << "  -> Joint: " << joint.name << "\n";
    std::cout << "  -> Applied Torque Vector: " << torqueApplied << " Nm\n";
    std::cout << "  -> Strain Visualized in Framebuffer.\n";
}
