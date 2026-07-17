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

## 2026-07-17 — RECON ONLY, no code fix (seeds `77040001`–`77040073`)

Sandpiper won this run's fewest-specs / oldest-ledger fix selection, so
LegendaryJourney was **recon only this run — nothing in `js/` was changed.**
Three defects were found and *reproduced headlessly*; all are logged below for a
future LJ fix run, ordered by severity. Seeds `77040001`–`77040073` (a fresh
range; a mulberry32 override of `Math.random` installed via `addInitScript`
before any page script, so every run is deterministic and re-runnable).

> **HEAD moved mid-run.** Recon started at `04e8762`; the concurrent burn task
> committed **`a543e2a`** (`mechanic-telegraphs`, Ladder 2 #17) underneath it —
> purely ADDITIVE battle-log telegraphs touching `js/battle-log.js`,
> `js/combat.js`, `js/hero.js`, `js/scene.js`, `theme.css`,
> `scripts/balance-baseline.json`, `scripts/content-backlog.json` +
> `tests/playtest/telegraphs.spec.ts`. It touches **none** of the code paths
> below. **Every finding here was RE-VERIFIED against `a543e2a`, and all line
> numbers cited are `a543e2a`'s.** Suite is **10/10** including the concurrent
> task's new `telegraphs.spec.ts`.

### Defect 1 — the terminal WIN state is escapable; the game silently un-wins itself (MEDIUM) — **the leading candidate for the next LJ fix run**

`lj.hero.gear.legendary.add()` (`js/combat.js:146-151`) defers `paintWin()` +
`lj.hero.ascend()` by `setTimeout(…, 300)` — but `hero.interact()`'s **Chest**
branch clears `isBusy = false` **synchronously** at `js/hero.js:171`. So for
300 ms after completing the legendary set the hero is alive, unlocked, and
free to walk. A fight started inside that window has an `outcome()` that sets
`isBusy = false` (`js/hero.js:153`/`:156`) **AFTER** `ascend()`
(`js/hero.js:203-205`) already set it true, and its `lj.scene.eraseTileItem()`
repaints the board straight over the win screen. Net effect: the player gets
"You completed the game!" plus a "Play again!" button in the log, the win screen
flashes and is then **painted over**, and the game just keeps running.

*Repro (OBSERVED, seed `77040070`):* plant a monster at `[5,8]`, equip 8/9
legendary slots, `pickup` the 9th, press `ArrowUp` inside the 300 ms window,
wait 6 s, then drive arrows. "You win!" orange pixels **1159 → 2** (screen
destroyed); hero health **41.5 → 61** (moving and healing, i.e. unlocked).
*Clean control (seed `77040071`):* identical win with **no** fight in the window
→ winPx **1159 stable**, health **40 → 40**, hero locked. A clean A/B.

***The fix is self-contained to `js/hero.js` and does NOT need to touch
`js/combat.js` — the CONTENDED file.*** Give `ascend()` a persistent
`hasAscended` flag that `step()` honours and `outcome()` will not clear, and
have `reset()` clear it. **The 300 ms defer in `combat.js` can stay exactly as
is.** That is what makes this both the highest-value and the cheapest next fix.
*Regression test asserts:* after the escape sequence, `lj.hero.stats.health` is
unchanged across 25 arrow presses. **Proven FAIL pre-fix** (41.5 → 61) against
the passing control.

### Defect 2 — stale `paintGameOver()` paints a corpse over the restarted realm (LOW)

`scene.eraseTileItem(tile, true)` (`js/scene.js:263-270`) schedules
`paintGameOver(tile)` at +1000 ms and **nothing ever cancels it**, while
`scene.reset()` (`js/scene.js:49`) is reachable *immediately* via the
"Try again!" button — `checkRestartButton` has no `isBusy` / pending-timer
check. Restart inside that window and the stale callback repaints: the player
sees the fresh realm-1 room with a **corpse sprite and no live hero** until the
next keypress.

*Repro (OBSERVED, seed `77040072`, real organic death):* monster planted at
`[5,8]`, hero dropped to 1 HP via `hurt()`, walk into it → a **real lost fight
through the shipped Enemy branch** → click "Try again!" → snapshot the canvas →
wait 1.5 s → snapshot again. Canvas repaints with **zero input**.
*Fix self-contained to `js/scene.js`* (store the timer id, `clearTimeout` it in
`reset()`) — **not contended**. *Regression test asserts:* after a real death +
restart, the canvas `ImageData` is byte-identical across the following 1.5 s.
**Proven FAIL pre-fix.**

### Defect 3 — unguarded `checkTile` row read (LOW / latent) — **file as HARDENING, not a player-facing bug**

`js/hero.js:131` — `const item = creaturesAndItems[tile[0]][tile[1]];` has no
guard. `interact()`'s deferred `outcome()` re-reads
`creaturesAndItems = lj.realm.getChestsAndMonsters(currentRoom)`
(`js/hero.js:163`/`:172`) using the room number **captured at fight start**, and
`realm.makeRealm()` resets `chestsAndMonsters[n] = []` for every room of the new
realm — so a stale `outcome()` landing *after* a level-up assigns `[]`, and the
next step throws `TypeError: Cannot read properties of undefined`.

**HONEST REACHABILITY — no organic trigger was found, and this should not be
sold as one:**
- The **shipped boss path is SAFE**: `outcome()`'s `:163`/`:172` re-read runs
  **BEFORE** the boss path's deferred `levelUp()` (which is scheduled +1000 ms
  *inside* that same callback), so the ordering saves it.
- A **3.4-minute fully-organic run** (seed `77040033`, zero scripted calls)
  cleared **realm 1 → 2 by a real arrow-key boss kill with ZERO errors**.
- The **restart-button race is harmless**: `makeRealm` does not truncate
  `chestsAndMonsters`, so the stale room index still holds a real 11×11 array
  (desynced ghost monsters, but no crash).
- The trigger that DOES reproduce it (seed `77040073`: call `lj.scene.levelUp()`
  mid-fight, 10 uncaught pageerrors at `js/hero.js:131:44`) is **exactly what
  this repo's OWN suite does at `playtest.spec.ts:44`**.

*Fix self-contained to `js/hero.js`* (guard the row read, or have `outcome()`
re-read the LIVE room instead of the captured one) — **not contended**.

**Clean/verified this run** — this matters because it covers the concurrent
task's newest surface (the five apex mechanics, the 14 elite mods, the affix
batches and the open-plaza boss arena):
- **Health invariants HOLD.** 6000 real items across every slot × quality driven
  through the real `pickup`/`equip`/`heal` path (seed `77040052`): **0**
  `health > max`, **0** NaN, **0** malformed/overflowing `#healthBar`, **0**
  false `DEAD`. **BOTH prior fixes (`regression-health-overflow`,
  `regression-maxhp-floor`) survive the concurrent task's new affixes and
  bosses**; both specs still pass.
- **Boss mechanics + all 14 elite mods are NaN-free.** ~950 fights across every
  apex grade (B/T/W/S/M/H) × all 14 mods × realms 1–14 with randomized real gear
  (seed `77040012`): **0** non-finite enemy stats, **0** NaN in any fight-log
  damage or outcome, **0** non-terminating fights (guarded at 40 k `duel()`
  calls — the real loop untouched, only a counter wrapped around `lj.hero.duel`).
- **Connectivity solid — and playtest IS the gate here**, since room modules are
  invisible to the selfplay win-rate. 1200 real boss rooms incl. the NEW
  open-plaza arena, sizes 1–10, all five apex grades sampled (seed `77040013`):
  0 unreachable tiles/doors, 0 un-carved arenas, 0 missing bosses. 420 whole
  realms flood-filled at the **room-graph** level (seed `77040015`): **0 realms
  where the boss room is unwalkable from spawn**, 0 isolated rooms. No softlocks.
  (Note: `makeRealm` only builds the bottom-row START room, so a boss-room probe
  MUST call `lj.realm.enterRoom(getBossRoom())` — sampling `getCurrentRoom()`
  silently only ever sees grade "B" at size 1.)
- **Input/resize/click fuzz clean.** 600 seeded presses incl. non-arrow keys
  (Tab/Esc/F5/Space/…), 3 viewport flips (375×812 ↔ 1280×800), spam-clicks
  (seed `77040051`): 0 violations, 0 console/page errors.
- **Assets + CLS clean.** All 17 requests **200**, exact-case; **CLS 0** (seed
  `77040004`).

**Noted, not filed:**
- **Fight-log length explodes at depth.** `maxLog` **13209 at realm 14** (6505 at
  r12, 4631 at r11) — `hero.js` schedules `log.length × 400 ms` of animation, so
  a deep hp-stacked hero can sit through a **~88-minute `isBusy` freeze**.
  Extreme-depth only, but it is the same "kind to the 400 ms/step animation"
  constraint the boss-mechanic comments already reason about.
- **`js/items.js:139` declares `let itemLevel;` and never assigns it**, then
  passes it to `lj.items.types.get(itemLevel, …)` at `:169` — so `level` falls
  back to 1 and `makeItem(level, …)`'s parameter is effectively dead. **STATIC
  READ ONLY — no runtime symptom was observed** (nothing currently calls
  `makeItem` with a level, so nothing visibly breaks). Worth a deliberate look
  rather than a claim: *if* real it would silently disable item-level scaling.

> Note: this run edited **only** `tests/playtest/LEDGER.md`. `js/` was not
> touched, no spec was added, and the two temp probe spec batches were deleted.
> The working tree was clean at start and end.

---

## 2026-07-17 (run 2) — RECON ONLY (no code fix) — affix id-0 falsy re-roll

**Not this run's fix target.** 2014-7DFPS won selection (fewest regression specs:
2 vs this repo's 7) and was fixed/gated/pushed instead. This run touched **only
this ledger** — no source, no spec; all probes were throwaway specs inside the
repo tree, deleted afterwards. Shared checkout: no `git add -A`, no stash; only
`tests/playtest/LEDGER.md` staged by explicit path.

> Subagent-safety note: the classifier (`claude-opus-4-8[1m]`) was unavailable
> when this run's playtest subagent finished, so the lead **independently
> re-verified** the headline finding against source before recording it (see the
> code cites below). Do not treat the numbers as trusted without that re-read;
> they were confirmed.

**Seeds this run:** `77174000` (boot/assets/CLS), `77174010` (items/NaN/equip),
`77174020`+`77174021` (organic full runs), `77174030` (deep descent + death),
`77174050` (affix bias), `77174101`-`77174104` (fuzz, timers/10),
`77174105`-`77174106` (fuzz, real time). Range 77174000-77174106; prior runs used
7704xxxx.

---

### DEFECT (LOW, confirmed — lead re-verified against source) — affix pool entry 0 is ~33-39x rarer than every peer. **LEADING CANDIDATE FOR THE NEXT FIX RUN.**

**Root cause.** `js/stats.js:300` (`pre.get`) and `js/stats.js:329` (`suf.get`)
both do `if (!id) { this.prefix = rng(0, len-1) } else { this.prefix = id }`.
**id `0` is falsy**, so an explicit request for pool entry 0 is discarded and
re-rolled uniformly. `makeItem` (`js/items.js:172-178`) passes
`rng(0, prefixes.length - 1)` as the id — so whenever 0 is rolled, it re-rolls,
leaving entry 0 at probability **(1/n)²** instead of **1/n**. (Lead confirmed both
call sites and the `rng` range by reading the source, 2026-07-17.)

**Measured** (agent, 60,000 samples of the exact call `makeItem` uses):
- `lj.stats.prefixes.get(0)` returned **"Furious" (id 25)**, not "Burning" — the
  re-roll in action.
- **"Burning" 51 vs ~1818 expected**; **"of the Phoenix" 50 vs ~1538 expected** —
  both match the (1/n)² prediction (~55 / ~39), while peer affixes sat at
  1787-1942.

Entry 0 of each pool ("Burning" prefix, "of the Phoenix" suffix) is therefore a
near-unobtainable affix. Pure loot-distribution correctness; no crash, no NaN.

**Fix shape.** Change both guards to `id == null` (or `id === undefined`) so an
explicit 0 is honoured. Self-contained to `js/stats.js`, uncontended by the
concurrent content/playtest tasks (they work in `content-backlog.json` and
affix-batch modules, not the `get` dispatch). **Regression test design:** call
`lj.stats.prefixes.get(0)` and assert `.id === 0` / name === pool[0].name; plus a
distribution smoke test (a few thousand `makeItem` samples) asserting entry 0's
frequency is within a tolerance band of 1/n, not 1/n².

---

### items.js:139 `let itemLevel;` — runtime repro produced, but NO player-facing symptom (do not over-file)

The prior entry asked for a runtime repro of the unassigned `let itemLevel;`.
**CONFIRMED at the API level:** `lj.items.makeItem(10, "weapon", "normal")` yields
mean weapon strength **6.34** vs a level-1 baseline **6.63** (statistically
identical — the level is dropped at `js/items.js:169`), while a correctly-plumbed
`lj.items.types.get(10, "weapon")` yields mean **51.5** (~8x). Smoking gun: after
`makeItem(10,…)`, `lj.items.itemLevel === 10` (the stray `this.itemLevel` write at
`:143`) while the produced item is level-1.

**Reachability caveat — this is the important part.** **No shipped call site passes
a level** — `js/hero.js:168` calls `makeItem()` bare — so there is **no
player-facing symptom**. Item-level scaling is a **confirmed-dead parameter**, not
a live bug: items scale only via the quality mod, and depth difficulty comes
entirely from the enemy `1.375^(n-1)` curve plus the magicFind quality escalator.
File it as "wire it up **if** you ever want item-level scaling", not as a bug.

### Minor observations (measured, not filed as defects)

- `js/items.js:37-39`: negative total magicFind yields `baseMF = 1`, *better* than
  magicFind 0 (`baseMF = 0`). Measured realm 1: legendary 45/4000 (mf 0) vs
  39/4000 (mf -5) — negligible; the branch only matters at depth where mf is
  multiplied by `2^(size-1)`. Logic quirk, no meaningful impact.
- `hero.js` `creaturesAndItemsMap` maps `'E'` but `scene.js` `spriteMap` has no
  `'E'` — currently unreachable (`pickRandomEnemyType` only returns a-d), latent
  paint-hardening note only.

### Verified CLEAN this run

- **Build/boot/assets:** dist builds (19 files); 17 requests all **200, exact-case**;
  **CLS 0**; canvas painted (122,495 non-blank px); **zero console errors /
  pageerrors / unhandled rejections across all 11 probe sessions**.
- **Real full-game runs** (BFS-driven arrow-key play): seed `77174020` descended
  realms **1→8**, 49 fights, 56 equips, organic **WIN** (full legendary set); seed
  `77174021` realms **1→9**, 65 fights, WIN. Apex telegraphs fired en route (3-4x).
  **0 NaN** in enemy stats and fight-log damage, **0** health>max, **0** malformed
  HUD, **max fight-log length 9** even at realms 8-9 with geared heroes.
- **Depth + death/restart:** seed `77174030` chest-geared to realm 6 (200/200, 16
  equips), fought at depth, died organically; "Try again!" verified: realm 1,
  100/100, gear + legendary slots cleared, hero movable (isBusy cleared). Two more
  organic real-time deaths recovered identically.
- **Item system:** 6,000 `makeItem` items — 0 NaN across all 9 stats, 0 malformed
  names, 0 non-finite gScore; 26 negative-hp items handled (both prior HUD fixes
  hold). Equip/unequip/pickup edge cases all clean; inventory confirmed vestigial
  (always empty) by design.
- **Fuzz:** 6 seeds x 640 presses incl. Space/Tab/Escape/Enter/letters/digits/
  Backspace/PageDown/Home/End, viewport flips 375x812<->1280x800 every 160 presses,
  24 canvas spam-clicks/seed — **0 violations, 0 errors**, gameplay provably
  exercised.
- **No save/load surface exists** (no localStorage/sessionStorage/indexedDB
  anywhere). **No softlocks** in any run.

Known ledger items (escapable win, stale paintGameOver, checkTile hardening,
extreme-depth log explosion) were not re-tested and are not re-reported.
