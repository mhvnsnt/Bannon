#pragma once
#include <string>
#include <vector>

class GodWithinConsequenceAI {
public:
    static void processMatchOutcome(const std::string& attackerName, const std::string& defenderName, const std::string& injuredLimb, bool constraintBroken);
private:
    static void applyInjuryFlag(const std::string& wrestlerName, int durationMonths);
    static void stripActiveTitles(const std::string& wrestlerName);
    static void rewriteBookingCard(const std::string& removedWrestler);
    static void plantRevengeStoryline(const std::string& injuredWrestler, const std::string& attacker);
};
