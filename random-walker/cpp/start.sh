#!/bin/sh
set -e
# Compile
g++ -std=gnu++17 -O2 -pipe -o bot random_walker.cpp
# Run
exec ./bot
