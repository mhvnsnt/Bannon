#pragma once
#include <string>
#include <thread>
#include <atomic>
class LogStreamInterceptor {
public:
    void startIntercepting();
    void stopIntercepting();
private:
    void captureStream();
    std::atomic<bool> isRunning{false};
    std::thread interceptorThread;
};
