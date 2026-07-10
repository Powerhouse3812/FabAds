import scribble from "@/assets/auth/signup-save20-scribble.svg";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ANNUAL_SAVINGS_LABEL, type BillingCycle } from "@/components/auth/signup/plans";

/**
 * BillingToggle — Monthly/Annual segmented control (Figma "*Segmented*"
 * instance, node 10990:45315) with the handwritten-style "Save 20%"
 * scribble annotation (node 10608:47196, exported verbatim as an SVG since
 * it's a flattened illustration+text asset, not editable text — see
 * plans.ts for why "20%" was used instead of the canonical frame's stale
 * "30%" figure). Reuses the shadcn `Tabs` pill styling rather than a
 * bespoke segmented control, matching the Individual/Agency toggle on
 * Step 2 for one shared "segmented" visual language.
 */
export function BillingToggle({
  value,
  onChange,
}: {
  value: BillingCycle;
  onChange: (next: BillingCycle) => void;
}) {
  return (
    <div className="relative">
      <Tabs value={value} onValueChange={(v) => onChange(v as BillingCycle)}>
        <TabsList className="h-8">
          <TabsTrigger value="monthly" className="px-3 py-1 text-sm">
            Monthly
          </TabsTrigger>
          <TabsTrigger value="annual" className="px-3 py-1 text-sm">
            Annual
          </TabsTrigger>
        </TabsList>
      </Tabs>
      <img
        src={scribble}
        alt={ANNUAL_SAVINGS_LABEL}
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-6 h-12 w-20 select-none"
      />
    </div>
  );
}
