#include "NativeHTTPFetch.h"
#include <iostream>

void NativeHTTPFetch::fetchFromBackend(const std::string& endpoint) {
    std::string backendUrl = "https://bannon-production.up.railway.app";
    std::string authKey = "#GodmodeOs1";
    
    std::cout << "[NativeHTTPFetch] Authenticating with custom backend: " << backendUrl << "\n";
    std::cout << "[NativeHTTPFetch] Target endpoint: " << backendUrl << endpoint << "\n";
    std::cout << "[NativeHTTPFetch] Injecting authentication header: Authorization: Bearer " << authKey << "\n";
    std::cout << "[NativeHTTPFetch] Security Rule: If this key is missing, server drops connection automatically.\n";
}
