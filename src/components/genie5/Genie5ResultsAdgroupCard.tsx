import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ThumbsUp, ThumbsDown, BookmarkPlus, Download, Rocket,
  RefreshCw, FileText, Loader2, ImageIcon, Copy, FolderPlus, MoreHorizontal, Pencil,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useSubmitFeedback } from "@/hooks/use-genie-feedback";

export interface AdgroupResult {
  id: string;
  imageUrl: string;
  pageName: string;
  pageAvatarColor: string;
  headline: string;
  primaryText: string;
  description: string;
  cta: string;
  tags: string[];
  strategy?: string;
}

interface Props {
  result: AdgroupResult;
  selected?: boolean;
  onSelect?: () => void;
  onSaveToLibrary: () => void;
  onLaunch: () => void;
  onRegenerate: () => void;
  onSaveAsTemplate: () => void;
  onDownloadImage?: () => void;
  onSaveImageToLibrary?: () => void;
  onEditCopy?: () => void;
  isRegenerating?: boolean;
}

export function Genie5ResultsAdgroupCard({
  result,
  selected,
  onSelect,
  onSaveToLibrary,
  onLaunch,
  onRegenerate,
  onSaveAsTemplate,
  onDownloadImage,
  onSaveImageToLibrary,
  onEditCopy,
  isRegenerating,
}: Props) {
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null);
  const [popoverType, setPopoverType] = useState<"up" | "down" | null>(null);
  const [comment, setComment] = useState("");
  const submitFeedback = useSubmitFeedback();

  const handleThumbClick = (type: "up" | "down") => {
    if (feedback === type) {
      // Toggle off — just clear state
      setFeedback(null);
      setPopoverType(null);
      return;
    }
    setPopoverType(type);
  };

  const handleSubmitFeedback = () => {
    const type = popoverType!;
    setFeedback(type);
    submitFeedback.mutate({
      targetId: result.id,
      targetType: "result_card",
      feedbackType: type,
      comment: comment.trim() || undefined,
      strategyAngle: result.strategy || undefined,
      strategyTitle: result.headline,
    });
    toast.success("Thanks! This improves future generations");
    setComment("");
    setPopoverType(null);
  };

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = result.imageUrl;
    a.download = `adgroup-${result.id.slice(0, 8)}.png`;
    a.target = "_blank";
    a.click();
    toast.success("Downloading...");
  };

  const handleCopyText = () => {
    const text = `Headline: ${result.headline}\nPrimary Text: ${result.primaryText}\nDescription: ${result.description}`;
    navigator.clipboard.writeText(text);
    toast.success("Ad copy text copied!");
  };

  return (
    <div
      onClick={onSelect}
      className={cn(
        "rounded-xl border bg-card overflow-hidden transition-shadow group",
        selected
          ? "border-primary ring-2 ring-primary/20 shadow-lg"
          : "border-border hover:shadow-lg",
        onSelect && "cursor-pointer"
      )}
    >
      {/* Page header */}
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-border">
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
          style={{ backgroundColor: result.pageAvatarColor }}
        >
          {result.pageName.charAt(0)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-foreground truncate">{result.pageName}</p>
          <p className="text-[10px] text-muted-foreground">Sponsored</p>
        </div>
      </div>

      {/* Primary text */}
      <div className="px-3 py-1.5">
        <p className="text-[11px] text-foreground leading-relaxed line-clamp-2">{result.primaryText}</p>
      </div>

      {/* Media */}
      <div className="aspect-[3/2] bg-muted/40 relative overflow-hidden">
        <img src={result.imageUrl} alt={result.headline} className="w-full h-full object-cover" loading="lazy" />
        {result.strategy && (
          <Badge variant="secondary" className="absolute top-2 right-2 text-[9px] bg-background/80 backdrop-blur-sm">
            {result.strategy}
          </Badge>
        )}
      </div>

      {/* Link strip */}
      <div className="px-3 py-1.5 border-t border-border bg-muted/20">
        <p className="text-[11px] font-semibold text-foreground truncate">{result.headline}</p>
        <p className="text-[10px] text-muted-foreground truncate mt-0.5">{result.description}</p>
      </div>

      {/* Tags */}
      {result.tags.length > 0 && (
        <div className="px-3 py-1 flex gap-1 flex-wrap">
          {result.tags.map((t) => (
            <Badge key={t} variant="outline" className="text-[9px] h-4 px-1.5">
              {t}
            </Badge>
          ))}
        </div>
      )}

      {/* Action bar */}
      <div className="flex items-center gap-1 px-3 py-2 border-t border-border">
        {/* Thumbs Up with Popover */}
        <Popover open={popoverType === "up"} onOpenChange={(v) => !v && setPopoverType(null)}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost" size="icon"
              className={cn("h-7 w-7", feedback === "up" && "text-primary bg-primary/10")}
              onClick={() => handleThumbClick("up")}
            >
              <ThumbsUp className="h-3 w-3" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-3 space-y-2" align="start">
            <p className="text-xs font-medium text-foreground">What did you like?</p>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Optional — tell us more..."
              className="min-h-[50px] text-xs resize-none"
            />
            <Button size="sm" className="w-full h-7 text-xs" onClick={handleSubmitFeedback}>
              Submit
            </Button>
          </PopoverContent>
        </Popover>

        {/* Thumbs Down with Popover */}
        <Popover open={popoverType === "down"} onOpenChange={(v) => !v && setPopoverType(null)}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost" size="icon"
              className={cn("h-7 w-7", feedback === "down" && "text-destructive bg-destructive/10")}
              onClick={() => handleThumbClick("down")}
            >
              <ThumbsDown className="h-3 w-3" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-3 space-y-2" align="start">
            <p className="text-xs font-medium text-foreground">What went wrong?</p>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Optional — help us improve..."
              className="min-h-[50px] text-xs resize-none"
            />
            <Button size="sm" className="w-full h-7 text-xs" onClick={handleSubmitFeedback}>
              Submit
            </Button>
          </PopoverContent>
        </Popover>

        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onSaveToLibrary}>
          <BookmarkPlus className="h-3 w-3" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCopyText}>
          <Copy className="h-3 w-3" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onLaunch}>
          <Rocket className="h-3 w-3" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 ml-auto">
              <MoreHorizontal className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            {onEditCopy && (
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEditCopy(); }}>
                <Pencil className="h-3.5 w-3.5 mr-2" /> Edit Copy
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={handleDownload}>
              <Download className="h-3.5 w-3.5 mr-2" /> Download
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onRegenerate} disabled={isRegenerating}>
              {isRegenerating ? <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5 mr-2" />}
              Regenerate
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onSaveAsTemplate}>
              <FileText className="h-3.5 w-3.5 mr-2" /> Save as Template
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDownloadImage || handleDownload}>
              <ImageIcon className="h-3.5 w-3.5 mr-2" /> Download Image
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onSaveImageToLibrary || onSaveToLibrary}>
              <FolderPlus className="h-3.5 w-3.5 mr-2" /> Save Image to Library
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
