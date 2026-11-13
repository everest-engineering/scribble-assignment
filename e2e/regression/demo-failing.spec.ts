import { expect, test } from "@playwright/test";

// Fails on purpose, to show how a failing regression test looks in Factory
// (screenshot, error, trace and log). Delete this file once you've seen it.
test("demo: the start page shows a leaderboard (fails on purpose)", async ({ page }) => {
  await test.step("Open the start page", async () => {
    await page.goto("/");
  });
  await expect(page.getByRole("heading", { name: "Leaderboard" })).toBeVisible({
    timeout: 3_000,
  });
});
