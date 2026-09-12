#include <iostream>
#include <map>
#include <string>

class TraumaDiagnosticPanel {
public:
    bool isPanelVisible = false;

    void togglePanel() {
        isPanelVisible = !isPanelVisible;
    }

    void updateTraumaBuffer(const std::string& characterId, const std::map<std::string, float>& localizedTraumaBuffer) {
        if (!isPanelVisible) return;
        
        std::cout << "\n=== TRAUMA DIAGNOSTIC PANEL: " << characterId << " ===" << std::endl;
        for (const auto& limb : localizedTraumaBuffer) {
            std::cout << " -> " << limb.first << " HP: " << limb.second 
                      << " (Targeting Priority: " << (limb.second < 30.0f ? "HIGH" : "NORMAL") << ")" << std::endl;
        }
        std::cout << "========================================\n" << std::endl;
    }
};
