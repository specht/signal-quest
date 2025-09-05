#!/bin/sh
set -e
go build -o bot random_walker.go
exec ./bot
