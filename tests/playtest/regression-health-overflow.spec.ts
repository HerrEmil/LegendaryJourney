import { test, expect } from "@playwright/test";
import { boot, readHud, assertHudSane } from "./harness";

// Regression: health-bar overflow / impossible HP readout after a gear swap
// that LOWERS max-HP.
//
// The bug: heal() caps this.health at heal-time, but nothing re-caps it when a
// later equip lowers max-HP. gear.pickup() auto-equips by total gScore, so it
// will take a higher-score item that happens to carry less hp — dropping max
// while health stays stranded above it. updateHealth() then renders an
// impossible readout ("300/100") and a #healthBar that overflows its 200px box
// (600px wide). An organic self-play sweep hit this in 100% of playthroughs
// (worst 500/150, 3.33x), so it is normal-play behaviour, not a contrived edge.
//
// The fix re-caps health to max inside updateHealth() (the single choke point).
// This test drives the real equip/pickup/updateHealth path and asserts the HUD
// invariant. Proven FAIL pre-fix (600px / "300/100"), PASS post-fix.

test("health readout and bar stay within max after a max-lowering gear swap", async ({ page }) => {
  page.on("dialog", (d) => d.dismiss()); // canvas onclick=alert(...)
  await boot(page);

  const result = await page.evaluate(() => {
    const lj: any = (window as any).lj;
    const S = lj.hero.stats;

    // 1) Equip gear that grants a big max-HP pool, then heal to full.
    const hpItem = {
      slot: "chest", quality: "epic", name: "HP Plate",
      strength: 0, agility: 0, luck: 0, hp: 40, hit: 0, crit: 0, armor: 0, defense: 0, magicFind: 0,
    };
    lj.hero.gear.equip(hpItem);        // max -> 100 + 40*5 = 300
    S.heal(1000);                      // health -> 300 (full)

    // 2) Auto-equip (via pickup) a higher-SCORE item for the same slot that has
    //    ZERO hp. gScore prefers it (lots of strength), so it equips and max
    //    drops back to 100 — the exact swap that strands health above max.
    const strItem = {
      slot: "chest", quality: "epic", name: "Brute Plate",
      strength: 80, agility: 0, luck: 0, hp: 0, hit: 0, crit: 0, armor: 0, defense: 0, magicFind: 0,
    };
    lj.hero.gear.pickup(strItem);

    return {
      equippedIsBrute: lj.hero.gear.equipped.chest?.name === "Brute Plate",
      max: 100 + S.get().hp * 5,
      health: S.health,
    };
  });

  // Sanity: the higher-score low-hp item really did get equipped (max dropped).
  expect(result.equippedIsBrute, "the higher-score zero-hp item should auto-equip").toBe(true);
  expect(result.max, "max-HP should have dropped after the swap").toBe(100);

  // The actual regression assertion: the HUD must not exceed max / its box.
  const hud = await readHud(page);
  expect(hud.stay, "readout should not show an impossible ratio").not.toBe("300/100");
  assertHudSane(hud, "after max-lowering gear swap");

  // And the underlying state is bounded too (root cause, not just display).
  expect(result.health, "health should be re-capped to the new max").toBeLessThanOrEqual(result.max);
});
