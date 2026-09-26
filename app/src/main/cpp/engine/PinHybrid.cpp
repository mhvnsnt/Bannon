#include "PinHybrid.h"
#include <iostream>

void PinHybrid::processPinUIResult(float kickOutTime, float totalPinTime) {
    std::cout << "[PinHybrid] UI Mini-game processed. Kick-out registered at " << kickOutTime << "s out of " << totalPinTime << "s.\n";
    
    if (kickOutTime <= 1.0f) {
        std::cout << "[PinHybrid] 1-Count Kick-out: Injecting massive upward kinetic burst into defender's chest.\n";
        std::cout << "[PinHybrid] Attacker's IK pin constraints shattered instantly.\n";
    } else if (kickOutTime > 1.0f && kickOutTime < 2.9f) {
        std::cout << "[PinHybrid] 2-Count Kick-out: Defender broke free with medium struggle.\n";
        std::cout << "[PinHybrid] Kinetic burst overcomes attacker's Mass-Delta Gravity modifier.\n";
    } else if (kickOutTime >= 2.9f && kickOutTime < totalPinTime) {
        std::cout << "[PinHybrid] 2.9-Count Kick-out: Epic struggle!\n";
        std::cout << "[PinHybrid] Feeding slow, heavy procedural struggle sine wave into the mesh.\n";
        std::cout << "[PinHybrid] Kick-out looks physically exhausting against attacker's dead weight.\n";
    } else {
        std::cout << "[PinHybrid] 3-Count reached: Defender's mass constraints locked. Match over.\n";
    }
}
