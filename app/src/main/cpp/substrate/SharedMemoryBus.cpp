#include "SharedMemoryBus.h"
#include <iostream>

void SharedMemoryBus::linkASTToGraphRAG(const std::string& tokenizedClass, const std::string& trajectoryData) {
    unifiedMemoryCache[tokenizedClass] = trajectoryData;
    std::cout << "[SharedMemoryBus] AST Token linked to Graph RAG Vault: " << tokenizedClass << "\n";
}

std::string SharedMemoryBus::queryUnifiedCache(const std::string& memoryKey) {
    return unifiedMemoryCache[memoryKey];
}
