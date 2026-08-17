import { test, expect } from "@playwright/test";

test.describe("Header navigation", () => {
  test("Blog link goes to the blog index", async ({ page }) => {
    await page.goto("tags");
    await page.getByRole("navigation").getByRole("link", { name: "Blog" }).click();
    await expect(page).toHaveURL(/\/blog\/?$/);
    await expect(page).toHaveTitle(/Home \| Igor Souza's Blog/);
  });

  test("Tags link goes to the tags index", async ({ page }) => {
    await page.goto("");
    await page.getByRole("navigation").getByRole("link", { name: "Tags" }).click();
    await expect(page).toHaveURL(/\/blog\/tags\/?$/);
    await expect(page.getByRole("heading", { level: 1, name: "Tags" })).toBeVisible();
  });

  test("Home link points to Igor's personal portfolio site, not the blog", async ({
    page,
  }) => {
    await page.goto("");
    const homeLink = page.getByRole("navigation").getByRole("link", { name: "Home" });
    await expect(homeLink).toHaveAttribute("href", "https://igormcsouza.github.io/");
    // This link is same-origin-but-outside-basePath in production
    // (igormcsouza.github.io/ vs the /blog app), which is what made Next's
    // viewport prefetch treat it as an internal route and mis-load its RSC
    // payload/chunks (#48). `prefetch={false}` (components/header.tsx) is
    // the fix, but that prop isn't reflected in rendered HTML, and the bug
    // only triggers when this app's own origin matches igormcsouza.github.io
    // exactly — never true against this suite's 127.0.0.1 webServer. So
    // this test can only guard the href itself, not the prefetch fix; the
    // fix was verified against the live deployed site instead.
  });

  test("logo links back to the blog home", async ({ page }) => {
    // The logo is hidden below Tailwind's `sm` breakpoint (see
    // components/header.tsx), so on mobile viewports we only assert it is
    // present in the DOM rather than requiring it to be visible.
    await page.goto("tags");
    const logoLink = page.locator("header a.hidden.sm\\:inline-block");
    await expect(logoLink).toBeAttached();

    const viewport = page.viewportSize();
    if (viewport && viewport.width >= 640) {
      await expect(logoLink).toBeVisible();
      await logoLink.click();
      await expect(page).toHaveURL(/\/blog\/?$/);
    }
  });
});

test.describe("404 page", () => {
  test("unknown routes render a not-found page instead of crashing", async ({
    page,
  }) => {
    const response = await page.goto("this-post-does-not-exist");
    expect(response?.status()).toBe(404);
    await expect(page.getByText("404")).toBeVisible();
    await expect(page.getByText(/page could not be found/i)).toBeVisible();
  });
});
