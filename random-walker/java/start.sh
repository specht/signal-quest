#!/bin/sh
set -e
javac -cp json.jar RandomWalker.java
exec java -cp .:json.jar RandomWalker
