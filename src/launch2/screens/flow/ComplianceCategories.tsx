/**
 * ComplianceCategories — Meta Special Ad Category multi-toggle (Step 1).
 *
 * Declaring a special category (Credit, Employment, Housing, Social issues /
 * elections & politics) is a Meta compliance requirement that RESTRICTS
 * targeting — detailed targeting, custom audiences and geo radius are limited.
 * Default is none; selecting more than one is allowed. Re-derived from Meta's
 * model (not copied) so it stays a thin, honest placeholder.
 */
import { ShieldCheck } from "lucide-react";
import type { SpecialAdCategory } from "../../types";
import type { UseLaunch2FlowReturn } from "../../state/useLaunch2Flow";
import { ChoicePill, SectionLabel } from "./parts";

const CATEGORIES: { id: SpecialAdCategory; label: string }[] = [
  { id: "credit", label: "Credit" },
  { id: "employment", label: "Employment" },
  { id: "housing", label: "Housing" },
  { id: "social-issues", label: "Social issues, elections or politics" },
];

export function ComplianceCategories({ flow }: { flow: UseLaunch2FlowReturn }) {
  const { plan } = flow;
  const selected = plan.specialAdCategories;

  function toggle(id: SpecialAdCategory) {
    const next = selected.includes(id)
      ? selected.filter((c) => c !== id)
      : [...selected, id];
    flow.setSpecialAdCategories(next);
  }

  return (
    <div>
      <SectionLabel
        trailing={
          selected.length > 0 ? (
            <span
              className="rounded-full px-1.5 py-0.5 font-mono text-[10px] font-semibold leading-none"
              style={{ color: "#874d00", backgroundColor: "rgba(250,173,20,0.16)" }}
            >
              {selected.length} declared
            </span>
          ) : null
        }
      >
        Special ad category
      </SectionLabel>
      <div className="flex flex-wrap items-center gap-2">
        {CATEGORIES.map((c) => (
          <ChoicePill key={c.id} selected={selected.includes(c.id)} onClick={() => toggle(c.id)}>
            {selected.includes(c.id) ? <ShieldCheck className="h-4 w-4" /> : null}
            {c.label}
          </ChoicePill>
        ))}
      </div>
      <p className="mt-2 flex items-start gap-1.5 text-[11px] text-muted-foreground">
        <ShieldCheck className="mt-px h-3.5 w-3.5 shrink-0" />
        <span>
          Declaring a category is a Meta compliance requirement and{" "}
          <span className="font-medium text-foreground">restricts targeting</span> (detailed targeting,
          custom audiences &amp; geo radius are limited). Leave all off if none apply.
        </span>
      </p>
    </div>
  );
}
