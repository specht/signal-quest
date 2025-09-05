#!/bin/sh
set -e
# Compile
g++ -std=gnu++17 -O2 -pipe -o bot bot.cpp
# Run
exec ./bot
