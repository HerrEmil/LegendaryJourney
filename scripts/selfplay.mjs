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

    // Boss guards the realm exit; killing it advances to the next realm.
    const boss = lj.enemy.get(family, "B");
    if (!resolveFight(lj, boss)) {
      return { win: false, size, cause: "died-boss" };
    }
  }
  return { win: false, size: MAX_REALMS, cause: "stalled" };
}

// ---------------------------------------------------------------------------
// Runner
// ---------------------------------------------------------------------------
function parseArgs(argv) {
  const args = { runs: DEFAULT_RUNS, check: false, json: false };
  for (let i = 2; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--check") args.check = true;
    else if (a === "--json") args.json = true;
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

function main() {
  const args = parseArgs(process.argv);
  const res = run(args.runs);

  const baselinePath = join(ROOT, "scripts", "balance-baseline.json");
  let baseline = null;
  if (existsSync(baselinePath)) {
    baseline = JSON.parse(readFileSync(baselinePath, "utf8"));
  }

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
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
