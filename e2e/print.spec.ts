import { test, expect } from "@playwright/test";

// Middle-of-suite post so PostNavigation renders at least one link.
const POST_URL = "welcome";

test.describe("Print layout", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(POST_URL);
    await page.emulateMedia({ media: "print" });
  });

  test("hides header, footer, scroll progress, and post navigation", async ({
    page,
  }) => {
    await expect(page.locator("header")).not.toBeVisible();
    await expect(page.locator("footer")).not.toBeVisible();
    await expect(page.locator("div.fixed.top-0.left-0.h-1")).not.toBeVisible();
    await expect(
      page.getByRole("navigation", { name: "Post navigation" })
    ).not.toBeVisible();
  });

  test("keeps the article title, metadata, and body visible", async ({
    page,
  }) => {
    await expect(
      page.getByRole("heading", { level: 1, name: "Welcome to the Blog!" })
    ).toBeVisible();
    await expect(page.getByText("Igor Souza", { exact: true })).toBeVisible();
    await expect(page.getByText(/childhood dream coming true/i)).toBeVisible();
  });

  test("prints black-on-white regardless of the active theme", async ({
    page,
  }) => {
    const bodyBackground = await page.evaluate(
      () => getComputedStyle(document.body).backgroundColor
    );
    expect(bodyBackground).toBe("rgb(255, 255, 255)");

    const headingColor = await page
      .locator("article h1")
      .evaluate((el) => getComputedStyle(el).color);
    expect(headingColor).toBe("rgb(0, 0, 0)");
  });

  test("code blocks print without a dark background", async ({ page }) => {
    await page.goto("containerization-a-chroot-with-steroids");
    await page.emulateMedia({ media: "print" });

    const preBackground = await page
      .locator("pre")
      .first()
      .evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(preBackground).toBe("rgba(0, 0, 0, 0)");
  });
});
