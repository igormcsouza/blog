import { test, expect } from "@playwright/test";

// Order (ascending by date) of currently published content. If a new post is
// added, the oldest/newest assertions below may need updating — same
// fragility class as the hard-coded "welcome" assertions elsewhere in this
// suite.
const OLDEST_POST = "welcome";
const MIDDLE_POST = "we-need-to-talk-about-gil";
const NEWEST_POST = "async-vs-threading-the-battle-for-supremacy";

test.describe("Post navigation", () => {
  test("middle post shows both previous and next links", async ({ page }) => {
    await page.goto(MIDDLE_POST);
    const nav = page.getByRole("navigation", { name: "Post navigation" });

    await expect(nav).toBeVisible();
    await expect(
      nav.getByRole("link", { name: /Welcome to the Blog!/ })
    ).toBeVisible();
    await expect(
      nav.getByRole("link", { name: /Containerization: A Chroot with Steroids/ })
    ).toBeVisible();
    await expect(nav.getByText("Previous")).toBeVisible();
    await expect(nav.getByText("Next")).toBeVisible();
  });

  test("oldest post shows only a next link", async ({ page }) => {
    await page.goto(OLDEST_POST);
    const nav = page.getByRole("navigation", { name: "Post navigation" });

    await expect(nav).toBeVisible();
    await expect(nav.getByText("Next")).toBeVisible();
    await expect(nav.getByText("Previous")).toHaveCount(0);
  });

  test("newest post shows only a previous link", async ({ page }) => {
    await page.goto(NEWEST_POST);
    const nav = page.getByRole("navigation", { name: "Post navigation" });

    await expect(nav).toBeVisible();
    await expect(nav.getByText("Previous")).toBeVisible();
    await expect(nav.getByText("Next")).toHaveCount(0);
  });

  test("clicking the previous link navigates to the older post", async ({
    page,
  }) => {
    await page.goto(MIDDLE_POST);
    const nav = page.getByRole("navigation", { name: "Post navigation" });

    await nav.getByRole("link", { name: /Welcome to the Blog!/ }).click();
    await expect(page).toHaveURL(new RegExp(`/blog/${OLDEST_POST}$`));
  });

  test("clicking the next link navigates to the newer post", async ({
    page,
  }) => {
    await page.goto(OLDEST_POST);
    const nav = page.getByRole("navigation", { name: "Post navigation" });

    await nav.getByRole("link", { name: /We need to talk about GIL!/ }).click();
    await expect(page).toHaveURL(new RegExp(`/blog/${MIDDLE_POST}$`));
  });
});
