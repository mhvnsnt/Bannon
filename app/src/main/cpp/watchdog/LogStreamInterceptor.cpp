#include "LogStreamInterceptor.h"
#include <iostream>
void LogStreamInterceptor::startIntercepting() {
    isRunning = true;
    interceptorThread = std::thread(&LogStreamInterceptor::captureStream, this);
}
void LogStreamInterceptor::stopIntercepting() {
    isRunning = false;
    if (interceptorThread.joinable()) interceptorThread.join();
}
void LogStreamInterceptor::captureStream() {
    while (isRunning) {
        // Intercept stdout/stderr
    }
}
