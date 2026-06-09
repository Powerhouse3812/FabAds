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
import { Zap, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { UseFlowV2 } from "../../../state/useFlowV2";
import { templatesService } from "../../../templates/service";
import { diffSetupTemplate, isSetupEdited } from "../../../templates/edits";
import type { SetupTemplate } from "../../../templates/types";

import { SaveTemplateDialog } from "./SaveTemplateDialog";

export function SetupTemplateBar({ flow }: { flow: UseFlowV2 }) {
  const { plan } = flow;
  const [saveOpen, setSaveOpen] = useState(false);
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

  return (
    <>
      <div className="mb-4 rounded-2xl border border-primary/30 bg-primary/5 px-4 py-3">
        {linked ? (
          /* ── Linked state ──────────────────────────────────────── */
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Setup template:</span>
              <span className="text-sm font-medium text-foreground">{linked.name}</span>
              {edited && (
                <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-500">
                  Edited
                </span>
              )}
              <div className="ml-auto flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => setSaveOpen(true)}
                >
                  Save new
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => flow.unlinkSetupTemplate()}
                  aria-label="Unlink template"
                  title="Unlink template (keeps current values)"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
            {edited && (
              <p className="pl-6 text-[11px] text-muted-foreground">
                Edited — fork to save changes
              </p>
            )}
          </div>
        ) : (
          /* ── Unlinked state ────────────────────────────────────── */
          <div className="flex flex-wrap items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            {templates.length > 0 ? (
              <Select value={undefined} onValueChange={handleApply}>
                <SelectTrigger className="h-8 w-auto min-w-[14rem] border-primary/30 bg-card text-xs">
                  <SelectValue placeholder="Apply Setup template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <span className="text-xs text-muted-foreground">
                No templates yet. Configure this step, then “Save new.”
              </span>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto h-7 px-2 text-xs"
              onClick={() => setSaveOpen(true)}
            >
              Save new
            </Button>
          </div>
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
