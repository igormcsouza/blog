import { test, expect } from "@playwright/test";

test.describe("Theme toggle", () => {
  test("defaults to the OS color scheme when no preference is stored", async ({
    page,
  }) => {
    await page.goto("");
    const expected = await page.evaluate(
      () => (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
    );
    await expect(page.locator("body")).toHaveClass(new RegExp(expected));
  });

  test("clicking the toggle switches the theme and the choice survives a reload", async ({
    page,
  }) => {
    await page.goto("");
    const body = page.locator("body");
    // Theme is resolved client-side after mount (see context/index.tsx), so
    // wait for that to settle before snapshotting "before" - reading too
    // early can catch the transient pre-hydration class and desync from
    // what the toggle button actually flips.
    await page.waitForFunction(() =>
      /\b(light|dark)\b/.test(document.body.className)
    );
    const before = /\bdark\b/.test((await body.getAttribute("class")) ?? "")
      ? "dark"
      : "light";
    const after = before === "dark" ? "light" : "dark";

    await page.getByRole("button", { name: /toggle theme/i }).click();
    await expect(body).toHaveClass(new RegExp(after));
    await expect(body).not.toHaveClass(new RegExp(before));

    await page.reload();
    await expect(body).toHaveClass(new RegExp(after));

    const stored = await page.evaluate(() =>
      localStorage.getItem("themePreference")
    );
    expect(stored).toBe(after);
  });

  test("page content is visible immediately on first load, in both themes (regression for #10)", async ({
    page,
  }) => {
    // Guards against the dev-mode "blank page" bug (issue #10): the theme
    // provider must never render a null/empty tree while it figures out the
    // active theme, in any color scheme.
    await page.goto("");
    await expect(
      page.getByRole("heading", { level: 1, name: "Igor Souza's Blog" })
    ).toBeVisible();
    await expect(page.locator("main article").first()).toBeVisible();
  });
});
