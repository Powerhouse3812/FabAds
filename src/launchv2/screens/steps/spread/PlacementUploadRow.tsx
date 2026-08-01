/**
 * PlacementUploadRow — Decision 20.
 * A compact row for per-placement media: placement label + thumbnail/placeholder
 * + 3 action buttons: [Upload] [Replace] [Crop].
 *
 * Upload: opens a file input dialog (mock — console.log).
 * Replace: opens the existing MediaPicker component.
 * Crop: opens PlacementCropModal for this placement's customization rule.
 */
import { useRef, useState } from "react";
import { Crop, ImageOff, RefreshCw, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import MediaPicker from "./MediaPicker";
import { PlacementCropModal } from "../../review/PlacementCropModal";
import type { AssetCustomizationRule, CreativeRef } from "../../../types";

interface Props {
  placement: string;
  /** Current creative id associated with this placement (if any). */
  creativeId?: string;
  thumbnail?: string;
  /** All available creatives for the Replace picker. */
  creatives: CreativeRef[];
  /** Current customization rules for the Crop modal. */
  cropRules: AssetCustomizationRule[];
  onUpload: (file: File) => void;
  onReplace: (id: string | undefined) => void;
  onSaveCropRules: (rules: AssetCustomizationRule[]) => void;
}

/** Human-readable placement labels. */
const PLACEMENT_LABELS: Record<string, string> = {
  facebook_feeds:       "Facebook Feed",
  facebook_stories:     "Facebook Stories",
  facebook_reels:       "Facebook Reels",
  instagram_feed:       "Instagram Feed",
  instagram_stories:    "Instagram Stories",
  instagram_reels:      "Instagram Reels",
  audience_network:     "Audience Network",
  messenger_inbox:      "Messenger Inbox",
};

function placementLabel(key: string): string {
  return PLACEMENT_LABELS[key] ?? key.replace(/_/g, " ");
}

export default function PlacementUploadRow({
  placement,
  creativeId,
  thumbnail,
  creatives,
  cropRules,
  onUpload,
  onReplace,
  onSaveCropRules,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [showReplace, setShowReplace] = useState(false);
  const [showCrop, setShowCrop] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log("[PlacementUploadRow] upload:", placement, file.name, file.type, file.size);
      onUpload(file);
    }
    // reset so the same file can be re-selected
    e.target.value = "";
  };

  return (
    <div className="flex h-14 items-center gap-3 rounded-xl border border-border bg-card px-3">
      {/* Hidden file input */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*,video/*"
        className="sr-only"
        onChange={handleFileChange}
        aria-label={`Upload media for ${placementLabel(placement)}`}
      />

      {/* Thumbnail / placeholder */}
      <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-muted">
        {thumbnail ? (
          <img
            src={thumbnail}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground/50">
            <ImageOff className="h-4 w-4" strokeWidth={1.5} />
          </div>
        )}
      </div>

      {/* Placement label */}
      <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-foreground">
        {placementLabel(placement)}
      </span>
      {!thumbnail && (
        <span className="shrink-0 font-mono text-[10px] text-muted-foreground/60">No media</span>
      )}

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-1.5">
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-7 rounded-full px-3 text-[11px]"
          onClick={() => fileRef.current?.click()}
          title="Upload media for this placement"
        >
          <Upload className="mr-1.5 h-3 w-3" strokeWidth={1.5} />
          Upload
        </Button>

        <Button
          type="button"
          size="sm"
          variant="outline"
          className={cn(
            "h-7 rounded-full px-3 text-[11px]",
            !creativeId && "opacity-50",
          )}
          disabled={creatives.length === 0}
          onClick={() => setShowReplace(true)}
          title="Replace media from creative library"
        >
          <RefreshCw className="mr-1.5 h-3 w-3" strokeWidth={1.5} />
          Replace
        </Button>

        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-7 rounded-full px-3 text-[11px]"
          onClick={() => setShowCrop(true)}
          title="Crop media for this placement"
        >
          <Crop className="mr-1.5 h-3 w-3" strokeWidth={1.5} />
          Crop
        </Button>
      </div>

      {/* Replace picker inline */}
      {showReplace && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
        >
          <div
            className="w-80 rounded-2xl border border-border bg-card p-4 shadow-lg"
          >
            <p className="mb-3 text-[13px] font-medium text-foreground">
              Replace media — {placementLabel(placement)}
            </p>
            <MediaPicker
              creatives={creatives}
              value={creativeId}
              onChange={(id) => {
                onReplace(id);
                setShowReplace(false);
              }}
            />
            <button
              type="button"
              className="mt-3 rounded-full border border-border px-3 py-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setShowReplace(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Crop modal */}
      <PlacementCropModal
        open={showCrop}
        onOpenChange={setShowCrop}
        rules={cropRules}
        creatives={creatives}
        onSave={(rules) => {
          onSaveCropRules(rules);
          setShowCrop(false);
        }}
      />
    </div>
  );
}
