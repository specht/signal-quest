@echo off
REM Compile (MinGW or LLVM clang-cl/g++)
g++ -std=c++17 -O2 -o bot.exe bot.cpp
REM Run
bot.exe
