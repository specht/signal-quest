@echo off
REM Compile (MinGW or LLVM clang-cl/g++)
g++ -std=c++17 -O2 -o bot.exe random_walker.cpp
REM Run
bot.exe
