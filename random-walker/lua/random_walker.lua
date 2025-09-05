#!/usr/bin/env lua
local json = require("json")

-- Unbuffered stdout so the runner sees each move immediately
io.stdout:setvbuf("no")
io.stderr:setvbuf("no")

-- Deterministic RNG
math.randomseed(1)

local first_tick = true
local moves = { "N", "S", "E", "W" }

for line in io.lines() do
  local ok, data = pcall(json.decode, line)
  if first_tick and type(data) == "table" and type(data.config) == "table" then
      local w = data.config.width or "?"
      local h = data.config.height or "?"
      io.stderr:write(string.format("Random walker (Lua) launching on a %sx%s map\n", w, h))
  end
  print(moves[math.random(1, #moves)])
  first_tick = false
end
