#ifndef NEXUS_WATCHDOG_H
#define NEXUS_WATCHDOG_H

#include <string>
#include <thread>
#include <atomic>
#include <vector>
#include <mutex>
#include <iostream>
#include <chrono>

/**
 * NexusWatchdog
 * 
 * Replaces the external Railway agent with a closed-loop, self-healing 
 * system inside the C++ core.
 * Monitors engine stdout/stderr logs for crash signatures, 
 * automatically triggers recovery routines, and manages resource allocation.
 */
class NexusWatchdog {
public:
    NexusWatchdog();
    ~NexusWatchdog();

    void startMonitoring();
    void stopMonitoring();
    void logEvent(const std::string& logLine);

private:
    void monitorLoop();
    void analyzeLog(const std::string& logLine);
    void triggerRecoveryRoutine(const std::string& crashSignature);
    void throttleNonEssentialTasks();
    void heartbeatLoop();

    std::atomic<bool> isRunning;
    std::thread watchdogThread;
    std::thread heartbeatThread;
    
    std::vector<std::string> logBuffer;
    std::mutex logMutex;
};

#endif // NEXUS_WATCHDOG_H
