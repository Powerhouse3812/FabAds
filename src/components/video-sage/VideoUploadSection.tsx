import { useRef } from "react";
import { Upload, FolderOpen, HardDrive, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface Props {
  onFileSelected: (file: File) => void;
  uploading?: boolean;
}

export default function VideoUploadSection({ onFileSelected, uploading }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <Card className="p-8 flex flex-col items-center text-center gap-5 border-dashed border-2 border-border bg-card">
      <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
        <Sparkles className="w-7 h-7 text-primary" />
      </div>

      <div>
        <h2 className="text-lg font-semibold text-foreground">
          Analyse videos made easy with Video Sage
        </h2>
        <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
          Upload your ad videos and get detailed analysis — framework breakdown, storyboard, scripts, and more.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" className="gap-2" disabled>
          <FolderOpen className="w-4 h-4" />
          Select from Library
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="w-4 h-4" />
          Upload local files
        </Button>
        <Button variant="outline" size="sm" className="gap-2" disabled>
          <HardDrive className="w-4 h-4" />
          Select from Google Drive
        </Button>
      </div>

      <Button
        className="w-full max-w-xs font-semibold"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? "Uploading…" : "Analyse video (02 credit)"}
      </Button>

      <p className="text-xs text-muted-foreground">
        Supported formats: MP4, MOV, WMV — Max 500 MB
      </p>

      <input
        ref={inputRef}
        type="file"
        accept="video/mp4,video/quicktime,video/x-ms-wmv"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFileSelected(f);
          e.target.value = "";
        }}
      />
    </Card>
  );
}
