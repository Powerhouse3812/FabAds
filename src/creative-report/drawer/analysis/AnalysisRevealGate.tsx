/**
 * AnalysisRevealGate — the credit-gated blur wrapper shared by the Framework
 * and Cognitive Insights sub-tabs (Figma node 6591:73938: real layout visible
 * but blurred behind a centred "Discover What Drives Performance" /
 * "Reveal Insights (4 credits)" card).
 *
 * Three states, all driven by analysisStore:
 *  - idle: children render blurred + inert underneath a reveal card.
 *  - analysing: same blur, card swaps to an indeterminate progress state.
 *  - analysed: blur lifts, children render normally, gate renders nothing.
 *
 * Credits are fully mock (analysisStore) — never useCredits() — by design.
 */
import { Brain, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  BALANCE_CEILING,
  REVEAL_COST,
  startAnalysis,
  type AnalysisStatus,
} from "@/creative-report/lib/analysisStore";

interface Props {
  creativeId: string;
  status: AnalysisStatus;
  balance: number;
  title: string;
  description: string;
  children: React.ReactNode;
}

export function AnalysisRevealGate({ creativeId, status, balance, title, description, children }: Props) {
  if (status === "analysed") {
    return <>{children}</>;
  }

  const canAfford = balance >= REVEAL_COST;

  return (
    <div className="relative">
      <div aria-hidden className="pointer-events-none select-none blur-sm">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center px-4">
        <div className="w-full max-w-[320px] rounded-xl border border-border bg-card p-5 text-center shadow-lg">
          {status === "analysing" ? (
            <>
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Loader2 className="h-5 w-5 animate-spin text-primary-text" />
              </div>
              <p className="text-sm font-semibold text-foreground">Analysing this creative (simulated)…</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Usually takes a few seconds. You can keep browsing the drawer. No real analysis is running.
              </p>
              <Progress value={65} className="mt-3 h-1.5 animate-pulse" />
            </>
          ) : (
            <>
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Brain className="h-5 w-5 text-primary-text" />
              </div>
              <p className="text-sm font-semibold text-foreground">{title}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</p>
              <Button
                size="sm"
                className={cn("mt-3 w-full gap-1.5")}
                disabled={!canAfford}
                onClick={() => startAnalysis(creativeId)}
              >
                <Sparkles className="h-3.5 w-3.5" />
                Reveal insights ({REVEAL_COST} credits, simulated)
              </Button>
              <p className="mt-2 text-[11px] text-muted-foreground">
                {canAfford
                  ? `${balance}/${BALANCE_CEILING} credits available (simulated — no real credits are charged)`
                  : `Not enough credits — ${balance}/${BALANCE_CEILING} available, ${REVEAL_COST} needed (simulated)`}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
