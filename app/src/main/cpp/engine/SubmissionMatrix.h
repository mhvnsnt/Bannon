#pragma once
#include <string>

struct JointIK {
    std::string name;
    float currentRotation;
    float maxRotationLimit;
    float localHP;
};

class SubmissionMatrix {
public:
    static void applyTorque(JointIK& joint, float appliedForce);
    static void applyTorqueFromUI(JointIK& joint, float uiDelta);
    static void renderTorqueVectorDiagnostics(const JointIK& joint, float torqueApplied);
};
