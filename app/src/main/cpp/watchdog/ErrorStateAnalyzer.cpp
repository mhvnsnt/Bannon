#include "ErrorStateAnalyzer.h"
#include "RecoveryExecutionMatrix.h"
#include <iostream>
void ErrorStateAnalyzer::analyze(const std::string& logLine) {
    if (logLine.find("CRASH") != std::string::npos || logLine.find("Exception") != std::string::npos) {
        RecoveryExecutionMatrix matrix;
        matrix.triggerRecovery(logLine);
    }
}
