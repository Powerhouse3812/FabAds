import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Copy, Eye, Info, ScrollText } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import {
  serializeTimelineScript,
  summarizeTimelineScript,
  type TimelineScript,
  type TimelineScriptRow,
} from "../data/timelineScript";

/**
 * ScriptTimelineModal — the script, as a timeline, for a Generate Variations
 * card.
 *
 * Owner's ruling (2026-09-10): the prompt bar carries an OVERVIEW only, because
 * a script holds every beat's dialogue and sometimes visual directions too.
 * The full thing lives here, and "by default only script aayegi with timeline.
 * on clicking toggle visuals bhi add ho jayenge us script me" — so visuals are
 * an ADDITIVE COLUMN on the same rows, default off. Not a second view, not a
 * tab switch: the rows never change, only whether each one also shows its
 * visual direction.
 *
 * Visual grammar follows Video Sage's Script tab
 * (`src/components/video-sage/ScriptTab.tsx`) — time / visual / dialogue in
 * one table, mono timecodes — which is the surface the owner pointed at.
 * Outside-click never dismisses (house rule, enforced in `ui/dialog.tsx`), so
 * Cancel and the X are the only exits and an unsaved edit cannot be lost to a
 * stray click.
 */
export interface ScriptTimelineModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The script to show. Built by `data/timelineScript.ts`, never parsed here. */
  script: TimelineScript;
  /** Header line — which variation/ad this script belongs to. */
  contextLabel?: string;
  /**
   * Commit. Omit to get a read-only modal (same as `readOnly`), which is the
   * honest shape for a source ad's script that isn't the user's to edit.
   */
  onSave?: (next: TimelineScript) => void;
  readOnly?: boolean;
  /** Visuals start hidden per the ruling; a caller may open them pre-shown. */
  defaultShowVisuals?: boolean;
}

export function ScriptTimelineModal({
  open,
  onOpenChange,
  script,
  contextLabel,
  onSave,
  readOnly,
  defaultShowVisuals = false,
}: ScriptTimelineModalProps) {
  const editable = !readOnly && !!onSave;
  const [rows, setRows] = useState<TimelineScriptRow[]>(script.rows);
  // One card per variation means this modal's markup exists N times, so a
  // hardcoded id would bind the label to the FIRST switch and point
  // aria-describedby at another card's reason text.
  const uid = useId();
  const visualsId = `script-timeline-visuals-${uid}`;
  const reasonId = `${visualsId}-reason`;

  const [showVisuals, setShowVisuals] = useState(defaultShowVisuals);

  /* Reopening must not resurrect a discarded edit, and the parent may hand a
     different card's script to the same mounted modal. */
  useEffect(() => {
    if (open) {
      setRows(script.rows);
      setShowVisuals(defaultShowVisuals && script.hasVisuals);
    }
  }, [open, script, defaultShowVisuals]);

  const draft = useMemo<TimelineScript>(
    () => ({
      rows,
      hasVisuals: rows.some((r) => !!r.visual?.trim()),
      hasTimecodes: rows.some((r) => !!r.time.trim()),
      provenance: script.provenance,
    }),
    [rows, script.provenance],
  );
  const summary = useMemo(() => summarizeTimelineScript(draft), [draft]);
  const dirty = useMemo(
    () => serializeTimelineScript(draft) !== serializeTimelineScript(script),
    [draft, script],
  );

  const isFlat = script.provenance === "flat";
  /* The toggle can only ever ADD what is there. No visuals in the source means
     no switch that appears to work and does nothing. */
  const toggleUsable = script.hasVisuals && !isFlat;
  const toggleReason = isFlat
    ? "This script has no timeline, so there are no per-beat visuals to add."
    : "This script carries no visual directions — nothing to add.";

  const patch = (index: number, field: "dialogue" | "visual", value: string) => {
    setRows((prev) =>
      prev.map((row, i) => {
        if (i !== index) return row;
        if (field === "dialogue") return { ...row, dialogue: value };
        const visual = value.trim();
        return visual ? { ...row, visual: value } : { ...row, visual: undefined };
      }),
    );
  };

  const copy = () => {
    navigator.clipboard.writeText(serializeTimelineScript(draft, { includeVisuals: showVisuals }));
    toast({ title: showVisuals ? "Script + visuals copied" : "Script copied" });
  };

  const save = () => {
    onSave?.(draft);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="g6-root flex max-h-[86vh] max-w-3xl flex-col gap-0 overflow-hidden rounded-g6-xl border-g6-border bg-g6-bg-container p-0">
        <DialogHeader className="space-y-0 border-b border-g6-border-secondary px-5 py-4 pr-12 text-left">
          <DialogTitle className="flex items-center gap-2 text-[16px] font-semibold leading-6 text-g6-text">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-g6-sm border border-g6-primary-border bg-g6-primary-bg">
              <ScrollText className="h-3.5 w-3.5 text-g6-primary-active" aria-hidden />
            </span>
            Script
            {contextLabel ? (
              <span className="min-w-0 truncate text-[12px] font-normal leading-5 text-g6-text-secondary">
                · {contextLabel}
              </span>
            ) : null}
          </DialogTitle>
          <DialogDescription className="mt-1.5 font-g6-mono text-[10px] uppercase tracking-[0.12em] text-g6-text-tertiary">
            <span className="text-g6-primary-active">{summary.line}</span>
            {script.provenance === "video-sage" ? " · from Video Sage" : null}
          </DialogDescription>
        </DialogHeader>

        {/* Toolbar: the one toggle, plus Copy. Stays out of the scroll area so
            the switch is reachable however long the script runs. */}
        <div className="flex items-center justify-between gap-4 border-b border-g6-border-secondary bg-g6-bg-base px-5 py-2.5">
          <div className="flex min-w-0 items-center gap-2.5">
            <Switch
              id={visualsId}
              checked={showVisuals}
              disabled={!toggleUsable}
              onCheckedChange={setShowVisuals}
              aria-describedby={toggleUsable ? undefined : reasonId}
              className="data-[state=checked]:bg-g6-primary"
            />
            <label
              htmlFor={visualsId}
              className={cn(
                "flex min-w-0 cursor-pointer items-center gap-1.5 text-[12px] font-medium leading-5",
                toggleUsable ? "text-g6-text" : "cursor-not-allowed text-g6-text-disabled",
              )}
            >
              <Eye className="h-3.5 w-3.5 shrink-0" aria-hidden />
              Add visual directions
            </label>
            {toggleUsable ? (
              <span className="truncate text-[11px] leading-4 text-g6-text-tertiary">
                {showVisuals
                  ? `Showing on ${summary.visualCount} of ${summary.rowCount} beats`
                  : `${summary.visualCount} beats carry one`}
              </span>
            ) : (
              <span
                id={reasonId}
                className="truncate text-[11px] leading-4 text-g6-text-tertiary"
              >
                {toggleReason}
              </span>
            )}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={copy}
            className="h-7 shrink-0 gap-1.5 border-g6-border bg-g6-bg-container px-2.5 text-[11px] leading-4 text-g6-text-secondary hover:bg-g6-bg-muted hover:text-g6-text"
          >
            <Copy className="h-3 w-3" aria-hidden />
            Copy
          </Button>
        </div>

        {/* Only this region scrolls — a 40-beat script must not scroll the page. */}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {isFlat ? (
            <FlatScriptBody
              value={rows[0]?.dialogue ?? ""}
              editable={editable}
              onChange={(value) => patch(0, "dialogue", value)}
            />
          ) : (
            <TimelineBody
              rows={rows}
              showVisuals={showVisuals}
              hasTimecodes={script.hasTimecodes}
              editable={editable}
              onPatch={patch}
            />
          )}
        </div>

        <DialogFooter className="items-center justify-between gap-3 border-t border-g6-border-secondary bg-g6-bg-base px-5 py-3 sm:justify-between">
          <p className="text-[11px] leading-4 text-g6-text-tertiary">
            {!editable
              ? "Read-only — this script belongs to the source ad."
              : dirty
                ? "Unsaved changes. Cancel discards them."
                : "Edit any beat, then Save."}
          </p>
          <div className="flex shrink-0 items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="border-g6-border bg-g6-bg-container text-g6-text-secondary hover:bg-g6-bg-muted hover:text-g6-text"
            >
              {editable ? "Cancel" : "Close"}
            </Button>
            {editable ? (
              <Button
                type="button"
                size="sm"
                onClick={save}
                disabled={!dirty}
                className="bg-g6-primary text-g6-text-on-accent shadow-g6-primary-btn hover:bg-g6-primary-hover"
              >
                Save script
              </Button>
            ) : null}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* --------------------------------------------------------------- timeline */

function TimelineBody({
  rows,
  showVisuals,
  hasTimecodes,
  editable,
  onPatch,
}: {
  rows: TimelineScriptRow[];
  showVisuals: boolean;
  hasTimecodes: boolean;
  editable: boolean;
  onPatch: (index: number, field: "dialogue" | "visual", value: string) => void;
}) {
  return (
    <div className="overflow-hidden rounded-g6-lg border border-g6-border">
      <div
        className={cn(
          "grid items-center gap-3 border-b border-g6-border-secondary bg-g6-bg-muted px-3 py-2 font-g6-mono text-[10px] uppercase tracking-[0.12em] text-g6-text-tertiary",
          showVisuals ? "grid-cols-[104px_minmax(0,1fr)_minmax(0,1fr)]" : "grid-cols-[104px_minmax(0,1fr)]",
        )}
      >
        <span className="text-g6-primary-active">{hasTimecodes ? "Timeline" : "Beat"}</span>
        <span>Dialogue</span>
        {showVisuals ? <span>Visual</span> : null}
      </div>

      <ul>
        {rows.map((row, i) => (
          <li
            key={i}
            className={cn(
              "grid gap-3 px-3 py-2.5",
              i > 0 && "border-t border-g6-border-secondary",
              showVisuals ? "grid-cols-[104px_minmax(0,1fr)_minmax(0,1fr)]" : "grid-cols-[104px_minmax(0,1fr)]",
            )}
          >
            <div className="pt-1">
              {row.time ? (
                <span className="inline-flex rounded-g6-pill border border-g6-primary-border bg-g6-primary-bg px-1.5 py-0.5 font-g6-mono text-[10px] leading-4 text-g6-primary-active">
                  {row.time}
                </span>
              ) : row.label ? (
                <span className="inline-flex rounded-g6-pill border border-g6-border bg-g6-bg-muted px-1.5 py-0.5 font-g6-mono text-[10px] uppercase leading-4 tracking-wide text-g6-text-secondary">
                  {row.label}
                </span>
              ) : (
                /* No timecode and no label the author wrote — say so rather
                   than numbering it and implying a timing we don't have. */
                <span className="font-g6-mono text-[10px] leading-4 text-g6-text-tertiary">
                  no timecode
                </span>
              )}
            </div>

            <BeatField
              label={`Dialogue, beat ${i + 1}`}
              value={row.dialogue}
              editable={editable}
              placeholder="No dialogue in this beat"
              resizeKey={showVisuals}
              onChange={(v) => onPatch(i, "dialogue", v)}
            />

            {showVisuals ? (
              <BeatField
                label={`Visual direction, beat ${i + 1}`}
                value={row.visual ?? ""}
                editable={editable}
                placeholder="No visual direction — add one"
                muted
                resizeKey={showVisuals}
                onChange={(v) => onPatch(i, "visual", v)}
              />
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

function BeatField({
  label,
  value,
  editable,
  placeholder,
  muted,
  resizeKey,
  onChange,
}: {
  label: string;
  value: string;
  editable: boolean;
  placeholder: string;
  muted?: boolean;
  /** Changes when the column width changes, so the height is re-measured. */
  resizeKey?: unknown;
  onChange: (value: string) => void;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  /* Grow to fit. A fixed `rows` clipped the longest beat the moment the visual
     column halved the dialogue column's width — a script modal that hides part
     of a line is worse than no modal. */
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value, resizeKey]);

  if (!editable) {
    return (
      <p
        className={cn(
          "whitespace-pre-wrap text-[12px] leading-5",
          value ? (muted ? "text-g6-text-secondary" : "text-g6-text") : "text-g6-text-tertiary",
        )}
      >
        {value || placeholder}
      </p>
    );
  }
  return (
    <Textarea
      ref={ref}
      aria-label={label}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      rows={1}
      className={cn(
        "min-h-0 resize-none overflow-hidden border-transparent bg-transparent px-2 py-1 text-[12px] leading-5 placeholder:text-g6-text-tertiary hover:border-g6-border focus-visible:border-g6-primary-border focus-visible:ring-1 focus-visible:ring-g6-primary-border",
        muted ? "text-g6-text-secondary" : "text-g6-text",
      )}
    />
  );
}

/* ------------------------------------------------------------------- flat */

/** No timecodes, no beats — say it plainly and still let the user edit. */
function FlatScriptBody({
  value,
  editable,
  onChange,
}: {
  value: string;
  editable: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-3">
      <p className="flex items-start gap-2 rounded-g6-base border border-g6-primary-border bg-g6-primary-bg px-3 py-2 text-[11px] leading-4 text-g6-primary-active">
        <Info className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden />
        <span>
          This script has no timeline yet — it came through as one block, with no
          timecodes and no marked visual directions. We won&rsquo;t invent them.
          Edit it here, or add timecodes like{" "}
          <span className="font-g6-mono">[0:00-0:03]</span> and{" "}
          <span className="font-g6-mono">VISUAL:</span> lines and it will read as
          a timeline next time.
        </span>
      </p>
      {editable ? (
        <Textarea
          aria-label="Script"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={14}
          className="resize-y border-g6-border bg-g6-bg-base px-3 py-2 text-[12px] leading-5 text-g6-text focus-visible:border-g6-primary-border focus-visible:ring-1 focus-visible:ring-g6-primary-border"
        />
      ) : (
        <p className="whitespace-pre-wrap rounded-g6-base border border-g6-border bg-g6-bg-base px-3 py-2 text-[12px] leading-5 text-g6-text">
          {value || "This script is empty."}
        </p>
      )}
    </div>
  );
}
