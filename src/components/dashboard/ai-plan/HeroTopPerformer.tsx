/**
 * HeroTopPerformer — "win" card for the AI-plan dashboard hero strip.
 *
 * Definition of "top" (per redo-all-this-stuff-tidy-rain.md plan):
 *   sort generations by `wasUsed DESC, qualityScore DESC, createdAt DESC`
 *   then pick the head.
 *
 * Data — there is no "wasUsed" field on real OutputData yet (the genie6
 * library tracks `qualityScore` but not "was this script actually used in
 * a live campaign"), so we synthesize a believable winning entry inline
 * off the first brand in `mocks/shared/brands.ts`. When the real entity
 * lands, swap `mockTopPerformer()` for the real selector.
 */
import { Sparkles, Star, ArrowRight, Layers, BookmarkPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { brands } from "@/mocks/shared/brands";

interface HeroTopPerformerProps {
  className?: string;
}

interface TopPerformer {
  id: string;
  name: string;
  qualityScore: number;
  wasUsed: boolean;
  ageDays: number;
  brand: { id: string; name: string; logo: string };
  mode: string;
  thumbnail: string;
}

/**
 * Synthesised top performer. Real selector should sort the library by
 * `wasUsed DESC, qualityScore DESC, createdAt DESC` and pick the head.
 */
function mockTopPerformer(): TopPerformer | null {
  const brand = brands[0];
  if (!brand) return null;
  return {
    id: "gen-top-mock-1",
    name: "Onion Shampoo · UGC drift cut",
    qualityScore: 92,
    wasUsed: true,
    ageDays: 2,
    brand: { id: brand.id, name: brand.name, logo: brand.logo },
    mode: "UGC Video",
    thumbnail:
      "https://images.unsplash.com/photo-1631730486572-226d1f595b68?auto=format&fit=crop&w=600&q=70",
  };
}

export function HeroTopPerformer({ className }: HeroTopPerformerProps) {
  const navigate = useNavigate();
  const top = mockTopPerformer();

  if (!top) {
    return (
      <Card className={cn("h-[300px]", className)}>
        <CardContent className="h-full flex flex-col items-center justify-center text-center gap-3 p-6">
          <div className="h-12 w-12 rounded-full bg-primary/15 flex items-center justify-center">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold">No top performer yet</p>
            <p className="text-xs text-muted-foreground max-w-[260px]">
              Generate your first ad to claim this spot
            </p>
          </div>
          <Button
            size="sm"
            className="mt-2"
            onClick={() => navigate("/iq/genie6/generate")}
          >
            Start a generation
          </Button>
        </CardContent>
      </Card>
    );
  }

  const isElite = top.qualityScore >= 85;
  const ageLabel =
    top.ageDays <= 0
      ? "today"
      : top.ageDays === 1
        ? "1 day ago"
        : `${top.ageDays} days ago`;

  return (
    <Card
      className={cn(
        "h-[300px] overflow-hidden transition-colors hover:border-foreground/20",
        className
      )}
    >
      <CardContent className="h-full p-4 flex gap-4">
        {/* Thumbnail — 4:5 aspect, lime ring if wasUsed */}
        <div
          className={cn(
            "h-full aspect-[4/5] rounded-xl overflow-hidden bg-muted shrink-0",
            top.wasUsed && "ring-2 ring-primary ring-offset-2 ring-offset-background"
          )}
        >
          <img
            src={top.thumbnail}
            alt={top.name}
            className="h-full w-full object-cover"
          />
        </div>

        {/* Meta block */}
        <div className="flex-1 min-w-0 flex flex-col">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            Top performer · This week
          </p>

          <div className="mt-2 flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2 py-1 text-[11px] font-medium">
              <img
                src={top.brand.logo}
                alt=""
                className="h-3.5 w-3.5 rounded-sm"
              />
              {top.brand.name}
            </span>
            <span className="inline-flex items-center rounded-full bg-muted px-2 py-1 text-[11px] font-medium">
              {top.mode}
            </span>
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-mono font-medium",
                isElite
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground"
              )}
            >
              <Star
                className={cn(
                  "h-3 w-3",
                  isElite ? "fill-primary-foreground" : "fill-foreground"
                )}
              />
              {top.qualityScore}
            </span>
          </div>

          <p className="mt-3 text-base font-semibold leading-snug line-clamp-2">
            {top.name}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{ageLabel}</p>

          <div className="mt-auto flex items-center gap-2 pt-3">
            <Button
              size="sm"
              onClick={() => navigate(`/iq/genie6/library/${top.id}`)}
            >
              View generation
              <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate(`/iq/genie6/generate?forgeFrom=${top.id}`)}
            >
              <Layers className="mr-1 h-3.5 w-3.5" />
              Forge 10 more
            </Button>
            <Button size="sm" variant="ghost">
              <BookmarkPlus className="mr-1 h-3.5 w-3.5" />
              Add to library
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
