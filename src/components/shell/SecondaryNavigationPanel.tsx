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
        "hidden md:flex w-[264px] shrink-0 flex-col overflow-hidden",
        // Floating shape: margin + rounded + shadow → independent surface,
        // gap from parent rail visible via app bg.
        "my-2 ml-1 mr-2 rounded-2xl shadow-lg",
        "h-[calc(100vh-1rem)]",
        "bg-zinc-50 ring-1 ring-zinc-200/70 text-zinc-900"
      )}
    >
      {/* HEADER — sticky, compact. Title + (when Genie active) variant chips. */}
      <header className="sticky top-0 z-10 shrink-0 bg-zinc-50 border-b border-zinc-200/70">
        <div className="flex items-center gap-2 px-3 py-2.5">
          <ModuleIcon className="h-[15px] w-[15px] shrink-0 text-zinc-700" />
          <h2 className="flex-1 truncate text-[13px] font-semibold tracking-tight text-zinc-900">
            {activeMod.label}
          </h2>
        </div>
        {/* Genie variant chips — only render when Genie is the active module.
            Click cycles the variant; preserves existing variant state via
            useGenie6Theme. */}
        {isGenie && (
          <div className="px-3 pb-2.5">
            <GenieVariantChips />
          </div>
        )}
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
 *  GenieVariantChips — 4-segment pill, click cycles variant.
 *  Lives in the panel header when Genie is active.
 * ───────────────────────────────────────────────────────── */
const GENIE_VARIANTS: { key: GenieVariant; label: string; Icon: React.ElementType }[] = [
  { key: "studio",  label: "Studio",  Icon: Sparkles },
  { key: "canvas",  label: "Canvas",  Icon: Maximize2 },
  { key: "command", label: "Command", Icon: Terminal },
  { key: "modular", label: "Modular", Icon: Grid3x3 },
];

function GenieVariantChips() {
  const { variant, setVariant } = useGenie6Theme();
  return (
    <div className="flex w-full rounded-lg border border-zinc-200 bg-white p-0.5">
      {GENIE_VARIANTS.map((o) => {
        const active = variant === o.key;
        const Icon = o.Icon;
        return (
          <button
            key={o.key}
            type="button"
            onClick={() => setVariant(o.key)}
            title={`Genie · ${o.label}`}
            className={cn(
              "flex-1 inline-flex items-center justify-center gap-1 rounded-md py-1 text-[10px] font-semibold transition-colors",
              active
                ? "bg-zinc-900 text-white shadow-sm"
                : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100"
            )}
          >
            <Icon className="h-3 w-3" />
            <span>{o.label}</span>
          </button>
        );
      })}
    </div>
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
