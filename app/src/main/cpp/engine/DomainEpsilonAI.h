#pragma once
#include <string>

class DomainEpsilonAI {
public:
    void evaluateTacticalState(float stamina, float armHealth, float ringPositionX, float ringPositionY);
    void evaluateSubmissionDefense(float localLimbHP, float currentRotation, float maxRotationLimit);
private:
    void executeRollOut();
    void holdPosition();
    void struggleInUI();
};
