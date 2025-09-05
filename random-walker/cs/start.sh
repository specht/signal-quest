#!/bin/sh
set -e

# Ensure project exists
if [ ! -f "RandomWalker.csproj" ]; then
  # Create a minimal project if missing
  dotnet new console -n RandomWalker -o . --force
fi

# Build in Release mode
dotnet build -c Release

# Run the compiled DLL
exec dotnet bin/Release/net9.0/RandomWalker.dll
