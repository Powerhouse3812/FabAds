/** Shares the launchV2 service + re-renders on live progress (React context). */
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { launchV2Service } from "../services/mockLaunchV2";
import type { LaunchRunV2 } from "../types";

interface Ctx {
  service: typeof launchV2Service;
  version: number;
  /** ID of the run that was re-hydrated from sessionStorage on this mount, if any. */
  rehydratedRunId: string | null;
}
const LaunchV2Ctx = createContext<Ctx | undefined>(undefined);

export function LaunchV2Provider({ children }: { children: ReactNode }) {
  const [version, setVersion] = useState(0);
  const [rehydratedRunId, setRehydratedRunId] = useState<string | null>(null);

  useEffect(() => {
    // Re-hydrate any run persisted from a previous page load.
    const restored = launchV2Service.rehydrateFromStorage();
    if (restored) setRehydratedRunId(restored.id);

    const unsub = launchV2Service.subscribe(() => setVersion((v) => v + 1));
    launchV2Service.resumeLive();
    return () => {
      unsub();
      launchV2Service.pauseLive();
    };
  }, []);

  return (
    <LaunchV2Ctx.Provider value={{ service: launchV2Service, version, rehydratedRunId }}>
      {children}
    </LaunchV2Ctx.Provider>
  );
}

export function useLaunchV2() {
  const c = useContext(LaunchV2Ctx);
  if (!c) throw new Error("useLaunchV2 must be inside LaunchV2Provider");
  return c.service;
}

/** Returns the run ID that was re-hydrated from sessionStorage on provider mount (or null). */
export function useRehydratedRunId(): string | null {
  const c = useContext(LaunchV2Ctx);
  return c?.rehydratedRunId ?? null;
}

/** Monotonically-increasing counter that bumps on every live progress update. */
export function useLaunchV2Version(): number {
  const c = useContext(LaunchV2Ctx);
  if (!c) throw new Error("useLaunchV2Version must be inside LaunchV2Provider");
  return c.version;
}

export function useRunV2(id: string | undefined): LaunchRunV2 | undefined {
  const s = useLaunchV2();
  return id ? s.getRun(id) : undefined;
}
