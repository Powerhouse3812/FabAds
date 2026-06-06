/**
 * UploadModal — body-only stub for the Upload creative source sheet.
 *
 * Drag-drop zone UI. No upload logic yet — placeholder with a clear
 * "use Library / Genie" nudge. Header/footer live in the Sheet wrapper.
 */

import { useRef, useState } from "react";
import { UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

interface UploadModalProps {
  /** Multi-select state (wired up when upload logic lands). */
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  search: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function UploadModal({ selectedIds, onToggle, search }: UploadModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    // Upload logic will go here when the feature lands.
  }

  function handleClick() {
    inputRef.current?.click();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" || e.key === " ") handleClick();
  }

  return (
    <div className="flex flex-col items-center justify-center h-full p-8">
      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,video/mp4,video/quicktime"
        multiple
        className="hidden"
        aria-label="Select files to upload"
      />

      {/* Drop zone */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Drag and drop files, or click to browse"
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "w-full max-w-md rounded-2xl border-2 border-dashed px-8 py-12 text-center cursor-pointer transition-colors duration-150 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30",
          dragging
            ? "border-primary bg-primary/5"
            : "border-border bg-muted/20 hover:border-primary/50 hover:bg-muted/30",
        )}
      >
        <div className="flex flex-col items-center gap-4">
          <UploadCloud
            className={cn(
              "size-10 transition-colors duration-150",
              dragging ? "text-primary" : "text-muted-foreground",
            )}
            strokeWidth={1.5}
          />

          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">
              Drag &amp; drop files here
            </p>
            <p className="text-xs text-muted-foreground">
              or{" "}
              <span className="text-primary font-medium underline underline-offset-2">
                click to browse
              </span>
            </p>
          </div>

          <p className="text-[11px] font-mono text-muted-foreground">
            Supports: JPG, PNG, MP4, MOV · Max 4 GB
          </p>
        </div>
      </div>

      {/* Coming soon nudge */}
      <p className="mt-5 max-w-xs text-center text-xs text-muted-foreground leading-relaxed font-mono">
        Upload functionality coming soon — use Library or Genie to pick from existing assets.
      </p>
    </div>
  );
}
