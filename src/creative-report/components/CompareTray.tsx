/**
 * CompareTray — floating "InstaX-style" cluster for the running compare
 * selection (Maalik: "jaise Instagram ka new photo share feature — ek
 * folder sa bna hua kuchh"). Clicking Compare on a creative no longer
 * navigates straight to the Compare screen (losing your place in the grid);
 * it adds to this tray instead, up to `MAX_COMPARE`.
 *
 * Mounted once in `CreativeReportLayout`, so it floats above every screen in
 * the module (grid, components, compare, automations) and survives
 * navigation between them. Corner: bottom-right. `BulkActionBar` occupies
 * the same bottom edge on the Creatives grid, but it's `sticky bottom-4
 * mx-auto` (centered, scoped to the grid's own scroll container, z-20) —
 * this tray is `fixed bottom-6 right-6` (viewport-anchored, right-aligned,
 * z-30), so the two can never occupy the same horizontal space even if both
 * are visible on the grid at once.
 *
 * Renders nothing when the selection is empty or the tray has been
 * dismissed — dismissing only hides this component, it never touches the
 * store's `ids`. `addToCompare` clears `dismissed`, so adding another
 * creative from anywhere in the module brings the tray back and replays the
 * slide-in.
 */
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronUp, ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useCompareTray,
  dismissTray,
  removeFromCompare,
  MAX_COMPARE,
} from "@/creative-report/lib/compareTrayStore";
import { CreativeThumb } from "@/creative-report/components/CreativeThumb";
import { useCreativeData } from "@/creative-report/hooks/useCreativeData";
import { useReportBasePath } from "@/creative-report/state/ReportBasePathContext";
import { P } from "@/creative-report/lib/paramSchema";
import type { CreativeRollup } from "@/creative-report/lib/selectors";

const STACK_PREVIEW = 3;

export function CompareTray() {
  const { ids, dismissed } = useCompareTray();

  if (ids.length === 0 || dismissed) return null;

  return <CompareTrayInner ids={ids} />;
}

/** Split out so `entered` (the slide-in flag) is fresh on every mount —
 *  i.e. every time the outer guard flips the tray from hidden to visible. */
function CompareTrayInner({ ids }: { ids: string[] }) {
  const navigate = useNavigate();
  const basePath = useReportBasePath();
  const { rollups } = useCreativeData();
  const [expanded, setExpanded] = useState(false);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const rollupById = useMemo(() => {
    const map = new Map<string, CreativeRollup>();
    for (const r of rollups) map.set(r.creative.id, r);
    return map;
  }, [rollups]);

  // Resolve ids → creatives honestly: a stale id (dataset regenerated, or
  // filtered out of the current window) is dropped from what's rendered
  // rather than shown as a broken tile. The store keeps the raw id either
  // way — this component never mutates the store from render.
  const resolved = ids
    .map((id) => rollupById.get(id))
    .filter((r): r is CreativeRollup => r !== undefined);

  const atCapacity = ids.length >= MAX_COMPARE;

  const goToCompare = () => {
    const params = new URLSearchParams();
    params.set(P.ids, ids.join(","));
    navigate(`${basePath}/compare?${params.toString()}`);
  };

  return (
    <div
      className={cn(
        "fixed bottom-6 right-6 z-30 flex flex-col items-end gap-2",
        "transition-all duration-200 ease-out",
        entered ? "translate-x-0 opacity-100" : "translate-x-6 opacity-0",
      )}
    >
      {expanded && (
        <div className="w-64 overflow-hidden rounded-xl border border-border bg-card shadow-lg">
          <ul className="max-h-72 overflow-y-auto py-1">
            {resolved.map((r) => (
              <li key={r.creative.id} className="flex items-center gap-2 px-3 py-2">
                <CreativeThumb creative={r.creative} size={32} />
                <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                  {r.creative.name}
                </span>
                <button
                  type="button"
                  onClick={() => removeFromCompare(r.creative.id)}
                  aria-label={`Remove ${r.creative.name} from compare`}
                  className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent/10 hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between gap-2 border-t border-border px-3 py-2">
            <span className="text-xs text-muted-foreground">
              {ids.length} of {MAX_COMPARE}
              {atCapacity ? " — remove one to add another" : " selected"}
            </span>
            <button
              type="button"
              onClick={goToCompare}
              className="shrink-0 text-xs font-medium text-foreground underline underline-offset-2 hover:text-foreground/80"
            >
              Open compare
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center gap-1 rounded-full border border-border bg-card py-1.5 pl-1.5 pr-1.5 shadow-lg">
        <button
          type="button"
          onClick={goToCompare}
          aria-label={`Compare ${ids.length} of ${MAX_COMPARE} creatives`}
          className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 transition-colors hover:bg-accent/10"
        >
          <div className="flex -space-x-3">
            {resolved.slice(0, STACK_PREVIEW).map((r) => (
              <div key={r.creative.id} className="rounded-md ring-2 ring-card">
                <CreativeThumb creative={r.creative} size={28} />
              </div>
            ))}
          </div>
          <span className="text-xs font-semibold tabular-nums text-foreground">
            {ids.length}/{MAX_COMPARE}
          </span>
        </button>

        <div className="h-4 w-px bg-border" />

        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-label={expanded ? "Collapse compare tray" : "Expand compare tray"}
          aria-expanded={expanded}
          className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent/10 hover:text-foreground"
        >
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </button>

        <button
          type="button"
          onClick={dismissTray}
          aria-label="Dismiss compare tray"
          className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent/10 hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
