import { Link } from "react-router-dom";
import { ArrowRight, Play } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface TileProps {
  className?: string;
}

interface VideoAnalysis {
  title: string;
  whyItWorked: string;
}

// Inline mock — no /mocks/video-sage directory exists yet.
const ITEMS: VideoAnalysis[] = [
  {
    title: "Mamaearth 15s UGC",
    whyItWorked: "Hook lands at 0.7s · Problem at 2.1s",
  },
  {
    title: "Boat earbuds TVC",
    whyItWorked: "Product reveal delayed to 4s · CTA at 11s",
  },
  {
    title: "Sleepyhead pillow ad",
    whyItWorked: "Testimonial overlay drove 23% completion",
  },
];

export function VideoSageRecentTile({ className }: TileProps) {
  const isEmpty = ITEMS.length === 0;

  return (
    <Card
      className={cn(
        "rounded-2xl border border-border bg-card p-5 shadow-none flex flex-col",
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Video Sage
          </p>
          <h3 className="text-base font-semibold text-foreground mt-0.5">
            Recent analyses
          </h3>
        </div>
        <Link
          to="/iq/video-sage"
          className="inline-flex items-center gap-1 text-xs font-medium text-foreground hover:underline whitespace-nowrap"
        >
          Analyze a video <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Body */}
      {isEmpty ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-6 mt-4">
          <Play className="h-4 w-4 text-muted-foreground mb-2" />
          <p className="text-xs text-foreground">
            Drop a video URL to get your first analysis
          </p>
        </div>
      ) : (
        <ul className="mt-4 space-y-3 flex-1">
          {ITEMS.map((item, i) => (
            <li key={i} className="flex items-start gap-3">
              <div
                className="h-8 w-10 shrink-0 rounded-md bg-foreground/10 flex items-center justify-center"
                aria-hidden
              >
                <Play className="h-3 w-3 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[12.5px] leading-snug font-medium text-foreground line-clamp-1">
                  {item.title}
                </p>
                <p className="text-[11px] leading-snug text-muted-foreground line-clamp-1 mt-0.5">
                  {item.whyItWorked}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
