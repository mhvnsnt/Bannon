#pragma once
#include <string>

class CAWVisualAssetComposite {
public:
    static void applyAttireMesh(const std::string& attireID);
    static void applyMaskOverlay(const std::string& maskID);
    static void applyFacePaintShader(const std::string& hexColor, float coverageAlpha);
};
