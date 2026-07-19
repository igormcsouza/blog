import { test, expect } from "@playwright/test";

const ROUTES: Array<[string, RegExp]> = [
  ["", /^Home \| Igor Souza's Blog$/],
  ["tags", /^Tags \| Igor Souza's Blog$/],
  ["tags/welcome", /^welcome \| Tags \| Igor Souza's Blog$/],
  ["welcome", /^Welcome to the Blog! \| Igor Souza's Blog$/],
];

test.describe("Per-page HTML titles (regression for #9)", () => {
  for (const [path, expected] of ROUTES) {
    test(`"${path}" has a distinct, correctly formatted title`, async ({
      page,
    }) => {
      await page.goto(path);
      await expect(page).toHaveTitle(expected);
    });
  }

  test("titles across routes are all unique", async ({ page }) => {
    const titles: string[] = [];
    for (const [path] of ROUTES) {
      await page.goto(path);
      titles.push(await page.title());
    }
    expect(new Set(titles).size).toBe(titles.length);
  });
});
