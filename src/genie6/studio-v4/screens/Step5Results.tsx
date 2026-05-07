import { useEffect, useMemo, useState } from "react";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { getConceptById } from "../data/concepts";
import { HeroHeader } from "../components/HeroHeader";
import type { UseWizardReturn } from "../state/useWizard";

interface Step5Props {
  wizard: UseWizardReturn;
}

interface Variant {
  id: string;
  emoji: string;
}

interface Row {
  conceptId: string;
  emoji: string;
  name: string;
  variants: Variant[];
}

const VARIANT_EMOJI_POOL = [
  "🌅",
  "🎯",
  "🔥",
  "📱",
  "✨",
  "🎨",
  "💎",
  "🚀",
  "🎬",
  "🎁",
  "📦",
  "🛍️",
];

function buildRows(selectedConceptIds: string[], count: number): Row[] {
  if (selectedConceptIds.length === 0) {
    return [
      {
        conceptId: "ai-pick",
        emoji: "✨",
        name: "AI Pick",
        variants: Array.from({ length: count }, (_, i) => ({
          id: `ai-pick-v${i}`,
          emoji: VARIANT_EMOJI_POOL[i % VARIANT_EMOJI_POOL.length],
        })),
      },
    ];
  }

  return selectedConceptIds.map((id, rowIdx) => {
    const concept = getConceptById(id);
    return {
      conceptId: id,
      emoji: concept?.emoji ?? "✨",
      name: concept?.name ?? "Concept",
      variants: Array.from({ length: count }, (_, i) => ({
        id: `${id}-v${i}`,
        emoji: VARIANT_EMOJI_POOL[(rowIdx * 3 + i) % VARIANT_EMOJI_POOL.length],
      })),
    };
  });
}

export function Step5Results({ wizard }: Step5Props) {
  const count = wizard.state.count;
  const selectedConceptIds = wizard.state.selectedConceptIds;
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDone(false);
    const t = setTimeout(() => setDone(true), 2500);
    return () => clearTimeout(t);
  }, [wizard.state.step]);

  const rows = useMemo(
    () => buildRows(selectedConceptIds, count),
    [selectedConceptIds, count],
  );

  const totalOutputs = rows.length * count;

  const restart = () => {
    wizard.reset();
  };
  const generateAgain = () => {
    setDone(false);
    setTimeout(() => setDone(true), 2500);
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 pt-4 pb-6">
      <HeroHeader
        eyebrow="Output"
        title={done ? "Done!" : "Generating with Genie…"}
        subtitle={
          done
            ? `Here are your ${totalOutputs} ${totalOutputs === 1 ? "variant" : "variants"}${rows.length > 1 ? ` across ${rows.length} concepts` : ""}.`
            : `Crafting ${totalOutputs} ${totalOutputs === 1 ? "variant" : "variants"} based on your inputs…`
        }
      />

      {!done && (
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
            <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
            Working… {rows.length} concept{rows.length === 1 ? "" : "s"} ×{" "}
            {count} variation{count === 1 ? "" : "s"}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-6">
        {rows.map((row) => (
          <ConceptRow key={row.conceptId} row={row} done={done} />
        ))}
      </div>

      <div className="flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={generateAgain}
          disabled={!done}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-5 py-2 text-sm font-medium transition-colors",
            done ? "hover:border-primary/40" : "cursor-not-allowed opacity-50",
          )}
        >
          <Sparkles className="h-4 w-4" />
          Generate again
        </button>
        <button
          type="button"
          disabled={!done}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2 text-sm font-bold text-primary-foreground transition-transform",
            done ? "hover:scale-[1.02]" : "cursor-not-allowed opacity-50",
          )}
        >
          Save
        </button>
        <button
          type="button"
          onClick={restart}
          className="inline-flex items-center gap-1.5 rounded-full px-5 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          Start over
        </button>
      </div>
    </div>
  );
}

function ConceptRow({ row, done }: { row: Row; done: boolean }) {
  return (
    <section className="border-t border-border pt-3 first:border-t-0 first:pt-0">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-xl leading-none">{row.emoji}</span>
        <h2 className="truncate text-sm font-bold text-foreground">
          {row.name}
        </h2>
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          {row.variants.length}{" "}
          {row.variants.length === 1 ? "variant" : "variants"}
        </span>
      </div>

      <div
        className={cn(
          "grid gap-3",
          row.variants.length <= 2 && "grid-cols-2",
          row.variants.length === 3 && "grid-cols-2 sm:grid-cols-3",
          row.variants.length >= 4 && "grid-cols-2 sm:grid-cols-3 md:grid-cols-4",
        )}
      >
        {row.variants.map((v) => (
          <div
            key={v.id}
            className={cn(
              "relative flex aspect-square items-center justify-center overflow-hidden rounded-xl border border-border shadow-sm",
              done ? "bg-card" : "bg-muted",
            )}
          >
            {done ? (
              <span className="text-5xl">{v.emoji}</span>
            ) : (
              <>
                <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-muted to-muted-foreground/10" />
                <div className="relative inline-flex items-center gap-1.5 rounded-full bg-background/80 px-2.5 py-1 text-[11px] font-medium text-foreground backdrop-blur">
                  <Sparkles className="h-3 w-3" />
                  Generating…
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
