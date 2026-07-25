cmake_minimum_required(VERSION 3.10.2)
project(BannonEngine)

set(CMAKE_CXX_STANDARD 17)

add_library(bannon SHARED src/native_activity.cpp)
find_library(log-lib log)
target_link_libraries(bannon ${log-lib})
