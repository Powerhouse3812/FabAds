import { useState, type ReactNode } from "react";
import {
  Telescope,
  ChevronRight,
  LayoutDashboard,
  BarChart3,
  Wand2,
  Compass,
  Search,
  Map as MapIcon,
  Users,
  Bookmark,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * RailPopoverVariants — Studio v3 design lab (A-11.26).
 *
 * Visual UI mockups for the 4 candidate hover-popover styles.
 * Maalik picks one → I propagate to live ParentNavigationRail.
 *
 * Behaviour locked (same across all 4 variants):
 *   - Float over sub-nav on hover.
 *   - Module-label row clickable → switches module + lands on default sub-route.
 *   - Sub-item rows clickable → direct navigation.
 *   - Active module → silent (no popover).
 *   - No-sub-menu modules → plain Tooltip (not the card).
 */

interface SubMock {
  id: string;
  label: string;
  icon: typeof Compass;
}

const INDUSTRY_SUBS: SubMock[] = [
  { id: "discover", label: "Discover", icon: Compass },
  { id: "intelligence", label: "Intelligence", icon: Search },
  { id: "boards", label: "Boards", icon: MapIcon },
  { id: "competitors", label: "Competitors", icon: Users },
  { id: "saved", label: "Saved", icon: Bookmark },
];

export function RailPopoverVariants() {
  const [chosen, setChosen] = useState<1 | 2 | 3 | 4 | null>(null);

  return (
    <div className="min-h-screen bg-[#fafaf6] p-6 sm:p-10">
      {/* Header */}
      <header className="max-w-6xl mx-auto space-y-2 pb-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary font-bold">
          A-11.26 · Design Lab
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Rail hover popover · pick a visual
        </h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Behaviour is locked across all 4 variants. Only the visual
          treatment differs. Click one to mark your pick — I'll wire it
          into the live{" "}
          <code className="bg-muted/60 rounded px-1 text-xs">
            ParentNavigationRail
          </code>
          .
        </p>
        {chosen && (
          <div className="inline-flex items-center gap-2 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground mt-2">
            ✓ V{chosen} picked — tell Claude to ship it
          </div>
        )}
      </header>

      {/* 2x2 grid */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
        <VariantCard
          n={1}
          title="Linear-clean"
          sub="White card · generous padding · Notion / Linear DNA"
          chosen={chosen === 1}
          onPick={() => setChosen(1)}
        >
          <V1 />
        </VariantCard>

        <VariantCard
          n={2}
          title="macOS-dense"
          sub="Compact · tight rows · power-user feel"
          chosen={chosen === 2}
          onPick={() => setChosen(2)}
        >
          <V2 />
        </VariantCard>

        <VariantCard
          n={3}
          title="Sectioned hierarchy"
          sub="Icon disc + page count + grouped sections"
          chosen={chosen === 3}
          onPick={() => setChosen(3)}
        >
          <V3 />
        </VariantCard>

        <VariantCard
          n={4}
          title="Studio v3 glass"
          sub="Frosted backdrop-blur + lime accent ring"
          chosen={chosen === 4}
          onPick={() => setChosen(4)}
        >
          <V4 />
        </VariantCard>
      </div>

      {/* Comparison summary table */}
      <div className="max-w-6xl mx-auto mt-12 rounded-xl border border-border bg-white overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-muted/40 text-muted-foreground">
            <tr>
              <th className="text-left px-3 py-2 font-mono uppercase tracking-wider text-[10px]">
                Trait
              </th>
              <th className="text-left px-3 py-2 font-mono uppercase tracking-wider text-[10px]">
                V1 Linear
              </th>
              <th className="text-left px-3 py-2 font-mono uppercase tracking-wider text-[10px]">
                V2 Dense
              </th>
              <th className="text-left px-3 py-2 font-mono uppercase tracking-wider text-[10px]">
                V3 Sectioned
              </th>
              <th className="text-left px-3 py-2 font-mono uppercase tracking-wider text-[10px]">
                V4 Glass
              </th>
            </tr>
          </thead>
          <tbody className="text-foreground">
            <Row
              cells={["Width", "240px", "200px", "240px", "240px"]}
              first
            />
            <Row
              cells={[
                "Row height",
                "32px",
                "24px (densest)",
                "32px",
                "32px",
              ]}
            />
            <Row
              cells={[
                "Header style",
                "Icon + label + chevron",
                "Plain label",
                "Icon disc + page count",
                "Lime-ringed icon + label",
              ]}
            />
            <Row
              cells={[
                "Surface",
                "White card",
                "White card (small shadow)",
                "White card",
                "Frosted glass + lime tint",
              ]}
            />
            <Row
              cells={[
                "Best when",
                "Familiar / safe",
                "Power users",
                "Module has section groups",
                "Studio v3 continuity",
              ]}
            />
            <Row
              cells={[
                "Risk",
                "Generic",
                "Tight click targets",
                "Wasted space if 2-3 items",
                "Different from rest of shell",
              ]}
            />
          </tbody>
        </table>
      </div>

      <p className="max-w-6xl mx-auto mt-6 text-center text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground/70">
        Click any variant to pick · then tell Claude to ship it
      </p>
    </div>
  );
}

/* ────────────────────────────────────────────────────────── *
 *  VariantCard — wraps each variant with a faux-rail context
 *  + pickable click target + pick state ring.
 * ────────────────────────────────────────────────────────── */

function VariantCard({
  n,
  title,
  sub,
  chosen,
  onPick,
  children,
}: {
  n: number;
  title: string;
  sub: string;
  chosen: boolean;
  onPick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onPick}
      className={cn(
        "group relative rounded-2xl border bg-white p-5 text-left transition-all",
        chosen
          ? "border-primary ring-2 ring-primary/30 shadow-lg"
          : "border-border hover:border-primary/40 hover:shadow-md",
      )}
    >
      {/* Title row */}
      <div className="flex items-baseline justify-between gap-2 mb-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Variant 0{n}
          </p>
          <h3 className="text-lg font-bold text-foreground">{title}</h3>
          <p className="text-[11px] text-muted-foreground">{sub}</p>
        </div>
        <span
          className={cn(
            "shrink-0 inline-flex h-7 w-7 items-center justify-center rounded-full text-[12px] font-bold transition-colors",
            chosen
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground group-hover:bg-primary/15 group-hover:text-primary",
          )}
        >
          {chosen ? "✓" : `V${n}`}
        </span>
      </div>

      {/* Faux rail + popover */}
      <div className="relative h-[260px] flex items-stretch gap-0">
        <FauxRail />
        <div className="absolute left-[72px] top-[80px] z-10">{children}</div>
      </div>
    </button>
  );
}

function FauxRail() {
  return (
    <aside className="relative w-[60px] shrink-0 rounded-2xl bg-[linear-gradient(180deg,hsl(80_30%_12%)_0%,hsl(80_15%_8%)_50%,hsl(80_25%_10%)_100%)] py-3 flex flex-col items-center gap-2.5">
      <RailIcon Icon={LayoutDashboard} label="Dashboard" />
      <RailIcon Icon={BarChart3} label="Reports" />
      {/* Hovered: Industry Insights */}
      <div className="relative">
        <RailIcon Icon={Telescope} label="Industry…" hovered />
        <span
          aria-hidden
          className="absolute -right-1 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-primary"
          style={{ animation: "v3-pulse-ring 1.6s infinite" }}
        />
      </div>
      <RailIcon Icon={Wand2} label="Genie" active />
    </aside>
  );
}

function RailIcon({
  Icon,
  label,
  active = false,
  hovered = false,
}: {
  Icon: typeof Telescope;
  label: string;
  active?: boolean;
  hovered?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-0.5 rounded-md py-1 px-0.5 transition-colors w-full",
        hovered ? "bg-white/[0.06]" : "",
      )}
    >
      <span
        className={cn(
          "h-6 w-6 rounded flex items-center justify-center",
          active ? "bg-white/[0.12] ring-1 ring-white/[0.18]" : "",
        )}
      >
        <Icon
          className={cn(
            "h-3.5 w-3.5",
            active ? "text-white" : hovered ? "text-primary" : "text-zinc-400",
          )}
        />
      </span>
      <span
        className={cn(
          "text-[7.5px] font-medium tracking-tight max-w-[48px] truncate",
          active ? "text-white" : hovered ? "text-primary" : "text-zinc-400",
        )}
      >
        {label}
      </span>
    </div>
  );
}

/* ────────────────────────────────────────────────────────── *
 *  V1 — Linear-clean
 * ────────────────────────────────────────────────────────── */

function V1() {
  return (
    <div className="w-60 rounded-xl border border-border bg-white shadow-lg p-1.5">
      <div className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 hover:bg-primary/8 cursor-pointer">
        <Telescope className="h-4 w-4 text-primary shrink-0" />
        <span className="flex-1 text-sm font-semibold text-foreground">
          Industry Insights
        </span>
        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      <div className="h-px bg-border/60 my-1 mx-1" />
      <div className="flex flex-col gap-0.5">
        {INDUSTRY_SUBS.map((sub) => {
          const SubIcon = sub.icon;
          return (
            <div
              key={sub.id}
              className="flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs hover:bg-muted/60 cursor-pointer"
            >
              <SubIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="font-medium text-foreground">{sub.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────── *
 *  V2 — macOS-dense
 * ────────────────────────────────────────────────────────── */

function V2() {
  return (
    <div className="w-52 rounded-md border border-border bg-white shadow-md p-0.5">
      <div className="flex items-center gap-2 rounded px-2 py-1 hover:bg-primary/8 cursor-pointer">
        <Telescope className="h-3 w-3 text-primary shrink-0" />
        <span className="text-xs font-semibold text-foreground">
          Industry Insights
        </span>
      </div>
      <div className="h-px bg-border/60 my-0.5 mx-0.5" />
      {INDUSTRY_SUBS.map((sub) => {
        const SubIcon = sub.icon;
        return (
          <div
            key={sub.id}
            className="flex items-center gap-2 rounded px-2 py-1 text-[11px] hover:bg-muted/60 cursor-pointer"
          >
            <SubIcon className="h-3 w-3 text-muted-foreground shrink-0" />
            <span className="text-foreground">{sub.label}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ────────────────────────────────────────────────────────── *
 *  V3 — Sectioned hierarchy
 * ────────────────────────────────────────────────────────── */

function V3() {
  const browse = INDUSTRY_SUBS.slice(0, 2);
  const manage = INDUSTRY_SUBS.slice(2);
  return (
    <div className="w-60 rounded-xl border border-border bg-white shadow-lg p-2">
      <div className="flex items-center gap-2.5 rounded-lg px-1.5 py-1.5 hover:bg-primary/8 cursor-pointer">
        <div className="h-7 w-7 shrink-0 rounded-md bg-primary/15 flex items-center justify-center">
          <Telescope className="h-3.5 w-3.5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">
            Industry Insights
          </p>
          <p className="text-[10px] text-muted-foreground">
            {INDUSTRY_SUBS.length} pages
          </p>
        </div>
      </div>
      <div className="h-px bg-border/60 mt-2 mx-0.5" />
      <div className="space-y-2 pt-2">
        {[
          { label: "Browse", items: browse },
          { label: "Manage", items: manage },
        ].map((g) => (
          <div key={g.label} className="space-y-0.5">
            <p className="px-1.5 text-[9px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
              {g.label}
            </p>
            {g.items.map((sub) => {
              const SubIcon = sub.icon;
              return (
                <div
                  key={sub.id}
                  className="flex items-center gap-2 rounded-md px-1.5 py-1.5 text-xs hover:bg-muted/60 cursor-pointer"
                >
                  <SubIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="font-medium text-foreground">
                    {sub.label}
                  </span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────── *
 *  V4 — Studio v3 glass
 * ────────────────────────────────────────────────────────── */

function V4() {
  return (
    <div
      className={cn(
        "w-60 rounded-2xl p-1.5 relative overflow-hidden",
        "border border-white shadow-[0_8px_30px_-12px_rgba(0,0,0,0.18)]",
      )}
      style={{
        background:
          "linear-gradient(135deg, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.65) 100%)",
        backdropFilter: "blur(20px) saturate(160%)",
      }}
    >
      <span
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 30% 30%, hsl(74 81% 70% / 0.15), transparent 70%)",
        }}
      />
      <div className="relative flex items-center gap-2.5 rounded-xl px-2.5 py-2 hover:bg-primary/15 cursor-pointer">
        <div className="h-8 w-8 shrink-0 rounded-lg bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center ring-1 ring-primary/40">
          <Telescope className="h-4 w-4 text-primary" />
        </div>
        <span className="flex-1 text-sm font-semibold text-foreground">
          Industry Insights
        </span>
      </div>
      <div className="relative h-px bg-foreground/10 my-1.5 mx-1" />
      <div className="relative flex flex-col gap-0.5">
        {INDUSTRY_SUBS.map((sub) => {
          const SubIcon = sub.icon;
          return (
            <div
              key={sub.id}
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs hover:bg-foreground/5 cursor-pointer"
            >
              <SubIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="font-medium text-foreground">{sub.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────── */

function Row({ cells, first }: { cells: string[]; first?: boolean }) {
  return (
    <tr className={cn(!first && "border-t border-border/60")}>
      {cells.map((c, i) => (
        <td
          key={i}
          className={cn(
            "px-3 py-2",
            i === 0 ? "font-mono uppercase text-[10px] text-muted-foreground tracking-wider" : "text-foreground",
          )}
        >
          {c}
        </td>
      ))}
    </tr>
  );
}

export default RailPopoverVariants;
