import { Lock, Rocket, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface UpsellPopoverProps {
  /** The locked module's label (e.g. "Reports"). Used in the headline. */
  moduleLabel: string;
}

/**
 * Marketing-pitch upsell shown when a user clicks a locked module on
 * the AI plan. Primary CTA: "Start free trial". Secondary: "Talk to
 * sales". Per Maalik's call.
 *
 * For demo purposes both CTAs are no-op + toast. Real wiring (Stripe
 * checkout, sales calendly link, etc.) is a follow-up.
 */
export function UpsellPopover({ moduleLabel }: UpsellPopoverProps) {
  return (
    <div className="w-[280px]">
      {/* Header — lime tint, lock icon */}
      <div className="flex items-start gap-2.5 px-3.5 pt-3.5 pb-3 border-b border-border/60">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-primary/15 text-foreground shrink-0">
          <Lock className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
            Full plan
          </p>
          <p className="text-[14px] font-semibold text-foreground leading-tight mt-0.5">
            Ready to scale?
          </p>
        </div>
      </div>

      {/* Pitch body */}
      <div className="px-3.5 pt-3 pb-2 space-y-2">
        <p className="text-[12px] text-foreground leading-relaxed">
          <span className="font-semibold">{moduleLabel}</span> is part of
          the Full plan. Turn your AI generations into live spend —
          Reports, Launch, and Automation power the entire ad ops loop.
        </p>
        <ul className="text-[11px] text-muted-foreground space-y-0.5 pl-3.5 list-disc">
          <li>Real-time campaign reporting</li>
          <li>One-click launch to Meta, TikTok, Google</li>
          <li>Automation rules for spend + creative refresh</li>
        </ul>
      </div>

      {/* Actions */}
      <div className="px-3.5 pt-2 pb-3.5 space-y-1.5">
        <Button
          size="sm"
          className="w-full h-8 gap-1.5 text-[12px] font-semibold"
          onClick={() => {
            toast.success("Free trial started — 7 days of Full plan");
          }}
        >
          <Rocket className="h-3.5 w-3.5" />
          Start free trial
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="w-full h-8 gap-1.5 text-[12px]"
          onClick={() => {
            toast.message("Sales contact link coming soon");
          }}
        >
          <MessageCircle className="h-3.5 w-3.5" />
          Talk to sales
        </Button>
      </div>

      {/* Footnote */}
      <div className="px-3.5 pb-3 text-center">
        <p className="text-[10px] text-muted-foreground/80">
          No card required · Cancel anytime
        </p>
      </div>
    </div>
  );
}
