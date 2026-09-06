import { Check, Download, ImageOff, Repeat2, Rocket, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EllipsisMenu } from "../../components/OutputCard/EllipsisMenu";
import { qualityTier, type EllipsisAction, type OutputData } from "../../types/output";
import { flowSearchParams, type FlowActionId } from "@/genie6/flows/flowTypes";
import { PreviewVideo } from "./PreviewVideo";
import { videoForSeed } from "../data/studio-visuals";

interface OutputCardHybridProps {
  output: OutputData;
  selected?: boolean;
  onToggleSelect?: () => void;
  onClick?: () => void;
  onSave?: () => void;
  onLaunch?: () => void;
  onDownload?: () => void;
  onAction?: (action: EllipsisAction) => void;
}

/**
 * §21.2 — "Variation is a first-class action everywhere — Results card
 * overflow, Library card overflow, and Ad detail. Same wording, same
 * behaviour, same result in all three." The three labels below are the
 * literal wording for FlowActionId "vary-script" / "vary-concept" /
 * "vary-whole-video" (src/genie6/flows/flowTypes.ts) — the Library card
 * overflow and Ad detail wire the identical strings to the identical ids so
 * the spec's "same wording" holds across all three surfaces.
 */
const VARIATION_ACTIONS: { id: FlowActionId; label: string }[] = [
  { id: "vary-script", label: "Vary script" },
  { id: "vary-concept", label: "Vary concept" },
  { id: "vary-whole-video", label: "Vary whole video" },
];

/**
 * OutputCardHybrid — Studio v4 Step 5 output card.
 *
 * Composition: Genie 5 Meta-ad chrome (Sponsored header + avatar + body
 * copy + link strip + CTA pill) layered with Genie 6 OutputCard actions
 * (Save · Launch · Download primary buttons + EllipsisMenu for the 9
 * secondary actions per design system §8) and selection state (checkbox
 * top-right, ring on selected).
 *
 * Pulls realistic data from `mocks/sample-outputs.ts` so the cards look
 * like real Meta ads pulled from generated history.
 */
export function OutputCardHybrid({
  output,
  selected,
  onToggleSelect,
  onClick,
  onSave,
  onLaunch,
  onDownload,
  onAction,
}: OutputCardHybridProps) {
  const tier = qualityTier(output.qualityScore);
  const brandName = output.brand?.name ?? "Studio";
  const brandInitial = brandName.charAt(0).toUpperCase();
  const navigate = useNavigate();

  // Brand → consistent avatar color (mock — real impl would use brand.colors)
  const avatarBg = stringToHsl(brandName);

  // §21.2 Rule 1 — variation asks nothing and lands straight on Configure
  // (landingStep 4), pre-filled via the universal flow-context params.
  const runVariation = (action: FlowActionId) => {
    const params = flowSearchParams("creative-library", output.id, action);
    navigate(`/iq/genie6/studio-alpha/configure?${params.toString()}`);
  };

  // §6 Rule 6 — "Send to Other Apps" is reachable from the module too, not
  // only from Library.
  const sendToOtherApps = () => navigate("/iq/genie6/apps");

  return (
    <div
      onClick={onClick}
      className={cn(
        "v3-glass-card group relative flex flex-col overflow-hidden rounded-xl transition-shadow",
        selected
          ? "ring-2 ring-primary/30 shadow-md"
          : "hover:shadow-md",
        onClick && "cursor-pointer",
      )}
    >
      {/* Selection checkbox — top-right, appears on hover or when selected */}
      {onToggleSelect && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect();
          }}
          aria-label={selected ? "Deselect" : "Select"}
          className={cn(
            "absolute right-2 top-2 z-10 inline-flex h-5 w-5 items-center justify-center rounded-md border bg-background/90 backdrop-blur transition-opacity",
            selected
              ? "border-primary bg-primary text-primary-foreground opacity-100"
              : "border-border opacity-0 group-hover:opacity-100",
          )}
        >
          {selected && <Check className="h-3 w-3" strokeWidth={3} />}
        </button>
      )}

      {/* G5 — Sponsored header (avatar circle + page name + sponsored label) */}
      <div className="flex items-center gap-2 border-b border-border px-3 py-1.5">
        <div
          className="flex h-6 w-6 items-center justify-center rounded-full text-[9px] font-bold text-white"
          style={{ backgroundColor: avatarBg }}
        >
          {brandInitial}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-foreground">{brandName}</p>
          <p className="text-[10px] text-muted-foreground">Sponsored</p>
        </div>
        {/* §21.2 — Variation as a first-class card-overflow action, plus
            Send to Other Apps (§6 Rule 6). Kept as its own trigger rather
            than folded into EllipsisMenu — that component is a shared,
            fixed-items menu (src/genie6/components/OutputCard/EllipsisMenu.tsx,
            owned by the Library agent) with no slot for extra items. */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              onClick={(e) => e.stopPropagation()}
              aria-label="Variation actions"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Repeat2 className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-52"
            onClick={(e) => e.stopPropagation()}
          >
            {VARIATION_ACTIONS.map((a) => (
              <DropdownMenuItem key={a.id} onSelect={() => runVariation(a.id)}>
                {a.label}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={sendToOtherApps}>Send to Other Apps</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <EllipsisMenu onAction={onAction} />
      </div>

      {/* G5 — Body copy (line-clamp 2) */}
      {output.body && (
        <div className="px-3 py-1.5">
          <p className="line-clamp-2 text-[11px] leading-relaxed text-foreground">
            {output.body}
          </p>
        </div>
      )}

      {/* G5+G6 — Media (aspect-[4/5] thumbnail + quality score badge) */}
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-muted">
        {output.thumbnail && output.mediaType === "video" ? (
          <PreviewVideo
            src={videoForSeed(output.angleId ? `angle:${output.angleId}` : `output:${output.id}`)}
            poster={output.thumbnail}
          />
        ) : output.thumbnail ? (
          <img
            src={output.thumbnail}
            alt={output.headline ?? brandName}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          // §7 anti-pattern: no emojis in product UI — lucide icons only.
          <div className="flex h-full w-full items-center justify-center text-muted-foreground/50">
            <ImageOff className="h-8 w-8" strokeWidth={1.5} />
          </div>
        )}
        {tier && output.qualityScore !== undefined && (
          <span
            className={cn(
              "absolute left-2 top-2 inline-flex items-center gap-1 rounded-full border bg-background/95 px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider backdrop-blur",
              tier === "success" && "border-g6-success/30 text-g6-success",
              tier === "warning" && "border-g6-warning/30 text-g6-warning",
              tier === "error" && "border-g6-error/30 text-g6-error",
            )}
            title={`Quality score: ${output.qualityScore}`}
          >
            Q-{output.qualityScore}
          </span>
        )}
      </div>

      {/* G5 — Link strip (headline + brand domain) */}
      {output.headline && (
        <div className="border-t border-border bg-muted/20 px-3 py-1.5">
          <p className="truncate text-[11px] font-semibold text-foreground">
            {output.headline}
          </p>
          <p className="mt-0.5 truncate font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {brandName}.com
          </p>
        </div>
      )}

      {/* G5 — CTA pill (right-aligned) */}
      {output.cta && (
        <div className="flex justify-end border-t border-border bg-muted/10 px-3 py-1.5">
          <button
            type="button"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center rounded-full bg-foreground px-3 py-1 text-[10px] font-bold text-background transition-opacity hover:opacity-90"
          >
            {output.cta}
          </button>
        </div>
      )}

      {/* G6 — Action bar (Save · Launch · Download) */}
      <div className="flex items-center gap-1 border-t border-border px-2 py-1.5">
        <ActionBtn
          icon={Save}
          label="Save"
          onClick={(e) => {
            e.stopPropagation();
            onSave?.();
          }}
        />
        <ActionBtn
          icon={Rocket}
          label="Launch"
          onClick={(e) => {
            e.stopPropagation();
            onLaunch?.();
          }}
        />
        <ActionBtn
          icon={Download}
          label="Download"
          onClick={(e) => {
            e.stopPropagation();
            onDownload?.();
          }}
        />
      </div>
    </div>
  );
}

function ActionBtn({
  icon: Icon,
  label,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  onClick: (e: React.MouseEvent) => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-7 flex-1 items-center justify-center gap-1 rounded-md px-2 text-[10px] font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      <Icon className="h-3 w-3" />
      {label}
    </button>
  );
}

/**
 * Deterministic HSL color from a string — used for brand avatar bg.
 * Same brand name always gets the same color across renders.
 */
function stringToHsl(s: string): string {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = (hash * 31 + s.charCodeAt(i)) & 0xffffffff;
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 60%, 45%)`;
}
