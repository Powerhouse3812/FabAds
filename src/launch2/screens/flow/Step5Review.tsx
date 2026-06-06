/**
 * Step 5 — Review & launch.
 *
 * A campaign → ad set → ad tree summary derived from plan.structure + targets
 * (counts + a few representative leaves; never all 50). A pre-flight panel:
 *   - 250-cap = HARD BLOCK (capCheck) — blocks Launch + lists offenders
 *   - Policy = SOFT warnings (mock, non-blocking)
 *   - Missing fields = aggregated validateStep across steps 1-4
 * Budget confirm fires service.launch(plan). The reliability spine is surfaced
 * as a cue line (idempotent N=N · batched/throttled · failed≠launched · retry).
 */
import { useMemo } from "react";
import {
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Link2,
  ShieldAlert,
  ShieldCheck,
  Tag,
  XCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getStrategy } from "../../data/strategies";
import { findAccount } from "../../data/mockData";
import { formatMoney } from "../../utils/time";
import {
  budgetPerDay,
  capCheck,
  creativeMultiplier,
  estimateRequested,
  perTargetCounts,
  validateStep,
} from "../../state/flowDerive";
import { resolveNamingPattern, brandFromAccount } from "../../utils/naming";
import { buildTrackedUrl } from "../../utils/tracking";
import type { SpecialAdCategory } from "../../types";
import type { UseLaunch2FlowReturn, FlowStep } from "../../state/useLaunch2Flow";
import { SectionLabel } from "./parts";

/** Mock policy scan — 0–2 soft, non-blocking warnings keyed off the plan id. */
function mockPolicyWarnings(planId: string): string[] {
  const pool = [
    "Ad copy mentions a competitor — may trigger manual review.",
    "Landing page domain not yet verified for this Page.",
  ];
  let h = 0;
  for (let i = 0; i < planId.length; i++) h = (h * 31 + planId.charCodeAt(i)) >>> 0;
  const count = h % 3; // 0, 1, or 2
  return pool.slice(0, count);
}

/** Human labels for the allocation modes (mirrors Step 4's wording). */
const ALLOCATION_LABELS: Record<string, string> = {
  distribute: "Distribute creatives across slots",
  multiply: "Multiply structure per creative",
  manual: "Manual creative → slot map",
};

/** Compliance labels for Meta's special ad categories. */
const SPECIAL_AD_CATEGORY_LABELS: Record<SpecialAdCategory, string> = {
  credit: "Credit",
  employment: "Employment",
  housing: "Housing",
  "social-issues": "Social issues, elections or politics",
};

export function Step5Review({
  flow,
  onJump,
}: {
  flow: UseLaunch2FlowReturn;
  onJump: (s: FlowStep) => void;
}) {
  const { plan } = flow;
  const strategy = getStrategy(plan.strategyId);
  const account = findAccount(plan.targets[0]?.accountId ?? "");
  const currency = account?.currency ?? "USD";

  const cap = capCheck(plan);
  const requested = estimateRequested(plan);
  const counts = perTargetCounts(plan);

  // Missing-fields: aggregate earlier-step validation (step 5 itself = the cap).
  const missing = useMemo(() => {
    const out: { step: FlowStep; errors: string[] }[] = [];
    ([1, 2, 3, 4] as FlowStep[]).forEach((s) => {
      const v = validateStep(plan, s);
      if (!v.ok) out.push({ step: s, errors: v.errors });
    });
    return out;
  }, [plan]);

  const policyWarnings = mockPolicyWarnings(plan.id);
  const hasMissing = missing.length > 0;

  const { campaigns, adSetsPerCampaign, adsPerAdSet } = plan.structure;

  /* ---- naming preview + allocation + tracking (the launch-shape summary) ---- */
  const brand = brandFromAccount(plan.targets[0]?.accountName ?? "");
  const objectiveLabel = plan.objective
    ? plan.objective.charAt(0).toUpperCase() + plan.objective.slice(1)
    : "";
  const today = new Date().toISOString().slice(0, 10);
  const namePreview = resolveNamingPattern(plan.namingPattern, {
    brand,
    strategy: strategy?.name,
    objective: objectiveLabel,
    date: today,
    campaign: "C1",
    adset: "01",
    n: 1,
  });

  const multiplier = creativeMultiplier(plan);
  const allocationLabel = ALLOCATION_LABELS[plan.allocation];

  // 1–2 representative tracked destination URLs (first two ad-set positions).
  const trackedUrls =
    plan.destinationUrl.trim().length > 0
      ? [
          buildTrackedUrl(plan.destinationUrl, plan.utmTemplate, { campaign: "C1", adset: "01" }),
          adSetsPerCampaign > 1
            ? buildTrackedUrl(plan.destinationUrl, plan.utmTemplate, { campaign: "C1", adset: "02" })
            : null,
        ].filter((u): u is string => !!u)
      : [];

  return (
    <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
      {/* LEFT — tree summary */}
      <div className="space-y-4">
        <Card className="rounded-2xl">
          <CardContent className="p-4">
            <SectionLabel
              trailing={
                <span className="font-mono text-[11px] font-normal tabular-nums tracking-normal text-muted-foreground">
                  {requested} ads
                </span>
              }
            >
              Launch tree
            </SectionLabel>

            {!strategy || plan.targets.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Complete the earlier steps to preview the tree.
              </p>
            ) : (
              <div className="space-y-3">
                {plan.targets.map((t, i) => {
                  const send = counts[i] ?? 0;
                  const setsShown = Math.min(adSetsPerCampaign, 2);
                  return (
                    <div
                      key={`${t.accountId}-${t.pageId}`}
                      className="rounded-xl border border-border p-3"
                    >
                      {/* Campaign node */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 text-sm">
                          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="font-semibold text-foreground">
                            {strategy.name} · {t.pageName}
                          </span>
                        </div>
                        <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-[10px] tabular-nums text-muted-foreground">
                          {formatMoney(strategy.budgetPerAdSet, currency)}/set/day
                        </span>
                      </div>
                      <div className="mt-0.5 pl-5 text-[11px] text-muted-foreground">
                        {t.accountName} · {campaigns} campaign · {adSetsPerCampaign} ad sets · {send} ads
                      </div>

                      {/* A couple of representative ad-set leaves */}
                      <div className="mt-2 space-y-1 pl-5">
                        {Array.from({ length: setsShown }).map((_, si) => (
                          <div key={si} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <span className="text-foreground/40">•</span>
                            <span>
                              Ad set {si + 1} — {plan.audienceLabel ?? "Broad"} · {adsPerAdSet} ad
                              {adsPerAdSet === 1 ? "" : "s"}
                            </span>
                          </div>
                        ))}
                        {adSetsPerCampaign > setsShown && (
                          <div className="pl-4 text-[11px] text-muted-foreground/70">
                            +{adSetsPerCampaign - setsShown} more ad sets
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Launch shape — naming · allocation · compliance · tracking */}
        <Card className="rounded-2xl">
          <CardContent className="space-y-4 p-4">
            <SectionLabel>Naming &amp; delivery</SectionLabel>

            {/* Naming preview */}
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-foreground">Naming</span>
                <span className="font-mono text-[10px] text-muted-foreground/70">
                  {plan.namingPattern || "{brand}_{strategy}_{date}"}
                </span>
              </div>
              <div className="rounded-xl border border-border bg-muted/40 px-3 py-2 font-mono text-xs tabular-nums text-foreground">
                {namePreview}
              </div>
              <p className="text-[10px] leading-relaxed text-muted-foreground">
                Example entity name — tokens resolve per campaign / ad set / ad at launch.
              </p>
            </div>

            {/* Allocation + final estimate */}
            <div className="space-y-1.5">
              <span className="text-xs font-medium text-foreground">Allocation</span>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="rounded-md bg-muted px-2 py-0.5 text-foreground">
                  {allocationLabel}
                </span>
                <span className="font-mono tabular-nums">
                  {requested} ad{requested === 1 ? "" : "s"}
                  {plan.allocation === "multiply" && multiplier > 1 && (
                    <span className="text-muted-foreground"> · ×{multiplier} creatives</span>
                  )}
                </span>
              </div>
            </div>

            {/* Special Ad Categories — compliance chips */}
            <div className="space-y-1.5">
              <span className="text-xs font-medium text-foreground">Special Ad Categories</span>
              {plan.specialAdCategories.length === 0 ? (
                <p className="text-xs text-muted-foreground">None declared — standard targeting.</p>
              ) : (
                <div className="flex flex-wrap items-center gap-1.5">
                  {plan.specialAdCategories.map((c) => (
                    <span
                      key={c}
                      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium leading-none"
                      style={{ color: "#874d00", backgroundColor: "rgba(250,173,20,0.16)" }}
                    >
                      <Tag className="h-3 w-3" />
                      {SPECIAL_AD_CATEGORY_LABELS[c]}
                    </span>
                  ))}
                </div>
              )}
              {plan.specialAdCategories.length > 0 && (
                <p className="text-[10px] leading-relaxed text-muted-foreground">
                  Declared categories restrict targeting (age, gender, location) per Meta policy.
                </p>
              )}
            </div>

            {/* Tracked destination URLs */}
            <div className="space-y-1.5">
              <span className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                <Link2 className="h-3.5 w-3.5 text-muted-foreground" />
                Tracked destination URL
              </span>
              {trackedUrls.length === 0 ? (
                <p className="text-xs text-muted-foreground">No destination URL set.</p>
              ) : (
                <div className="space-y-1">
                  {trackedUrls.map((u) => (
                    <div
                      key={u}
                      className="break-all rounded-lg border border-border bg-muted/40 px-2.5 py-1.5 font-mono text-[11px] leading-relaxed text-muted-foreground"
                    >
                      {u}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* RIGHT — pre-flight + budget confirm */}
      <div className="space-y-4">
        <Card className="rounded-2xl">
          <CardContent className="p-4">
            <SectionLabel>Pre-flight</SectionLabel>
            <ul className="space-y-2">
              {/* 250-cap — HARD */}
              <PreflightRow
                label="250-ad cap"
                ok={cap.ok}
                okText="Pass"
                badText={`${cap.offenders.length} over cap`}
                hard
              />
              {/* Policy — SOFT */}
              <PreflightRow
                label="Policy scan"
                ok={policyWarnings.length === 0}
                okText="Clear"
                badText={`${policyWarnings.length} warning${policyWarnings.length === 1 ? "" : "s"}`}
                soft
              />
              {/* Missing fields */}
              <PreflightRow
                label="Required fields"
                ok={!hasMissing}
                okText="Complete"
                badText="Incomplete"
              />
            </ul>

            {/* Hard-block detail */}
            {!cap.ok && (
              <div
                className="mt-3 space-y-1 rounded-xl border px-3 py-2 text-xs"
                style={{ color: "#cf1322", backgroundColor: "rgba(255,77,79,0.06)", borderColor: "rgba(255,77,79,0.4)" }}
              >
                <div className="flex items-center gap-1.5 font-medium">
                  <ShieldAlert className="h-4 w-4" />
                  Cap breach — launch blocked
                </div>
                {cap.offenders.map((o) => (
                  <div key={o.fbPageId} className="pl-5 font-mono text-[11px] tabular-nums">
                    {o.pageName}: {o.current} + {o.demand} &gt; 250
                  </div>
                ))}
              </div>
            )}

            {/* Soft policy detail */}
            {policyWarnings.length > 0 && (
              <div
                className="mt-3 space-y-1 rounded-xl border px-3 py-2 text-xs"
                style={{ color: "#874d00", backgroundColor: "rgba(250,173,20,0.08)", borderColor: "rgba(250,173,20,0.4)" }}
              >
                <div className="flex items-center gap-1.5 font-medium">
                  <CircleAlert className="h-4 w-4" />
                  Policy warnings — proceed allowed
                </div>
                {policyWarnings.map((w) => (
                  <div key={w} className="pl-5 leading-relaxed">
                    {w}
                  </div>
                ))}
              </div>
            )}

            {/* Missing-field detail with jump-to-step */}
            {hasMissing && (
              <div className="mt-3 space-y-1.5 rounded-xl border border-border px-3 py-2 text-xs">
                {missing.map((m) => (
                  <button
                    key={m.step}
                    type="button"
                    onClick={() => onJump(m.step)}
                    className="flex w-full items-start gap-1.5 text-left text-muted-foreground hover:text-foreground"
                  >
                    <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span>
                      <span className="font-medium text-foreground">Step {m.step}:</span> {m.errors.join(" ")}
                    </span>
                  </button>
                ))}
              </div>
            )}

            <p className="mt-3 text-[10px] leading-relaxed text-muted-foreground">
              Cap breach is a hard block. Policy warnings are advisory — you can still launch.
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-primary/40">
          <CardContent className="p-4">
            <SectionLabel>Budget confirm</SectionLabel>
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-lg font-bold tabular-nums text-foreground">
                {formatMoney(budgetPerDay(plan), currency)}/day
              </span>
              <span className="text-sm text-muted-foreground">· {requested} ads</span>
            </div>
            <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground">
              Idempotent (N requested = N created) · batched &amp; throttled · failed ≠ launched · retry failed only.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function PreflightRow({
  label,
  ok,
  okText,
  badText,
  hard,
  soft,
}: {
  label: string;
  ok: boolean;
  okText: string;
  badText: string;
  hard?: boolean;
  soft?: boolean;
}) {
  // Failing tone: hard = error, soft = warning, otherwise error (missing fields block too).
  const badColor = soft ? "#874d00" : "#cf1322";
  const badBg = soft ? "rgba(250,173,20,0.14)" : "rgba(255,77,79,0.12)";
  const Icon = ok ? (soft ? ShieldCheck : CheckCircle2) : soft ? CircleAlert : hard ? XCircle : CircleAlert;
  return (
    <li className="flex items-center justify-between gap-2">
      <span className="text-xs text-foreground">{label}</span>
      <span
        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium leading-none"
        style={
          ok
            ? { color: "#237804", backgroundColor: "rgba(82,196,26,0.14)" }
            : { color: badColor, backgroundColor: badBg }
        }
      >
        <Icon className="h-3 w-3" />
        {ok ? okText : badText}
      </span>
    </li>
  );
}
