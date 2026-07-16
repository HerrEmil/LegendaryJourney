#!/usr/bin/env node
// Persistent self-play harness for Legendary Journey.
//
// Loads the REAL browser modules (js/*.js, in index.html order, minus the
// bootstrap files that only wire the DOM) inside a node:vm context with a
// minimal document/Image/setTimeout shim, then simulates full playthroughs
// using the real logic: lj.enemy.get, lj.hero.fight, lj.items.makeItem and
// lj.hero.gear.pickup, advancing a realm on every boss kill and winning when
// a full 9-slot legendary set is assembled.
//
// Usage:
//   node scripts/selfplay.mjs                 pretty summary over RUNS games
//   node scripts/selfplay.mjs --runs 1000     override game count
//   node scripts/selfplay.mjs --check         also enforce balance-baseline.json
//   node scripts/selfplay.mjs --json          machine-readable one-line result
//
// The spatial dungeon layer (door navigation, exact tile positions) is the
// only thing abstracted away; enemy stats, item rolls, gear scoring, quality
// rolls and the turn-by-turn duel are all executed by the shipped code, so
// the win rate tracks the real content balance.

import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import vm from "node:vm";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");

// ---------------------------------------------------------------------------
// Harness realism knobs. These describe a reasonable (not optimal) player and
// are the STABLE reference frame for the balance baseline: content changes are
// measured against fixed knobs, so a win-rate shift means a real balance shift.
// ---------------------------------------------------------------------------
const DEFAULT_RUNS = 300;
const MAX_REALMS = 40; // safety cap so a stalled game can't loop forever
// Enemies are static tiles, so a careful player paces over cleared floor
// (heal 1.5/step, zero risk) to recover before stepping onto the next enemy.
// We model that patience as: top up toward HEAL_TARGET_FRAC of max HP before
// each fight. It scales with gear and leaves single big hits and tough realms
// as the real death modes. This is the stable reference for the baseline.
const HEAL_TARGET_FRAC = 0.8; // recover ~80% of the bar between fights
const roomsPerRealm = (size) => size + 3; // rooms cleared en route to the boss

// ---------------------------------------------------------------------------
// DOM / browser shim: just enough for the modules to load and for the gear and
// battle-log side effects (innerHTML, style, appendChild) to be no-ops.
// ---------------------------------------------------------------------------
function makeEl() {
  const el = {
    style: {},
    innerHTML: "",
    className: "",
    scrollTop: 0,
    scrollHeight: 0,
    clientHeight: 0,
    querySelector: () => makeEl(),
    querySelectorAll: () => [],
    setAttribute() {},
    getAttribute: () => "",
    appendChild() {},
    addEventListener() {},
  };
  return el;
}

function buildSandbox() {
  const sandbox = {};
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  sandbox.self = sandbox;
  sandbox.console = console;
  sandbox.setTimeout = () => 0; // async render/level-up callbacks are inert
  sandbox.clearTimeout = () => {};
  sandbox.setInterval = () => 0;
  sandbox.clearInterval = () => {};
  sandbox.Image = function Image() {
    return makeEl();
  };
  sandbox.document = {
    getElementById: () => makeEl(),
    querySelector: () => makeEl(),
    createElement: () => makeEl(),
    addEventListener() {},
  };
  // Pre-seed `lj` with the handful of Game-instance methods the logic touches
  // at load time (the real lj is a Game; we don't need canvas/image plumbing).
  sandbox.lj = {
    addKeyListener() {},
    getImage: () => makeEl(),
    context: new Proxy(
      {},
      {
        get: () => () => {},
      }
    ),
  };
  return sandbox;
}

// Load order mirrors index.html, excluding lib/game.js and js/game-startup.js
// (they only construct the Game/canvas and start timers) — everything below is
// pure lj.* logic that hangs off the shared global.
const MODULE_ORDER = [
  "js/realm.js",
  "js/hero.js",
  "js/scene.js",
  "js/util.js",
  "js/stats.js",
  "js/items.js",
  "js/combat.js",
  "js/enemy.js",
  "js/battle-log.js",
];

export function loadGame() {
  const sandbox = buildSandbox();
  const ctx = vm.createContext(sandbox);
  for (const rel of MODULE_ORDER) {
    const code = readFileSync(join(ROOT, rel), "utf8");
    vm.runInContext(code, ctx, { filename: rel });
  }
  return sandbox.lj;
}

// ---------------------------------------------------------------------------
// Playthrough simulation
// ---------------------------------------------------------------------------
function familyForRealm(lj, size) {
  // Use the shipped ladder once it exists; fall back to brown otherwise so the
  // harness runs against both the pre- and post-blue-tier codebase.
  if (typeof lj.enemy.familyForRealm === "function") {
    return lj.enemy.familyForRealm(size);
  }
  return "brown";
}

function maxHp(lj) {
  return 100 + lj.hero.stats.get().hp * 5;
}

// Real spawn counts from realm.js spawnChestsAndMonsters.
function rollEnemies(lj) {
  return lj.util.randomInterval(1, 4) + 4; // 5..8
}
function rollChests(lj) {
  return lj.util.randomInterval(1, 2) + 4; // 5..6
}
function rollGrade(lj) {
  return ["a", "b", "c", "d"][lj.util.randomInterval(0, 3)];
}

// Recover toward the patience target before engaging (walking cleared floor).
function pace(lj) {
  const target = maxHp(lj) * HEAL_TARGET_FRAC;
  if (lj.hero.stats.health < target) {
    lj.hero.stats.heal(target - lj.hero.stats.health);
  }
}

// Returns true if the hero survives the fight; applies real damage.
function resolveFight(lj, enemy) {
  pace(lj);
  const fight = lj.hero.fight(enemy);
  lj.hero.stats.hurt(fight.outcome.damage);
  return fight.outcome.actor === "hero" && lj.hero.stats.health > 0;
}

function playthrough(lj) {
  lj.hero.gear.clear(); // resets equipped, legendary slots, inventory, health
  const full = () => lj.hero.gear.legendary.fullLegendarySet();

  for (let size = 1; size <= MAX_REALMS; size += 1) {
    lj.realm.makeRealm(size); // sets realm size for enemy/loot scaling
    lj.hero.stats.heal(1e9); // realm-entry full heal (mirrors levelUp/reset)
    const family = familyForRealm(lj, size);

    for (let room = 0; room < roomsPerRealm(size); room += 1) {
      const enemies = rollEnemies(lj);
      const chests = rollChests(lj);
      const slots = Math.max(enemies, chests);
      // Interleave loot and combat the way a room mixes them spatially, so
      // fresh gear can help the very next fight.
      for (let i = 0; i < slots; i += 1) {
        if (i < chests) {
          lj.hero.gear.pickup(lj.items.makeItem());
          if (full()) return { win: true, size, cause: "legendary-set" };
        }
        if (i < enemies) {
          const enemy = lj.enemy.get(family, rollGrade(lj));
          if (!resolveFight(lj, enemy)) {
            return { win: false, size, cause: "died-room" };
          }
        }
      }
    }

    // Boss guards the realm exit; killing it advances to the next realm. Which
    // boss (grade "B" or the realm-5+ apex Cinderwyrm "T") is depth-dependent,
    // so the harness fights the same grade the game would place — this is what
    // exercises the enrage mechanic in the balance numbers. Fall back to "B" on
    // a pre-boss-mechanic codebase.
    const bossGrade =
      typeof lj.enemy.bossGradeForRealm === "function"
        ? lj.enemy.bossGradeForRealm(size)
        : "B";
    const boss = lj.enemy.get(family, bossGrade);
    if (!resolveFight(lj, boss)) {
      return { win: false, size, cause: "died-boss" };
    }
  }
  return { win: false, size: MAX_REALMS, cause: "stalled" };
}

// ---------------------------------------------------------------------------
// Structural gate: every generated room must be fully traversable and contain
// only known tile symbols. The playthrough sim above abstracts the spatial
// layer away, so THIS is what guards the room-generation / biome layer
// (js/realm.js) against the two failure modes that break real play but are
// invisible to the win-rate number: a walled-off region (unreachable enemies /
// chests / exit door => a soft-locked realm) and a stray tile symbol
// (spriteMap[sym] undefined => paint() throws). We flood-fill every generated
// room, across all biomes and a range of realm sizes, from the hero's fixed
// spawn [5,9] and assert the whole walkable area is a single component.
// ---------------------------------------------------------------------------
const ROOM_ALLOWED = new Set(["#", " ", "L", "U", "R", "D"]);
const HERO_SPAWN = [5, 9]; // [col,row]; odd/odd, so never a pillar or offshoot
// The boss room is laid out as an open-plaza ARENA (js/realm.js makeRoom): the
// four central grid pillars are cleared. These [col,row] cells are '#' in every
// normal room, so their being open is the arena's signature — the validator
// asserts it to prove the arena was actually carved (and stays connected).
const BOSS_ARENA_PLAZA = [
  [4, 4],
  [6, 4],
  [4, 6],
  [6, 6],
];

// Set of walkable cells reachable from (startCol,startRow) via 4-neighbour steps
// over an 11x11 room. A cell is walkable iff it is not a "#".
function floodComponent(room, startCol, startRow) {
  const seen = new Set();
  const key = (c, r) => c * 11 + r;
  const stack = [[startCol, startRow]];
  seen.add(key(startCol, startRow));
  const steps = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ];
  while (stack.length) {
    const [c, r] = stack.pop();
    for (const [dc, dr] of steps) {
      const nc = c + dc;
      const nr = r + dr;
      if (nc < 0 || nc > 10 || nr < 0 || nr > 10) continue;
      if (room[nc][nr] === "#") continue;
      const k = key(nc, nr);
      if (seen.has(k)) continue;
      seen.add(k);
      stack.push([nc, nr]);
    }
  }
  return seen;
}

export function checkRooms({ sizes = [1, 2, 3, 4, 6], samples = 400 } = {}) {
  const lj = loadGame();
  const problems = [];
  const perBiome = {};
  let roomsChecked = 0;
  let bossRoomsChecked = 0;

  for (const size of sizes) {
    for (let s = 0; s < samples && problems.length < 12; s += 1) {
      lj.realm.makeRealm(size);
      const biome =
        typeof lj.realm.getBiomeName === "function"
          ? lj.realm.getBiomeName()
          : "n/a";
      const bossRoomIdx =
        typeof lj.realm.getBossRoom === "function"
          ? lj.realm.getBossRoom()
          : -1;
      // Generate and inspect every room in the realm (interior rooms carry up
      // to four doors, so they stress connectivity harder than the start room).
      for (let roomIdx = 0; roomIdx < size * size; roomIdx += 1) {
        lj.realm.enterRoom(roomIdx);
        const room = lj.realm.getRoom(roomIdx);
        roomsChecked += 1;
        perBiome[biome] = (perBiome[biome] || 0) + 1;

        const where = `biome=${biome} size=${size} room=${roomIdx}`;

        // Boss room: assert its distinct open-plaza arena was actually carved
        // (the four central pillars are open). The connectivity flood-fill below
        // then proves the arena stays fully traversable like any other room.
        if (roomIdx === bossRoomIdx) {
          bossRoomsChecked += 1;
          for (const [c, r] of BOSS_ARENA_PLAZA) {
            if (room[c][r] === "#") {
              problems.push(
                `${where}: boss arena not carved — central pillar [${c},${r}] still walled`
              );
            }
          }
        }

        if (room[HERO_SPAWN[0]][HERO_SPAWN[1]] === "#") {
          problems.push(`${where}: hero spawn [5,9] is walled`);
          continue;
        }

        let walkable = 0;
        for (let c = 0; c <= 10; c += 1) {
          for (let r = 0; r <= 10; r += 1) {
            const sym = room[c][r];
            if (!ROOM_ALLOWED.has(sym)) {
              problems.push(`${where}: stray symbol ${JSON.stringify(sym)} at [${c},${r}]`);
            }
            if (sym !== "#") walkable += 1;
          }
        }

        const reachable = floodComponent(room, HERO_SPAWN[0], HERO_SPAWN[1]);
        if (reachable.size !== walkable) {
          problems.push(
            `${where}: ${walkable - reachable.size}/${walkable} walkable cells unreachable from [5,9]`
          );
        }
      }
    }
  }
  // The boss arena is selfplay-blind (playthrough never calls makeRoom), so this
  // is the only automated proof it is wired: if we never saw a boss room, the
  // getter is missing or the arena is unreachable.
  if (bossRoomsChecked === 0) {
    problems.push("no boss rooms were sampled (getBossRoom missing?)");
  }
  return { roomsChecked, bossRoomsChecked, perBiome, problems };
}

// ---------------------------------------------------------------------------
// Runner
// ---------------------------------------------------------------------------
function parseArgs(argv) {
  const args = { runs: DEFAULT_RUNS, check: false, json: false, rooms: false };
  for (let i = 2; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--check") args.check = true;
    else if (a === "--json") args.json = true;
    else if (a === "--rooms") args.rooms = true;
    else if (a === "--runs") args.runs = parseInt(argv[++i], 10);
  }
  return args;
}

function run(runs) {
  const lj = loadGame();
  let wins = 0;
  const causes = {};
  let realmSum = 0;
  let realmMax = 0;
  for (let i = 0; i < runs; i += 1) {
    const r = playthrough(lj);
    if (r.win) wins += 1;
    causes[r.cause] = (causes[r.cause] || 0) + 1;
    realmSum += r.size;
    realmMax = Math.max(realmMax, r.size);
  }
  return {
    runs,
    wins,
    winRate: wins / runs,
    avgRealm: realmSum / runs,
    maxRealm: realmMax,
    causes,
  };
}

function reportRooms(rc) {
  console.log(
    `Room structural check — ${rc.roomsChecked} rooms (${rc.bossRoomsChecked} boss arenas) across biomes ${JSON.stringify(
      rc.perBiome
    )}`
  );
  if (rc.problems.length) {
    console.error(
      `\nSTRUCTURAL GATE FAILED:\n  - ${rc.problems.join("\n  - ")}`
    );
  }
}

function main() {
  const args = parseArgs(process.argv);

  const baselinePath = join(ROOT, "scripts", "balance-baseline.json");
  let baseline = null;
  if (existsSync(baselinePath)) {
    baseline = JSON.parse(readFileSync(baselinePath, "utf8"));
  }

  // Standalone structural check (skips the playthrough sim entirely).
  if (args.rooms && !args.check) {
    const rc = checkRooms();
    reportRooms(rc);
    if (rc.problems.length) process.exit(1);
    console.log(`\nSTRUCTURAL GATE PASSED`);
    return;
  }

  const res = run(args.runs);

  if (args.json) {
    console.log(JSON.stringify(res));
  } else {
    const pct = (n) => `${(n * 100).toFixed(1)}%`;
    console.log(`Legendary Journey self-play — ${res.runs} playthroughs`);
    console.log(`  win rate : ${pct(res.winRate)} (${res.wins}/${res.runs})`);
    console.log(`  avg realm: ${res.avgRealm.toFixed(2)}  (deepest ${res.maxRealm})`);
    console.log(`  outcomes : ${JSON.stringify(res.causes)}`);
    if (baseline) {
      console.log(`  baseline : ${pct(baseline.min)}–${pct(baseline.max)} band`);
    }
  }

  if (args.check) {
    const min = baseline ? baseline.min : 0.25;
    const max = baseline ? baseline.max : 0.75;
    const problems = [];
    if (res.winRate <= 0) problems.push("win rate is 0% (unbeatable)");
    if (res.winRate >= 1) problems.push("win rate is 100% (trivial)");
    if (res.winRate < min) problems.push(`win rate ${(res.winRate * 100).toFixed(1)}% below ${(min * 100).toFixed(0)}% floor`);
    if (res.winRate > max) problems.push(`win rate ${(res.winRate * 100).toFixed(1)}% above ${(max * 100).toFixed(0)}% ceiling`);
    if (problems.length) {
      console.error(`\nBALANCE GATE FAILED:\n  - ${problems.join("\n  - ")}`);
      process.exit(1);
    }
    console.log(`\nBALANCE GATE PASSED`);

    // Structural gate runs as part of --check: a room-gen regression must fail
    // the same command that guards balance.
    const rc = checkRooms();
    reportRooms(rc);
    if (rc.problems.length) process.exit(1);
    console.log(`STRUCTURAL GATE PASSED`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
