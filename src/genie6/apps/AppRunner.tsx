import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import type { AppFieldValues, GenieApp } from "./appTypes";
import { previewCost } from "./data/appCost";
import { startBatch } from "../lib/genieRunStore";
import { CREDITS_REMAINING, exceedsBalance, formatCredits } from "../lib/credits";
import { firstMissingRequiredField } from "./lib/fieldHelpers";
import { buildRunPlan } from "./lib/runPlan";
import { FieldRenderer } from "./fields";
import { CostBreakdown } from "./components/CostBreakdown";
import { RunResults } from "./components/RunResults";
import { AppScreenSkeleton } from "./components/AppSkeleton";

const OUTCOME_VALUES = ["all-done", "one-failed", "all-failed", "partial"] as const;

/**
 * AppRunner — the ONE screen anatomy for every live app (§8), driven
 * entirely by `app.sections` / `app.cost` / `app.stages` / `app.zeroState`.
 * A new app is a registry entry, never a new screen (see appTypes.ts's
 * top-of-file rationale) — this file is that promise kept.
 *
 * 750px centred column · centred 30px title + 14px subtitle · sections
 * divided by hairline rules (never nested cards) · full-width primary
 * action with the cost stated beneath it · results view below.
 */
export function AppRunner({ app }: { app: GenieApp }) {
  const [searchParams] = useSearchParams();
  const [values, setValues] = useState<AppFieldValues>({});

  if (searchParams.get("loading") === "1") {
    return <AppScreenSkeleton />;
  }

  const preview = previewCost(app, values);
  const missing = firstMissingRequiredField(app.sections, values);
  const overBalance = !missing && exceedsBalance(preview.total);
  const disabled = !!missing || overBalance;

  const setField = (id: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = () => {
    if (disabled) return;
    const plan = buildRunPlan(app, values, preview);
    const outcomeParam = searchParams.get("outcome");
    const outcome = (OUTCOME_VALUES as readonly string[]).includes(outcomeParam ?? "")
      ? (outcomeParam as (typeof OUTCOME_VALUES)[number])
      : undefined;

    startBatch({
      origin: { kind: "app", app: app.key },
      label: plan.label,
      stages: app.stages ?? ["Queued", "Processing", "Finalizing"],
      count: plan.count,
      creditsPerItem: plan.creditsPerItem,
      creditsTotal: plan.creditsTotal, // exactly what the cost line under the button said
      config: plan.config,
      itemSeed: plan.itemSeed,
      outcome,
    });
    setValues({});
  };

  return (
    <div className="mx-auto flex w-full max-w-[750px] flex-col gap-8 px-6 pb-16 pt-14">
      <header className="flex flex-col items-center gap-1.5 text-center">
        <h1 className="text-[30px] font-bold tracking-tight text-foreground">{app.name}</h1>
        <p className="text-[14px] text-muted-foreground">{app.subtitle}</p>
      </header>

      <div className="flex flex-col">
        {(app.sections ?? []).map((section, i) => (
          <section
            key={section.title}
            className={cn("flex flex-col gap-4 py-6", i > 0 && "border-t border-border")}
          >
            <h2 className="font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              {section.title}
            </h2>
            <div className="flex flex-col gap-5">
              {section.fields.map((field) => (
                <div key={field.id} className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-medium text-foreground">
                    {field.label}
                    {field.required && <span className="ml-0.5 text-primary">*</span>}
                  </label>
                  {field.hint && <p className="text-[12px] text-muted-foreground">{field.hint}</p>}
                  <FieldRenderer
                    field={field}
                    value={values[field.id]}
                    onChange={(v) => setField(field.id, v)}
                    ratePerLanguageMinute={
                      field.kind === "language-multiselect" && app.cost?.unit === "language-minute"
                        ? app.cost.rate
                        : undefined
                    }
                  />
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="flex w-full flex-col items-center gap-2 border-t border-border pt-6">
        <button
          type="button"
          disabled={disabled}
          aria-disabled={disabled}
          onClick={handleSubmit}
          className={cn(
            "w-full rounded-full py-3 text-[14px] font-semibold transition-colors",
            disabled
              ? "cursor-not-allowed bg-muted text-muted-foreground"
              : "bg-primary text-primary-foreground hover:bg-primary/90",
          )}
        >
          Generate ({formatCredits(preview.total)} credits)
        </button>

        {missing && (
          <p className="text-[12.5px] text-muted-foreground">Add {missing.label} to continue.</p>
        )}
        {!missing && overBalance && (
          <p className="text-[12.5px] text-destructive">
            Not enough credits — you're short {formatCredits(preview.total - CREDITS_REMAINING)}.{" "}
            <a href="/plans-v2?addon=credits" className="font-medium underline">
              Top up
            </a>
          </p>
        )}

        <CostBreakdown preview={preview} />
      </div>

      <RunResults app={app} />
    </div>
  );
}
