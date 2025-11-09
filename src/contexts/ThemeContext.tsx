import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

/**
 * CONTEXTO DE TEMA
 * 
 * Gerencia o tema claro/escuro do sistema, incluindo:
 * - Aplicação da classe 'dark' no document.documentElement
 * - Detecção de preferência do sistema operacional
 * - Persistência em localStorage
 * - Sincronização com AppContext (settings.theme)
 */

export type Theme = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * Aplica ou remove a classe 'dark' no document.documentElement
 */
function applyThemeToDOM(resolvedTheme: ResolvedTheme) {
  const root = document.documentElement;
  if (resolvedTheme === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}

/**
 * Resolve o tema baseado na preferência do sistema quando theme === "system"
 */
function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/**
 * Lê o tema salvo no localStorage
 */
function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "system";
  
  try {
    const storedSettings = localStorage.getItem('alignwork:settings');
    if (storedSettings) {
      const settings = JSON.parse(storedSettings);
      if (settings.theme && ["light", "dark", "system"].includes(settings.theme)) {
        return settings.theme as Theme;
      }
    }
  } catch (error) {
    console.warn('Erro ao ler tema do localStorage:', error);
  }
  
  return "system";
}

/**
 * Salva o tema no localStorage (dentro de alignwork:settings)
 */
function saveThemeToStorage(theme: Theme) {
  try {
    const storedSettings = localStorage.getItem('alignwork:settings');
    const settings = storedSettings ? JSON.parse(storedSettings) : {};
    settings.theme = theme;
    localStorage.setItem('alignwork:settings', JSON.stringify(settings));
  } catch (error) {
    console.warn('Erro ao salvar tema no localStorage:', error);
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => getStoredTheme());
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => {
    const initialTheme = getStoredTheme();
    if (initialTheme === "system") {
      return getSystemTheme();
    }
    return initialTheme;
  });

  // Aplicar tema inicial ao DOM
  useEffect(() => {
    applyThemeToDOM(resolvedTheme);
  }, []); // Apenas na montagem inicial

  // Atualizar resolvedTheme quando theme mudar
  useEffect(() => {
    if (theme === "system") {
      const systemTheme = getSystemTheme();
      setResolvedTheme(systemTheme);
      applyThemeToDOM(systemTheme);
    } else {
      setResolvedTheme(theme);
      applyThemeToDOM(theme);
    }
  }, [theme]);

  // Listener para mudanças na preferência do sistema (quando theme === "system")
  useEffect(() => {
    if (theme !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    
    const handleChange = (e: MediaQueryListEvent) => {
      const newResolvedTheme = e.matches ? "dark" : "light";
      setResolvedTheme(newResolvedTheme);
      applyThemeToDOM(newResolvedTheme);
    };

    // Usar addListener para compatibilidade com navegadores mais antigos
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    } else {
      // Fallback para navegadores antigos
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, [theme]);

  // Função para alterar tema (com sincronização de localStorage)
  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    saveThemeToStorage(newTheme);
    
    // Disparar evento customizado para sincronizar com AppContext
    window.dispatchEvent(new CustomEvent('theme-changed'));
    
    // Log para telemetria futura
    console.log('[Theme] Changed:', { 
      from: theme, 
      to: newTheme, 
      resolved: newTheme === "system" ? getSystemTheme() : newTheme 
    });
  };

  const value: ThemeContextType = {
    theme,
    resolvedTheme,
    setTheme,
  };

  return (
    <ThemeContext.Provider value={value} suppressHydrationWarning>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Hook para usar o contexto de tema
 */
export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme deve ser usado dentro de um ThemeProvider');
  }
  return context;
}

