import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ThumbsUp, MessageCircle, Share2 } from "lucide-react";

interface Props {
  pageName: string;
  pageAvatarUrl?: string;
  adType?: string;
  primaryText?: string;
  mediaUrl?: string;
  mediaType?: "image" | "video";
  headline?: string;
  description?: string;
  destinationUrl?: string;
  displayLink?: string;
  cta?: string;
}

export function AdPreviewPanel({
  pageName = "Page Name",
  pageAvatarUrl,
  adType = "Static",
  primaryText,
  mediaUrl,
  headline,
  description,
  destinationUrl,
  displayLink,
  cta = "CTA button",
}: Props) {
  return (
    <div className="flex flex-col h-full">
      <h3 className="text-sm font-semibold text-foreground mb-3">Ad Preview</h3>
      <div className="flex-1 rounded-xl border border-border bg-card overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-2 p-3">
          <Avatar className="h-8 w-8">
            {pageAvatarUrl ? <AvatarImage src={pageAvatarUrl} /> : null}
            <AvatarFallback className="text-xs">{pageName[0] || "P"}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-foreground truncate">{pageName || "Page Name"}</p>
            <p className="text-[10px] text-muted-foreground">Sponsored</p>
          </div>
          <Badge variant="secondary" className="text-[9px] px-1.5 h-4 shrink-0">{adType}</Badge>
        </div>

        {/* Primary text */}
        <div className="px-3 pb-2">
          <p className="text-xs text-foreground">{primaryText || "Your primary text will appear here…"}</p>
        </div>

        {/* Media */}
        <div className="bg-muted aspect-square flex items-center justify-center overflow-hidden">
          {mediaUrl ? (
            <img src={mediaUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <p className="text-xs text-muted-foreground">Media preview</p>
          )}
        </div>

        {/* Link strip */}
        <div className="px-3 py-2 bg-muted/50 flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-[10px] text-muted-foreground truncate">{displayLink || destinationUrl || "example.com"}</p>
            <p className="text-xs font-semibold text-foreground truncate">{headline || "Headline"}</p>
            <p className="text-[10px] text-muted-foreground truncate">{description || "Description"}</p>
          </div>
          <Button size="sm" variant="secondary" className="h-7 text-[10px] shrink-0 ml-2">{cta}</Button>
        </div>

        {/* Social bar */}
        <div className="flex items-center justify-around py-2 border-t border-border">
          <button className="flex items-center gap-1 text-[10px] text-muted-foreground"><ThumbsUp className="h-3 w-3" /> Like</button>
          <button className="flex items-center gap-1 text-[10px] text-muted-foreground"><MessageCircle className="h-3 w-3" /> Comment</button>
          <button className="flex items-center gap-1 text-[10px] text-muted-foreground"><Share2 className="h-3 w-3" /> Share</button>
        </div>
      </div>
    </div>
  );
}
