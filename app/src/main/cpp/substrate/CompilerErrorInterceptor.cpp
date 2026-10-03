#include "CompilerErrorInterceptor.h"
#include <iostream>

void CompilerErrorInterceptor::interceptStream(const std::string& stderrLog) {
    std::cout << "[CompilerErrorInterceptor] Caught compiler crash. Passing to ASTCodeMapIndexer for dependency resolution...\n";
    std::cout << "[CompilerErrorInterceptor] Packaging broken snippet and structural chain for blind worker rewrite.\n";
}
