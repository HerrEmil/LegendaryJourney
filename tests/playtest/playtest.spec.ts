import { test, expect } from "@playwright/test";
import { boot, collectErrors, readHud, assertHudSane } from "./harness";

// Characterization suite for the previously-untested browser surface: boot
// hygiene, canvas render, keyboard input, cross-realm navigation, resize, the
// death→restart cycle, and the dungeon-maze connectivity invariant. The Node
// self-play harness covers combat/loot balance and explicitly abstracts the
// spatial layer away — this is that layer.

const DIRS = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];

test("boots clean, paints the dungeon, and responds to arrow input", async ({ page }) => {
  const errors = collectErrors(page);
  page.on("dialog", (d) => d.dismiss()); // canvas onclick=alert(...)
  await boot(page);

  // Canvas is the real deployed 352x352 board and must paint something.
  const canvas = await page.evaluate(() => {
    const c = document.getElementById("game") as HTMLCanvasElement;
    const ctx = c.getContext("2d")!;
    const d = ctx.getImageData(0, 0, c.width, c.height).data;
    let painted = false;
    for (let i = 3; i < d.length; i += 4) if (d[i] !== 0) { painted = true; break; }
    return { w: c.width, h: c.height, painted };
  });
  expect(canvas).toEqual({ w: 352, h: 352, painted: true });

  // Drive a batch of arrow input; the HUD must stay well-formed throughout.
  for (let i = 0; i < 120; i++) await page.keyboard.press(DIRS[i % 4]);
  const hud = await readHud(page);
  expect(hud.stay === "DEAD" || /^\d+\/\d+$/.test(hud.stay)).toBe(true);
  assertHudSane(hud, "after arrow input");

  expect(errors, `unexpected errors: ${errors.join(" | ")}`).toEqual([]);
});

test("advances through realms 1..8 with no errors and a sane HUD", async ({ page }) => {
  const errors = collectErrors(page);
  page.on("dialog", (d) => d.dismiss());
  await boot(page);

  for (let target = 2; target <= 8; target++) {
    await page.evaluate(() => (window as any).lj.scene.levelUp());
    // Take a few steps so the freshly-entered room renders and interacts.
    for (let i = 0; i < 10; i++) await page.keyboard.press(DIRS[(i + target) % 4]);
    const hud = await readHud(page);
    expect(hud.size, `should be in realm ${target}`).toBe(target);
    assertHudSane(hud, `realm ${target}`);
  }
  expect(errors, `unexpected errors: ${errors.join(" | ")}`).toEqual([]);
});

test("survives mobile+desktop resize and canvas spam-clicks", async ({ page }) => {
  const errors = collectErrors(page);
  page.on("dialog", (d) => d.dismiss());
  await boot(page);

  for (const vp of [{ width: 375, height: 812 }, { width: 1280, height: 800 }]) {
    await page.setViewportSize(vp);
    for (let i = 0; i < 30; i++) await page.keyboard.press(DIRS[i % 4]);
    const hud = await readHud(page);
    assertHudSane(hud, `viewport ${vp.width}`);
  }
  // The canvas' onclick pops an alert (auto-dismissed); spam it.
  const canvas = page.locator("#game");
  for (let i = 0; i < 12; i++) {
    await canvas.click({ position: { x: 80, y: 80 }, force: true }).catch(() => {});
  }
  expect(errors, `unexpected errors: ${errors.join(" | ")}`).toEqual([]);
});

test("death shows DEAD and 'Try again!' restarts into realm 1, alive and movable", async ({ page }) => {
  const errors = collectErrors(page);
  page.on("dialog", (d) => d.dismiss());
  await boot(page);

  // Reproduce hero.interact's death branch: lethal damage + the killed message
  // (which prints the restart button), exactly as a losing fight would.
  await page.evaluate(() => {
    const lj: any = (window as any).lj;
    lj.hero.stats.hurt(1e9);
    lj.battleLog.heroKilled("Test Boss");
  });
  expect((await readHud(page)).stay, "should read DEAD when killed").toBe("DEAD");

  await page.locator(".btn.restart").last().click();
  const hud = await readHud(page);
  expect(hud.size, "restart should return to realm 1").toBe(1);
  expect(hud.health ?? 0, "hero should be alive after restart").toBeGreaterThan(0);
  assertHudSane(hud, "after restart");

  // isBusy must be cleared — the hero can act again.
  for (let i = 0; i < 6; i++) await page.keyboard.press(DIRS[i % 4]);
  assertHudSane(await readHud(page), "after moving post-restart");
  expect(errors, `unexpected errors: ${errors.join(" | ")}`).toEqual([]);
});

test("every generated dungeon room is fully connected (boss + all tiles reachable)", async ({ page }) => {
  page.on("dialog", (d) => d.dismiss());
  await boot(page);

  // A sealed maze would make the boss (or loot) unreachable — a hard softlock /
  // unwinnable game. Flood-fill from the hero spawn (5,9) across many freshly
  // generated rooms and assert nothing placed is walled off. (The spawn tile is
  // always floor and always the hero's start in a size-1 realm.)
  const result = await page.evaluate(() => {
    const lj: any = (window as any).lj;
    const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    function reachable(room: string[][]) {
      const seen = new Set<string>(["5,9"]);
      const stack: number[][] = [[5, 9]];
      while (stack.length) {
        const [c, r] = stack.pop()!;
        for (const [dc, dr] of NB) {
          const nc = c + dc, nr = r + dr;
          if (nc < 0 || nc > 10 || nr < 0 || nr > 10) continue;
          const k = `${nc},${nr}`;
          if (seen.has(k) || room[nc][nr] === "#") continue;
          seen.add(k);
          stack.push([nc, nr]);
        }
      }
      return seen;
    }
    let samples = 0, bossUnreachable = 0, tileUnreachable = 0, bossesSeen = 0;
    // Size 1 guarantees the boss sits in the (only) room the hero spawns in, so
    // it's the definitive "is the game winnable" check; a few larger realms
    // exercise the same makeRoom() maze at other sizes.
    for (const size of [1, 1, 1, 1, 1, 2, 3, 4]) {
      for (let n = 0; n < 250; n++) {
        lj.realm.makeRealm(size);
        const cur = lj.realm.getCurrentRoom();
        const room = lj.realm.getRoom(cur);
        const cm = lj.realm.getChestsAndMonsters(cur);
        const seen = reachable(room);
        samples++;
        for (let c = 0; c <= 10; c++) {
          for (let r = 0; r <= 10; r++) {
            const t = cm[c] && cm[c][r];
            if (!t || t === "#" || t === " ") continue;
            const ok = seen.has(`${c},${r}`);
            if (t === "B" || t === "T") { bossesSeen++; if (!ok) bossUnreachable++; }
            else if (!ok) tileUnreachable++;
          }
        }
      }
    }
    return { samples, bossUnreachable, tileUnreachable, bossesSeen };
  });

  expect(result.bossesSeen, "size-1 realms should always place a boss").toBeGreaterThan(0);
  expect(result.bossUnreachable, "boss must be reachable from spawn (else unwinnable)").toBe(0);
  expect(result.tileUnreachable, "no monster/chest should be walled off").toBe(0);
});
