import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ChevronDown, Sparkles, Maximize2, Terminal, Grid3x3 } from "lucide-react";
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

  const ModuleIcon = activeMod.icon;
  const siblingPaths = allSubPaths(activeMod);
  const onNavigate = (path: string) => navigate(path);
  const isGenie = activeMod.key === "genie";

  return (
    <aside
      data-fabads-nav-panel="secondary"
      className={cn(
        // A-10.8: flush inside the merged shell (no self-floating chrome).
        // Same cream bg as the shell — single visual surface, divider does
        // the separation.
        "flex w-[240px] shrink-0 flex-col overflow-hidden bg-white text-zinc-900"
      )}
    >
      {/* HEADER — sticky, compact. Title + (when Genie active) variant cycler icon.
          Pre-body divider uses the same elegant gradient style as the rail's
          logo→menu divider, just dark-tinted for the light surface (Maalik A-10.7). */}
      <header className="sticky top-0 z-10 shrink-0 bg-white">
        <div className="flex items-center gap-2 px-3 py-2.5">
          <ModuleIcon className="h-4 w-4 shrink-0 text-zinc-700" />
          <h2 className="flex-1 truncate text-[13px] font-semibold tracking-tight text-zinc-900">
            {activeMod.label}
          </h2>
          {isGenie && <GenieVariantCycler />}
        </div>
        <PanelDivider />
      </header>

      {/* BODY — independently scrollable */}
      <div className="flex-1 min-h-0 overflow-y-auto px-1.5 py-2">
        {/* Flat sub-items */}
        {activeMod.subItems && (
          <div className="flex flex-col gap-0.5">
            {activeMod.subItems.map((item) => (
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

        {/* Sectioned sub-items — each section header is a collapse toggle */}
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
      className="relative flex h-7 w-7 items-center justify-center rounded-md text-zinc-500 hover:text-zinc-900 hover:bg-zinc-900/[0.06] transition-colors shrink-0"
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
        className="w-full flex items-center gap-1.5 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500 hover:text-zinc-700 transition-colors"
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
