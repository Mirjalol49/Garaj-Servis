"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { useSyncExternalStore } from "react"

import { Button } from "@/components/ui/button"

function subscribe(callback: () => void) {
  const timeout = window.setTimeout(callback, 0)
  return () => window.clearTimeout(timeout)
}

const getClientSnapshot = () => true
const getServerSnapshot = () => false

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const isMounted = useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot)

  const isDark = resolvedTheme === "dark"
  const label = isMounted
    ? isDark
      ? "Switch to light mode"
      : "Switch to dark mode"
    : "Switch theme"

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label={label}
      title={label}
      disabled={!isMounted}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {isMounted && isDark ? <Sun /> : <Moon />}
    </Button>
  )
}
