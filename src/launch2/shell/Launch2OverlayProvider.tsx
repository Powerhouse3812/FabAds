import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { LaunchMode } from "../types";
import { EntryOverlay } from "../flow/EntryOverlay";

interface OverlayContextValue {
  isOpen: boolean;
  /** Optional preselected mode (e.g. open straight into Quick). */
  initialMode: LaunchMode | null;
  open: (mode?: LaunchMode) => void;
  close: () => void;
}

const OverlayContext = createContext<OverlayContextValue | null>(null);

/**
 * Hosts the "+ New Launch" entry overlay (Mode → Strategy → Objective).
 * Mounted once in Launch2Bridge so the persistent CTA can open it from any
 * Launch 2.0 screen.
 */
export function Launch2OverlayProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [initialMode, setInitialMode] = useState<LaunchMode | null>(null);

  const open = useCallback((mode?: LaunchMode) => {
    setInitialMode(mode ?? null);
    setIsOpen(true);
  }, []);
  const close = useCallback(() => setIsOpen(false), []);

  const value = useMemo(() => ({ isOpen, initialMode, open, close }), [isOpen, initialMode, open, close]);

  return (
    <OverlayContext.Provider value={value}>
      {children}
      {isOpen && <EntryOverlay initialMode={initialMode} onClose={close} />}
    </OverlayContext.Provider>
  );
}

export function useLaunch2Overlay() {
  const ctx = useContext(OverlayContext);
  if (!ctx) throw new Error("useLaunch2Overlay must be used within Launch2OverlayProvider");
  return ctx;
}
