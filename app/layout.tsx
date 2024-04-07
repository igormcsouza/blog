import ThemeContextProvider from "@/context";
import { BodyLayout } from "./body-layout";

import "./globals.css";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" type="image/svg+xml" href="/blog/favicon.svg" />
      </head>
      <ThemeContextProvider>
        <BodyLayout>{children}</BodyLayout>
      </ThemeContextProvider>
    </html>
  );
}
