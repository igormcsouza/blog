import ThemeContextProvider from "@/context";
import { BodyLayout } from "./body-layout";
import { siteConfig } from "@/lib/utils";
import { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                try {
                  var theme =
                    localStorage.getItem("themePreference") ||
                    (window.matchMedia("(prefers-color-scheme: dark)").matches
                      ? "dark"
                      : "light");
                  document.documentElement.classList.add(theme);
                } catch (e) {}
              })();
            `,
          }}
        />
        <link rel="icon" type="image/svg+xml" href="/blog/favicon.svg" />
      </head>
      <ThemeContextProvider>
        <BodyLayout>{children}</BodyLayout>
      </ThemeContextProvider>
    </html>
  );
}
