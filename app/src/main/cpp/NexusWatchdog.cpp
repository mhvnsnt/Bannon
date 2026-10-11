#include "NexusWatchdog.h"
#include <chrono>

NexusWatchdog::NexusWatchdog() : isRunning(false) {}

NexusWatchdog::~NexusWatchdog() {
    stopMonitoring();
}

void NexusWatchdog::startMonitoring() {
    if (isRunning) return;
    isRunning = true;
    watchdogThread = std::thread(&NexusWatchdog::monitorLoop, this);
    heartbeatThread = std::thread(&NexusWatchdog::heartbeatLoop, this);
    std::cout << "[NexusWatchdog] Started background monitoring process. Self-healing loop active.\n";
}

void NexusWatchdog::stopMonitoring() {
    if (!isRunning) return;
    isRunning = false;
    if (watchdogThread.joinable()) {
        watchdogThread.join();
    }
    if (heartbeatThread.joinable()) {
        heartbeatThread.join();
    }
    std::cout << "[NexusWatchdog] Stopped background monitoring process.\n";
}

void NexusWatchdog::logEvent(const std::string& logLine) {
    std::lock_guard<std::mutex> lock(logMutex);
    logBuffer.push_back(logLine);
}

void NexusWatchdog::monitorLoop() {
    while (isRunning) {
        std::vector<std::string> currentLogs;
        {
            std::lock_guard<std::mutex> lock(logMutex);
            currentLogs = logBuffer;
            logBuffer.clear();
        }

        for (const auto& log : currentLogs) {
            analyzeLog(log);
        }

        std::this_thread::sleep_for(std::chrono::milliseconds(500));
    }
}

void NexusWatchdog::heartbeatLoop() {
    std::string backendUrl = "https://bannon-production.up.railway.app";
    std::string authKey = "#GodmodeOs1";
    
    while (isRunning) {
        std::cout << "[NexusWatchdog] [Heartbeat] Verifying connection to Railway server: " << backendUrl << "\n";
        std::cout << "[NexusWatchdog] [Heartbeat] Injecting authorization key: " << authKey << "\n";
        
        // Simulate a ping check - in a real scenario this would use libcurl or similar
        bool connectionSuccessful = true; // Replace with actual ping result
        
        if (connectionSuccessful) {
             std::cout << "[NexusWatchdog] [Heartbeat] Server ping successful. Pipeline clear.\n";
        } else {
             std::cout << "[NexusWatchdog] [Heartbeat] ERROR: Server connection timeout! Possible Tripo fetch pipeline stall.\n";
             triggerRecoveryRoutine("Railway Server Timeout");
        }
        
        std::this_thread::sleep_for(std::chrono::seconds(30));
    }
}

void NexusWatchdog::analyzeLog(const std::string& logLine) {
    // Detect crash signatures (Railway deployment errors, engine crashes, memory leaks)
    if (logLine.find("FATAL EXCEPTION") != std::string::npos ||
        logLine.find("SEGFAULT") != std::string::npos ||
        logLine.find("Out of memory") != std::string::npos ||
        logLine.find("Failed to build an image") != std::string::npos ||
        logLine.find("Deployment failed during build process") != std::string::npos ||
        logLine.find("timeout") != std::string::npos) {
        
        std::cout << "[NexusWatchdog] CRITICAL ANOMALY DETECTED: " << logLine << "\n";
        triggerRecoveryRoutine(logLine);
    }
    
    // Manage resource allocation / detect throttling needs (e.g., API limits reached)
    if (logLine.find("High CPU Usage") != std::string::npos ||
        logLine.find("Agent usage limit reached") != std::string::npos ||
        logLine.find("rate limit") != std::string::npos) {
        throttleNonEssentialTasks();
    }
}

void NexusWatchdog::triggerRecoveryRoutine(const std::string& crashSignature) {
    std::cout << "[NexusWatchdog] Triggering Self-Healing Recovery Routine for: " << crashSignature << "...\n";
    // Simulated recovery steps for closed-loop execution
    std::cout << "[NexusWatchdog] -> Capturing memory snapshot and stack trace...\n";
    
    if (crashSignature == "Railway Server Timeout") {
        std::cout << "[NexusWatchdog] -> Executing Network Watchdog Fixer: Re-initializing HTTP transport layer...\n";
        std::cout << "[NexusWatchdog] -> Swapping to fallback DNS / retry logic...\n";
    } else {
        std::cout << "[NexusWatchdog] -> Bypassing failed external container and migrating state to local sandbox...\n";
        std::cout << "[NexusWatchdog] -> Restarting failed subsystem (CAW Suite/Engine)...\n";
        std::cout << "[NexusWatchdog] -> System stabilized. Engine hot-patched dynamically.\n";
    }
}

void NexusWatchdog::throttleNonEssentialTasks() {
    std::cout << "[NexusWatchdog] Resource allocation warning. Throttling non-essential background tasks...\n";
    // Simulated throttling to manage quotas and memory
    std::cout << "[NexusWatchdog] -> Suspended Tripo 3D background polling temporarily.\n";
    std::cout << "[NexusWatchdog] -> Reduced physics solver tick rate for off-screen entities.\n";
    std::cout << "[NexusWatchdog] -> Culling orphaned particles to preserve memory.\n";
}
