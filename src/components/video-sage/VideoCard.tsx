import { format } from "date-fns";
import { Play, Download, RefreshCw, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { VideoSageVideo } from "@/hooks/use-video-sage";

interface Props {
  video: VideoSageVideo;
  onOpen: (id: string) => void;
}

function formatDuration(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export default function VideoCard({ video, onOpen }: Props) {
  const isAnalysing = video.status === "analysing";
  const isFailed = video.status === "failed";
  const meta = video.analysis?.metadata;

  return (
    <Card
      className="overflow-hidden cursor-pointer group hover:shadow-md transition-shadow"
      onClick={() => !isAnalysing && onOpen(video.id)}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-muted overflow-hidden">
        {video.thumbnail_url ? (
          <img
            src={video.thumbnail_url}
            alt={video.title}
            className={`w-full h-full object-cover ${isAnalysing ? "opacity-50 animate-pulse" : ""}`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Play className="w-8 h-8 text-muted-foreground" />
          </div>
        )}

        {/* Badges on thumbnail */}
        <div className="absolute bottom-2 left-2 flex gap-1.5">
          <Badge variant="secondary" className="text-[10px] bg-background/80 backdrop-blur-sm">
            {video.language}
          </Badge>
          <Badge variant="secondary" className="text-[10px] bg-background/80 backdrop-blur-sm">
            {formatDuration(video.duration_seconds)}
          </Badge>
        </div>

        {isAnalysing && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/30 backdrop-blur-[2px]">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 space-y-2">
        <h3 className="text-sm font-medium text-foreground truncate" title={video.title}>
          {video.title}
        </h3>

        {meta && (
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
            <span>Scripting: <span className="text-foreground">{meta.scriptingStyle}</span></span>
            <span>Caption: <span className="text-foreground">{meta.captionTheme}</span></span>
          </div>
        )}

        <div className="flex items-center justify-between pt-1">
          <span className="text-[11px] text-muted-foreground">
            {format(new Date(video.created_at), "MMM d, yyyy")}
          </span>

          {isAnalysing && (
            <Badge className="text-[10px] bg-primary/10 text-primary border-primary/20">
              <Loader2 className="w-3 h-3 mr-1 animate-spin" /> Generating
            </Badge>
          )}
          {video.status === "analysed" && (
            <Badge className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
              Analysed
            </Badge>
          )}
          {isFailed && (
            <Badge variant="destructive" className="text-[10px]">
              Failed
            </Badge>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity pt-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); onOpen(video.id); }}>
            <Play className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" disabled>
            <Download className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" disabled>
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
