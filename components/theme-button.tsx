"use client";

import { Button } from "@/components/ui/button";
import { Loader, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export const ThemeButton = () => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="size-7 animate-pulse rounded-sm opacity-50"
        disabled
      >
        <Loader className="size-4 animate-spin" />
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      size="icon"
      className="size-7 border-t-[0.5px] shadow-none rounded-sm rounded-t-none"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      {theme === "dark" ? (
        <Sun strokeWidth={1.75} />
      ) : (
        <Moon strokeWidth={1.75} />
      )}
    </Button>
  );
}; 