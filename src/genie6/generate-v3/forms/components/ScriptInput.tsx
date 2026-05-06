import { Sparkles, FolderOpen, Upload, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * ScriptInput — A-11.21 (Brand → Product-focused, video output).
 *
 * Maalik's spec: "Script but optional, Ai will create by default. Or user
 * can give one of his own, paste, write or attach."
 *
 * 4 tabs:
 *   - AI       : empty state, AI drafts script from concept + audience + angle
 *   - Saved    : pick a previously-saved script (mock dropdown)
 *   - Upload   : drag-drop or .txt/.docx upload (alert mock)
 *   - Manual   : 4-row textarea for typed script
 */

export type ScriptMode = "ai" | "saved" | "upload" | "manual";

const MOCK_SAVED_SCRIPTS = [
  { id: "saved-festive-launch", label: "Festive launch · 30s · Hindi-English" },
  { id: "saved-founder-story", label: "Founder story · 45s · English" },
  { id: "saved-product-demo-15s", label: "Product demo · 15s · Hindi" },
];

export interface ScriptInputProps {
  mode: ScriptMode;
  onModeChange: (next: ScriptMode) => void;
  text: string;
  onTextChange: (next: string) => void;
  fileName: string | null;
  onFileNameChange: (next: string | null) => void;
  /** ID of a saved script when mode === "saved". */
  savedScriptId: string | null;
  onSavedScriptChange: (id: string | null) => void;
}

const TAB_META: Record<ScriptMode, { label: string; icon: typeof Sparkles }> = {
  ai: { label: "AI", icon: Sparkles },
  saved: { label: "Saved", icon: FolderOpen },
  upload: { label: "Upload", icon: Upload },
  manual: { label: "Manual", icon: Pencil },
};

export function ScriptInput({
  mode,
  onModeChange,
  text,
  onTextChange,
  fileName,
  onFileNameChange,
  savedScriptId,
  onSavedScriptChange,
}: ScriptInputProps) {
  return (
    <div className="space-y-2">
      {/* Tab row */}
      <div
        role="tablist"
        aria-label="Script source"
        className="inline-flex rounded-md border border-border bg-card p-0.5"
      >
        {(Object.keys(TAB_META) as ScriptMode[]).map((m) => {
          const meta = TAB_META[m];
          const Icon = meta.icon;
          const active = mode === m;
          return (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onModeChange(m)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-[11px] font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="h-3 w-3" />
              {meta.label}
            </button>
          );
        })}
      </div>

      {/* Tab body */}
      {mode === "ai" && (
        <div className="rounded-lg border border-dashed border-border bg-card/40 px-3 py-3">
          <p className="text-[11px] text-foreground flex items-start gap-1.5">
            <Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
            AI will draft a script from your concept + audience + angle. You'll
            see the draft on the result card and can regenerate or edit before
            export.
          </p>
        </div>
      )}

      {mode === "saved" && (
        <select
          value={savedScriptId ?? ""}
          onChange={(e) => onSavedScriptChange(e.target.value || null)}
          className="block h-9 w-full max-w-md rounded-md border border-border bg-background px-2.5 text-xs text-foreground focus:border-primary/40 focus:outline-none"
          aria-label="Saved script"
        >
          <option value="">Pick a saved script…</option>
          {MOCK_SAVED_SCRIPTS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      )}

      {mode === "upload" && (
        <div className="rounded-lg border-2 border-dashed border-border bg-card/40 px-3 py-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-foreground">
              {fileName ?? "Upload .txt or .docx"}
            </p>
            <p className="text-[10px] text-muted-foreground">
              Drag & drop or browse — real ingest lands with the assets backend.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              // Mock — no real upload. Stub a filename so the UI shows it.
              alert("Upload wiring lands with the assets-storage backend (TODO).");
              onFileNameChange("script-draft.txt");
            }}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1 text-[11px] text-foreground hover:border-primary/40"
          >
            <Upload className="h-3 w-3" />
            Browse
          </button>
        </div>
      )}

      {mode === "manual" && (
        <textarea
          rows={4}
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          placeholder="Type your script. One line per beat. Use [ACTION] for non-spoken cues."
          className="block w-full resize-none rounded-md border border-border bg-background px-2.5 py-2 text-xs text-foreground focus:border-primary/40 focus:outline-none"
        />
      )}
    </div>
  );
}
