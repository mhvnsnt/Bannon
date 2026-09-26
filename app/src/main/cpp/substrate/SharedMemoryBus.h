#pragma once
#include <string>
#include <map>

class SharedMemoryBus {
public:
    void linkASTToGraphRAG(const std::string& tokenizedClass, const std::string& trajectoryData);
    std::string queryUnifiedCache(const std::string& memoryKey);
private:
    std::map<std::string, std::string> unifiedMemoryCache;
};
