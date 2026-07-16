import { test, expect } from "@playwright/test";
import { boot } from "./harness";

// Regression: negative/zero effective max-HP corrupts the health HUD.
//
// The 07-13 fix capped health when a gear swap LOWERED max-HP, but the max-HP
// formula itself — `100 + get().hp * 5` in updateHealth() and heal() — has no
// lower bound. Gear can carry negative `hp` (e.g. "of the Loser" affixes), and
// gear auto-equips by total gScore, so an unlucky streak can drive the summed
// `hp` to <= -20, making effective max-HP <= 0. Then:
//   * max === 0  -> `2 * round(current/0 * 100)` = "NaNpx": the browser silently
//                   drops the invalid width, so #healthBar FREEZES at its last
//                   value; and updateHealth() clamps health to 0 -> a false
//                   "DEAD" readout even though the hero was never killed and can
//                   still walk around (a "zombie" HUD).
//   * max  <  0  -> a negative readout like "-50/-50", bar pinned to 200px.
//
// This is the same numeric input the equipped-gear path produces; the test
// drives `stats.self.hp` directly (get() sums self + gear identically) to hit
// the vulnerable formula deterministically without coupling to gear internals.
//
// The existing assertHudSane() is blind to all three symptoms because "NaNpx",
// "DEAD" and "-50/-50" all fail its parse regexes and become null (checks are
// skipped), so this test reads the RAW DOM instead.
//
// The fix floors effective max-HP at 1 in both formulas (Math.max(1, ...)), so
// a hero whose gear collapses max to <= 0 sits at a sane "1/1" instead of a
// broken readout. Proven FAIL pre-fix, PASS post-fix.

type Symptom = {
  label: string;
  hp: number; // effective get().hp; max = 100 + hp*5
  stay: string; // raw #stay text
  width: string; // raw #healthBar style.width
  health: number; // internal health after the readout
};

// hp = -20 -> max 0 (NaNpx + false DEAD); hp = -30 -> max -50 (negative readout).
// Route one case through heal() to also lock the heal() formula (combat.js:190).
const CASES: { hp: number; viaHeal: boolean }[] = [
  { hp: -20, viaHeal: false },
  { hp: -20, viaHeal: true },
  { hp: -30, viaHeal: false },
];

test("health HUD stays valid when gear drives effective max-HP to <= 0", async ({ page }) => {
  page.on("dialog", (d) => d.dismiss()); // canvas onclick=alert(...)
  await boot(page);

  const results: Symptom[] = await page.evaluate((cases) => {
    const lj: any = (window as any).lj;
    const S = lj.hero.stats;
    const bar = document.getElementById("healthBar") as HTMLElement;
    const stayEl = document.getElementById("stay") as HTMLElement;
    const out: any[] = [];

    for (const c of cases) {
      // A living hero whose gear sum drives max-HP non-positive.
      S.self.hp = c.hp;
      S.health = 100; // clearly alive going in
      if (c.viaHeal) {
        S.heal(0); // exercises heal()'s own maxHP formula, then updateHealth()
      } else {
        S.updateHealth();
      }
      out.push({
        label: `hp=${c.hp}${c.viaHeal ? " (via heal)" : ""}`,
        hp: S.get().hp,
        stay: (stayEl.textContent ?? "").trim(),
        width: bar.style.width ?? "",
        health: S.health,
      });
    }
    return out;
  }, CASES);

  for (const r of results) {
    const max = 100 + r.hp * 5;

    // 1) The bar width must be a real, finite, in-box pixel value — never "NaNpx"
    //    (which the browser drops, freezing the bar).
    const m = r.width.match(/^(\d+(?:\.\d+)?)px$/);
    expect(m, `${r.label}: #healthBar width must be a valid non-negative px value (got "${r.width}")`).not.toBeNull();
    const px = parseFloat(m![1]);
    expect(px, `${r.label}: #healthBar width within its 200px box`).toBeLessThanOrEqual(200);

    // 2) A max-HP collapse must not spuriously show "DEAD" for a hero that was
    //    never combat-killed.
    expect(r.stay, `${r.label}: readout must not falsely show DEAD (health was 100 going in)`).not.toBe("DEAD");

    // 3) No negative numbers in the readout.
    expect(r.stay, `${r.label}: readout must not contain a negative value (got "${r.stay}")`).not.toContain("-");

    // 4) When it is a current/max readout, current must be in [0, max] and max >= 1.
    const ratio = r.stay.match(/^(\d+)\/(\d+)$/);
    expect(ratio, `${r.label}: readout should be a valid current/max (got "${r.stay}")`).not.toBeNull();
    const current = parseInt(ratio![1], 10);
    const shownMax = parseInt(ratio![2], 10);
    expect(shownMax, `${r.label}: shown max-HP should be floored to >= 1`).toBeGreaterThanOrEqual(1);
    expect(current, `${r.label}: current should not exceed max`).toBeLessThanOrEqual(shownMax);

    // 5) Root cause, not just display: internal health stays within the floored max.
    expect(r.health, `${r.label}: internal health should be re-capped within max`).toBeLessThanOrEqual(Math.max(1, max));
    expect(r.health, `${r.label}: internal health should stay non-negative`).toBeGreaterThanOrEqual(0);
  }
});
