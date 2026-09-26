#pragma once
#include <string>

class NativeHTTPFetch {
public:
    static void fetchFromBackend(const std::string& endpoint);
};
