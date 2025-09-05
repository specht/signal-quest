#!/usr/bin/env node

const readline = require("readline");

const moves = ["N", "S", "E", "W"];
let firstTick = true;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

rl.on("line", (line) => {
  const data = JSON.parse(line);

  if (firstTick) {
    const { width, height } = data.config;
    console.error(`Random walker (Node.js) launching on a ${width}x${height} map`);
  }

  const move = moves[Math.floor(Math.random() * moves.length)];
  console.log(move);

  firstTick = false;
});
