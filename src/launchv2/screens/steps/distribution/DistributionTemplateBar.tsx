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
import { Zap, X, ChevronDown, Check, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
  const [pickerOpen, setPickerOpen] = useState(false);
  const [templateSearch, setTemplateSearch] = useState("");

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
              <Popover open={pickerOpen} onOpenChange={(o) => { setPickerOpen(o); if (!o) setTemplateSearch(""); }}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 -ml-1 gap-1 text-sm font-medium text-foreground hover:bg-primary/10"
                  >
                    Apply Distribution template
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-72 p-0">
                  {/* Search */}
                  <div className="flex items-center gap-2 border-b border-border px-3 py-2">
                    <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <input
                      autoFocus
                      type="text"
                      placeholder="Search templates…"
                      value={templateSearch}
                      onChange={(e) => setTemplateSearch(e.target.value)}
                      className="w-full bg-transparent text-[12px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
                    />
                  </div>
                  {/* Template list */}
                  <div className="max-h-56 overflow-y-auto py-1">
                    {templates.length === 0 ? (
                      <div className="px-3 py-3 text-center text-[11px] font-mono text-muted-foreground">
                        No saved Distribution templates yet
                      </div>
                    ) : templates.filter((t) =>
                      !templateSearch || t.name.toLowerCase().includes(templateSearch.toLowerCase())
                    ).length === 0 ? (
                      <div className="px-3 py-3 text-center text-[11px] font-mono text-muted-foreground">
                        No templates match "{templateSearch}"
                      </div>
                    ) : (
                      templates
                        .filter((t) =>
                          !templateSearch || t.name.toLowerCase().includes(templateSearch.toLowerCase())
                        )
                        .map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => { flow.applyDistributionTemplate(t.id); setPickerOpen(false); setTemplateSearch(""); }}
                            className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-[12px] text-foreground transition-colors hover:bg-muted/50"
                          >
                            <span className="truncate">{t.name}</span>
                            {plan.appliedDistributionTemplateId === t.id && (
                              <Check className="h-3.5 w-3.5 shrink-0 text-primary" />
                            )}
                          </button>
                        ))
                    )}
                  </div>
                </PopoverContent>
              </Popover>
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
