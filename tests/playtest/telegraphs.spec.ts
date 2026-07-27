import { test, expect, Page } from "@playwright/test";
import { boot, collectErrors } from "./harness";

// The five apex mechanics resolve silently inside lj.hero.fight: a warded blow
// just reads 0, a sundered cleave just lands harder, and thorns drains the hero
// on the hero's OWN strike. js/hero.js telegraphs each one into the battle log
// the first time it fires, and scene.levelUp announces the biome on arrival.
// The Node self-play harness re-implements the boss loop and never calls
// interact() or scene.levelUp(), so this whole surface is invisible to it —
// these tests are its only coverage.

// Two of these tests watch a whole animated boss duel (one log entry per 400ms),
// so serially they dominate the suite's wall clock. Each takes its own page and
// boots independently, so run the file's tests concurrently — this file only,
// since flipping fullyParallel globally oversubscribes the browser and is slower.
test.describe.configure({ mode: "parallel" });

const TELEGRAPHS = [
  { kind: "enraged", match: /is wounded — and enrages!/ },
  { kind: "executed", match: /smells blood and moves to finish you!/ },
  { kind: "warded", match: /A ward flares/ },
  { kind: "reflected", match: /searing hide sears your blow back!/ },
  { kind: "sundered", match: /cleaves through your armor!/ },
  { kind: "flurried", match: /blurs into a flurry of blows!/ },
];

// Realm -> biome title, mirroring realm.js's biomeLadder (r1 halls, r2 frost,
// r3 blight, r4+ ember). Realm 1 is never announced — you arrive by levelUp.
const ARRIVALS = [
  { realm: 2, slug: "frost", title: "The Frostmarch" },
  { realm: 3, slug: "blight", title: "The Blightwood" },
  { realm: 4, slug: "ember", title: "The Emberdeep" },
  { realm: 5, slug: "ember", title: "The Emberdeep" }, // clamps at ember, r4+
];

function logText(page: Page): Promise<string> {
  return page.evaluate(
    () => document.getElementById("battleLog")?.textContent ?? ""
  );
}

test("every apex mechanic renders a named, styled telegraph line", async ({
  page,
}) => {
  const errors = collectErrors(page);
  page.on("dialog", (d) => d.dismiss());
  await boot(page);

  for (const { kind, match } of TELEGRAPHS) {
    await page.evaluate((k) => {
      const lj: any = (window as any).lj;
      lj.battleLog.clear();
      lj.battleLog.mechanic(k, "The Test Boss");
    }, kind);

    const html = await page.locator("#battleLog").innerHTML();
    expect(html, `${kind} should be styled as a telegraph`).toContain(
      'class="telegraph"'
    );
    const text = await logText(page);
    expect(text, `${kind} should name the mechanic`).toMatch(match);
    expect(text, `${kind} should name the monster`).toContain("The Test Boss");
  }

  // A flag with no telegraph must stay silent rather than print "undefined" —
  // including inherited keys, which a bare truthiness check would resolve to an
  // Object.prototype member and happily invoke.
  for (const bogus of ["not-a-mechanic", "constructor", "toString", "valueOf"]) {
    await page.evaluate((k) => {
      const lj: any = (window as any).lj;
      lj.battleLog.clear();
      lj.battleLog.mechanic(k, "The Test Boss");
    }, bogus);
    expect(await logText(page), `mechanic("${bogus}") should stay silent`).toBe(
      ""
    );
  }

  // Same for an unmapped biome: it must fall back to the raw slug (so a biome
  // added to realm.js still announces itself) and never reach the prototype.
  const unmapped = await page.evaluate(() => {
    const lj: any = (window as any).lj;
    lj.battleLog.clear();
    lj.battleLog.realmArrival(9, "chasm");
    lj.battleLog.realmArrival(9, "constructor");
    return document.getElementById("battleLog")?.textContent ?? "";
  });
  expect(unmapped).toContain("Realm 9 — chasm");
  expect(unmapped).toContain("Realm 9 — constructor");

  expect(errors, `unexpected errors: ${errors.join(" | ")}`).toEqual([]);
});

test("arriving in a realm announces its biome", async ({ page }) => {
  const errors = collectErrors(page);
  page.on("dialog", (d) => d.dismiss());
  await boot(page);

  for (const { realm, slug, title } of ARRIVALS) {
    const seen = await page.evaluate(() => {
      const lj: any = (window as any).lj;
      lj.battleLog.clear();
      lj.scene.levelUp();
      return {
        text: document.getElementById("battleLog")?.textContent ?? "",
        size: lj.realm.getSize(),
        biome: lj.realm.getBiomeName(),
      };
    });
    expect(seen.size, "levelUp should advance one realm").toBe(realm);
    expect(seen.text, `realm ${realm} should announce ${title}`).toContain(
      `Realm ${realm} — ${title}`
    );
    // The banner must describe the realm just entered, not the one just left.
    expect(seen.biome, `realm ${realm} biome slug`).toBe(slug);
  }

  expect(errors, `unexpected errors: ${errors.join(" | ")}`).toEqual([]);
});

// End-to-end proof that a real fight stamps the flag AND that the telegraph is
// deduped to once per fight. Each entry names a boss whose mechanic fires on the
// boss's FIRST swinging turn (so no waiting out a whole duel) and repeatedly
// after (so a per-occurrence callout would print many lines and fail the count).
// `prepare` runs in-page after the realm is reached, for a boss whose mechanic
// has to be forced.
const REAL_FIGHTS = [
  {
    // The Molten Reaver sunders on EVERY swing it takes — nothing to force.
    name: "The Molten Reaver",
    grade: "M",
    realm: 8,
    phrase: "cleaves through your armor!",
    once: "sunder should telegraph once, not once per swing",
  },
  {
    // The Flarebrand Duelist flurries on a per-mille CHANCE, so a real fight
    // might not flurry within a short duel. Force chance to 1000 (always) —
    // lj.enemy.base shares the type's mechanic by reference, so every planted
    // "F" flurries on its first swinging turn. CRUCIAL: the flurry's telegraph
    // lives on the SECOND swing, which the fight loop only reaches if the hero
    // SURVIVES the first — and a gearless hero is one-shot by a realm-10 boss,
    // so buff the hp STAT (raising real max HP; NOT stats.health = 1e9, which
    // caps at max and would be a no-op). 400 -> max 2100 HP clears even the
    // worst-case first swing (an "Angry" agi-doubling mod + crit at realm 10
    // tops out ~1.5k), and surviving multiple flurrying turns is what stresses
    // the once-per-fight dedupe.
    name: "The Flarebrand Duelist",
    grade: "F",
    realm: 10,
    phrase: "blurs into a flurry of blows!",
    once: "tempo should telegraph once, not once per flurry",
    prepare: () => {
      const lj: any = (window as any).lj;
      lj.enemy.types.red.F.mechanic.chance = 1000;
      lj.hero.stats.buff("hp", 400); // real max HP -> 100 + 400*5 = 2100
    },
  },
];

// Drop a `grade` enemy on a walkable tile next to the hero and return the
// direction to step into it. The hero stands on [5,9] after entering a realm.
// getChestsAndMonsters hands back a shallow copy whose inner rows are LIVE, so
// writing a grade here is what hero.js's own cached view reads on the next step.
function plantAdjacentEnemy(page: Page, grade: string): Promise<string | null> {
  return page.evaluate((g) => {
    const lj: any = (window as any).lj;
    const roomNo = lj.realm.getCurrentRoom();
    const room = lj.realm.getRoom(roomNo);
    const items = lj.realm.getChestsAndMonsters(roomNo);
    // step(dir) lands on [col,row]; move() requires open floor there.
    const candidates: Array<[string, number, number]> = [
      ["up", 5, 8],
      ["down", 5, 10],
      ["left", 4, 9],
      ["right", 6, 9],
    ];
    for (const [d, col, row] of candidates) {
      if (room[col] && room[col][row] === " ") {
        items[col][row] = g;
        return d;
      }
    }
    return null;
  }, grade);
}

for (const fight of REAL_FIGHTS) {
  test(`a real ${fight.name} fight telegraphs its mechanic exactly once`, async ({
    page,
  }) => {
    test.setTimeout(90_000); // the fight animates one log entry per 400ms
    const errors = collectErrors(page);
    page.on("dialog", (d) => d.dismiss());
    await boot(page);

    await page.evaluate((r) => {
      const lj: any = (window as any).lj;
      while (lj.realm.getSize() < r) lj.scene.levelUp();
    }, fight.realm);
    if (fight.prepare) await page.evaluate(fight.prepare);
    await page.evaluate(() => {
      const lj: any = (window as any).lj;
      lj.hero.stats.heal(1e9); // after prepare, so a raised max HP is filled
      lj.battleLog.clear();
    });

    const dir = await plantAdjacentEnemy(page, fight.grade);
    expect(dir, "hero should have a walkable neighbouring tile").not.toBeNull();
    await page.evaluate((d) => (window as any).lj.hero.step(d), dir);

    // The callout lands on the boss's first swinging turn...
    await expect(page.locator("#battleLog")).toContainText(fight.phrase, {
      timeout: 30_000,
    });
    // ...and the duel then runs to its end (kill or death) with no second line.
    await expect
      .poll(
        async () => /Slayed the|You were killed by/.test(await logText(page)),
        { timeout: 60_000 }
      )
      .toBe(true);

    const text = await logText(page);
    expect(text.split(fight.phrase).length - 1, fight.once).toBe(1);
    expect(text, "the telegraph should name the boss").toContain(fight.name);

    expect(errors, `unexpected errors: ${errors.join(" | ")}`).toEqual([]);
  });
}
