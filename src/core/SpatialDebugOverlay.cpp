#include <iostream>

class SpatialDebugOverlay {
public:
    bool wireframeEnabled = false;

    void toggleWireframe() {
        wireframeEnabled = !wireframeEnabled;
        std::cout << "[VIEWPORT] Ring Apron & Rope Boundary Wireframe " 
                  << (wireframeEnabled ? "ENABLED" : "DISABLED") << std::endl;
    }

    void renderBoundaries(float apronX, float apronZ, float ropeTension) {
        if (!wireframeEnabled) return;
        std::cout << "[DEBUG OVERLAY] Rendering Apron Bounds (Cyan Wireframe) at X:" << apronX << " Z:" << apronZ << std::endl;
        std::cout << "[DEBUG OVERLAY] Rendering Rope Tension Bounds (Yellow Wireframe): " << ropeTension << std::endl;
    }
};
