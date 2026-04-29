import { useState, useCallback } from "react";
import { X, ImagePlus, Upload, FolderOpen, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const MAX_IMAGES = 20;

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

interface Props {
  images: string[];
  onChange: (images: string[]) => void;
  referenceMode: "merge" | "separate";
  onModeChange: (mode: "merge" | "separate") => void;
  onSelectFromLibrary?: () => void;
}

export function GenieReferenceMedia({ images, onChange, referenceMode, onModeChange, onSelectFromLibrary }: Props) {
  const [dragOver, setDragOver] = useState(false);

  const addImages = useCallback(
    async (files: File[]) => {
      const imageFiles = files.filter((f) => f.type.startsWith("image/"));
      if (!imageFiles.length) return;

      const remaining = MAX_IMAGES - images.length;
      if (remaining <= 0) {
        toast.warning(`Maximum ${MAX_IMAGES} reference images allowed`);
        return;
      }
      const toProcess = imageFiles.slice(0, remaining);
      if (imageFiles.length > remaining) {
        toast.warning(`Only ${remaining} more image(s) can be added (max ${MAX_IMAGES})`);
      }

      const results = await Promise.all(toProcess.map(readFileAsDataURL));
      onChange([...images, ...results]);
    },
    [images, onChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const files = Array.from(e.dataTransfer.files);
      addImages(files);
    },
    [addImages]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      addImages(files);
      e.target.value = "";
    },
    [addImages]
  );

  const removeImage = (idx: number) => {
    onChange(images.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
          dragOver ? "border-primary bg-primary/5" : "border-border"
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => document.getElementById("genie-ref-file-input")?.click()}
      >
        <ImagePlus className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Drag or Upload a reference image to guide AI's visual style, layout or theme.
        </p>
        <p className="text-xs text-muted-foreground/70 mt-1">Supported formats: JPEG, PNG, Zip · Max {MAX_IMAGES} images</p>
      </div>

      {/* Three action buttons */}
      <div className="grid grid-cols-3 gap-2">
        <Button variant="outline" size="sm" className="text-xs h-8 w-full" onClick={onSelectFromLibrary}>
          <FolderOpen className="h-3.5 w-3.5 mr-1.5" />
          Select from Library
        </Button>
        <label className="contents">
          <Button variant="outline" size="sm" className="text-xs h-8 w-full" asChild>
            <span>
              <Upload className="h-3.5 w-3.5 mr-1.5" />
              Upload local files
            </span>
          </Button>
          <input
            id="genie-ref-file-input"
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />
        </label>
        <Button variant="outline" size="sm" className="text-xs h-8 w-full">
          <Globe className="h-3.5 w-3.5 mr-1.5" />
          Select from google drive
        </Button>
      </div>

      {/* Uploaded thumbnails */}
      {images.length > 0 && (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">
            {images.length} reference image{images.length > 1 ? "s" : ""} added
          </Label>
          <div className="flex gap-2 flex-wrap">
            {images.map((img, i) => (
              <div key={i} className="relative w-16 h-16 rounded-md overflow-hidden border border-border group">
                <img src={img} alt="" className="w-full h-full object-cover" />
                <button
                  onClick={() => removeImage(i)}
                  className="absolute top-0.5 right-0.5 bg-background/80 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3 text-foreground" />
                </button>
              </div>
            ))}
          </div>

          {images.length > 1 && (
            <div className="flex gap-2">
              {(["merge", "separate"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => onModeChange(mode)}
                  className={`px-3 py-1 text-xs rounded-md border transition-colors ${
                    referenceMode === mode
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-foreground border-border hover:bg-accent"
                  }`}
                >
                  {mode === "merge" ? "Merge all" : "Separate variations"}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
