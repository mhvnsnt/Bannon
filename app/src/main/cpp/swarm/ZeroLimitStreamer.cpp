#include "ZeroLimitStreamer.h"
#include <iostream>
void ZeroLimitStreamer::streamCodeBlock(const std::string& functionName) {
    std::cout << "[ZeroLimitStreamer] Injecting target function block for: " << functionName << std::endl;
}
