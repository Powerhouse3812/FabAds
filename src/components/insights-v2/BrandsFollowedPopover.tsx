import { useMemo, useState, type ReactNode } from "react";
import { Search, Check } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface BrandsFollowedPopoverProps {
  /** The chip / button that opens the popover. */
  trigger: ReactNode;
  /** Real followed brand names (lowercased or as-stored). */
  followedBrands: string[];
  /** All brands available to follow (e.g. BRANDS from dummy data). */
  allBrands: string[];
  /** Mutation callback — toggles a single brand on click. */
  onToggleBrand: (brand: string) => void;
}

/**
 * Popover anchored to the brands-followed chip. Lets the user
 * browse + search the full brand list and toggle follow state. Saves
 * automatically via the parent's mutation.
 */
export function BrandsFollowedPopover({
  trigger,
  followedBrands,
  allBrands,
  onToggleBrand,
}: BrandsFollowedPopoverProps) {
  const [search, setSearch] = useState("");

  const followedSet = useMemo(
    () => new Set(followedBrands.map((b) => b.toLowerCase())),
    [followedBrands],
  );

  const { following, rest } = useMemo(() => {
    const q = search.trim().toLowerCase();
    const match = (b: string) => !q || b.toLowerCase().includes(q);
    const sorted = [...allBrands].sort((a, b) => a.localeCompare(b));
    const following = sorted.filter(
      (b) => followedSet.has(b.toLowerCase()) && match(b),
    );
    const rest = sorted.filter(
      (b) => !followedSet.has(b.toLowerCase()) && match(b),
    );
    return { following, rest };
  }, [allBrands, followedSet, search]);

  const followedCount = followedSet.size;
  const totalCount = allBrands.length;

  return (
    <Popover>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent align="start" className="w-[320px] p-0">
        <div className="flex items-center justify-between px-3 py-2 border-b border-border/60">
          <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
            Brands followed
          </span>
          <span className="font-mono text-[10px] text-muted-foreground">
            {followedCount} of {totalCount}
          </span>
        </div>

        <div className="px-3 py-2 border-b border-border/60">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search brands…"
              className="h-8 pl-8 text-[12px]"
              aria-label="Search brands"
            />
          </div>
        </div>

        <div className="max-h-[320px] overflow-y-auto py-1">
          {following.length > 0 && (
            <>
              <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                Following ({following.length})
              </div>
              {following.map((b) => (
                <BrandRow
                  key={b}
                  brand={b}
                  followed
                  onClick={() => onToggleBrand(b)}
                />
              ))}
              {rest.length > 0 && (
                <div className="border-t border-border/40 my-1" />
              )}
            </>
          )}

          {rest.length > 0 && (
            <>
              <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                {following.length > 0 ? "All brands" : "All brands"}
              </div>
              {rest.map((b) => (
                <BrandRow
                  key={b}
                  brand={b}
                  followed={false}
                  onClick={() => onToggleBrand(b)}
                />
              ))}
            </>
          )}

          {following.length === 0 && rest.length === 0 && (
            <div className="px-3 py-6 text-center text-[12px] text-muted-foreground">
              No brands match "{search}"
            </div>
          )}
        </div>

        <div className="px-3 py-1.5 border-t border-border/60">
          <span className="font-mono text-[10px] text-muted-foreground">
            Saved automatically
          </span>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function BrandRow({
  brand,
  followed,
  onClick,
}: {
  brand: string;
  followed: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={followed}
      className={cn(
        "flex w-full items-center justify-between px-3 py-1.5 text-[12px] transition-colors text-left",
        "hover:bg-muted focus-visible:outline-none focus-visible:bg-muted",
        followed ? "text-foreground" : "text-muted-foreground",
      )}
    >
      <span className="truncate">{brand}</span>
      {followed && (
        <Check className="h-3.5 w-3.5 text-primary shrink-0" strokeWidth={3} aria-hidden />
      )}
    </button>
  );
}
