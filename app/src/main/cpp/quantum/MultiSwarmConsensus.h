#pragma once
#include <vector>
#include <string>

class MultiSwarmConsensus {
public:
    bool requestMergeSignature(const std::string& branchName, int frameVariations);
private:
    bool simulateFrameStressTest(int frames);
    std::vector<std::string> validatorAgents;
};
