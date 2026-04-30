import { useState } from "react";
import { Upload, Link } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDraft } from "../../stores/draftStore";
import { OptionalFieldCollapse } from "./OptionalFieldCollapse";

type InputMode = "url" | "upload";

export function SourceImagePicker() {
  const { draft, dispatch } = useDraft();
  const [mode, setMode] = useState<InputMode>("url");

  // For Image-to-Ad mode: the source image is OPTIONAL when sub-method is "brief-to-ad"
  // (user supplies a brief instead of an image). Per Maalik (Track 4.4): show collapsed
  // accordion instead of hiding — user must still see field exists. They can expand
  // and fill it if they want; the brief still drives generation when source-image is empty.
  const isOptional =
    draft.mode === "image-to-ad" && draft.subMethod === "brief-to-ad";

  const body = (
    <SourceImageBody draft={draft} dispatch={dispatch} mode={mode} setMode={setMode} />
  );

  if (isOptional) {
    return (
      <OptionalFieldCollapse
        label="Source image"
        reason="Brief-to-Ad uses your brief instead — image is optional"
      >
        {body}
      </OptionalFieldCollapse>
    );
  }

  return (
    <div className="space-y-2">
      <label className="text-g6-sm font-medium text-g6-text">
        Source image <span className="text-g6-text-tertiary">(required)</span>
      </label>
      {body}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Body extracted so both required + collapsible variants share UI
   ───────────────────────────────────────────────────────── */
function SourceImageBody({
  draft,
  dispatch,
  mode,
  setMode,
}: {
  draft: ReturnType<typeof useDraft>["draft"];
  dispatch: ReturnType<typeof useDraft>["dispatch"];
  mode: InputMode;
  setMode: (m: InputMode) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex gap-1">
        {(["url", "upload"] as InputMode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={cn(
              "flex items-center gap-1.5 rounded-g6-pill border px-3 py-1 text-g6-xs font-medium transition-colors",
              mode === m
                ? "border-g6-primary bg-g6-primary text-g6-text-on-accent"
                : "border-g6-border-secondary text-g6-text-secondary hover:text-g6-text"
            )}
          >
            {m === "url" ? <Link className="h-3 w-3" /> : <Upload className="h-3 w-3" />}
            {m === "url" ? "Paste URL" : "Upload"}
          </button>
        ))}
      </div>

      {mode === "url" ? (
        <input
          type="url"
          value={draft.sourceImageUrl ?? ""}
          onChange={(e) =>
            dispatch({ type: "SET_SOURCE_IMAGE", sourceImageUrl: e.target.value || null })
          }
          placeholder="https://cdn.example.com/product.jpg"
          className="h-g6-lg w-full rounded-g6-base border border-g6-border bg-g6-bg-container px-3 font-g6-mono text-g6-base text-g6-text placeholder:text-g6-text-disabled focus:border-g6-primary focus:outline-none focus:ring-2 focus:ring-g6-primary/20"
        />
      ) : (
        <label className="flex h-24 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-g6-base border-2 border-dashed border-g6-border bg-g6-bg-container text-g6-text-secondary transition-colors hover:border-g6-primary hover:bg-g6-primary-bg">
          <Upload className="h-5 w-5" />
          <span className="text-g6-sm">Click to upload or drag image here</span>
          <input type="file" accept="image/*" className="sr-only" />
        </label>
      )}

      {draft.sourceImageUrl && (
        <div className="mt-1 flex items-center gap-2 rounded-g6-base border border-g6-primary-border bg-g6-primary-bg px-3 py-2">
          <img
            src={draft.sourceImageUrl}
            alt="Source preview"
            className="h-8 w-8 rounded-g6-base object-cover"
            onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
          />
          <span className="flex-1 truncate font-g6-mono text-g6-xs text-g6-text-secondary">
            {draft.sourceImageUrl}
          </span>
        </div>
      )}
    </div>
  );
}
