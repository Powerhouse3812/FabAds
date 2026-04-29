import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Upload, FolderOpen, Trash2, Image, Video, GripVertical } from "lucide-react";
import { useUploadCreativeAsset, type CreativeAsset } from "@/hooks/use-creative-assets";
import CreativeLibraryModal from "./CreativeLibraryModal";

export interface MediaAsset {
  url: string;
  file_name: string;
  file_type: string;
  width?: number | null;
  height?: number | null;
  asset_id?: string;
}

interface Props {
  assets: MediaAsset[];
  onChange: (assets: MediaAsset[]) => void;
  /** "image" | "video" | "all" */
  acceptType?: "image" | "video" | "all";
  /** Max number of assets */
  max?: number;
  label?: string;
  required?: boolean;
}

export default function MediaPickerSection({
  assets, onChange, acceptType = "all", max = 10, label = "Media", required = false,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const { upload, uploading, progress } = useUploadCreativeAsset();

  const acceptStr = acceptType === "image" ? "image/*" : acceptType === "video" ? "video/*" : "image/*,video/*";

  const handleUpload = async (fileList: FileList | null) => {
    if (!fileList?.length) return;
    const files = Array.from(fileList);
    try {
      const uploaded = await upload({ files });
      const newAssets: MediaAsset[] = uploaded.map((a: CreativeAsset) => ({
        url: a.url,
        file_name: a.file_name,
        file_type: a.file_type,
        width: a.width,
        height: a.height,
        asset_id: a.id,
      }));
      onChange([...assets, ...newAssets].slice(0, max));
    } catch {
      // error handled by toast in hook or parent
    }
  };

  const handleLibrarySelect = (selected: CreativeAsset[]) => {
    const newAssets: MediaAsset[] = selected.map((a) => ({
      url: a.url,
      file_name: a.file_name,
      file_type: a.file_type,
      width: a.width,
      height: a.height,
      asset_id: a.id,
    }));
    onChange([...assets, ...newAssets].slice(0, max));
  };

  const removeAsset = (index: number) => {
    onChange(assets.filter((_, i) => i !== index));
  };

  const formatDims = (a: MediaAsset) => {
    if (a.width && a.height) return `${a.width}×${a.height}`;
    return null;
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-medium">
          {label} ({assets.length}/{max}) {required && <span className="text-destructive">*</span>}
        </Label>
      </div>

      {/* Thumbnail grid */}
      {assets.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {assets.map((asset, i) => (
            <div key={`${asset.url}-${i}`} className="relative group border border-border rounded-md overflow-hidden bg-muted">
              <div className="aspect-square flex items-center justify-center">
                {asset.file_type === "video" ? (
                  <Video className="h-6 w-6 text-muted-foreground" />
                ) : (
                  <img src={asset.url} alt={asset.file_name} className="w-full h-full object-cover" />
                )}
              </div>
              <div className="px-1.5 py-1 space-y-0.5">
                <p className="text-[9px] font-medium truncate text-foreground">{asset.file_name}</p>
                <div className="flex items-center gap-1">
                  <Badge variant="secondary" className="text-[8px] px-1 py-0 h-3.5">{asset.file_type}</Badge>
                  {formatDims(asset) && <span className="text-[8px] text-muted-foreground">{formatDims(asset)}</span>}
                </div>
              </div>
              {/* Remove button */}
              <button
                type="button"
                onClick={() => removeAsset(i)}
                className="absolute top-1 right-1 h-5 w-5 rounded bg-destructive/90 text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload progress */}
      {uploading && (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Uploading...</p>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2">
        <input ref={inputRef} type="file" accept={acceptStr} multiple className="hidden" onChange={(e) => handleUpload(e.target.files)} />
        <Button
          type="button" variant="outline" size="sm"
          disabled={uploading || assets.length >= max}
          onClick={() => inputRef.current?.click()}
          className="text-xs"
        >
          <Upload className="h-3.5 w-3.5 mr-1" /> Upload
        </Button>
        <Button
          type="button" variant="outline" size="sm"
          disabled={assets.length >= max}
          onClick={() => setLibraryOpen(true)}
          className="text-xs"
        >
          <FolderOpen className="h-3.5 w-3.5 mr-1" /> Creative Library
        </Button>
      </div>

      <CreativeLibraryModal
        open={libraryOpen}
        onOpenChange={setLibraryOpen}
        onSelect={handleLibrarySelect}
        filterType={acceptType}
        selectedUrls={assets.map((a) => a.url)}
        multiple={max > 1}
      />
    </div>
  );
}
