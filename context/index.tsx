"use client"

import { ReactNode, createContext, useCallback, useContext, useEffect, useState } from "react"

interface ThemeContextProps {
  theme: string | undefined
  handleChangeTheme: (choise: string) => void
}

const ThemeContext = createContext<ThemeContextProps>({ theme: "dark", handleChangeTheme: () => {} })

const determineTheme = () => {
  const localTheme = localStorage.getItem("themePreference")
  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  return localTheme || systemTheme
}

export default function ThemeContextProvider({ children }: { children: ReactNode }) {  
  const [theme, setTheme] = useState<string>()

  useEffect(() => {
    setTheme(determineTheme())
  }, [])
  
  const handleChangeTheme = useCallback((choise: string) => {
    setTheme(choise)
    localStorage.setItem("themePreference", choise)
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, handleChangeTheme }}>
      {children}
    </ThemeContext.Provider>
  )

}

export function useThemeContext() {
  return useContext(ThemeContext)
}