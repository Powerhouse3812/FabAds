import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  ChevronDown,
  Sparkles,
  Maximize2,
  Terminal,
  Grid3x3,
  PanelLeftClose,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type ModuleDef,
  hasSubItems,
  allSubPaths,
  deriveActiveModule,
  MODULES,
  SYSTEM_MODULES,
} from "@/components/sidebar/modules";
import { useGenie6Theme, type GenieVariant } from "@/genie6/hooks/useGenie6Theme";
import { SecondaryNavigationItem } from "./SecondaryNavigationItem";
import { setSubNavCollapsed } from "./useSubNavCollapsed";

/**
 * SecondaryNavigationPanel — V7 ClickUp Strict (iter-6 A-10.3 update).
 *
 * Floating light surface (m-2 + rounded + shadow) — independent from the
 * parent rail. Sticky compact header with module title; when Genie is active,
 * header also surfaces the 4 Genie variant chips (Studio/Canvas/Command/Modular).
 *
 * Collapse-by-section: when the active module has `sections` data, each
 * section header becomes a chevron-toggleable group (default expanded).
 * Modules without sections render flat.
 */
export function SecondaryNavigationPanel() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const activeKey = deriveActiveModule(pathname);
  const activeMod: ModuleDef | undefined = activeKey
    ? [...MODULES, ...SYSTEM_MODULES].find((m) => m.key === activeKey)
    : undefined;

  if (!activeMod || !hasSubItems(activeMod)) {
    return null;
  }

  const siblingPaths = allSubPaths(activeMod);
  const onNavigate = (path: string) => navigate(path);
  const isGenie = activeMod.key === "genie";

  return (
    <aside
      data-fabads-nav-panel="secondary"
      className={cn(
        // A-12.38 redesign: 200px wide, hairline right divider, plain bg.
        // Genie pages get v3-page-mesh through-bleed for the warm gradient
        // ambiance; other modules render on plain background.
        "relative flex w-[200px] shrink-0 flex-col overflow-hidden text-foreground",
        "border-r border-foreground/[0.06]",
        isGenie ? "v3-page-mesh bg-transparent" : "bg-background",
      )}
    >
      {/* HEADER — fixed 52px height with bottom hairline divider */}
      <header
        className={cn(
          "sticky top-0 z-10 flex h-[52px] shrink-0 items-center gap-2 border-b border-foreground/[0.06] px-4",
          isGenie ? "bg-transparent" : "bg-background",
        )}
      >
        <h2 className="flex-1 truncate font-mono text-[13px] font-medium leading-4 tracking-tight text-foreground/65">
          {activeMod.label}
        </h2>
        {isGenie && <GenieVariantCycler />}
        <button
          type="button"
          onClick={() => setSubNavCollapsed(true)}
          aria-label="Collapse panel"
          title="Collapse sub-navigation"
          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-foreground/45 transition-colors hover:bg-foreground/[0.06] hover:text-foreground/65"
        >
          <PanelLeftClose className="h-4 w-4" />
        </button>
      </header>

      {/* BODY — independently scrollable, 8px/6px padding, 2px row gap */}
      <div className="min-h-0 flex-1 overflow-y-auto px-[6px] py-2">
        {activeMod.subItems && (
          <div className="flex flex-col gap-[2px]">
            {activeMod.subItems.map((item, i) => {
              const prev = activeMod.subItems![i - 1];
              const showDivider =
                item.deprioritized && (!prev || !prev.deprioritized);
              return (
                <div key={item.path} className="contents">
                  {showDivider && (
                    <div className="px-2 py-1.5">
                      <div
                        aria-hidden
                        className="h-px bg-foreground/[0.06]"
                      />
                    </div>
                  )}
                  <SecondaryNavigationItem
                    item={item}
                    pathname={pathname}
                    siblingPaths={siblingPaths}
                    onNavigate={onNavigate}
                  />
                </div>
              );
            })}
          </div>
        )}

        {activeMod.sections && (
          <div className="flex flex-col gap-1.5">
            {activeMod.sections.map((section) => (
              <CollapsibleSection
                key={section.sectionLabel}
                label={section.sectionLabel}
                items={section.items}
                pathname={pathname}
                siblingPaths={siblingPaths}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}

/* ─────────────────────────────────────────────────────────
 *  PanelDivider — elegant gradient line for the light surface.
 *  Mirrors RailDivider's pattern but in zinc/dark-tinted alpha
 *  (Maalik A-10.7: matching divider style across rail + panel).
 * ───────────────────────────────────────────────────────── */
function PanelDivider() {
  return (
    <div className="mx-3 shrink-0">
      <div className="h-px bg-[linear-gradient(90deg,transparent_0%,rgba(0,0,0,0.10)_50%,transparent_100%)]" />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
 *  GenieVariantCycler — single icon button. Click cycles through 4
 *  Genie variants. Icon cross-fades to show the CURRENT variant.
 *  Tooltip names current → next destination.
 * ───────────────────────────────────────────────────────── */
const GENIE_VARIANTS: { key: GenieVariant; label: string; Icon: React.ElementType }[] = [
  { key: "studio",  label: "Studio",  Icon: Sparkles },
  { key: "canvas",  label: "Canvas",  Icon: Maximize2 },
  { key: "command", label: "Command", Icon: Terminal },
  { key: "modular", label: "Modular", Icon: Grid3x3 },
];

function GenieVariantCycler() {
  const { variant, setVariant } = useGenie6Theme();
  const idx = GENIE_VARIANTS.findIndex((v) => v.key === variant);
  const current = GENIE_VARIANTS[idx >= 0 ? idx : 0];
  const next = GENIE_VARIANTS[(idx + 1) % GENIE_VARIANTS.length];
  const tooltip = `Genie variant: ${current.label} → ${next.label}`;

  return (
    <button
      type="button"
      onClick={() => setVariant(next.key)}
      title={tooltip}
      aria-label={tooltip}
      className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-foreground/45 transition-colors hover:bg-foreground/[0.06] hover:text-foreground/65"
    >
      {/* Cross-fade between 4 variant icons. Same animation grammar as
          DarkModeToggleIcon (rotate + scale + fade). Only the active
          variant's icon is visible at any moment. */}
      {GENIE_VARIANTS.map((v) => {
        const active = v.key === variant;
        const Icon = v.Icon;
        return (
          <Icon
            key={v.key}
            className={cn(
              "h-4 w-4 absolute transition-all duration-300 ease-in-out",
              active ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-45 scale-75"
            )}
          />
        );
      })}
    </button>
  );
}

/* ─────────────────────────────────────────────────────────
 *  CollapsibleSection — group header with toggle + items below.
 * ───────────────────────────────────────────────────────── */
function CollapsibleSection({
  label,
  items,
  pathname,
  siblingPaths,
  onNavigate,
}: {
  label: string;
  items: import("@/components/sidebar/modules").SubItem[];
  pathname: string;
  siblingPaths: string[];
  onNavigate: (path: string) => void;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div className="flex flex-col">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="flex w-full items-center gap-1.5 px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-foreground/45 transition-colors hover:text-foreground/65"
        aria-expanded={open}
      >
        <ChevronDown
          className={cn(
            "h-3 w-3 transition-transform",
            open ? "" : "-rotate-90"
          )}
        />
        <span>{label}</span>
      </button>
      {open && (
        <div className="flex flex-col gap-0.5">
          {items.map((item) => (
            <SecondaryNavigationItem
              key={item.path}
              item={item}
              pathname={pathname}
              siblingPaths={siblingPaths}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      )}
    </div>
  );
}
