#pragma once
#include <string>

class LogStreamInterceptor {
public:
    void intercept(const std::string& stderrOutput);
};
