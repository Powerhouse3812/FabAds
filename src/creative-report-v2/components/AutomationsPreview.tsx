/**
 * AutomationsPreview — Overview-level "coming soon" preview of a quick-create
 * rule builder. Shows the four routing destinations a matched creative could
 * go to; nothing here is wired up yet (see honesty note below). The real
 * automations engine already exists and is reachable via the "Open
 * Automations" link — this card previews a flow that doesn't exist there
 * yet (an Overview-level quick-create), it doesn't replace it.
 *
 * Tiles are intentionally non-interactive (dashed border, no onClick, not
 * focusable) — a dead button that looks clickable is worse than a plain
 * preview tile.
 *
 * Styling note: same as RecommendationsCard — this lives outside `.g6-root`
 * (data-theme is only mirrored onto <html> on Genie routes), so g6-* classes
 * would silently no-op here. Uses standard bg-card/backdrop-blur + transform
 * hover-lift + mono/uppercase eyebrow instead, for the same visual result.
 */
import { FolderInput, BrainCircuit, Rocket, Library } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { WhyDot } from "@/creative-report-v2/components/WhyDot";
import { useReportBasePath } from "@/creative-report-v2/state/ReportBasePathContext";

const DESTINATIONS = [
  {
    key: "folder",
    icon: FolderInput,
    label: "Move to folder",
    sub: "Board or smart folder",
  },
  {
    key: "genie",
    icon: BrainCircuit,
    label: "Genie knowledge base",
    sub: "Feed the winners",
  },
  {
    key: "launch",
    icon: Rocket,
    label: "Send to Launch",
    sub: "Queue a relaunch",
  },
  {
    key: "meta",
    icon: Library,
    label: "Meta ad library",
    sub: "Push to account",
  },
] as const;

export function AutomationsPreview() {
  const navigate = useNavigate();
  const basePath = useReportBasePath();

  return (
    <section className="rounded-xl border border-border bg-card/70 p-4 backdrop-blur-xl">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <h3 className="text-sm font-semibold text-foreground">Automations</h3>
          <WhyDot id="overview.automationsPreview" />
          <Badge variant="secondary" className="ml-0.5 font-normal">
            Coming soon
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 shrink-0 px-2 text-xs text-muted-foreground hover:text-foreground"
          onClick={() => navigate(`${basePath}/automations`)}
        >
          Open Automations
        </Button>
      </div>
      <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        Set a rule once — when a creative matches, route it automatically
      </p>

      <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
        {DESTINATIONS.map((d) => {
          const Icon = d.icon;
          return (
            <div
              key={d.key}
              className="flex flex-col items-start gap-2 rounded-lg border border-dashed border-border p-3"
            >
              <Icon className="h-4 w-4 text-muted-foreground" />
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-foreground">{d.label}</p>
                <p className="truncate text-[11px] text-muted-foreground">{d.sub}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
