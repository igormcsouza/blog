"use client"

import * as React from "react"

import { useThemeContext } from "@/context"

interface MermaidProps {
  chart: string
}

export function Mermaid({ chart }: MermaidProps) {
  const { theme } = useThemeContext()
  const uid = React.useId().replace(/:/g, "")
  const [svg, setSvg] = React.useState<string | null>(null)

  React.useEffect(() => {
    // Wait for ThemeContextProvider to resolve the actual theme (it starts
    // undefined) so the diagram is never rendered in the wrong palette.
    if (!theme) return

    let cancelled = false

    import("mermaid").then(async ({ default: mermaid }) => {
      mermaid.initialize({
        startOnLoad: false,
        theme: theme === "dark" ? "dark" : "default",
        securityLevel: "strict",
      })

      try {
        const { svg: rendered } = await mermaid.render(`mermaid-${uid}`, chart)
        if (!cancelled) setSvg(rendered)
      } catch (error) {
        console.error("Failed to render Mermaid diagram", error)
      }
    })

    return () => {
      cancelled = true
    }
  }, [chart, theme, uid])

  return (
    <div
      data-mermaid=""
      className="my-6 flex justify-center overflow-x-auto rounded-lg border p-4"
      {...(svg ? { dangerouslySetInnerHTML: { __html: svg } } : {})}
    />
  )
}
