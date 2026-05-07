import { useState } from "react";
import { Check, Loader2, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface RailGenerateConceptsProps {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  onClose: () => void;
}

interface MockGen {
  id: string;
  emoji: string;
  name: string;
  desc: string;
}

// Mock generated concepts — would come from backend in real impl
const MOCK_GENERATED: MockGen[] = [
  { id: "gen-1", emoji: "🌱", name: "Wellness Daily",   desc: "Calm morning ritual angle, soft lifestyle." },
  { id: "gen-2", emoji: "💪", name: "Power Pack",       desc: "Bold-claim energy framing." },
  { id: "gen-3", emoji: "🏆", name: "Bestseller",       desc: "Social-proof + sales-rank flex." },
  { id: "gen-4", emoji: "🎁", name: "Gift Edit",        desc: "Curated bundle, gift-occasion framing." },
  { id: "gen-5", emoji: "🧘", name: "Mindful Routine",  desc: "Slow-pace, ritual-driven storytelling." },
  { id: "gen-6", emoji: "✨", name: "Glow Up",          desc: "Before/after transformation tease." },
];

/**
 * RailGenerateConcepts — mock concept generation flow inside the right rail.
 * Stage 1: prompt input + Generate CTA
 * Stage 2: 2s shimmer
 * Stage 3: 6 mock concepts as multi-select; Save commits to selectedConceptIds
 *   with a synthetic `gen:` prefix to avoid colliding with saved concept IDs.
 */
export function RailGenerateConcepts({
  selectedIds,
  onChange,
  onClose,
}: RailGenerateConceptsProps) {
  const [stage, setStage] = useState<"prompt" | "generating" | "done">("prompt");
  const [brief, setBrief] = useState("");
  const [picks, setPicks] = useState<Set<string>>(new Set());

  const startGenerate = () => {
    setStage("generating");
    setTimeout(() => setStage("done"), 2000);
  };

  const togglePick = (id: string) =>
    setPicks((p) => {
      const next = new Set(p);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const save = () => {
    if (picks.size === 0) {
      onClose();
      return;
    }
    const newIds = Array.from(picks).map((id) => `gen:${id}`);
    onChange([...selectedIds, ...newIds]);
    onClose();
  };

  return (
    <div className="flex h-full flex-col">
      <header className="shrink-0 flex items-center justify-between border-b border-border px-4 py-3">
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Concepts
          </p>
          <h3 className="text-sm font-bold text-foreground">Generate new</h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </header>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
        {stage === "prompt" && (
          <>
            <p className="text-[11px] text-muted-foreground">
              Describe what you want and Genie will draft 6 concept directions for this product.
            </p>
            <textarea
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              rows={4}
              placeholder="e.g. Fresh, premium, gift-worthy. Emphasize natural ingredients."
              className="block w-full resize-none rounded-lg border border-border bg-background p-2.5 text-sm leading-relaxed outline-none focus:border-primary"
            />
            <button
              type="button"
              onClick={startGenerate}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground transition-transform hover:scale-[1.02]"
            >
              <Sparkles className="h-4 w-4" />
              Generate 6 concepts
            </button>
          </>
        )}

        {stage === "generating" && (
          <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-xs text-muted-foreground">
              Drafting 6 concepts based on your brief…
            </p>
          </div>
        )}

        {stage === "done" && (
          <>
            <p className="text-[11px] text-muted-foreground">
              Pick the ones to use. Saved concepts add to your selection on the left.
            </p>
            <ul className="grid grid-cols-2 gap-2">
              {MOCK_GENERATED.map((g) => {
                const active = picks.has(g.id);
                return (
                  <li key={g.id}>
                    <button
                      type="button"
                      onClick={() => togglePick(g.id)}
                      className={cn(
                        "relative flex h-full w-full flex-col items-start gap-1 rounded-lg border bg-background p-2 text-left transition-all",
                        active
                          ? "border-primary ring-2 ring-primary/30"
                          : "border-border hover:-translate-y-0.5 hover:border-primary/40",
                      )}
                    >
                      {active && (
                        <span className="absolute right-1.5 top-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                          <Check className="h-2.5 w-2.5" strokeWidth={3} />
                        </span>
                      )}
                      <span className="text-lg leading-none">{g.emoji}</span>
                      <p className="text-[12px] font-bold leading-tight text-foreground">
                        {g.name}
                      </p>
                      <p className="line-clamp-2 text-[10px] text-muted-foreground">
                        {g.desc}
                      </p>
                    </button>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>

      <footer className="shrink-0 flex items-center justify-end gap-2 border-t border-border px-4 py-3">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          {stage === "done" ? "Cancel" : "Close"}
        </button>
        {stage === "done" && (
          <button
            type="button"
            onClick={save}
            disabled={picks.size === 0}
            className={cn(
              "inline-flex items-center rounded-full bg-primary px-4 py-1.5 text-xs font-bold text-primary-foreground transition-opacity",
              "hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50",
            )}
          >
            Add{picks.size > 0 ? ` · ${picks.size}` : ""}
          </button>
        )}
      </footer>
    </div>
  );
}
