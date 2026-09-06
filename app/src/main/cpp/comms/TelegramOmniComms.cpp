#include "TelegramOmniComms.h"
#include <iostream>

void TelegramOmniComms::pushMultiplexedTelemetry(const std::string& domain, const std::string& message) {
    std::cout << "[" << domain << "] Pushing to Telegram Webhook: " << message << "\n";
}
