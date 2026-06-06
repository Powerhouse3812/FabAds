/** Shares the launchV2 service + re-renders on live progress (React context). */
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { launchV2Service } from "../services/mockLaunchV2";
import type { LaunchRunV2 } from "../types";

interface Ctx {
  service: typeof launchV2Service;
  version: number;
}
const LaunchV2Ctx = createContext<Ctx | undefined>(undefined);

export function LaunchV2Provider({ children }: { children: ReactNode }) {
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const unsub = launchV2Service.subscribe(() => setVersion((v) => v + 1));
    launchV2Service.resumeLive();
    return () => {
      unsub();
      launchV2Service.pauseLive();
    };
  }, []);
  return <LaunchV2Ctx.Provider value={{ service: launchV2Service, version }}>{children}</LaunchV2Ctx.Provider>;
}

export function useLaunchV2() {
  const c = useContext(LaunchV2Ctx);
  if (!c) throw new Error("useLaunchV2 must be inside LaunchV2Provider");
  return c.service;
}
export function useRunV2(id: string | undefined): LaunchRunV2 | undefined {
  const s = useLaunchV2();
  return id ? s.getRun(id) : undefined;
}
