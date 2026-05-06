import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UseWizardReturn } from "../state/useWizard";

interface Step5Props {
  wizard: UseWizardReturn;
}

const MOCK_RESULTS = [
  { id: "r-1", emoji: "🌅" },
  { id: "r-2", emoji: "🎯" },
  { id: "r-3", emoji: "🔥" },
  { id: "r-4", emoji: "📱" },
];

export function Step5Results({ wizard }: Step5Props) {
  const count = wizard.state.count;
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDone(false);
    const t = setTimeout(() => setDone(true), 2500);
    return () => clearTimeout(t);
  }, [wizard.state.step]);

  const items = MOCK_RESULTS.slice(0, count);

  const restart = () => {
    wizard.reset();
  };
  const generateAgain = () => {
    setDone(false);
    setTimeout(() => setDone(true), 2500);
  };

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-10">
      <header className="text-center">
        <h1 className="text-3xl font-bold">
          {done ? "Done!" : "Generating with Genie…"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {done
            ? `Here are your ${count} variants.`
            : `Crafting ${count} variants based on your inputs…`}
        </p>
      </header>

      {!done && (
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
            <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
            Working…
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {items.map((r) => (
          <div
            key={r.id}
            className={cn(
              "relative flex aspect-square items-center justify-center overflow-hidden rounded-2xl border border-border shadow-sm",
              done ? "bg-card" : "bg-muted",
            )}
          >
            {done ? (
              <span className="text-7xl">{r.emoji}</span>
            ) : (
              <>
                <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-muted to-muted-foreground/10" />
                <div className="relative inline-flex items-center gap-1.5 rounded-full bg-background/80 px-3 py-1 text-xs font-medium text-foreground backdrop-blur">
                  <Sparkles className="h-3.5 w-3.5" />
                  Generating…
                </div>
              </>
            )}
          </div>
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
