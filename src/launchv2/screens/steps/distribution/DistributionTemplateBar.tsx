/**
 * DistributionTemplateBar — Step 4 Distribution template header bar.
 *
 * Lime-tinted bar that sits at the top of Step 4 and lets the user:
 *  - Apply a saved Distribution template via a dropdown (when none linked)
 *  - See "Distribution template: <name>" + an "Edited" pill + a × unlink (when linked)
 *  - Open the shared SaveTemplateDialog to fork-save the current state as a new template
 *
 * Edit detection is driven by `diffDistributionTemplate(plan, tpl.payload)` from
 * `../../templates/edits`. There is no "update existing" affordance — fork only.
 *
 * Visually consistent with the Setup variant (Agent B's SetupTemplateBar) so the
 * two bars feel like one product. Fabfunnel design system v1.1 — lime primary,
 * amber for "Edited" warning tone, Geist sans, Lucide icons, dark-mode-first.
 */
import { useMemo, useState } from "react";
import { Zap, X, ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SaveTemplateDialog } from "../setup/SaveTemplateDialog";
import { templatesService } from "../../../templates/service";
import {
  diffDistributionTemplate,
  isDistributionEdited,
} from "../../../templates/edits";
import type { UseFlowV2 } from "../../../state/useFlowV2";

export default function DistributionTemplateBar({ flow }: { flow: UseFlowV2 }) {
  const { plan } = flow;
  const [saveOpen, setSaveOpen] = useState(false);

  // Re-read the templates list on every render — the service is synchronous and
  // localStorage-backed, so this is cheap and always reflects fresh state.
  const templates = useMemo(() => templatesService.listDistribution(), [
    plan.appliedDistributionTemplateId,
    saveOpen,
  ]);

  const linked = plan.appliedDistributionTemplateId
    ? templates.find((t) => t.id === plan.appliedDistributionTemplateId) ?? null
    : null;

  const edited = linked ? isDistributionEdited(diffDistributionTemplate(plan, linked.payload)) : false;

  return (
    <div
      data-testid="lv2-distribution-template-bar"
      className={cn(
        "mb-4 rounded-2xl border px-4 py-3 transition-colors",
        "border-primary/40 bg-primary/5",
      )}
    >
      <div className="flex items-center gap-3">
        <Zap className="h-4 w-4 shrink-0 text-primary" aria-hidden />

        {linked ? (
          <>
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <span className="truncate text-sm font-medium text-foreground">
                Distribution template:{" "}
                <span className="text-foreground/90">{linked.name}</span>
              </span>
              {edited && (
                <span
                  className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400"
                  aria-label="Template edited since applied"
                >
                  Edited
                </span>
              )}
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              aria-label="Unlink template"
              onClick={flow.unlinkDistributionTemplate}
            >
              <X className="h-3.5 w-3.5" />
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-primary hover:bg-primary/10 hover:text-primary"
              onClick={() => setSaveOpen(true)}
            >
              Save new
            </Button>
          </>
        ) : (
          <>
            <div className="flex min-w-0 flex-1 items-center">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 -ml-1 gap-1 text-sm font-medium text-foreground hover:bg-primary/10"
                  >
                    Apply Distribution template
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-64">
                  {templates.length === 0 ? (
                    <div className="px-2 py-1.5 text-xs text-muted-foreground">
                      No saved Distribution templates yet
                    </div>
                  ) : (
                    templates.map((t) => (
                      <DropdownMenuItem
                        key={t.id}
                        onClick={() => flow.applyDistributionTemplate(t.id)}
                        className="flex items-center justify-between gap-2"
                      >
                        <span className="truncate">{t.name}</span>
                        {plan.appliedDistributionTemplateId === t.id && (
                          <Check className="h-3.5 w-3.5 text-primary" />
                        )}
                      </DropdownMenuItem>
                    ))
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-primary hover:bg-primary/10 hover:text-primary"
              onClick={() => setSaveOpen(true)}
            >
              Save new
            </Button>
          </>
        )}
      </div>

      {linked && edited && (
        <p className="ml-7 mt-1 text-[11px] text-amber-600 dark:text-amber-400">
          Edited — fork to save changes
        </p>
      )}

      <SaveTemplateDialog
        open={saveOpen}
        onOpenChange={setSaveOpen}
        kind="Distribution"
        onSave={(name) => flow.saveCurrentDistributionAsTemplate(name)}
      />
    </div>
  );
}

/* ── Per-section chip helper ─────────────────────────────────────────────── */

/**
 * Small chip rendered next to each section title within Step 4 when a
 * distribution template is applied. Shows `from template` when the section
 * is in sync; `Edited` (amber) when it diverges.
 */
export function DistributionSectionChip({
  flow,
  section,
}: {
  flow: UseFlowV2;
  section: keyof ReturnType<typeof diffDistributionTemplate>;
}) {
  const { plan } = flow;
  if (!plan.appliedDistributionTemplateId) return null;
  const tpl = templatesService.getDistribution(plan.appliedDistributionTemplateId);
  if (!tpl) return null;

  const diff = diffDistributionTemplate(plan, tpl.payload);
  const isEdited = diff[section];

  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-[10px] font-medium",
        isEdited
          ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
          : "bg-primary/10 text-primary",
      )}
    >
      {isEdited ? "Edited" : "from template"}
    </span>
  );
}
