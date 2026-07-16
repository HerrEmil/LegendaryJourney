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

## 2026-07-16 — fix: non-positive max-HP corrupts the health HUD (run seed `76090000`)

Five-game fan-out recon with fresh disjoint seeds (2014-7DFPS `76063317`,
GGJ2015 `76070000`, GameLand `76080000`, LegendaryJourney `76090000`, Sandpiper
`76100000`). LegendaryJourney won this run's **fewest-regression-tests /
oldest-ledger** selection (2 specs, ledger last touched 07-13; the other
2-spec repos — 2014-7DFPS, Sandpiper — were fixed 07-14/07-16). Its deep
spatial/DOM sweep surfaced the one real defect fixed below; the other four were
clean (see cross-game recon).

**Defect found & fixed (1) — LOW severity, the unhandled cousin of the 07-13 fix.**

1. **Non-positive effective max-HP corrupts the health HUD (state/render).**
   The 07-13 fix re-capped `health` when a gear swap *lowered* max-HP, but the
   max-HP formula itself — `100 + lj.hero.stats.get().hp * 5` in `updateHealth()`
   (`js/combat.js:171`) and `heal()` (`:190`) — had **no lower bound**. Gear can
   carry negative `hp` (e.g. "of the Loser"-class affixes) and auto-equips by
   total `gScore`, so an unlucky early streak can drive summed `hp` to ≤ −20,
   i.e. effective max-HP ≤ 0. Then `updateHealth()` produced three broken states:
   - **`max === 0`** → `percent = round(current / 0 * 100)` = `NaN`, so
     `#healthBar.style.width = "NaNpx"` — an invalid value the browser silently
     drops, **freezing the bar** at its last width; and the `:179` re-cap clamps
     `health` to 0 → `current == 0` → a **false `"DEAD"` readout** for a hero who
     was never killed and can still walk (a "zombie" HUD; `isBusy` never set).
   - **`max < 0`** (e.g. `hp = −30` → `max = −50`) → a **negative readout**
     `"-50/-50"`, bar pinned to 200px.
   *Root-cause fix:* floor effective max-HP at 1 — `Math.max(1, 100 + hp*5)` — in
   both `updateHealth()` and `heal()`. For every normal hero (`hp > −20`) the
   value is unchanged; a gear-collapsed hero now sits at a sane `"1/1"` instead of
   a broken HUD. One-line change in each of the two formulas.
   *Regression test:* `regression-maxhp-floor.spec.ts` — drives `stats.self.hp`
   to −20 (max 0) and −30 (max −50), through both `updateHealth()` and `heal()`,
   and asserts on the **raw** DOM: `#healthBar` width is a valid non-negative px
   (not the dropped `"NaNpx"`), `#stay` is never a false `"DEAD"` nor negative,
   and the shown `current/max` is well-formed with `max ≥ 1`. (The existing
   `assertHudSane()` is *blind* to this bug: `"NaNpx"`, `"DEAD"` and `"-50/-50"`
   all fail its parse regexes → `null` → checks skipped.) Proven **FAIL pre-fix**
   (width dropped to `""`, `#stay` = `"DEAD"`), **PASS post-fix** (`"1/1"`, 200px).
   Note: `lj.hero.fight()` (`:257`) recomputes the same formula unfloored for the
   new execute-boss reference; harmless (a ≤0-max hero simply never triggers
   execute, and is at 1 HP anyway) and left untouched to avoid colliding with the
   concurrent boss-burn edits to that region — logged as a tidy-up, not a defect.

**Gate:** `bash scripts/build-dist.sh` ✓ · `npx playwright test` → **7 passed**
(6 prior + the new regression) ✓ · `npm run size` — first-item 1.33 KB/5 KB,
Fonts 25.7 KB/30 KB, total transfer 62.56 KB/200 KB brotli ✓ · `html-validate`
(shared perf-config config) on `dist/index.html` clean ✓ · **Lighthouse CI** —
reproduced the real `perf-config@v1` gate (the ref CI pins; the local
`perf-config` sibling is on `main`, 13 commits ahead) against `dist`, 3 runs,
**all 8 metric/category thresholds pass with margin**: performance/a11y/
best-practices/seo all 1.000, LCP 1515 ms/1800, CLS 0.000/0.05, TBT 0 ms/180,
TTI 1515 ms/2500 ✓. (Newest-Lighthouse `unminified-javascript` + Lighthouse-12
*insight* audits flag LJ's verbatim-copied `dist/js/*.js` and its one
render-blocking stylesheet — pre-existing on `main`, identical pre/post-change,
and not in the v1 CI assertion set, which is green on every recent main push
incl. today's boss commits.) The fix is metric-neutral: ~1 KB of source
comments + a `Math.max` wrapper in one already-shipped file, no DOM/CSS/asset/
render change. **Balance:** untouched — this is a state-correctness fix on the
HUD render path, no combat/loot math changed; `js/combat.js` edited only inside
`lj.hero.stats` (the boss/`fight` region left alone).

> Note: `js/combat.js` is co-edited by a concurrent boss-burn task (bosses live
> in `lj.hero.fight` / boss defs). This fix is scoped strictly to the
> `lj.hero.stats` block and committed by explicit path (`git add js/combat.js
> tests/playtest/…`, never `-A`) with a pre-push rebase, so it composes cleanly
> with the other task's edits to the file's boss region.

**Cross-game recon this run (fresh disjoint seeds, headless):**
- **2014-7DFPS** (Three.js FPS, `76063317`): clean — 6 assets exact-case 200, no
  NaN/Infinity in camera/held-piece/`triHexMeshes`, input-gating + context-menu
  fixes hold, resize full-viewport. (Fixed earlier today, 07-16.)
- **GGJ2015** ("Sand Grains", `76070000`): **one NEW low-med defect** (not fixed
  here) — `clickHandler` (`src/scripts/clicks.js:11`) omits the `!obj.fulfilled`
  guard on the *premise-gated success* branch that its no-premise branch (`:17`)
  has, so a completed premise target re-fires its success bubble(s) on every
  re-click (re-narration + a switchScene re-trigger for the tent), feeding the
  deferred DOM leak. Logged for a GGJ2015 run.
- **GameLand** (screen shell, `76080000`): clean — 13 games enter/BACK/restart,
  no leaked/dual rAF loops (afterLeave 0, re-entry tick rate flat), best/score
  persistence correct, no NaN. A one-off game4 BACK actionability blip did not
  reproduce deterministically (harness flake, not a softlock).
- **Sandpiper** (Defold WASM, `76100000`): clean — boots headless
  (`game-started`, live WebGL), off-thread Wasm compile path taken, 11 assets
  exact-case 200, no white band on resize.
