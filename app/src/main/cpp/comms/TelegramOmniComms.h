#pragma once
#include <string>

class TelegramOmniComms {
public:
    static void pushMultiplexedTelemetry(const std::string& domain, const std::string& message);
};
