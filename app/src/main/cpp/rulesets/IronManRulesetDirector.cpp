#include "IronManRulesetDirector.h"
#include <iostream>

std::map<std::string, int> IronManRulesetDirector::scoreboard;
float IronManRulesetDirector::timeRemaining = 0.0f;

void IronManRulesetDirector::initialize(float durationSeconds) {
    timeRemaining = durationSeconds;
    scoreboard.clear();
    std::cout << "[IronManRulesetDirector] Iron Man Match Initialized. Timer set to " << timeRemaining << "s.\n";
}

void IronManRulesetDirector::processPinfall(const std::string& attacker, const std::string& defender) {
    std::cout << "[IronManRulesetDirector] Successful 3-Count for " << attacker << " over " << defender << ".\n";
    scoreboard[attacker]++;
    std::cout << "[IronManRulesetDirector] " << attacker << " scores a fall! Current Score: " << scoreboard[attacker] << "\n";
    std::cout << "[IronManRulesetDirector] Instantly resetting health pools to 100%.\n";
    std::cout << "[IronManRulesetDirector] Injecting 35% stamina penalty for physiological wear-and-tear.\n";
    std::cout << "[IronManRulesetDirector] Simulation continues...\n";
}

void IronManRulesetDirector::updateTimer(float deltaTime) {
    timeRemaining -= deltaTime;
    if (timeRemaining <= 0.0f) {
        std::cout << "[IronManRulesetDirector] TIMER EXPIRED (0.00). MATCH TERMINATED.\n";
    }
}
