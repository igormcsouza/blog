import { test, expect } from "@playwright/test";
import { getPublishedPostsAscending } from "./fixtures/posts";

// Ordering is derived from content/, so publishing a new post doesn't break
// the oldest/newest assertions.
const posts = getPublishedPostsAscending();
const [OLDEST, MIDDLE, AFTER_MIDDLE] = posts;
const NEWEST = posts[posts.length - 1];

test.describe("Post navigation", () => {
  test("middle post shows both previous and next links", async ({ page }) => {
    await page.goto(MIDDLE.slug);
    const nav = page.getByRole("navigation", { name: "Post navigation" });

    await expect(nav).toBeVisible();
    await expect(nav.getByRole("link", { name: OLDEST.title })).toBeVisible();
    await expect(
      nav.getByRole("link", { name: AFTER_MIDDLE.title })
    ).toBeVisible();
    await expect(nav.getByText("Previous")).toBeVisible();
    await expect(nav.getByText("Next")).toBeVisible();
  });

  test("oldest post shows only a next link", async ({ page }) => {
    await page.goto(OLDEST.slug);
    const nav = page.getByRole("navigation", { name: "Post navigation" });

    await expect(nav).toBeVisible();
    await expect(nav.getByText("Next")).toBeVisible();
    await expect(nav.getByText("Previous")).toHaveCount(0);
  });

  test("newest post shows only a previous link", async ({ page }) => {
    await page.goto(NEWEST.slug);
    const nav = page.getByRole("navigation", { name: "Post navigation" });

    await expect(nav).toBeVisible();
    await expect(nav.getByText("Previous")).toBeVisible();
    await expect(nav.getByText("Next")).toHaveCount(0);
  });

  test("clicking the previous link navigates to the older post", async ({
    page,
  }) => {
    await page.goto(MIDDLE.slug);
    const nav = page.getByRole("navigation", { name: "Post navigation" });

    await nav.getByRole("link", { name: OLDEST.title }).click();
    await expect(page).toHaveURL(new RegExp(`/blog/${OLDEST.slug}/?$`));
  });

  test("clicking the next link navigates to the newer post", async ({
    page,
  }) => {
    await page.goto(OLDEST.slug);
    const nav = page.getByRole("navigation", { name: "Post navigation" });

    await nav.getByRole("link", { name: MIDDLE.title }).click();
    await expect(page).toHaveURL(new RegExp(`/blog/${MIDDLE.slug}/?$`));
  });
});
