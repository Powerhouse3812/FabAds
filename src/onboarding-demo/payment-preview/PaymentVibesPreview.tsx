import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VibeA_InTransit } from "./VibeA_InTransit";
import { VibeB_IntentProgress } from "./VibeB_IntentProgress";
import { VibeC_PlayfulSharp } from "./VibeC_PlayfulSharp";

/**
 * PaymentVibesPreview — side-by-side comparison of three visual vibes for
 * the payment-verification screen Maalik wants to build. Single-page
 * artifact (not a real route flow) — Maalik picks one, then we build the
 * production version (3 states: waiting / success / failed) on that vibe.
 *
 * Layout: 3-column horizontal scroll on wide viewports, single-column
 * stack on narrower screens. Each column shows ONE vibe at the "waiting"
 * state (the most visually distinctive). Headers + descriptions help
 * Maalik identify which is which.
 *
 * URL: /onboarding-demo/payment-preview (registered in onboarding-demo
 * routes — sits inside AppLayout so auth + chrome remain visible).
 */
export function PaymentVibesPreview() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(-1)}
              className="gap-1.5"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </Button>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                Vibe selection · waiting state
              </p>
              <h1 className="text-[18px] font-bold tracking-tight">
                Pick a visual direction for the payment verification screen
              </h1>
            </div>
          </div>
          <p className="hidden md:block text-[12px] text-muted-foreground max-w-[360px] text-right">
            Each variant shows the <strong className="text-foreground">waiting</strong>{" "}
            state. Once you pick, success + failed states get built in the
            same vibe.
          </p>
        </div>
      </header>

      {/* Vibes grid */}
      <main className="max-w-[1400px] mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <VibePanel
            label="Vibe A · In-transit metaphor"
            tagline="Razorpay-style — visual story of money moving between user, bank, us."
            best="Best when explaining what's actually happening builds trust."
          >
            <VibeA_InTransit />
          </VibePanel>

          <VibePanel
            label="Vibe B · Intent progress"
            tagline="Mercury / Brex — multi-step verification list with live status."
            best="Best when communicating non-trivial backend work earns patience."
          >
            <VibeB_IntentProgress />
          </VibePanel>

          <VibePanel
            label="Vibe C · Playful sharp"
            tagline="Linear / Lemon Squeezy — single bold animated illustration + lime."
            best="Best when brand identity matters more than process transparency."
          >
            <VibeC_PlayfulSharp />
          </VibePanel>
        </div>

        {/* Decision footer */}
        <div className="mt-10 rounded-2xl border border-border bg-card p-5">
          <h2 className="text-[14px] font-semibold mb-3">When you've picked</h2>
          <ul className="text-[12.5px] text-muted-foreground space-y-1.5 leading-relaxed">
            <li>
              <strong className="text-foreground">A — In-transit</strong>:
              chosen if you want users to <em>see</em> the money moving.
              Sets a transactional, banking-led tone.
            </li>
            <li>
              <strong className="text-foreground">B — Intent progress</strong>:
              chosen if you want the wait to feel productive — every step
              is visible work, not hidden processing.
            </li>
            <li>
              <strong className="text-foreground">C — Playful sharp</strong>:
              chosen if brand voice should lead — Fabfunnel feels distinct
              even at the payment moment.
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
}

interface VibePanelProps {
  label: string;
  tagline: string;
  best: string;
  children: React.ReactNode;
}

function VibePanel({ label, tagline, best, children }: VibePanelProps) {
  return (
    <section className="flex flex-col gap-3">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-primary mb-1">
          {label}
        </p>
        <p className="text-[12.5px] text-foreground leading-snug">{tagline}</p>
        <p className="text-[11px] text-muted-foreground leading-snug mt-1 italic">
          {best}
        </p>
      </div>
      {/* The vibe component renders itself. We wrap it in a frame so all
          three sit visually aligned regardless of inner card widths. */}
      <div className="flex items-start justify-center rounded-3xl border border-border/60 bg-muted/30 p-4 min-h-[600px]">
        {children}
      </div>
    </section>
  );
}
