#pragma once
#include <string>

class CompilerErrorInterceptor {
public:
    void interceptStream(const std::string& stderrLog);
};
