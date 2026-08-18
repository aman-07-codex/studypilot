import { Moon, Sun } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { Button } from "./button";

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(resolvedTheme === "light" ? "dark" : "light")}
      title="Toggle theme"
    >
      {resolvedTheme === "light" ? (
        <Moon className="h-5 w-5" />
      ) : (
        <Sun className="h-5 w-5" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
