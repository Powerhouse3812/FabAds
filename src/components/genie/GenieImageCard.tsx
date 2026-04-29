import { useState } from "react";
import { Download, FolderPlus, Pencil, Copy, Rocket, Trash2, Loader2, ThumbsUp, ThumbsDown, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import type { GenieGeneration } from "@/hooks/use-genie-generations";

interface Props {
  generation: GenieGeneration;
  selected: boolean;
  onSelect: (id: string, checked: boolean) => void;
  onEdit: (gen: GenieGeneration) => void;
  onVariation: (gen: GenieGeneration) => void;
  onLaunch: (gen: GenieGeneration) => void;
  onDelete: (id: string) => void;
  onSaveToLibrary: (gen: GenieGeneration) => void;
  onAIEdit: (gen: GenieGeneration) => void;
  isDeleting?: boolean;
}

export function GenieImageCard({
  generation,
  selected,
  onSelect,
  onEdit,
  onVariation,
  onLaunch,
  onDelete,
  onSaveToLibrary,
  onAIEdit,
  isDeleting,
}: Props) {
  const [hovering, setHovering] = useState(false);
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null);
  const settings = generation.settings || {};

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = generation.output_url;
    a.download = `genie-${generation.id.slice(0, 8)}.png`;
    a.target = "_blank";
    a.click();
  };

  const handleFeedback = (type: "up" | "down") => {
    setFeedback(type);
    toast.success("Thanks! This improves future generations");
  };

  const handleSaveAsTemplate = () => {
    toast.success("Saved as template");
  };

  return (
    <div
      className="group relative rounded-lg overflow-hidden border border-border bg-card transition-shadow hover:shadow-md"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      {/* Checkbox */}
      <div className={`absolute top-2 left-2 z-10 transition-opacity ${hovering || selected ? "opacity-100" : "opacity-0"}`}>
        <Checkbox
          checked={selected}
          onCheckedChange={(v) => onSelect(generation.id, !!v)}
          className="bg-background/80 border-border"
        />
      </div>

      {/* Image */}
      <div className="aspect-square">
        <img
          src={generation.output_url}
          alt={generation.prompt}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>

      {/* Metadata badges */}
      <div className="absolute top-2 right-2 flex gap-1 z-10">
        {settings.aspect_ratio && settings.aspect_ratio !== "auto" && (
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-background/80 backdrop-blur-sm">
            {settings.aspect_ratio}
          </Badge>
        )}
        {settings.category && (
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-background/80 backdrop-blur-sm">
            {settings.category}
          </Badge>
        )}
      </div>

      {/* Hover overlay with actions */}
      <div
        className={`absolute inset-0 bg-black/50 flex flex-col justify-end p-2 transition-opacity ${
          hovering ? "opacity-100" : "opacity-0"
        }`}
      >
        <p className="text-white text-[11px] line-clamp-2 mb-2">{generation.prompt}</p>
        <div className="flex gap-1 flex-wrap">
          <ActionBtn icon={ThumbsUp} title="Like" onClick={() => handleFeedback("up")} className={feedback === "up" ? "bg-primary/40" : ""} />
          <ActionBtn icon={ThumbsDown} title="Dislike" onClick={() => handleFeedback("down")} className={feedback === "down" ? "bg-destructive/40" : ""} />
          <ActionBtn icon={Download} title="Download" onClick={handleDownload} />
          <ActionBtn icon={FolderPlus} title="Save to library" onClick={() => onSaveToLibrary(generation)} />
          <ActionBtn icon={Pencil} title="Edit with AI" onClick={() => onAIEdit(generation)} />
          <ActionBtn icon={Copy} title="Variations" onClick={() => onVariation(generation)} />
          <ActionBtn icon={Rocket} title="Launch" onClick={() => onLaunch(generation)} />
          <ActionBtn icon={FileText} title="Save as template" onClick={handleSaveAsTemplate} />
          <ActionBtn
            icon={isDeleting ? Loader2 : Trash2}
            title="Delete"
            onClick={() => onDelete(generation.id)}
            className={isDeleting ? "animate-spin" : ""}
            destructive
          />
        </div>
      </div>
    </div>
  );
}

function ActionBtn({
  icon: Icon,
  title,
  onClick,
  className = "",
  destructive,
}: {
  icon: any;
  title: string;
  onClick: () => void;
  className?: string;
  destructive?: boolean;
}) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      title={title}
      className={`p-1.5 rounded-md transition-colors ${
        destructive
          ? "bg-destructive/20 hover:bg-destructive/40 text-white"
          : "bg-white/20 hover:bg-white/30 text-white"
      } ${className}`}
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}
