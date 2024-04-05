"use client";

import { Inter } from "next/font/google";
import "./globals.css";
import Header from "./header";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import Footer from "./footer";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [darkMode, toggleDarkMode] = useState<boolean>(true)

  useEffect(() => {
    localStorage.getItem("darkModePreference") === "dark" ? toggleDarkMode(true) : toggleDarkMode(false)
  }, [])

  function changeDarkModeTheme() {
    toggleDarkMode(!darkMode)
    localStorage.setItem("darkModePreference", darkMode ? "light" : "dark")
  }

  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/svg+xml" href="/blog/favicon.svg" />
      </head>
      <body className={`flex flex-col min-h-[100vh] container max-w-6xl ${inter.className} ${darkMode ? "dark" : "light"}`}>
        <Header>
          <button
            className="flex gap-4 my-auto dark:bg-zinc-800 bg-zinc-100 p-2 rounded-full transition-color duration-300"
            onClick={changeDarkModeTheme}
          >
            <Sun className={`${darkMode && "text-zinc-800"}`} size={24} />
            <Moon className={`${!darkMode && "text-zinc-100"}`} size={24} />
            <span className="sr-only">Toggle theme</span>
          </button>
        </Header>
        <main className="flex-grow">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
