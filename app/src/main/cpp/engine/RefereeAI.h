#pragma once
#include <string>

class RefereeAI {
public:
    void initializeAutonomousRefereeProtocol();
    void interfaceTripo3DPipeline();
    void executePredictiveSpatialAvoidance();
    void raycastPerceptionEngine();
    void handleRefereeCollision(float wrestlerVelocity);
private:
    bool validateLineOfSight();
    bool isInCollisionTrajectory();
    void autonomouslyNavigate();
};
