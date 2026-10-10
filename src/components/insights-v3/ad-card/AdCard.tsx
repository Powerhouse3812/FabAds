/** OWNER: agent A (Phase 2). Contract: AdCard({ ad, onOpen }) — reused by B/C/D inside overlays and boards. Stub until then. */
import type { Ad } from "@/lib/insights-v3/types";

export function AdCard({ ad, onOpen }: { ad: Ad; onOpen?: (adId: string) => void }) {
  return (
    <button type="button" onClick={() => onOpen?.(ad.id)} className="rounded-lg border border-border bg-card p-3 text-left text-sm text-foreground">
      {ad.headline}
    </button>
  );
}
