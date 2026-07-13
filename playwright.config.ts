import { defineConfig, devices } from "@playwright/test";

// Legendary Journey is a canvas roguelike served straight from the repo root
// (index.html + theme.css + js/ + lib/ + assets/ + fonts/). `bash
// scripts/build-dist.sh` assembles dist/ — exactly what deploys to S3 (drops the
// legacy page-bg.jpg, adds app-assets/). The harness builds first and serves
// dist/ so the playtest exercises the real deployed artifact, not the source
// tree. The self-play harness (scripts/selfplay.mjs) already covers the combat
// and loot layer in Node; these browser tests cover the SPATIAL layer (door
// navigation, tile positions, canvas render, DOM readouts) it abstracts away.
const PORT = 5053;
const BASE_URL = `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: "./tests/playtest",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    command: `bash scripts/build-dist.sh && node tests/playtest/static-server.mjs dist ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
