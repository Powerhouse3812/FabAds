import { createContext, useContext, useMemo, type ReactNode } from "react";

interface GenieThemeContextValue {
  cardClass: string;
  pillActiveClass: string;
  pillInactiveClass: string;
  wrapperClass: string;
  barClass: string;
  sectionLabelClass: string;
  isStudio: boolean;
}

const DEFAULT_THEME: GenieThemeContextValue = {
  wrapperClass: "bg-background",
  cardClass: "bg-card border-border shadow-sm",
  pillActiveClass: "border-primary bg-primary text-primary-foreground",
  pillInactiveClass: "border-border bg-muted/50 text-muted-foreground hover:border-primary/40 hover:bg-muted/70",
  barClass: "bg-card border-border shadow-md",
  sectionLabelClass: "text-muted-foreground",
  isStudio: false,
};

const STUDIO_THEME: GenieThemeContextValue = {
  wrapperClass: "bg-gradient-to-b from-[#12100e] via-[#181410] to-[#1a1612]",
  cardClass: "bg-white/[0.04] backdrop-blur-xl border-white/[0.08] shadow-lg shadow-black/10",
  pillActiveClass: "bg-white/[0.14] text-white border-white/[0.18] shadow-sm shadow-white/5",
  pillInactiveClass: "bg-transparent text-white/50 border-transparent hover:text-white/70 hover:bg-white/[0.06]",
  barClass: "bg-white/[0.05] backdrop-blur-xl border-white/[0.08] shadow-xl shadow-black/20",
  sectionLabelClass: "text-white/40",
  isStudio: true,
};

const GenieThemeContext = createContext<GenieThemeContextValue>(DEFAULT_THEME);

export function Genie5ThemeProvider({
  children,
  layout,
}: {
  children: ReactNode;
  layout?: string;
}) {
  const theme = useMemo(() => {
    if (layout === "studio") return STUDIO_THEME;
    return DEFAULT_THEME;
  }, [layout]);

  return (
    <GenieThemeContext.Provider value={theme}>
      {children}
    </GenieThemeContext.Provider>
  );
}

export function useGenieTheme() {
  return useContext(GenieThemeContext);
}
