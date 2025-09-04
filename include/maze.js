#!/usr/bin/env node
/**
 * Flexible ASCII map generator using rot.js (Node only).
 * Adds options to border & fully-connect Cellular maps (and any map).
 *
 * Generators:
 *   arena | divided | eller | icey | cellular | uniform | digger | rogue
 *
 * Examples:
 *   node maze.js -g cellular -w 80 -h 40 --density 0.45 --steps 5
 *   node maze.js -g cellular --no-border            # allow open edges
 *   node maze.js -g digger   --no-connect           # skip connectivity fix
 *   node maze.js -g uniform  --opts '{"roomWidth":[3,9]}'
 */

let ROT;
try { ROT = require("rot-js"); } catch { ROT = require("./rot.min.js"); }

/* ---------------- CLI ---------------- */
const args = process.argv.slice(2);
const getFlag = (name, short) => {
  const i = args.findIndex(a => a === `--${name}` || (short && a === `-${short}`));
  if (i === -1) return undefined;
  const nxt = args[i + 1];
  if (nxt === undefined || nxt.startsWith("-")) return true;
  return nxt;
};
const hasFlag = (name, short) => args.includes(`--${name}`) || (short && args.includes(`-${short}`));

if (hasFlag("help", "h") || hasFlag("usage", "?")) {
  console.log(`
ASCII map generator (rot.js)

Usage:
  node maze.js [--width 61] [--height 31] [--seed 123]
               [--generator cellular] [--opts '{"topology":4}']
               [--density 0.5] [--steps 4]
               [--no-border] [--no-connect]
               [--wall '#'] [--floor '.']

Flags:
  -g, --generator   arena|divided|eller|icey|cellular|uniform|digger|rogue (default: eller)
  -w, --width       map width (default: 41)
  -h, --height      map height (default: 21)
  -s, --seed        RNG seed (number or string)
      --opts        JSON passed to generator constructor
      --wall        wall character (default: █)
      --floor       floor character (default: space)
      --density     (cellular) initial fill [0..1] (default: 0.5)
      --steps       (cellular) automaton iterations (default: 4)
      --no-border   do NOT add a solid border (default is border ON for cellular)
      --no-connect  do NOT enforce full connectivity (default is ON)

Tips:
  - Odd dimensions often look better for mazes.
  - Use --seed to make outputs reproducible.
`);
  process.exit(0);
}

const width  = Math.max(5, parseInt(getFlag("width", "w"), 10) || 41);
const height = Math.max(5, parseInt(getFlag("height", "h"), 10) || 21);
const generator = (getFlag("generator", "g") || "eller").toLowerCase();
const seed = getFlag("seed", "s");
const wallChar  = (getFlag("wall")  || "█");
const floorChar = (getFlag("floor") || " ");

const optsJSON = getFlag("opts");
let ctorOpts = {};
if (typeof optsJSON === "string") {
  try { ctorOpts = JSON.parse(optsJSON); }
  catch { console.error("Could not parse --opts JSON. Using empty options."); }
}

// Cellular params
const density = clamp01(parseFloat(getFlag("density")) || 0.5);
const steps   = Math.max(0, parseInt(getFlag("steps"), 10) || 4);

// Behavior toggles (defaults tailored to your request)
const addBorder   = !hasFlag("no-border");   // default true
const doConnect   = !hasFlag("no-connect");  // default true

if (seed !== undefined) {
  const n = Number(seed);
  ROT.RNG.setSeed(Number.isNaN(n) ? seed : n);
}

/* ---------------- Map selection ---------------- */
function buildMap(kind) {
  switch (kind) {
    case "arena":    return new ROT.Map.Arena(width, height, ctorOpts);
    case "divided":  return new ROT.Map.DividedMaze(width, height, ctorOpts);
    case "eller":    return new ROT.Map.EllerMaze(width, height, ctorOpts);
    case "icey":     return new ROT.Map.IceyMaze(width, height, ctorOpts);
    case "uniform":  return new ROT.Map.Uniform(width, height, ctorOpts);
    case "digger":   return new ROT.Map.Digger(width, height, ctorOpts);
    case "rogue":    return new ROT.Map.Rogue(width, height, ctorOpts);
    case "cellular": return new ROT.Map.Cellular(width, height, ctorOpts);
    default:
      console.error(`Unknown generator "${kind}". Use --help for options.`);
      process.exit(2);
  }
}

/* ---------------- Generate ---------------- */
const grid = Array.from({ length: height }, () => Array(width).fill(1)); // 1=wall, 0=floor
const write = (x, y, v) => { grid[y][x] = v; };

const map = buildMap(generator);

if (generator === "rogue") {
  // Use the safe wrapper instead of map.create directly
  const ok = createRogueSafe(width, height, ctorOpts, (x, y, v) => write(x, y, v));
  if (!ok) {
    // Fallback: use Digger (rogue-like dungeons) if Rogue keeps failing
    const dig = new ROT.Map.Digger(width, height, ctorOpts);
    dig.create((x, y, v) => write(x, y, v));
  }

  if (addBorder) addSolidBorder(grid);
  if (doConnect) ensureConnectivity(grid);

} else if (generator === "cellular") {
  // (keep your fixed cellular flow)
  if (typeof map.randomize === "function") map.randomize(density);
  for (let i = 0; i < steps; i++) map.create();
  map.create((x, y, v) => write(x, y, v));
  if (addBorder) addSolidBorder(grid);
  if (doConnect) ensureConnectivity(grid);

} else {
  // all other generators
  map.create((x, y, v) => write(x, y, v));
  if (addBorder) addSolidBorder(grid);
  if (doConnect) ensureConnectivity(grid);
}


/* ---------------- Output ---------------- */
for (let y = 0; y < height; y++) {
  let line = "";
  for (let x = 0; x < width; x++) line += grid[y][x] ? wallChar : floorChar;
  console.log(line);
}

/* ---------------- Helpers ---------------- */

function clamp01(n) { if (Number.isNaN(n)) return 0.5; return Math.max(0, Math.min(1, n)); }

function addSolidBorder(g) {
  const H = g.length, W = g[0].length;
  for (let x = 0; x < W; x++) { g[0][x] = 1; g[H-1][x] = 1; }
  for (let y = 0; y < H; y++) { g[y][0] = 1; g[y][W-1] = 1; }
}

// 1) Add this helper near your other helpers
function createRogueSafe(width, height, ctorOpts, write) {
  const candidates = [
    // Try a few proven-stable cell grids & room ranges
    { cellWidth: 3, cellHeight: 3, roomWidth: [3, 9], roomHeight: [3, 7] },
    { cellWidth: 3, cellHeight: 2, roomWidth: [3, 8], roomHeight: [3, 6] },
    { cellWidth: 2, cellHeight: 3, roomWidth: [3, 8], roomHeight: [3, 6] },
    { cellWidth: 4, cellHeight: 3, roomWidth: [3, 7], roomHeight: [3, 6] },
  ];

  // If user provided explicit Rogue opts, try those first
  const first = {};
  if (ctorOpts.cellWidth)  first.cellWidth  = ctorOpts.cellWidth;
  if (ctorOpts.cellHeight) first.cellHeight = ctorOpts.cellHeight;
  if (ctorOpts.roomWidth)  first.roomWidth  = ctorOpts.roomWidth;
  if (ctorOpts.roomHeight) first.roomHeight = ctorOpts.roomHeight;
  const tryList = Object.keys(first).length ? [first, ...candidates] : candidates;

  // Try each option set and up to a few seeds for each (keep user seed stable if set)
  const seedsToTry = [null, "rogue-fallback-1", "rogue-fallback-2"];

  for (const opts of tryList) {
    for (const s of seedsToTry) {
      const saved = ROT.RNG.getState && ROT.RNG.getState();
      if (s && ROT.RNG.setSeed) ROT.RNG.setSeed(s);
      try {
        const rogue = new ROT.Map.Rogue(width, height, { ...ctorOpts, ...opts });
        rogue.create((x, y, v) => write(x, y, v)); // may throw
        if (saved && ROT.RNG.setState) ROT.RNG.setState(saved);
        return true; // success
      } catch (e) {
        // restore RNG and try next combo
        if (saved && ROT.RNG.setState) ROT.RNG.setState(saved);
        continue;
      }
    }
  }
  return false; // all attempts failed
}


/**
 * Ensure the entire floor space is one connected component by carving
 * simple L-shaped corridors between components. Border is preserved.
 */
function ensureConnectivity(g) {
  const H = g.length, W = g[0].length;
  const {labels, components} = labelComponents(g);
  if (components.length <= 1) return;

  // Choose the largest component as the main region
  components.sort((a, b) => b.cells.length - a.cells.length);
  let main = components[0];

  for (let i = 1; i < components.length; i++) {
    const comp = components[i];
    // Find closest pair between 'main' and 'comp' (Manhattan distance)
    const {a, b} = closestPair(main.cells, comp.cells);
    carveTunnel(g, a.x, a.y, b.x, b.y);
    // Merge: relabel freshly carved tiles as part of main; recompute main cells quickly
    // (Simpler: relabel everything again)
    const relabeled = labelComponents(g);
    relabeled.components.sort((x, y) => y.cells.length - x.cells.length);
    main = relabeled.components[0];
  }
}

/** Label connected floor components (4-neighborhood). */
function labelComponents(g) {
  const H = g.length, W = g[0].length;
  const labels = Array.from({ length: H }, () => Array(W).fill(-1));
  const comps = [];
  let id = 0;

  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (g[y][x] !== 0 || labels[y][x] !== -1) continue;
    // BFS flood fill
    const q = [{x, y}];
    labels[y][x] = id;
    const cells = [{x, y}];
    while (q.length) {
      const p = q.shift();
      for (const [nx, ny] of neighbors4(p.x, p.y, W, H)) {
        if (g[ny][nx] === 0 && labels[ny][nx] === -1) {
          labels[ny][nx] = id;
          q.push({x: nx, y: ny});
          cells.push({x: nx, y: ny});
        }
      }
    }
    comps.push({ id, cells });
    id++;
  }
  return { labels, components: comps };
}

function neighbors4(x, y, W, H) {
  const out = [];
  if (x > 0) out.push([x-1, y]);
  if (x < W-1) out.push([x+1, y]);
  if (y > 0) out.push([x, y-1]);
  if (y < H-1) out.push([x, y+1]);
  return out;
}

/** Find the closest pair of cells between two sets (O(n*m), fine for typical sizes). */
function closestPair(aCells, bCells) {
  let best = { d: Infinity, a: null, b: null };
  for (const a of aCells) {
    for (const b of bCells) {
      const d = Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
      if (d < best.d) best = { d, a, b };
    }
  }
  return best;
}

/** Carve an L-shaped tunnel between two points, staying inside the border. */
function carveTunnel(g, x1, y1, x2, y2) {
  const H = g.length, W = g[0].length;
  const carve = (x, y) => {
    if (x <= 0 || y <= 0 || x >= W-1 || y >= H-1) return; // keep border solid
    g[y][x] = 0;
  };
  // Randomize bend direction a bit for variety
  const horizontalFirst = ROT.RNG.getUniform() < 0.5;
  if (horizontalFirst) {
    stepLine(x1, x2, x => carve(x, y1));
    stepLine(y1, y2, y => carve(x2, y));
  } else {
    stepLine(y1, y2, y => carve(x1, y));
    stepLine(x1, x2, x => carve(x, y2));
  }
}

function stepLine(a, b, visit) {
  const dir = a <= b ? 1 : -1;
  for (let v = a; v !== b; v += dir) visit(v);
  visit(b);
}
