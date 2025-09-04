#!/usr/bin/env ruby

require 'json'

STDOUT.sync = true
STDERR.sync = true

srand(1)
STDERR.puts "Let's fetch some beacons!!!"
loop do
    line = STDIN.readline
    STDOUT.puts ['N', 'W', 'E', 'S'].sample
end