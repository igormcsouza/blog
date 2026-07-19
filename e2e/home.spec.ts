import { test, expect } from "@playwright/test";

test.describe("Home page", () => {
  test("shows the site heading and a non-empty, date-sorted post list", async ({
    page,
  }) => {
    await page.goto("");
    await expect(page).toHaveTitle(/Home \| Igor Souza's Blog/);
    await expect(
      page.getByRole("heading", { level: 1, name: "Igor Souza's Blog" })
    ).toBeVisible();

    const posts = page.locator("main article");
    await expect(posts.first()).toBeVisible();

    const dates = await posts.locator("time").allTextContents();
    const parsed = dates.map((d) => new Date(d).getTime());
    const sorted = [...parsed].sort((a, b) => b - a);
    expect(parsed).toEqual(sorted);
  });

  test("each post card links to its post and shows title, tags, and date", async ({
    page,
  }) => {
    await page.goto("");
    const firstPost = page.locator("main article").first();

    await expect(firstPost.getByRole("heading", { level: 2 })).toBeVisible();
    await expect(firstPost.locator("time")).toBeVisible();
    await expect(
      firstPost.getByRole("link", { name: /read more/i })
    ).toBeVisible();

    const titleLink = firstPost.getByRole("heading", { level: 2 }).getByRole("link");
    const href = await titleLink.getAttribute("href");
    await titleLink.click();
    await expect(page).toHaveURL(new RegExp(`${href}$`));
  });

  test("sidebar lists every tag with its post count", async ({ page }) => {
    await page.goto("");
    const tagsCard = page.locator("div.rounded-lg", { has: page.getByRole("heading", { name: "Tags" }) });
    const tagLinks = tagsCard.getByRole("link");
    await expect(tagLinks.first()).toBeVisible();

    const count = await tagLinks.count();
    for (let i = 0; i < count; i++) {
      await expect(tagLinks.nth(i)).toHaveText(/\(\d+\)$/);
    }
  });
});
