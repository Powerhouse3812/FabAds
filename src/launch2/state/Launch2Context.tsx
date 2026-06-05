/**
 * Launch2Context — shares the singleton MetaLaunchService across the module and
 * re-renders consumers when the service broadcasts (live progress, retries,
 * draft saves). The repo uses React Context + hooks (no Zustand), so this is
 * the module's "store".
 */
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { metaLaunchService } from "../services/mockMetaLaunchService";
import type { MetaLaunchService } from "../services/MetaLaunchService";
import type { LaunchRun } from "../types";

interface Launch2ContextValue {
  service: MetaLaunchService;
  /** Bumps on every service event — forces consumers to re-read live data. */
  version: number;
}

const Launch2Context = createContext<Launch2ContextValue | undefined>(undefined);

export function Launch2Provider({ children }: { children: ReactNode }) {
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const unsub = metaLaunchService.subscribe(() => setVersion((v) => v + 1));
    metaLaunchService.resumeLiveRuns();
    return () => {
      unsub();
      metaLaunchService.pauseLiveRuns();
    };
  }, []);

  // New object identity per version bump → consumers re-render.
  return (
    <Launch2Context.Provider value={{ service: metaLaunchService, version }}>
      {children}
    </Launch2Context.Provider>
  );
}

/** Access the launch service. Re-renders the caller on every service event. */
export function useLaunch2(): MetaLaunchService {
  const ctx = useContext(Launch2Context);
  if (!ctx) throw new Error("useLaunch2 must be used within <Launch2Provider>");
  return ctx.service;
}

/** Convenience: a single live run by id (re-renders as it progresses). */
export function useLaunchRun(id: string | undefined): LaunchRun | undefined {
  const service = useLaunch2();
  return id ? service.getLaunch(id) : undefined;
}
