import { Paperclip, Upload as UploadIcon, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  UploadsPanel,
  type LocalUpload,
} from "./UploadsPanel";

/**
 * ReferencesSectionV3 — Studio v3 references (A-11.23).
 *
 * Replaces the legacy ReferencesSection's URL-paste pattern. Per Maalik:
 *   - Drop URL flow entirely.
 *   - Two sources only: Uploads (local files) + Pinterest (auto-fetched
 *     based on user's already-provided form inputs).
 *   - Tab pattern · "Uploads" default + "Pinterest" secondary.
 *   - Selected items live INLINE in their own tab — no combined chip strip.
 *   - "Include product imagery" toggle is GONE from this section — it
 *     lives in the product picker zone (related to product, not ref).
 *
 * Form supplies the data + handlers via props. Section is layout-only.
 */

export type ReferenceTab = "uploads" | "pinterest";

export interface ReferencesSectionV3Props {
  tab: ReferenceTab;
  onTabChange: (next: ReferenceTab) => void;

  // Uploads tab data
  uploads: LocalUpload[];
  onUploadsAdd: (next: LocalUpload[]) => void;
  onUploadsToggleSelect: (id: string) => void;
  onUploadsRemove: (id: string) => void;

  /** Pinterest selection count — drives the count badge on the tab body. */
  pinterestSelectedCount: number;
  /**
   * A-11.25: Pinterest tab now opens a side column instead of rendering
   * inline. Caller wires this to whatever drawer state controls the
   * column. Click on the Pinterest tab + the inline "Open Pinterest" CTA
   * both call this.
   */
  onPinterestOpen?: () => void;

  /** Optional override label */
  label?: string;
}

export function ReferencesSectionV3({
  tab,
  onTabChange,
  uploads,
  onUploadsAdd,
  onUploadsToggleSelect,
  onUploadsRemove,
  pinterestSelectedCount,
  onPinterestOpen,
  label = "References",
}: ReferencesSectionV3Props) {
  const attachedCount =
    uploads.filter((u) => u.selected).length + pinterestSelectedCount;

  // When `label` is empty, the host (e.g. SetupRow) is rendering the
  // section title. We just show the count + tabs row, no Paperclip header.
  const showHeaderTitle = !!label;

  return (
    <section className="space-y-2">
      {/* Header row — title + count + tabs (title optional) */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          {showHeaderTitle && (
            <>
              <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
              <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {label}
              </h2>
            </>
          )}
          {attachedCount > 0 && (
            <span className="rounded-full bg-primary/15 px-1.5 py-0.5 font-mono text-[9px] font-bold text-primary">
              {attachedCount} attached
            </span>
          )}
        </div>
        <TabSwitch tab={tab} onChange={onTabChange} />
      </div>

      {/* Tab body — no extra card frame; flows with the page mesh. */}
      <div className="pt-1">
        {tab === "uploads" ? (
          <UploadsPanel
            uploads={uploads}
            onAdd={onUploadsAdd}
            onToggleSelect={onUploadsToggleSelect}
            onRemove={onUploadsRemove}
          />
        ) : (
          /* Pinterest tab → the side column hosts the actual grid +
             search + filters. Inline body shows status + "Open Pinterest"
             button so the form stays compact. */
          <PinterestTabHint
            attached={pinterestSelectedCount}
            onOpen={onPinterestOpen}
          />
        )}
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────── */

function PinterestTabHint({
  attached,
  onOpen,
}: {
  attached: number;
  onOpen?: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 min-w-0">
        <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
        <p className="text-xs text-foreground truncate">
          Pinterest browser
          {attached > 0 ? (
            <span className="ml-1.5 rounded-full bg-primary/15 px-1.5 py-0.5 font-mono text-[9px] font-bold text-primary">
              {attached} attached
            </span>
          ) : (
            <span className="ml-1.5 text-muted-foreground">·</span>
          )}{" "}
          <span className="text-muted-foreground text-[11px]">
            opens in side column with auto-applied filters from your form.
          </span>
        </p>
      </div>
      <button
        type="button"
        onClick={onOpen}
        className={cn(
          "shrink-0 inline-flex items-center gap-1 rounded-md bg-primary px-2.5 py-1 text-[11px] font-bold text-primary-foreground",
          "hover:opacity-90 transition-opacity",
        )}
      >
        Open Pinterest
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────────────────── */

function TabSwitch({
  tab,
  onChange,
}: {
  tab: ReferenceTab;
  onChange: (next: ReferenceTab) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Reference source"
      className="inline-flex rounded-md border border-border bg-card p-0.5"
    >
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

export type { LocalUpload } from "./UploadsPanel";
