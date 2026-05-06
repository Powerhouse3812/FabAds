import { useEffect, useMemo, useRef, useState } from "react";
import { RefreshCw, Sparkles, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  fetchPinterestRefsAsync,
  type PinterestPin,
  type PinterestQuery,
} from "@/genie6/generate-v3/mocks/pinterest";

/**
 * PinterestPanel — A-11.23.
 *
 * Auto-fetches Pinterest reference pins keyed off the user's already-
 * provided form inputs (output / product+brand / angles / concepts). User
 * inputs change → grid refetches (debounced). Pins are inline-selectable
 * with a check overlay; selected pins flow up via `onToggleSelect`.
 *
 * Selection state lives in the parent so the references list survives
 * Pinterest tab unmount.
 */

export interface PinterestPanelProps {
  query: PinterestQuery;
  selectedIds: string[];
  onToggleSelect: (pin: PinterestPin) => void;
  /**
   * Optional client-side search filter applied to the fetched pins by
   * matching against `pin.title`. Real backend will eventually take this
   * as a server-side query parameter.
   */
  searchQuery?: string;
}

export function PinterestPanel({
  query,
  selectedIds,
  onToggleSelect,
  searchQuery,
}: PinterestPanelProps) {
  const [pins, setPins] = useState<PinterestPin[]>([]);
  const [loading, setLoading] = useState(false);
  const tokenRef = useRef(0);

  // Build a stable key for query — re-fetch when this changes
  const queryKey = useMemo(
    () =>
      [
        query.output,
        query.brandId ?? "",
        query.productId ?? "",
        ...query.angleIds.sort(),
        ...query.conceptIds.sort(),
      ].join("|"),
    [query],
  );

  // Apply client-side search filter on top of the fetched pins.
  const visiblePins = useMemo(() => {
    const q = (searchQuery ?? "").trim().toLowerCase();
    if (!q) return pins;
    return pins.filter((p) => p.title.toLowerCase().includes(q));
  }, [pins, searchQuery]);

  const refetch = useMemo(
    () => () => {
      const myToken = ++tokenRef.current;
      setLoading(true);
      fetchPinterestRefsAsync(query).then((next) => {
        // Drop stale responses
        if (myToken === tokenRef.current) {
          setPins(next);
          setLoading(false);
        }
      });
    },
    [query],
  );

  // Auto-fetch on query change (debounced)
  useEffect(() => {
    if (!query.productId && !query.brandId) {
      setPins([]);
      setLoading(false);
      return;
    }
    const t = window.setTimeout(refetch, 250);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryKey]);

  const hasSignal = !!query.productId || !!query.brandId;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
          {hasSignal
            ? `Auto-fetched · biased on ${describeBias(query)}`
            : "Pick a product to fetch related pins"}
        </p>
        <button
          type="button"
          onClick={refetch}
          disabled={!hasSignal || loading}
          aria-label="Refresh Pinterest results"
          className={cn(
            "inline-flex items-center gap-1 rounded-full border border-border bg-card px-2 py-0.5 text-[10px] text-muted-foreground transition-colors",
            "hover:border-primary/40 hover:text-foreground",
            "disabled:opacity-40 disabled:cursor-not-allowed",
          )}
        >
          <RefreshCw className={cn("h-3 w-3", loading && "animate-spin")} />
          Refresh
        </button>
      </div>

      {/* Grid */}
      {!hasSignal ? (
        <EmptyState />
      ) : loading && pins.length === 0 ? (
        <SkeletonGrid />
      ) : visiblePins.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card/40 px-3 py-4 text-center">
          <p className="text-[11px] text-muted-foreground">
            No pins match{" "}
            <span className="font-mono">"{searchQuery}"</span>. Try a different
            search or refresh.
          </p>
        </div>
      ) : (
        <div
          className="grid gap-1.5"
          style={{
            gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))",
          }}
        >
          {visiblePins.map((pin) => (
            <PinTile
              key={pin.id}
              pin={pin}
              selected={selectedIds.includes(pin.id)}
              onToggle={() => onToggleSelect(pin)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────── */

function describeBias(q: PinterestQuery): string {
  const parts: string[] = [q.output];
  if (q.brandId) parts.push("brand");
  if (q.angleIds.length) parts.push(`${q.angleIds.length} angle${q.angleIds.length === 1 ? "" : "s"}`);
  if (q.conceptIds.length) parts.push(`${q.conceptIds.length} concept${q.conceptIds.length === 1 ? "" : "s"}`);
  return parts.join(" · ");
}

function aspectClass(aspect: PinterestPin["aspect"]): string {
  switch (aspect) {
    case "portrait":
      return "aspect-[3/4]";
    case "landscape":
      return "aspect-[4/3]";
    default:
      return "aspect-square";
  }
}

function PinTile({
  pin,
  selected,
  onToggle,
}: {
  pin: PinterestPin;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={selected}
      aria-label={`${selected ? "Deselect" : "Select"} pin: ${pin.title}`}
      title={pin.title}
      className={cn(
        "group flex flex-col overflow-hidden rounded-lg border bg-card text-left transition-all",
        "hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-12px_rgba(0,0,0,0.18)]",
        "outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
        selected
          ? "border-primary ring-2 ring-primary/40"
          : "border-border/60 hover:border-primary/40",
      )}
    >
      {/* Image */}
      <div className={cn("relative w-full overflow-hidden", aspectClass(pin.aspect))}>
        <img
          src={pin.thumbnail}
          alt=""
          loading="lazy"
          className={cn(
            "absolute inset-0 h-full w-full object-cover transition-all",
            selected ? "scale-[1.02]" : "group-hover:scale-[1.03]",
          )}
        />
        {selected && (
          <span className="absolute top-1 right-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow animate-v3-pop-in">
            <Check className="h-3 w-3" />
          </span>
        )}
      </div>
      {/* Caption block — below image, Pinterest-style */}
      <div className="px-1.5 py-1">
        <p className="line-clamp-2 text-[10px] text-foreground leading-snug">
          {pin.title}
        </p>
      </div>
    </button>
  );
}

function SkeletonGrid() {
  return (
    <div
      className="grid gap-1.5"
      style={{
        gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))",
      }}
    >
      {[
        "aspect-square",
        "aspect-[3/4]",
        "aspect-[4/3]",
        "aspect-square",
        "aspect-[3/4]",
        "aspect-square",
        "aspect-[4/3]",
        "aspect-[3/4]",
      ].map((cls, i) => (
        <div
          key={i}
          className={cn(
            "rounded-lg bg-muted/60 animate-pulse",
            cls,
          )}
        />
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-lg border border-dashed border-border bg-card/40 px-4 py-6 text-center">
      <Sparkles className="mx-auto h-4 w-4 text-muted-foreground/60" />
      <p className="mt-1.5 text-xs text-muted-foreground">
        Pick a product (or brand) above. We'll auto-fetch reference pins biased
        on your output type, brand, angles, and concepts.
      </p>
    </div>
  );
}
