import { expect, Page, ConsoleMessage } from "@playwright/test";

// Shared helpers for the Legendary Journey playtest suite. The Node self-play
// harness (scripts/selfplay.mjs) covers the combat/loot balance; these browser
// tests cover the SPATIAL + DOM layer it abstracts away (door navigation, tile
// positions, canvas render, health/gear readouts).

// Collect everything that should never happen during a clean session. The
// canvas has `onclick="alert(...)"`, so callers should also register a dialog
// dismisser; the browser auto-requests /favicon.ico which we ignore.
export function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (m: ConsoleMessage) => {
    if (m.type() === "error") errors.push(`console.error: ${m.text()}`);
  });
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("requestfailed", (r) => {
    const u = r.url();
    if (!u.endsWith("/favicon.ico")) {
      errors.push(`requestfailed: ${u} ${r.failure()?.errorText ?? ""}`);
    }
  });
  return errors;
}

// Click Start and wait for startGame() to reveal the HUD (it strips the
// "hidden" class off #healthBarBox once the sprite sheet has loaded).
export async function boot(page: Page): Promise<void> {
  await page.goto("/");
  await page.locator(".btn-start").click();
  await expect(page.locator("#healthBarBox")).not.toHaveClass(/hidden/, {
    timeout: 15000,
  });
}

export type HudState = {
  barWidthPx: number | null; // parsed px value of #healthBar width
  stay: string; // #stay text, e.g. "100/100" or "DEAD"
  current: number | null;
  max: number | null;
  size: number | null;
  room: number | null;
  health: number | null;
};

export async function readHud(page: Page): Promise<HudState> {
  return await page.evaluate(() => {
    const lj: any = (window as any).lj;
    const bar = document.getElementById("healthBar") as HTMLElement;
    const stay = (document.getElementById("stay")?.textContent ?? "").trim();
    const m = stay.match(/^(\d+)\/(\d+)$/);
    const w = (bar?.style.width ?? "").match(/^(-?\d+(?:\.\d+)?)px$/);
    return {
      barWidthPx: w ? parseFloat(w[1]) : null,
      stay,
      current: m ? parseInt(m[1], 10) : null,
      max: m ? parseInt(m[2], 10) : null,
      size: lj?.realm?.getSize?.() ?? null,
      room: lj?.realm?.getCurrentRoom?.() ?? null,
      health: lj?.hero?.stats?.health ?? null,
    };
  });
}

// The healthBar box is 200px wide; the readout must never claim current > max.
export function assertHudSane(hud: HudState, where: string): void {
  if (hud.barWidthPx !== null) {
    expect(hud.barWidthPx, `${where}: #healthBar width should stay within its 200px box`).toBeLessThanOrEqual(200);
    expect(hud.barWidthPx, `${where}: #healthBar width should be non-negative`).toBeGreaterThanOrEqual(0);
  }
  if (hud.current !== null && hud.max !== null) {
    expect(hud.current, `${where}: readout current (${hud.stay}) should not exceed max`).toBeLessThanOrEqual(hud.max);
  }
}
