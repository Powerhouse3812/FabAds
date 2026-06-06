/**
 * TemplateControls — Apply / Save-as Targeting Templates, used inside the
 * launch flow (Step 3). Compact: an Apply-template Select, an applied-template
 * chip with a clear affordance, and an inline Save-as-template name input.
 *
 * Templates are captured from / applied to a LaunchPlan via the service
 * (listTemplates / applyTemplate / saveTemplate). The component re-renders on
 * service "templates-updated" events via the Launch2 context, so a freshly
 * saved template appears in the Apply list immediately.
 */
import { useState } from "react";
import { BookmarkPlus, Check, LayoutTemplate, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import type { MetaLaunchService } from "../../services/MetaLaunchService";
import type { UseLaunch2FlowReturn } from "../../state/useLaunch2Flow";
import { SectionLabel } from "./parts";

export function TemplateControls({
  flow,
  service,
}: {
  flow: UseLaunch2FlowReturn;
  service: MetaLaunchService;
}) {
  const { plan } = flow;
  const templates = service.listTemplates();
  const applied = plan.templateId ? service.getTemplate(plan.templateId) : undefined;

  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");

  function onApply(id: string) {
    const t = service.getTemplate(id);
    if (t) flow.applyTemplate(t);
  }

  function onSave() {
    const trimmed = name.trim();
    if (!trimmed) return;
    const tpl = service.saveTemplate(trimmed, plan);
    // Mark provenance so the applied chip reflects the just-saved template.
    flow.patch({ templateId: tpl.id });
    toast.success("Template saved", { description: `“${trimmed}” is ready to reuse.` });
    setName("");
    setSaving(false);
  }

  return (
    <div className="space-y-3">
      <SectionLabel
        trailing={
          !saving ? (
            <Button
              size="sm"
              variant="outline"
              className="ml-auto h-7 rounded-full px-2.5 text-xs"
              onClick={() => setSaving(true)}
            >
              <BookmarkPlus className="h-4 w-4" />
              Save as template
            </Button>
          ) : null
        }
      >
        Targeting template
      </SectionLabel>

      {/* Apply */}
      <div>
        <Label htmlFor="apply-template" className="text-xs text-muted-foreground">
          Apply a saved template
        </Label>
        <Select value={applied?.id ?? undefined} onValueChange={onApply}>
          <SelectTrigger id="apply-template" className="mt-1">
            <span className="flex min-w-0 items-center gap-2">
              <LayoutTemplate className="h-4 w-4 shrink-0 text-muted-foreground" />
              <SelectValue placeholder="Choose a template to apply" />
            </span>
          </SelectTrigger>
          <SelectContent>
            {templates.length === 0 ? (
              <div className="px-2 py-1.5 text-xs text-muted-foreground">No templates saved yet.</div>
            ) : (
              templates.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Applied chip + clear */}
      {applied ? (
        <div
          className="flex items-center justify-between gap-2 rounded-xl border px-3 py-2"
          style={{ borderColor: "rgba(143,184,33,0.4)", backgroundColor: "rgba(143,184,33,0.06)" }}
        >
          <span className="flex min-w-0 items-center gap-1.5 text-xs text-foreground">
            <Check className="h-4 w-4 shrink-0" style={{ color: "#5B7611" }} />
            <span className="truncate">
              Applied <span className="font-medium">{applied.name}</span>
            </span>
          </span>
          <button
            type="button"
            onClick={() => flow.patch({ templateId: null })}
            className="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Clear applied template"
          >
            <X className="h-3.5 w-3.5" />
            Clear
          </button>
        </div>
      ) : null}

      {/* Save-as inline input */}
      {saving ? (
        <div className="flex items-center gap-2">
          <Input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSave();
              if (e.key === "Escape") {
                setSaving(false);
                setName("");
              }
            }}
            placeholder="Template name, e.g. Broad Prospecting — Sales"
            className="h-8 text-sm"
          />
          <Button size="sm" className="h-8 rounded-full" onClick={onSave} disabled={!name.trim()}>
            Save
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 rounded-full px-2.5"
            onClick={() => {
              setSaving(false);
              setName("");
            }}
          >
            Cancel
          </Button>
        </div>
      ) : (
        <p className="text-[11px] text-muted-foreground">
          Captures strategy, objective, audience, budget, distribution &amp; compliance into a reusable template.
        </p>
      )}
    </div>
  );
}
