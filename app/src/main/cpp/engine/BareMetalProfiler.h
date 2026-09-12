#pragma once

class BareMetalProfiler {
public:
    void monitorHardware();
    void mutateRenderingLoop();
private:
    float getCPUCacheMissRate();
    float getGPURegisterPressure();
};
