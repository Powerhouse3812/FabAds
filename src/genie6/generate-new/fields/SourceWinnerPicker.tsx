import { useState } from "react";
import {
  Library,
  Upload,
  Link as LinkIcon,
  Hash,
  TrendingUp,
  Eye,
  X,
  Image as ImageIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { SourceInputKind } from "../types";

/**
 * SourceWinnerPicker — Variations top-sticky source picker (A-11.7).
 *
 * Per Form Specs §4 — multi-input methods:
 *   - Library pick (saved winners)
 *   - Upload (image/video file)
 *   - Link fetch (paste URL)
 *   - Meta Ad Library ID
 *   - FabAds Reports push (live ad with perf metrics)
 *   - Industry Insights push (competitor winner)
 *
 * Renders a kind-picker popover; each kind opens its own sub-input.
 * Selected source renders as a card with thumb + source-meta + remove.
 */

export interface SourceWinner {
  kind: SourceInputKind;
  /** Display label (file name, URL, ad title) */
  label: string;
  /** Optional thumbnail */
  thumbnail?: string;
  /** Source media type — drives the auto-derived Output for Variations */
  mediaType: "image" | "video";
  /** Optional perf metrics from Reports push */
  metrics?: { ctr?: number; roas?: number };
}

const KIND_OPTIONS: { id: SourceInputKind; label: string; icon: typeof Library; sub: string }[] = [
  { id: "library", label: "Library pick", icon: Library, sub: "Saved winners" },
  { id: "upload", label: "Upload", icon: Upload, sub: "Image / video file" },
  { id: "link-fetch", label: "Link fetch", icon: LinkIcon, sub: "Paste URL" },
  { id: "meta-ad-id", label: "Meta Ad Library ID", icon: Hash, sub: "Ad ID lookup" },
  { id: "fabads-reports", label: "FabAds Reports push", icon: TrendingUp, sub: "Live ad + perf data" },
  { id: "industry-insights", label: "Industry Insights push", icon: Eye, sub: "Competitor winner" },
];

export interface SourceWinnerPickerProps {
  value: SourceWinner | null;
  onChange: (next: SourceWinner | null) => void;
}

export function SourceWinnerPicker({ value, onChange }: SourceWinnerPickerProps) {
  const [open, setOpen] = useState(false);
  const [activeKind, setActiveKind] = useState<SourceInputKind | null>(null);
  const [urlInput, setUrlInput] = useState("");
  const [adIdInput, setAdIdInput] = useState("");

  const reset = () => {
    setActiveKind(null);
    setUrlInput("");
    setAdIdInput("");
    setOpen(false);
  };

  const submitUrl = () => {
    if (!urlInput.trim()) return;
    onChange({
      kind: "link-fetch",
      label: urlInput.trim(),
      mediaType: "image", // assume image until backend identifies
    });
    reset();
  };

  const submitAdId = () => {
    if (!adIdInput.trim()) return;
    onChange({
      kind: "meta-ad-id",
      label: `Meta Ad #${adIdInput.trim()}`,
      mediaType: "image",
    });
    reset();
  };

  const handleStubKind = (kind: SourceInputKind, mockLabel: string) => {
    onChange({
      kind,
      label: mockLabel,
      mediaType: kind === "fabads-reports" ? "video" : "image",
      metrics: kind === "fabads-reports" ? { ctr: 4.2, roas: 3.8 } : undefined,
    });
    reset();
  };

  if (value) {
    return (
      <SelectedSourceCard source={value} onClear={() => onChange(null)} />
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Pick a source winner"
          className={cn(
            "inline-flex h-9 items-center gap-2 rounded-md border border-dashed border-destructive/40 bg-card px-3 text-xs text-muted-foreground transition-colors",
            "hover:border-primary/40 hover:text-foreground",
            "outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
          )}
        >
          <ImageIcon className="h-3.5 w-3.5" />
          <span className="font-medium">Pick a source winner</span>
          <span className="text-destructive ml-1">·</span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 p-0">
        {!activeKind ? (
          <div className="py-1">
            <p className="px-3 pt-2 pb-1 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              Source winner — pick input method
            </p>
            {KIND_OPTIONS.map((k) => {
              const Icon = k.icon;
              return (
                <button
                  key={k.id}
                  type="button"
                  onClick={() => {
                    if (k.id === "link-fetch" || k.id === "meta-ad-id") {
                      setActiveKind(k.id);
                    } else if (k.id === "library") {
                      handleStubKind("library", "Library winner · Mamaearth Onion Shampoo (mock)");
                    } else if (k.id === "upload") {
                      alert("Upload-from-device wiring lands with assets-storage backend (TODO).");
                    } else if (k.id === "fabads-reports") {
                      handleStubKind("fabads-reports", "Reports push · Sleepyhead Ortho — 4.2% CTR (mock)");
                    } else if (k.id === "industry-insights") {
                      handleStubKind("industry-insights", "Insights · Boat Stone 1200 (mock competitor)");
                    }
                  }}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs transition-colors hover:bg-muted/40"
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground">{k.label}</p>
                    <p className="text-[10px] text-muted-foreground">{k.sub}</p>
                  </div>
                </button>
              );
            })}
          </div>
        ) : activeKind === "link-fetch" ? (
          <div className="p-3 space-y-2">
            <div className="flex items-center gap-1.5">
              <button onClick={() => setActiveKind(null)} className="text-[10px] text-muted-foreground hover:text-foreground">
                ← Back
              </button>
            </div>
            <p className="text-[11px] font-medium text-foreground">Paste a winner URL</p>
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://…"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && submitUrl()}
              className="block h-9 w-full rounded-md border border-border bg-card px-2 text-xs text-foreground focus:border-primary/40 focus:outline-none"
            />
            <button
              onClick={submitUrl}
              disabled={!urlInput.trim()}
              className="w-full rounded-md bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground disabled:opacity-40"
            >
              Use this winner
            </button>
          </div>
        ) : (
          // meta-ad-id
          <div className="p-3 space-y-2">
            <button onClick={() => setActiveKind(null)} className="text-[10px] text-muted-foreground hover:text-foreground">
              ← Back
            </button>
            <p className="text-[11px] font-medium text-foreground">Meta Ad Library ID</p>
            <input
              type="text"
              value={adIdInput}
              onChange={(e) => setAdIdInput(e.target.value)}
              placeholder="e.g. 1234567890"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && submitAdId()}
              className="block h-9 w-full rounded-md border border-border bg-card px-2 text-xs text-foreground focus:border-primary/40 focus:outline-none"
            />
            <button
              onClick={submitAdId}
              disabled={!adIdInput.trim()}
              className="w-full rounded-md bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground disabled:opacity-40"
            >
              Use this ad ID
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

/* ─────────────────────────────────────────────────────── */

function SelectedSourceCard({ source, onClear }: { source: SourceWinner; onClear: () => void }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-md border border-primary/30 bg-primary/5 p-2 max-w-[420px]">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
        <ImageIcon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="rounded bg-muted px-1 py-0.5 text-[8px] font-mono uppercase tracking-wider text-muted-foreground">
            {source.kind}
          </span>
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
            · {source.mediaType}
          </span>
        </div>
        <p className="truncate text-xs font-medium text-foreground">{source.label}</p>
        {source.metrics && (
          <p className="text-[10px] text-muted-foreground font-mono">
            CTR {source.metrics.ctr}% · ROAS {source.metrics.roas}×
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={onClear}
        aria-label="Clear source winner"
        className="shrink-0 text-muted-foreground hover:text-destructive transition-colors"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}
