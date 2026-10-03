#pragma once
#include <string>

class VisualTelemetryDaemon {
public:
    static void captureFramebufferAndSend(const std::string& targetAsset);
    static void validateMeshAndRender(const std::string& assetPath);
};
