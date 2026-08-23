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
        // Render at natural size and let the wrapper's overflow-x-auto
        // handle wide diagrams (same pattern as this blog's code blocks),
        // instead of Mermaid shrinking the SVG to fit the article column
        // and crowding every label.
        flowchart: { useMaxWidth: false },
        sequence: { useMaxWidth: false },
        c4: { useMaxWidth: false },
        themeVariables: {
          // Explicit, high-contrast colors for subgraph/cluster titles —
          // the built-in dark theme's default clusterBkg is dark enough
          // to make the title text read as if it had no background at
          // all against this site's near-black page background.
          clusterBkg: theme === "dark" ? "#374151" : "#fef9c3",
          clusterBorder: theme === "dark" ? "#6b7280" : "#ca8a04",
        },
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

