import { test, expect, Page } from "@playwright/test";
import { boot, collectErrors } from "./harness";

// The five apex mechanics resolve silently inside lj.hero.fight: a warded blow
// just reads 0, a sundered cleave just lands harder, and thorns drains the hero
// on the hero's OWN strike. js/hero.js telegraphs each one into the battle log
// the first time it fires, and scene.levelUp announces the biome on arrival.
// The Node self-play harness re-implements the boss loop and never calls
// interact() or scene.levelUp(), so this whole surface is invisible to it —
// these tests are its only coverage.

const TELEGRAPHS = [
  { kind: "enraged", match: /is wounded — and enrages!/ },
  { kind: "executed", match: /smells blood and moves to finish you!/ },
  { kind: "warded", match: /A ward flares/ },
  { kind: "reflected", match: /searing hide sears your blow back!/ },
  { kind: "sundered", match: /cleaves through your armor!/ },
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

test("a real boss fight telegraphs its mechanic exactly once", async ({
  page,
}) => {
  test.setTimeout(90_000); // the fight animates one log entry per 400ms
  const errors = collectErrors(page);
  page.on("dialog", (d) => d.dismiss());
  await boot(page);

  // The Molten Reaver (grade "M", realm 8) sunders on EVERY swing it takes, so
  // it both fires on the boss's first blow — no waiting out a whole duel — and
  // proves the once-per-fight dedupe: a callout per occurrence would print this
  // line many times over.
  const dir = await page.evaluate(() => {
    const lj: any = (window as any).lj;
    while (lj.realm.getSize() < 8) lj.scene.levelUp();
    lj.hero.stats.heal(1e9);
    lj.battleLog.clear();

    // The hero stands on [5,9] after entering a realm. getChestsAndMonsters
    // hands back a shallow copy whose inner rows are LIVE, so writing a grade
    // here is what hero.js's own cached view reads on the next step.
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
        items[col][row] = "M";
        return d;
      }
    }
    return null;
  });
  expect(dir, "hero should have a walkable neighbouring tile").not.toBeNull();

  await page.evaluate((d) => (window as any).lj.hero.step(d), dir);

  // The sunder callout lands on the boss's first swing...
  await expect(page.locator("#battleLog")).toContainText(
    "cleaves through your armor!",
    { timeout: 30_000 }
  );
  // ...and the duel then runs to its end (kill or death) with no second line.
  await expect
    .poll(async () => /Slayed the|You were killed by/.test(await logText(page)), {
      timeout: 60_000,
    })
    .toBe(true);

  const text = await logText(page);
  const lines = text.match(/cleaves through your armor!/g) ?? [];
  expect(lines, `sunder should telegraph once, not once per swing`).toHaveLength(
    1
  );
  expect(text, "the telegraph should name the boss").toContain(
    "The Molten Reaver"
  );

  expect(errors, `unexpected errors: ${errors.join(" | ")}`).toEqual([]);
});
