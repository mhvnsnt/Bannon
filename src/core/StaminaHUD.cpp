#include <iostream>
#include <cmath>

class StaminaHUD {
public:
    void renderDynamicBar(float currentStamina, float maxStamina) {
        float percentage = (currentStamina / maxStamina) * 100.0f;
        float successRateModifier = std::max(0.1f, percentage / 100.0f);
        
        std::cout << "[HUD] STAMINA ARRAY: [";
        int bars = static_cast<int>(percentage / 5.0f);
        for(int i = 0; i < 20; ++i) {
            if (i < bars) std::cout << "|";
            else std::cout << " ";
        }
        std::cout << "] " << percentage << "%" << std::endl;
        std::cout << "[HUD] MOVE EXECUTION SUCCESS RATE MODIFIER: " << (successRateModifier * 100.0f) << "%" << std::endl;
    }
};
