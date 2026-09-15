#pragma once
#include <string>

class HiveMindCrowdEngine {
public:
    void subscribeToKineticTelemetry();
    void processKineticEvent(float impactVelocity, const std::string& eventType);
private:
    void triggerPop(int intensity);
    void triggerBoo();
    void triggerChant(const std::string& chantText);
};
