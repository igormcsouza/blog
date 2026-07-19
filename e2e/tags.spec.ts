import { test, expect } from "@playwright/test";

test.describe("Tags index page", () => {
  test("lists every tag with a post count and links to its filter page", async ({
    page,
  }) => {
    await page.goto("tags");
    await expect(page).toHaveTitle(/Tags \| Igor Souza's Blog/);
    await expect(
      page.getByRole("heading", { level: 1, name: "Tags" })
    ).toBeVisible();

    const tagLink = page.getByRole("link", { name: /welcome \(\d+\)/i });
    await expect(tagLink).toBeVisible();
    await tagLink.click();
    await expect(page).toHaveURL(/\/blog\/tags\/welcome$/);
  });
});

test.describe("Tag filter page", () => {
  test("shows only posts carrying the selected tag, and highlights it in the sidebar", async ({
    page,
  }) => {
    await page.goto("tags/welcome");
    await expect(
      page.getByRole("heading", { level: 1, name: "welcome" })
    ).toBeVisible();

    const posts = page.locator("main article");
    await expect(posts).toHaveCount(1);
    await expect(posts.first().getByRole("heading", { level: 2 })).toHaveText(
      "Welcome to the Blog!"
    );

    const tagsCard = page.locator("div.rounded-lg", { has: page.getByRole("heading", { name: "Tags" }) });
    const currentTag = tagsCard.getByRole("link", { name: /welcome \(\d+\)/i });
    await expect(currentTag).toBeVisible();
  });

  test("a tag slug with no matching posts shows the empty state instead of crashing", async ({
    page,
  }) => {
    await page.goto("tags/does-not-exist");
    await expect(page.getByText("Nothing to see here yet")).toBeVisible();
  });
});
