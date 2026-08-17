import { test, expect } from "@playwright/test";

test.describe("Footer", () => {
  test("cross-links to Igor's portfolio site, socials, and the mail contact", async ({
    page,
  }) => {
    await page.goto("");
    const footer = page.locator("footer");

    await expect(footer.getByRole("link", { name: "Home" })).toHaveAttribute(
      "href",
      "https://igormcsouza.github.io/"
    );
    await expect(footer.getByRole("link", { name: "About" })).toHaveAttribute(
      "href",
      "https://igormcsouza.github.io/#about"
    );
    await expect(
      footer.getByRole("link", { name: "Projects" })
    ).toHaveAttribute("href", "https://igormcsouza.github.io/#projects");
    await expect(footer.getByRole("link", { name: "News" })).toHaveAttribute(
      "href",
      "https://igormcsouza.github.io/#news"
    );
    // These four are same-origin-but-outside-basePath, same as the header's
    // Home link (#48) — prefetch={false} (components/footer.tsx) is the
    // fix, but that prop isn't reflected in rendered HTML and the bug only
    // triggers when this app's own origin matches igormcsouza.github.io
    // exactly, which is never true against this suite's 127.0.0.1
    // webServer. See the equivalent note in e2e/navigation.spec.ts.

    await expect(footer.getByRole("link", { name: "GitHub" })).toHaveAttribute(
      "href",
      "https://github.com/igormcsouza"
    );
    await expect(footer.getByRole("link", { name: "Twitter" })).toHaveAttribute(
      "href",
      "https://twitter.com/igormcsouza"
    );
    await expect(
      footer.getByRole("link", { name: "LinkedIn" })
    ).toHaveAttribute("href", "https://linkedin.com/in/igormcsouza");
    await expect(
      footer.getByRole("link", { name: "Instagram" })
    ).toHaveAttribute("href", "https://www.instagram.com/igormcsouza/");

    await expect(footer.getByRole("link", { name: "mail" })).toHaveAttribute(
      "href",
      "mailto:igormcsouza@gmail.com"
    );

    await expect(
      footer.getByText(`© ${new Date().getFullYear()} Igor Souza. All rights reserved.`)
    ).toBeVisible();
  });
});
