#!/bin/sh
set -e
go build -o bot bot.go
exec ./bot
