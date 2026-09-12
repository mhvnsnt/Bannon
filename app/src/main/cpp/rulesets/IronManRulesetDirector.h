#pragma once
#include <string>
#include <map>

class IronManRulesetDirector {
public:
    static void initialize(float durationSeconds);
    static void processPinfall(const std::string& attacker, const std::string& defender);
    static void updateTimer(float deltaTime);
private:
    static std::map<std::string, int> scoreboard;
    static float timeRemaining;
};
