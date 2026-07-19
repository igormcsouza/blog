import { test, expect } from "@playwright/test";

const POST_URL = "welcome";

test.describe("Post page", () => {
  test("renders title, description, tags, author, date, and reading time", async ({
    page,
  }) => {
    await page.goto(POST_URL);
    await expect(page).toHaveTitle(/Welcome to the Blog! \| Igor Souza's Blog/);

    await expect(
      page.getByRole("heading", { level: 1, name: "Welcome to the Blog!" })
    ).toBeVisible();
    await expect(
      page.getByText("It's my pleasure to say to you all a warm welcome to my blog!")
    ).toBeVisible();

    await expect(page.getByRole("link", { name: "welcome" })).toBeVisible();
    await expect(page.getByRole("link", { name: "introduction" })).toBeVisible();

    await expect(page.getByText("Igor Souza", { exact: true })).toBeVisible();
    await expect(page.locator("time")).toBeVisible();
    await expect(page.getByText(/min read/)).toBeVisible();
  });

  test("renders MDX body content, including custom components like Callout", async ({
    page,
  }) => {
    await page.goto(POST_URL);
    await expect(
      page.getByText(/childhood dream coming true/i)
    ).toBeVisible();
    await expect(
      page.getByText(/Here you will find a lot of knowledge/i)
    ).toBeVisible();
  });

  test("code blocks in a post render with syntax highlighting and horizontal scroll for long lines", async ({
    page,
  }) => {
    await page.goto("containerization-a-chroot-with-steroids");
    const codeBlock = page.locator("pre").first();
    await expect(codeBlock).toBeVisible();

    const overflowX = await codeBlock.evaluate(
      (el) => getComputedStyle(el).overflowX
    );
    expect(overflowX).toBe("auto");
  });

  test("scroll progress bar advances as the reader scrolls the post", async ({
    page,
  }) => {
    await page.goto("containerization-a-chroot-with-steroids");
    const progressBar = page.locator("div.fixed.top-0.left-0.h-1");
    await expect(progressBar).toBeAttached();

    const widthBefore = await progressBar.evaluate(
      (el) => (el as HTMLElement).style.width
    );

    await page.mouse.wheel(0, 4000);
    await page.waitForTimeout(200);

    const widthAfter = await progressBar.evaluate(
      (el) => (el as HTMLElement).style.width
    );

    expect(parseFloat(widthAfter)).toBeGreaterThan(parseFloat(widthBefore) || 0);
  });

  test("tag chip on a post links to that tag's filter page", async ({
    page,
  }) => {
    await page.goto(POST_URL);
    await page.getByRole("link", { name: "welcome" }).click();
    await expect(page).toHaveURL(/\/blog\/tags\/welcome$/);
  });
});
