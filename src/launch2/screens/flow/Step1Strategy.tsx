/**
 * Step 1 — Mode / Strategy / Objective.
 *
 * Mode tri-toggle (quick / preset / custom). The 7 strategy playbooks as
 * selectable cards: Bruno is verified, the other 6 carry an [I] Est. tag with
 * an inferredNote tooltip and a per-day structure line. chooseStrategy auto-
 * fills structure + budget + (default) objective, which we reflect live.
 * Objective selector gates conversion fields downstream.
 */
import { Card, CardContent } from "@/components/ui/card";
import type { LaunchMode, Objective } from "../../types";
import { STRATEGIES, adsPerDestination } from "../../data/strategies";
import { findAccount } from "../../data/mockData";
import { formatMoney } from "../../utils/time";
import { validateStep } from "../../state/flowDerive";
import type { UseLaunch2FlowReturn } from "../../state/useLaunch2Flow";
import { ChoicePill, InlineErrors, ProvenanceTag, SectionLabel, SelectTile } from "./parts";
import { ComplianceCategories } from "./ComplianceCategories";

const MODES: { id: LaunchMode; title: string; blurb: string }[] = [
  { id: "quick", title: "Quick", blurb: "Clone a winner or draft, inherit everything, jump to Review." },
  { id: "preset", title: "Preset", blurb: "Pick a strategy — structure & budget auto-fill." },
  { id: "custom", title: "Custom", blurb: "Strategy optional. Full control over every field." },
];

const OBJECTIVES: { id: Objective; label: string }[] = [
  { id: "sales", label: "Sales" },
  { id: "leads", label: "Leads" },
  { id: "traffic", label: "Traffic" },
  { id: "engagement", label: "Engagement" },
];

export function Step1Strategy({ flow }: { flow: UseLaunch2FlowReturn }) {
  const { plan } = flow;
  const errors = validateStep(plan, 1).errors;

  // Budget preview uses the first target's currency if chosen, else USD.
  const currency = findAccount(plan.targets[0]?.accountId ?? "")?.currency ?? "USD";

  return (
    <div className="space-y-4">
      {/* Mode */}
      <Card className="rounded-2xl">
        <CardContent className="p-4">
          <SectionLabel>Mode</SectionLabel>
          <div className="grid gap-3 sm:grid-cols-3">
            {MODES.map((m) => (
              <SelectTile
                key={m.id}
                selected={plan.mode === m.id}
                onClick={() => flow.setMode(m.id)}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-foreground">{m.title}</span>
                  {plan.mode === m.id && (
                    <span
                      className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none"
                      style={{ color: "#5B7611", backgroundColor: "rgba(143,184,33,0.16)" }}
                    >
                      Selected
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{m.blurb}</p>
              </SelectTile>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Strategy playbooks */}
      <Card className="rounded-2xl">
        <CardContent className="p-4">
          <SectionLabel
            trailing={
              <span className="text-[11px] font-normal normal-case tracking-normal text-muted-foreground">
                Bruno verified · others are placeholder numbers to confirm
              </span>
            }
          >
            Strategy — 7 playbooks
          </SectionLabel>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {STRATEGIES.map((s) => {
              const selected = plan.strategyId === s.id;
              const perDest = adsPerDestination(s);
              return (
                <SelectTile key={s.id} selected={selected} onClick={() => flow.chooseStrategy(s.id)}>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-semibold text-foreground">{s.name}</span>
                    <ProvenanceTag verified={s.verified} note={s.inferredNote} />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{s.tagline}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[11px] tabular-nums text-muted-foreground">
                    <span className="text-foreground/80">
                      {s.structure.campaigns} × {s.structure.adSetsPerCampaign} × {s.structure.adsPerAdSet}
                    </span>
                    <span className="text-foreground/30">·</span>
                    <span>{formatMoney(s.budgetPerAdSet, currency)}/day</span>
                    <span className="text-foreground/30">·</span>
                    <span>{perDest} ads</span>
                  </div>
                </SelectTile>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Objective */}
      <Card className="rounded-2xl">
        <CardContent className="p-4">
          <SectionLabel>Objective</SectionLabel>
          <div className="flex flex-wrap items-center gap-2">
            {OBJECTIVES.map((o) => (
              <ChoicePill
                key={o.id}
                selected={plan.objective === o.id}
                onClick={() => flow.setObjective(o.id)}
              >
                {o.label}
              </ChoicePill>
            ))}
            <span className="ml-1 text-xs text-muted-foreground">
              Gates conversion & catalogue fields downstream.
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Compliance — Special ad category */}
      <Card className="rounded-2xl">
        <CardContent className="p-4">
          <ComplianceCategories flow={flow} />
        </CardContent>
      </Card>

      <InlineErrors errors={errors} />
    </div>
  );
}
