import { useNavigate, useLocation } from "react-router-dom";
import {
  type ModuleDef,
  hasSubItems,
  allSubPaths,
  deriveActiveModule,
  MODULES,
  SYSTEM_MODULES,
} from "@/components/sidebar/modules";
import { SecondaryNavigationItem } from "./SecondaryNavigationItem";

/**
 * SecondaryNavigationPanel — V7 (ClickUp Strict) light context panel.
 *
 * Spec:
 *   - Always-light surface (NOT auto-theme)
 *   - Width 264px (within 248-288px range)
 *   - Sticky header at top with active module title
 *   - Body independently scrollable
 *   - Existing nav data only — preserves order, labels, routes, icons, badges
 *   - Sections rendered if data has them; nested items rendered recursively
 *
 * Header actions: NONE added by default per spec ("Do not add a search button
 * unless search already exists"). The active module's data drives the title.
 */
export function SecondaryNavigationPanel() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const activeKey = deriveActiveModule(pathname);
  const activeMod: ModuleDef | undefined = activeKey
    ? [...MODULES, ...SYSTEM_MODULES].find((m) => m.key === activeKey)
    : undefined;

  // Hide panel if there's no active module OR active module has no sub-items.
  // (Per spec: nested navigation lives in the light panel; if the module is a
  // direct-route module like Dashboard, we don't render the panel at all.)
  if (!activeMod || !hasSubItems(activeMod)) {
    return null;
  }

  const ModuleIcon = activeMod.icon;
  const siblingPaths = allSubPaths(activeMod);
  const onNavigate = (path: string) => navigate(path);

  return (
    <aside
      data-fabads-nav-panel="secondary"
      className="hidden md:flex w-[264px] shrink-0 flex-col bg-zinc-50 border-r border-zinc-200/80 overflow-hidden text-zinc-900"
    >
      {/* HEADER — sticky, compact. Title on left, no actions added (data has none). */}
      <header className="sticky top-0 z-10 shrink-0 flex items-center gap-2 px-3 py-2.5 border-b border-zinc-200/70 bg-zinc-50">
        <ModuleIcon className="h-[15px] w-[15px] shrink-0 text-zinc-700" />
        <h2 className="flex-1 truncate text-[13px] font-semibold tracking-tight text-zinc-900">
          {activeMod.label}
        </h2>
      </header>

      {/* BODY — independently scrollable */}
      <div className="flex-1 min-h-0 overflow-y-auto px-1.5 py-1.5">
        {/* Flat sub-items (no group structure) */}
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

        {/* Sectioned sub-items (if data has sections) */}
        {activeMod.sections && (
          <div className="flex flex-col gap-2">
            {activeMod.sections.map((section) => (
              <div key={section.sectionLabel} className="flex flex-col gap-0.5">
                <span className="block px-3 pt-1.5 pb-0.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                  {section.sectionLabel}
                </span>
                {section.items.map((item) => (
                  <SecondaryNavigationItem
                    key={item.path}
                    item={item}
                    pathname={pathname}
                    siblingPaths={siblingPaths}
                    onNavigate={onNavigate}
                  />
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
