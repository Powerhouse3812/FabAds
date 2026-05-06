import { Paperclip, Upload as UploadIcon, Sparkles, LayoutTemplate } from "lucide-react";
import { cn } from "@/lib/utils";
import { PickerColumn } from "@/genie6/generate-v3/components/PickerColumn";
import { UploadsPanel, type LocalUpload } from "./UploadsPanel";
import {
  PinterestPanel,
  type PinterestPanelProps,
} from "./PinterestPanel";

/**
 * ReferencesDrawer — A-11.24.
 *
 * References live in the side drawer now. Tabs:
 *   - Brand mode: [Uploads | Pinterest]
 *   - Ad mode:    [Templates | Uploads | Pinterest]
 *
 * Templates tab is a stub for now — Ad sub-mode forms wire it when they
 * land. Brand sub-modes never see Templates.
 */

export type ReferenceTab = "uploads" | "pinterest" | "templates";

export interface ReferencesDrawerProps {
  open: boolean;
  onClose: () => void;
  /** Active tab. */
  tab: ReferenceTab;
  onTabChange: (next: ReferenceTab) => void;
  /** Whether the Templates tab is available (Ad mode only). */
  withTemplates?: boolean;

  // Uploads tab data
  uploads: LocalUpload[];
  onUploadsAdd: (next: LocalUpload[]) => void;
  onUploadsToggleSelect: (id: string) => void;
  onUploadsRemove: (id: string) => void;

  // Pinterest tab data
  pinterestQuery: PinterestPanelProps["query"];
  pinterestSelectedIds: string[];
  onPinterestToggleSelect: PinterestPanelProps["onToggleSelect"];
}

export function ReferencesDrawer({
  open,
  onClose,
  tab,
  onTabChange,
  withTemplates = false,
  uploads,
  onUploadsAdd,
  onUploadsToggleSelect,
  onUploadsRemove,
  pinterestQuery,
  pinterestSelectedIds,
  onPinterestToggleSelect,
}: ReferencesDrawerProps) {
  const attachedCount =
    uploads.filter((u) => u.selected).length + pinterestSelectedIds.length;

  return (
    <PickerColumn
      open={open}
      onClose={onClose}
      icon={Paperclip}
      title="Manage references"
      sub={
        attachedCount === 0
          ? "Upload local files or pick from Pinterest auto-fetch"
          : `${attachedCount} attached`
      }
    >
      <div className="space-y-3">
        <TabSwitch
          tab={tab}
          onChange={onTabChange}
          withTemplates={withTemplates}
        />

        {tab === "uploads" && (
          <UploadsPanel
            uploads={uploads}
            onAdd={onUploadsAdd}
            onToggleSelect={onUploadsToggleSelect}
            onRemove={onUploadsRemove}
          />
        )}
        {tab === "pinterest" && (
          <PinterestPanel
            query={pinterestQuery}
            selectedIds={pinterestSelectedIds}
            onToggleSelect={onPinterestToggleSelect}
          />
        )}
        {tab === "templates" && withTemplates && <TemplatesPlaceholder />}
      </div>
    </PickerColumn>
  );
}

/* ─────────────────────────────────────────────────────── */

function TabSwitch({
  tab,
  onChange,
  withTemplates,
}: {
  tab: ReferenceTab;
  onChange: (next: ReferenceTab) => void;
  withTemplates: boolean;
}) {
  return (
    <div
      role="tablist"
      aria-label="Reference source"
      className="inline-flex rounded-md border border-border bg-card p-0.5"
    >
      {withTemplates && (
        <TabButton
          active={tab === "templates"}
          onClick={() => onChange("templates")}
          icon={LayoutTemplate}
          label="Templates"
        />
      )}
      <TabButton
        active={tab === "uploads"}
        onClick={() => onChange("uploads")}
        icon={UploadIcon}
        label="Uploads"
      />
      <TabButton
        active={tab === "pinterest"}
        onClick={() => onChange("pinterest")}
        icon={Sparkles}
        label="Pinterest"
      />
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof UploadIcon;
  label: string;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-[11px] font-medium transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      <Icon className="h-3 w-3" />
      {label}
    </button>
  );
}

function TemplatesPlaceholder() {
  return (
    <div className="rounded-lg border border-dashed border-border bg-card/40 px-4 py-6 text-center">
      <LayoutTemplate className="mx-auto h-5 w-5 text-muted-foreground/60" />
      <p className="mt-2 text-xs text-muted-foreground">
        Templates land with Ad sub-mode forms (Product Ad / Performance Ad / Brand Ad).
      </p>
    </div>
  );
}
