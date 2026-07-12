#pragma once
#include <vector>
#include <string>

class DevilSweepManager {
public:
    void initializePartitions();
    void initializeA2ASockets();
private:
    std::vector<std::string> worktrees;
};
