import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload, X } from "lucide-react";
import { useMediaUpload } from "@/hooks/use-media-upload";

interface MediaUploaderProps {
  launchId: string;
  adId: string;
  currentUrls: string[];
  onUploaded: (urls: string[]) => void;
}

export function MediaUploader({ launchId, adId, currentUrls, onUploaded }: MediaUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { upload, uploading } = useMediaUpload();

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    try {
      const urls = await upload(launchId, adId, Array.from(files));
      onUploaded(urls);
    } catch {
      // toast handled elsewhere
    }
  };

  return (
    <div className="space-y-2">
      <Label className="text-xs">Media</Label>
      {currentUrls.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {currentUrls.map((url, i) => (
            <div key={i} className="relative w-16 h-16 rounded border border-border overflow-hidden bg-muted">
              <img src={url} alt="" className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      )}
      <input ref={inputRef} type="file" accept="image/*,video/*" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
      <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => inputRef.current?.click()}>
        <Upload className="h-3.5 w-3.5 mr-1" />
        {uploading ? "Uploading..." : "Upload Media"}
      </Button>
    </div>
  );
}
