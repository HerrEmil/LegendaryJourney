# Legendary Journey — Playtest Ledger

Cross-game self-play bug-hunt. Each run seeds fresh input ranges, plays the
canvas roguelike headless, mines for real defects, and fixes the root cause with
a regression test. The Node self-play harness (`scripts/selfplay.mjs`) already
covers the combat/loot **balance** and explicitly abstracts the **spatial layer**
away (door navigation, tile positions); these Playwright tests cover that spatial
+ DOM layer — canvas render, keyboard movement, room connectivity, and the
health/gear readouts.

## 2026-07-13 — harness bootstrap + health-bar overflow fix (run `2026071301`)

Playwright harness bootstrapped (`@playwright/test`, `playwright.config.ts` that
runs `bash scripts/build-dist.sh` then serves the real `dist/` artifact via a
dependency-free static server on port 5053). Repo previously had ZERO browser
tests. `deploy.yml` (which syncs the repo root, not `dist/`) now also excludes
`tests/`, `playwright.config.ts`, and the report dirs so the harness never leaks
to the live S3 site; `.gitignore` gained `.playwright-mcp/`, `test-results/`,
`playwright-report/`.

**Defect found & fixed (1):**

1. **Health-bar overflow + impossible HP readout after a max-lowering gear swap
   (state/render).** `lj.hero.stats.heal()` caps `this.health` at the max-HP
   *at heal-time*, but nothing re-caps it when a later `equip` **lowers** max-HP.
   `gear.pickup()` auto-equips by total `gScore` (`js/combat.js`), so it will
   take a higher-score item that happens to carry less `hp` — dropping the max
   while `health` stays stranded above it. `updateHealth()`
   (`js/combat.js:169`) then rendered an impossible readout — e.g. `#stay`
   showing **`300/100`** — and a `#healthBar` **600px** wide, 3× spilling out of
   its 200px box. An organic self-play sweep (real random drops, heal-between-
   fights) hit this in **100% of 3000 playthroughs** (worst readout `500/150`,
   3.33×) — normal-play behaviour, not a contrived edge.
   *Root-cause fix:* `updateHealth()` now re-caps `this.health` to the current
   `max` before painting. It's the single choke point every
   heal/hurt/equip/unequip routes through, so the bar and readout can never
   exceed the max no matter how it changed. Consistent with the existing intent
   (`heal()` already caps to max); the game has no overheal concept.
   *Regression test:* `regression-health-overflow.spec.ts` — boots, equips HP
   gear + heals to full, then `pickup`s a higher-score zero-hp item and asserts
   `#healthBar ≤ 200px`, the `#stay` ratio never exceeds max, and the underlying
   `health ≤ max`. Proven **FAIL pre-fix** (`300/100`, 600px), **PASS post-fix**.

**Characterization suite added (`playtest.spec.ts`, 5 tests)** for the previously
untested browser surface — all currently GREEN, documenting correct behaviour:
boots clean (zero console errors / pageerrors / non-favicon 404s) and paints the
352×352 canvas; arrow input keeps the HUD well-formed; advances realms 1→8 with a
sane readout at each depth (incl. the realm-5+ Cinderwyrm tier); survives
mobile 375×812 + desktop 1280×800 resize and canvas spam-clicks (the
`onclick=alert(...)` dialogs auto-dismiss); death shows `DEAD` and the "Try
again!" button restarts into realm 1 alive and movable (`isBusy` cleared). The
last test is a **maze-connectivity invariant**: flood-fill from the hero spawn
(5,9) across 2000 freshly generated rooms (sizes 1–4) asserts the boss and every
monster/chest is reachable — a sealed room would be an unwinnable softlock. A
wider offline sweep (20 000 size-1 boss rooms / 102 k monsters via the Node
loader) found **0 unreachable**, so the bomberman pillar generator is provably
connected.

**Gate:** `bash scripts/build-dist.sh` ✓ · `npx playwright test` → **6 passed**
✓ · `npm run size` — JS 17.6 KB/55 KB, CSS 1.23 KB/5 KB, Fonts 25.7 KB/30 KB,
total transfer 51 KB/200 KB brotli ✓ · Lighthouse CI (`lighthouserc.json`, tier
`game`) 3 runs, all assertions passed — LCP/CLS/TBT within 2200 ms / 0.05 /
350 ms ✓. No `html-validate` config in this repo (index.html unchanged), so that
step is N/A. **Balance:** `selfplay --check` **PASSES** — measured in isolation
(this commit's `js/combat.js` over the committed `js/stats.js`) the HP re-cap
removes the accidental stranded-HP bonus, nudging the sim from ~29.3% to **27.5%**
(4000 runs), still comfortably inside the [25%, 75%] band and strictly
beatable/survivable; `balance-baseline.json` left unchanged (this is a
state-correctness fix, not a content/balance change).

> Note: the live checkout also held an **unrelated, uncommitted** in-progress
> affix edit in `js/stats.js` (a "Spoils of the Realms" batch) from a concurrent
> burn — deliberately **excluded** from this commit and left in the working tree
> for that task. The balance figure above is measured against the committed
> (HEAD) `stats.js`, not the foreign edit.

**Cross-game recon this run (the other four games, static + play sweep):**
- **2014-7DFPS** (Three.js FPS): clean — all 6 assets resolve exact-case, no
  boot/console-error path; WebGL-in-headless is environmental, not a repo bug.
- **GGJ2015** ("Sand Grains"): only LOW — a dead OGG `<source>` whose `src`
  points at the `.mp3` (typo); invisible in MP3-capable browsers.
- **Sandpiper** (Defold WASM): clean — every loader-fetched path (wasm, archive
  pieces, sound) resolves exact-case; no runtime asset dropped on deploy.
- **GameLand** (screen shell): **one real MEDIUM defect** — Road Cross
  crashes/freezes on a taller-mid-run resize (`scripts/screen.road-cross.js:167`
  & `:202` read stale `s.rows` after `metrics()` bumps `R` without rebuilding
  rows → uncaught `TypeError`, kills the rAF loop). Not fixed here (GameLand is
  the most-tested repo; LegendaryJourney won this run's "fewest tests / oldest
  ledger" selection). **Logged as a follow-up for a GameLand run.**

**Known follow-ups (not this run):**
- `lib/game.js:35` calls `event.preventDefault()` on **every** keydown, not just
  the handled arrows/space — over-broad (blocks Tab focus / browser shortcuts on
  the page). Cosmetic/UX; a selective `preventDefault` (arrows + space only)
  would be the clean fix, worth doing deliberately.
- The canvas `onclick="alert('Use arrow keys…')"` (`index.html:18`) fires a
  modal alert on every canvas click — intentional hint, but abrasive under
  spam-click; a non-modal in-canvas hint would be friendlier.
