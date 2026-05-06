import { useState, type ReactNode } from "react";
import { Telescope, ChevronRight } from "lucide-react";
import {
  MODULES,
  type ModuleDef,
  type SubItem,
} from "@/components/sidebar/modules";
import { cn } from "@/lib/utils";

/**
 * RailPopoverVariants — Studio v3 design lab (A-11.26).
 *
 * Maalik locked the contract:
 *   - Hover popover floats over the sub-nav (z-above), anchored right
 *     of the rail item.
 *   - No-sub-menu modules → plain Tooltip with name only (no card).
 *   - Sub-item click → navigates directly. Module label click → switches
 *     module + lands on default sub-route.
 *   - Active module → silent on hover (popover suppressed).
 *
 * What's NOT locked: the visual style of the popover itself. Four
 * variants below — pick one, then I propagate to ParentNavigationRail.
 */

// Pick a representative module that HAS sub-items + a representative
// section group for variant 3. Industry Insights is a good demo since
// it's the one Maalik flagged.
const SAMPLE = MODULES.find((m) => m.key === "insights") ?? MODULES[0];
const SUBS: SubItem[] = [
  ...(SAMPLE.subItems ?? []),
  ...(SAMPLE.sections?.flatMap((s) => s.items) ?? []),
];

export function RailPopoverVariants() {
  return (
    <div className="min-h-screen bg-background p-8 sm:p-12 space-y-12">
      <header className="space-y-2 max-w-3xl">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary font-bold">
          A-11.26 · Design Lab
        </p>
        <h1 className="text-2xl font-bold tracking-tight">
          Rail hover popover · 4 visual variants
        </h1>
        <p className="text-sm text-muted-foreground">
          Hover behaviour locked. Pick the visual you want shipped — I'll
          propagate to the live <code className="text-xs bg-muted/60 rounded px-1">ParentNavigationRail</code>.
          Reference module: <strong>{SAMPLE.label}</strong> with{" "}
          {SUBS.length} sub-items.
        </p>
      </header>

      <Section
        title="V1 · Linear-clean"
        sub="White card, generous padding, icon + label + sub-items list. Notion / Linear DNA."
      >
        <FauxRail>
          <V1 mod={SAMPLE} subs={SUBS} />
        </FauxRail>
      </Section>

      <Section
        title="V2 · macOS-dense"
        sub="Compact dense menu. Small padding, tighter row height. Fast for power users."
      >
        <FauxRail>
          <V2 mod={SAMPLE} subs={SUBS} />
        </FauxRail>
      </Section>

      <Section
        title="V3 · Sectioned hierarchy"
        sub="When module has section groups (Reports / Genie), groups render with section labels. Clearer IA."
      >
        <FauxRail>
          <V3 mod={SAMPLE} subs={SUBS} />
        </FauxRail>
      </Section>

      <Section
        title="V4 · Studio v3 glass"
        sub="Frosted backdrop-blur + lime accents. Matches the Studio v3 form chrome — feels like part of the same surface."
      >
        <FauxRail>
          <V4 mod={SAMPLE} subs={SUBS} />
        </FauxRail>
      </Section>

      <p className="text-center text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground/70 pt-6">
        Pick one — I'll wire it into the live rail.
      </p>
    </div>
  );
}

/* ────────────────────────────────────────────────────────── */

function Section({
  title,
  sub,
  children,
}: {
  title: string;
  sub: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-2">
      <div className="flex items-baseline gap-3">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-xs text-muted-foreground">{sub}</p>
      </div>
      {children}
    </section>
  );
}

/**
 * FauxRail — visual mock of the parent rail with one item highlighted as
 * the hovered target. The chosen popover renders to the right of it.
 */
function FauxRail({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex items-stretch gap-0 h-[280px]">
      {/* Rail mock — dark gradient column */}
      <aside className="relative w-[64px] shrink-0 rounded-2xl bg-[linear-gradient(180deg,hsl(80_30%_12%)_0%,hsl(80_15%_8%)_50%,hsl(80_25%_10%)_100%)] py-3 flex flex-col items-center gap-3">
        {/* 3 inactive icons */}
        <RailIcon active={false} label="Dashboard" />
        <RailIcon active={false} label="Reports" />
        {/* Hovered icon — Telescope (Industry Insights) with halo */}
        <div className="relative">
          <RailIcon active={false} label="Industry…" hovered />
          <span
            aria-hidden
            className="absolute -right-1 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-primary animate-pulse"
          />
        </div>
        <RailIcon active label="Genie" />
      </aside>

      {/* Faux sub-nav (the dimmed surface beneath the popover) */}
      <div className="ml-2 w-[200px] shrink-0 rounded-xl border border-border bg-muted/40 p-3 space-y-2 opacity-60">
        <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
          Genie · sub-nav
        </p>
        <div className="space-y-1.5">
          {["Overview", "Studio v3", "Generations", "Assets"].map((label, i) => (
            <div
              key={label}
              className={cn(
                "h-7 rounded-md flex items-center px-2 text-xs",
                i === 1 ? "bg-primary/10 text-foreground font-medium" : "text-muted-foreground",
              )}
            >
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* Popover — slot for variant rendering. Anchored at the hovered
          rail item's vertical position with sideOffset. */}
      <div className="absolute left-[80px] top-[88px] z-10">{children}</div>
    </div>
  );
}

function RailIcon({
  active,
  label,
  hovered = false,
}: {
  active: boolean;
  label: string;
  hovered?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-0.5 rounded-md py-1 px-0.5 transition-colors",
        active ? "" : hovered ? "bg-white/[0.08]" : "",
      )}
    >
      <span
        className={cn(
          "h-6 w-6 rounded flex items-center justify-center",
          active ? "bg-white/[0.12] ring-1 ring-white/[0.18]" : "",
        )}
      >
        <Telescope
          className={cn(
            "h-3.5 w-3.5",
            active ? "text-white" : "text-zinc-400",
          )}
        />
      </span>
      <span
        className={cn(
          "text-[7.5px] font-medium tracking-tight max-w-[48px] truncate",
          active ? "text-white" : "text-zinc-400",
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

function V1({ mod, subs }: { mod: ModuleDef; subs: SubItem[] }) {
  const Icon = mod.icon;
  return (
    <div className="w-60 rounded-xl border border-border bg-popover shadow-lg p-1.5">
      <button
        type="button"
        className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-primary/8"
      >
        <Icon className="h-4 w-4 text-primary shrink-0" />
        <span className="flex-1 text-sm font-semibold text-foreground">
          {mod.label}
        </span>
        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
      </button>
      <div className="h-px bg-border/60 my-1 mx-1" />
      <div className="flex flex-col gap-0.5">
        {subs.map((sub) => {
          const SubIcon = sub.icon;
          return (
            <button
              key={sub.path}
              type="button"
              className={cn(
                "flex items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-xs transition-colors hover:bg-muted/60",
                sub.deprioritized && "opacity-60 italic",
              )}
            >
              {SubIcon && (
                <SubIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              )}
              <span className="flex-1 truncate font-medium text-foreground">
                {sub.label}
              </span>
              {sub.badge && <Pill>{sub.badge}</Pill>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────── *
 *  V2 — macOS-dense
 * ────────────────────────────────────────────────────────── */

function V2({ mod, subs }: { mod: ModuleDef; subs: SubItem[] }) {
  const Icon = mod.icon;
  return (
    <div className="w-52 rounded-md border border-border bg-popover shadow-md p-0.5">
      <button
        type="button"
        className="flex w-full items-center gap-2 rounded px-2 py-1 text-left transition-colors hover:bg-primary/8"
      >
        <Icon className="h-3 w-3 text-primary shrink-0" />
        <span className="flex-1 text-xs font-semibold text-foreground">
          {mod.label}
        </span>
      </button>
      <div className="h-px bg-border/60 my-0.5 mx-0.5" />
      {subs.map((sub) => {
        const SubIcon = sub.icon;
        return (
          <button
            key={sub.path}
            type="button"
            className={cn(
              "flex w-full items-center gap-2 rounded px-2 py-1 text-left text-[11px] transition-colors hover:bg-muted/60",
              sub.deprioritized && "opacity-60 italic",
            )}
          >
            {SubIcon && (
              <SubIcon className="h-3 w-3 shrink-0 text-muted-foreground" />
            )}
            <span className="flex-1 truncate text-foreground">{sub.label}</span>
            {sub.badge && <Pill mini>{sub.badge}</Pill>}
          </button>
        );
      })}
    </div>
  );
}

/* ────────────────────────────────────────────────────────── *
 *  V3 — Sectioned hierarchy (groups)
 * ────────────────────────────────────────────────────────── */

function V3({ mod, subs }: { mod: ModuleDef; subs: SubItem[] }) {
  const Icon = mod.icon;
  // Mock grouping — in real component, use mod.sections when present.
  // For demo: split subs into two virtual sections.
  const half = Math.ceil(subs.length / 2);
  const groups = [
    { label: "Browse", items: subs.slice(0, half) },
    { label: "Manage", items: subs.slice(half) },
  ];
  return (
    <div className="w-60 rounded-xl border border-border bg-popover shadow-lg p-2">
      <button
        type="button"
        className="flex w-full items-center gap-2.5 rounded-lg px-1.5 py-1.5 text-left transition-colors hover:bg-primary/8"
      >
        <div className="h-7 w-7 shrink-0 rounded-md bg-primary/15 flex items-center justify-center">
          <Icon className="h-3.5 w-3.5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">
            {mod.label}
          </p>
          <p className="text-[10px] text-muted-foreground">
            {subs.length} pages
          </p>
        </div>
      </button>
      <div className="h-px bg-border/60 mt-2 mx-0.5" />
      <div className="space-y-2 pt-2">
        {groups.map((g) => (
          <div key={g.label} className="space-y-0.5">
            <p className="px-1.5 text-[9px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
              {g.label}
            </p>
            {g.items.map((sub) => {
              const SubIcon = sub.icon;
              return (
                <button
                  key={sub.path}
                  type="button"
                  className="flex w-full items-center gap-2 rounded-md px-1.5 py-1.5 text-left text-xs transition-colors hover:bg-muted/60"
                >
                  {SubIcon && (
                    <SubIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  )}
                  <span className="flex-1 truncate font-medium text-foreground">
                    {sub.label}
                  </span>
                </button>
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

function V4({ mod, subs }: { mod: ModuleDef; subs: SubItem[] }) {
  const Icon = mod.icon;
  return (
    <div
      className={cn(
        "w-60 rounded-2xl p-1.5",
        "v3-glass shadow-[0_8px_30px_-12px_rgba(0,0,0,0.18)]",
      )}
    >
      <button
        type="button"
        className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition-colors hover:bg-primary/15"
      >
        <div className="h-8 w-8 shrink-0 rounded-lg bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center ring-1 ring-primary/30">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <span className="flex-1 text-sm font-semibold text-foreground">
          {mod.label}
        </span>
      </button>
      <div className="h-px bg-foreground/10 my-1.5 mx-1" />
      <div className="flex flex-col gap-0.5">
        {subs.map((sub) => {
          const SubIcon = sub.icon;
          return (
            <button
              key={sub.path}
              type="button"
              className={cn(
                "flex items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition-colors hover:bg-foreground/5",
                sub.deprioritized && "opacity-60 italic",
              )}
            >
              {SubIcon && (
                <SubIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              )}
              <span className="flex-1 truncate font-medium text-foreground">
                {sub.label}
              </span>
              {sub.badge && <Pill>{sub.badge}</Pill>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────── */

function Pill({
  children,
  mini = false,
}: {
  children: ReactNode;
  mini?: boolean;
}) {
  return (
    <span
      className={cn(
        "rounded-sm bg-muted px-1 font-mono uppercase tracking-wider text-muted-foreground",
        mini ? "text-[8px] py-0" : "text-[9px] py-0.5 font-bold",
      )}
    >
      {children}
    </span>
  );
}

export default RailPopoverVariants;

// Helper to keep useState/Telescope available — hover state isn't used
// in the static demo, but importing keeps the dev-tools tree clean.
export const _ = useState;
