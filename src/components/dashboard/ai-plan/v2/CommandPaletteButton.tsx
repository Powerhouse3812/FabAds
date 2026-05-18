import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Boxes,
  ChevronRight,
  Eye,
  Layers,
  Library,
  Plus,
  RefreshCw,
  Search,
  ShoppingBag,
  Sparkles,
  Telescope,
  Video,
  Zap,
  type LucideIcon,
} from "lucide-react";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/* ── Icon registry ───────────────────────────────────────────────── */
const ICON_MAP: Record<string, LucideIcon> = {
  Sparkles,
  ShoppingBag,
  Video,
  RefreshCw,
  Library,
  Telescope,
  Boxes,
  Layers,
  Eye,
  Plus,
  Zap,
};

interface ActionItem {
  label: string;
  icon: keyof typeof ICON_MAP;
  href: string;
}

interface ActionGroup {
  label: string;
  items: ActionItem[];
}

const ACTION_GROUPS: ActionGroup[] = [
  {
    label: "GENERATE",
    items: [
      { label: "Start a Brand Ad", icon: "Sparkles", href: "/iq/genie6/studio-alpha?mode=brand-ad" },
      { label: "Start a Product Ad", icon: "ShoppingBag", href: "/iq/genie6/studio-alpha?mode=product-ad" },
      { label: "Start a UGC Video", icon: "Video", href: "/iq/genie6/studio-alpha?mode=ugc-video" },
      { label: "Forge from saved ads", icon: "RefreshCw", href: "/iq/genie6/studio-alpha?mode=variation&skipGate=1" },
    ],
  },
  {
    label: "JUMP TO",
    items: [
      { label: "Library", icon: "Library", href: "/iq/genie6/library" },
      { label: "Industry Insights", icon: "Telescope", href: "/insights-v2/feed" },
      { label: "Catalogue", icon: "Boxes", href: "/catalogue/brands" },
      { label: "Video Sage", icon: "Video", href: "/iq/video-sage" },
      { label: "Creative Library", icon: "Layers", href: "/iq/creative-library" },
    ],
  },
  {
    label: "RESEARCH",
    items: [
      { label: "Analyze a video", icon: "Eye", href: "/iq/video-sage" },
      { label: "Add competitor", icon: "Plus", href: "/insights/competitors" },
    ],
  },
  {
    label: "PLANS",
    items: [
      { label: "Upgrade to Full plan", icon: "Zap", href: "/plans-v2?tier=growth" },
    ],
  },
];

interface CommandPaletteButtonProps {
  className?: string;
}

/**
 * CommandPaletteButton — V2 AI-plan Dashboard ⌘K affordance.
 *
 * Renders as a faux search input in the dashboard header. Click or Cmd+K
 * opens a shadcn Dialog with a filterable, grouped action list. Esc or
 * backdrop dismiss. Action click → navigate + sonner toast + close.
 *
 * Operator-class density inspired by Linear, Raycast, Vercel, Notion, Arc.
 */
export function CommandPaletteButton({ className }: CommandPaletteButtonProps) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  /* ── Global Cmd+K / Ctrl+K listener ─────────────────────────────── */
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, []);

  /* ── Autofocus input on open, reset query on close ──────────────── */
  useEffect(() => {
    if (open) {
      // Short delay to win the race with Dialog mount focus management.
      const t = window.setTimeout(() => inputRef.current?.focus(), 30);
      return () => window.clearTimeout(t);
    }
    setQuery("");
  }, [open]);

  /* ── Filter groups by case-insensitive label match ──────────────── */
  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ACTION_GROUPS;
    return ACTION_GROUPS.map((group) => ({
      ...group,
      items: group.items.filter((item) => item.label.toLowerCase().includes(q)),
    })).filter((group) => group.items.length > 0);
  }, [query]);

  const handleAction = (item: ActionItem) => {
    setOpen(false);
    toast.success(`Opening ${item.label}…`);
    navigate(item.href);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "inline-flex items-center gap-3 rounded-xl border border-border bg-card",
          "hover:bg-card hover:border-foreground/20 transition-colors",
          "w-full sm:w-[320px] px-3.5 py-2.5",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          className,
        )}
        aria-label="Open command palette"
      >
        <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" aria-hidden="true" />
        <span className="flex-1 text-left text-[12.5px] text-muted-foreground truncate">
          Search actions or jump to…
        </span>
        <span
          className={cn(
            "font-mono uppercase text-[9.5px] tracking-wide",
            "px-1.5 py-0.5 rounded border border-border bg-muted/40 text-muted-foreground shrink-0",
          )}
          aria-hidden="true"
        >
          ⌘K
        </span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="sm:max-w-[520px] p-0 gap-0 overflow-hidden rounded-2xl"
          onOpenAutoFocus={(e) => {
            // We manage focus ourselves so the search input gets it,
            // not the default close button.
            e.preventDefault();
            inputRef.current?.focus();
          }}
        >
          {/* ── Search input row ───────────────────────────────────── */}
          <div className="flex items-center gap-3 border-b border-border px-4">
            <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" aria-hidden="true" />
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search actions or jump to…"
              className={cn(
                "h-12 border-0 bg-transparent px-0 text-[14px] shadow-none",
                "focus-visible:ring-0 focus-visible:ring-offset-0",
                "placeholder:text-muted-foreground",
              )}
            />
            <span
              className={cn(
                "font-mono uppercase text-[9.5px] tracking-wide shrink-0",
                "px-1.5 py-0.5 rounded border border-border bg-muted/40 text-muted-foreground",
              )}
              aria-hidden="true"
            >
              ESC
            </span>
          </div>

          {/* ── Grouped action list ────────────────────────────────── */}
          <div className="max-h-[420px] overflow-y-auto py-2">
            {filteredGroups.length === 0 ? (
              <div className="px-4 py-8 text-center text-[12.5px] text-muted-foreground">
                No actions match “{query}”.
              </div>
            ) : (
              filteredGroups.map((group) => (
                <div key={group.label} className="py-1">
                  <div
                    className={cn(
                      "px-4 pt-2 pb-1.5",
                      "font-mono uppercase text-[9.5px] tracking-wider text-muted-foreground/70",
                    )}
                  >
                    {group.label}
                  </div>
                  <ul className="flex flex-col">
                    {group.items.map((item) => {
                      const Icon = ICON_MAP[item.icon] ?? Search;
                      return (
                        <li key={`${group.label}-${item.label}`}>
                          <button
                            type="button"
                            onClick={() => handleAction(item)}
                            className={cn(
                              "group w-full flex items-center gap-3 px-4 py-2.5",
                              "hover:bg-muted/40 transition-colors cursor-pointer",
                              "focus-visible:outline-none focus-visible:bg-muted/40",
                              "text-left",
                            )}
                          >
                            <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" aria-hidden="true" />
                            <span className="flex-1 text-[13px] text-foreground truncate">
                              {item.label}
                            </span>
                            <ChevronRight
                              className={cn(
                                "h-3 w-3 text-muted-foreground shrink-0",
                                "opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100",
                                "transition-opacity",
                              )}
                              aria-hidden="true"
                            />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default CommandPaletteButton;
