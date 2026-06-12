/**
 * SetupTemplateBar — lime-tinted header bar at the top of Step 2 Setup.
 *
 * Two visual states:
 *   - Unlinked: "Apply Setup template ▼" dropdown + "Save new" button.
 *   - Linked:   "Setup template: <name>" + "Edited" pill (when diff non-empty)
 *               + unlink (×) + "Save new" (forks).
 *
 * Edit-after-apply policy is FORK-ONLY: "Save new" creates a NEW template via
 * `flow.saveCurrentSetupAsTemplate`, which also re-links the plan to that new
 * template id (see useFlowV2). No "update existing" affordance.
 */
import { useMemo, useState } from "react";
import { Zap, X, ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import type { UseFlowV2 } from "../../../state/useFlowV2";
import { templatesService } from "../../../templates/service";
import { diffSetupTemplate, isSetupEdited } from "../../../templates/edits";
import type { SetupTemplate } from "../../../templates/types";

import { SaveTemplateDialog } from "./SaveTemplateDialog";

export function SetupTemplateBar({ flow }: { flow: UseFlowV2 }) {
  const { plan } = flow;
  const [saveOpen, setSaveOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [templateSearch, setTemplateSearch] = useState("");
  // Bump a counter to re-read templates after a save (service is mutable, not reactive).
  const [version, setVersion] = useState(0);

  const templates = useMemo(
    () => templatesService.listSetup(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [version, plan.appliedSetupTemplateId],
  );

  const linked: SetupTemplate | null = plan.appliedSetupTemplateId
    ? templates.find((t) => t.id === plan.appliedSetupTemplateId) ?? null
    : null;

  const diff = linked ? diffSetupTemplate(plan, linked.payload) : null;
  const edited = diff ? isSetupEdited(diff) : false;

  const handleApply = (id: string) => {
    flow.applySetupTemplate(id);
  };

  const handleSave = (name: string) => {
    flow.saveCurrentSetupAsTemplate(name);
    setVersion((v) => v + 1);
  };

  // One-line bar: "Template: <name|None applied> · [Apply template ▾] · [Save as…]"
  // Note: "Templates" word is reserved ONLY for Targeting Templates per strategy lock.
  // This bar persists "Setup template" wording internally but UI label says "Setup".
  return (
    <>
      <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
        <Zap className="h-3.5 w-3.5 text-primary shrink-0" />
        <span className="shrink-0">Setup:</span>
        <span className={cn("min-w-0 truncate", linked ? "font-medium text-foreground" : "")}>
          {linked ? linked.name : "None applied"}
        </span>
        {edited && (
          <span className="shrink-0 rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-500">
            Edited
          </span>
        )}

        <span className="text-muted-foreground/40">·</span>

        {templates.length > 0 ? (
          <Popover open={pickerOpen} onOpenChange={(o) => { setPickerOpen(o); if (!o) setTemplateSearch(""); }}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center gap-1 text-[12px] text-foreground hover:underline"
              >
                Apply Setup
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              </button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-72 p-0">
              <div className="flex items-center gap-2 border-b border-border px-3 py-2">
                <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <input
                  autoFocus
                  type="text"
                  placeholder="Search…"
                  value={templateSearch}
                  onChange={(e) => setTemplateSearch(e.target.value)}
                  className="w-full bg-transparent text-[12px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
                />
              </div>
              <div className="max-h-56 overflow-y-auto py-1">
                {templates.filter((t) =>
                  !templateSearch || t.name.toLowerCase().includes(templateSearch.toLowerCase())
                ).length === 0 ? (
                  <div className="px-3 py-3 text-center text-[11px] font-mono text-muted-foreground">
                    No matches
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
                        onClick={() => { handleApply(t.id); setPickerOpen(false); setTemplateSearch(""); }}
                        className="w-full px-3 py-2 text-left text-[12px] text-foreground transition-colors hover:bg-muted/50"
                      >
                        {t.name}
                      </button>
                    ))
                )}
              </div>
            </PopoverContent>
          </Popover>
        ) : (
          <span className="text-[12px] text-muted-foreground/70">No Setups saved</span>
        )}

        <span className="text-muted-foreground/40">·</span>
        <button
          type="button"
          onClick={() => setSaveOpen(true)}
          className="text-[12px] text-foreground hover:underline"
        >
          Save as…
        </button>

        {linked && (
          <button
            type="button"
            onClick={() => flow.unlinkSetupTemplate()}
            aria-label="Unlink setup"
            title="Unlink (keeps current values)"
            className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:text-foreground"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      <SaveTemplateDialog
        open={saveOpen}
        onOpenChange={setSaveOpen}
        onSave={handleSave}
        kind="Setup"
      />
    </>
  );
}

/** Per-section chip helper exposed for SectionCard headers. */
export function SetupSectionChip({
  flow,
  section,
}: {
  flow: UseFlowV2;
  section: "destinations" | "campaign" | "adset" | "audience";
}) {
  const { plan } = flow;
  if (!plan.appliedSetupTemplateId) return null;
  const tpl = templatesService.getSetup(plan.appliedSetupTemplateId);
  if (!tpl) return null;
  const diff = diffSetupTemplate(plan, tpl.payload);
  const isEdited = diff[section];
  if (isEdited) {
    return (
      <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-500">
        Edited
      </span>
    );
  }
  return (
    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
      from template
    </span>
  );
}
