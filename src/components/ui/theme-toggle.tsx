import * as React from "react";
import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/**
 * COMPONENTE THEME TOGGLE
 * 
 * Toggle de tema unificado com três variantes:
 * - compact: Modo binário para Header (light ↔ dark)
 * - detailed: Modo detalhado para Settings (system | light | dark)
 * - default: Similar a compact
 */

interface ThemeToggleProps {
  variant?: "default" | "compact" | "detailed";
  showIcons?: boolean;
  showLabel?: boolean;
  className?: string;
}

/**
 * Variante Compact (Header)
 * Toggle binário estilo "pill" com knob animado
 */
function CompactToggle({ showIcons = true, className }: Omit<ThemeToggleProps, "variant">) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const toggleTheme = () => {
    // Alternar entre light e dark
    // Se estiver em system, alterna baseado no resolvedTheme
    if (theme === "system") {
      setTheme(isDark ? "light" : "dark");
    } else {
      setTheme(isDark ? "light" : "dark");
    }
  };

  const getTooltipText = () => {
    if (theme === "system") {
      return `Tema do sistema (${isDark ? "escuro" : "claro"})`;
    }
    return isDark ? "Tema escuro" : "Tema claro";
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={toggleTheme}
            role="switch"
            aria-checked={isDark}
            aria-label={getTooltipText()}
            className={cn(
              "relative inline-flex h-9 w-16 items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out",
              "bg-muted hover:bg-muted/80",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              "disabled:cursor-not-allowed disabled:opacity-50",
              isDark && "bg-violet-600 hover:bg-violet-700",
              !isDark && "bg-violet-100 hover:bg-violet-200 dark:bg-violet-900/20 dark:hover:bg-violet-900/30",
              className
            )}
          >
            {/* Ícones opcionais */}
            {showIcons && (
              <>
                <Sun
                  className={cn(
                    "absolute left-2 h-4 w-4 transition-opacity duration-150 ease-in-out",
                    isDark ? "opacity-0" : "opacity-100 text-violet-700"
                  )}
                />
                <Moon
                  className={cn(
                    "absolute right-2 h-4 w-4 transition-opacity duration-150 ease-in-out",
                    isDark ? "opacity-100 text-white" : "opacity-0"
                  )}
                />
              </>
            )}

            {/* Knob animado */}
            <span
              className={cn(
                "pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform duration-300 ease-in-out",
                isDark ? "translate-x-8" : "translate-x-1"
              )}
            />
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{getTooltipText()}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Variante Detailed (Settings)
 * Três botões para escolher: system, light, dark
 */
function DetailedToggle({ showIcons = true, showLabel = true }: Omit<ThemeToggleProps, "variant">) {
  const { theme, setTheme } = useTheme();

  const options: Array<{ value: "system" | "light" | "dark"; label: string; icon: React.ReactNode; description: string }> = [
    {
      value: "system",
      label: "Sistema",
      icon: <Monitor className="h-4 w-4" />,
      description: "Segue a preferência do sistema operacional",
    },
    {
      value: "light",
      label: "Claro",
      icon: <Sun className="h-4 w-4" />,
      description: "Tema claro",
    },
    {
      value: "dark",
      label: "Escuro",
      icon: <Moon className="h-4 w-4" />,
      description: "Tema escuro",
    },
  ];

  return (
    <div role="radiogroup" aria-label="Escolha do tema" className="space-y-3">
      {options.map((option) => {
        const isSelected = theme === option.value;
        return (
          <button
            key={option.value}
            onClick={() => setTheme(option.value)}
            role="radio"
            aria-checked={isSelected}
            aria-label={option.label}
            className={cn(
              "w-full flex items-center justify-between rounded-lg border-2 p-4 transition-all duration-200 ease-in-out",
              "hover:bg-accent hover:text-accent-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2",
              isSelected
                ? "border-violet-600 bg-violet-50 dark:bg-violet-950/20 shadow-sm"
                : "border-border bg-card"
            )}
          >
            <div className="flex items-center gap-3">
              {showIcons && (
                <span className={cn("text-muted-foreground", isSelected && "text-violet-600 dark:text-violet-400")}>
                  {option.icon}
                </span>
              )}
              <div className="text-left">
                {showLabel && (
                  <div className={cn("font-medium", isSelected && "text-violet-600 dark:text-violet-400")}>
                    {option.label}
                  </div>
                )}
                <div className="text-sm text-muted-foreground">{option.description}</div>
              </div>
            </div>

            {/* Indicador de seleção */}
            <div
              className={cn(
                "h-4 w-4 rounded-full border-2 transition-all duration-200",
                isSelected
                  ? "border-violet-600 bg-violet-600 dark:bg-violet-400"
                  : "border-muted-foreground/30"
              )}
            >
              {isSelected && (
                <div className="h-full w-full rounded-full bg-white scale-50 transition-transform duration-200" />
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

/**
 * Componente principal ThemeToggle
 */
export function ThemeToggle({
  variant = "default",
  showIcons = true,
  showLabel = true,
  className,
}: ThemeToggleProps) {
  if (variant === "detailed") {
    return <DetailedToggle showIcons={showIcons} showLabel={showLabel} />;
  }

  return <CompactToggle showIcons={showIcons} className={className} />;
}

