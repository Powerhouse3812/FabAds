import { useRef } from "react";
import { Upload, Image as ImageIcon, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * UploadsPanel — A-11.23.
 *
 * Compact upload panel inside the References tab. Per Maalik's spec:
 * "Upload wale ko minimise kro height me." Single thin drop zone row at
 * top + a horizontal-scroll list of uploaded thumbnails below.
 *
 * Each upload is inline-selectable (check overlay). Click X to remove.
 *
 * Real upload wiring lands with the assets-storage backend — for now,
 * the file picker creates a stub upload entry with a generated thumbnail
 * URL via URL.createObjectURL.
 */

export interface LocalUpload {
  id: string;
  name: string;
  thumbnail: string;
  /** Whether the upload is "attached" to the generation as a reference. */
  selected: boolean;
}

export interface UploadsPanelProps {
  uploads: LocalUpload[];
  onAdd: (uploads: LocalUpload[]) => void;
  onToggleSelect: (id: string) => void;
  onRemove: (id: string) => void;
}

export function UploadsPanel({
  uploads,
  onAdd,
  onToggleSelect,
  onRemove,
}: UploadsPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const next: LocalUpload[] = [];
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      next.push({
        id: `upload-${Date.now()}-${i}-${f.name}`,
        name: f.name,
        thumbnail: URL.createObjectURL(f),
        selected: true,
      });
    }
    onAdd(next);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div className="space-y-3">
      {/* Drop zone — taller, conventional upload area */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        className={cn(
          "group relative w-full h-24 flex items-center justify-center gap-3 rounded-md border-2 border-dashed border-border bg-card/40 px-4",
          "transition-colors",
          "hover:border-primary/40 hover:bg-card",
          "outline-none focus-visible:ring-2 focus-visible:ring-foreground/40 focus-visible:ring-offset-1",
        )}
      >
        <div className="flex flex-col items-center gap-1">
          <Upload className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs text-foreground font-medium">
            Drop files here or browse
          </span>
          <span className="text-[10px] text-muted-foreground">
            PNG · JPG · MP4 · up to 50MB each
          </span>
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-md border border-border bg-card px-2.5 py-1 text-[11px] text-foreground",
            "group-hover:border-primary/40",
          )}
        >
          <Upload className="h-3 w-3" />
          Browse
        </span>
        <span className="absolute top-2 right-2 rounded-full bg-muted px-1.5 py-0.5 font-mono text-[9px] font-bold text-muted-foreground">
          {uploads.length}
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {/* Uploads list */}
      {uploads.length === 0 ? (
        <p className="text-[11px] text-muted-foreground italic px-1">
          No files uploaded yet. Upload your own creative or screenshots to
          anchor the generation.
        </p>
      ) : (
        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
          {uploads.map((u) => (
            <UploadTile
              key={u.id}
              upload={u}
              onToggle={() => onToggleSelect(u.id)}
              onRemove={() => onRemove(u.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────── */

function UploadTile({
  upload,
  onToggle,
  onRemove,
}: {
  upload: LocalUpload;
  onToggle: () => void;
  onRemove: () => void;
}) {
  return (
    <div
      className={cn(
        "group relative shrink-0 w-[88px] aspect-square overflow-hidden rounded-lg border bg-card transition-all",
        upload.selected
          ? "border-primary ring-2 ring-primary/30"
          : "border-border/60 hover:border-primary/40",
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={upload.selected}
        aria-label={`${upload.selected ? "Detach" : "Attach"} ${upload.name}`}
        title={upload.name}
        className="absolute inset-0 outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        {upload.thumbnail ? (
          <img
            src={upload.thumbnail}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted">
            <ImageIcon className="h-4 w-4 text-muted-foreground/50" />
          </div>
        )}
        {upload.selected && (
          <span className="absolute top-1 right-1 inline-flex h-4.5 w-4.5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow animate-v3-pop-in">
            <Check className="h-2.5 w-2.5" />
          </span>
        )}
      </button>
      {/* Remove (hover) */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        aria-label={`Remove ${upload.name}`}
        className="absolute bottom-1 right-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-foreground/70 text-background opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X className="h-2.5 w-2.5" />
      </button>
    </div>
  );
}
