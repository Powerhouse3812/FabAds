import { useLocation, useNavigate } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

import { UserMenu } from "@/components/UserMenu";
import { NotificationBell } from "@/components/NotificationBell";
import {
  MODULES,
  SYSTEM_MODULES,
  groupedModules,
  type ModuleDef,
  hasSubItems,
  allSubPaths,
  deriveActiveModule,
  isSubItemActive,
} from "@/components/sidebar/modules";
import { useFabAdsNavVariant } from "@/components/sidebar/useFabAdsNavVariant";

/**
 * Mobile sheet content — single-pane, sectioned by RUN/CREATE/AUTOMATE/TOOLS
 * group labels just like the desktop nav. Variant-agnostic since the sheet
 * pattern works the same regardless of desktop nav variant.
 */
export function MobileNavContent({ onClose }: { onClose: () => void }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { variant } = useFabAdsNavVariant();
  // Mobile mirrors the desktop variant's grouping (V2 → EXTENSIONS at bottom).
  const groups = groupedModules(variant);

  const go = (path: string) => {
    navigate(path);
    onClose();
  };

  const renderModule = (mod: ModuleDef) => {
    const active = deriveActiveModule(pathname) === mod.key;
    if (!hasSubItems(mod)) {
      return (
        <button
          key={mod.key}
          onClick={() => go(mod.path!)}
          className={cn(
            "w-full text-left px-3 py-2 rounded-md text-sm flex items-center gap-2.5",
            active ? "bg-g6-primary/10 text-g6-primary-active font-medium" : "text-foreground/80"
          )}
        >
          <mod.icon className="h-4 w-4" />
          {mod.label}
          {mod.comingSoon && (
            <span className="ml-auto text-[10px] text-muted-foreground border border-border rounded px-1">
              Soon
            </span>
          )}
        </button>
      );
    }

    return (
      <div key={mod.key}>
        <div className="px-3 py-2 text-sm font-medium text-foreground flex items-center gap-2.5">
          <mod.icon className="h-4 w-4" />
          {mod.label}
        </div>
        {/* iter-6 A-9: Genie6SubnavNewGenButton removed — Studio sub-item replaces it. */}
        <div className="ml-6 flex flex-col gap-0.5">
          {mod.subItems?.map((item) => {
            const siblings = allSubPaths(mod);
            return (
              <button
                key={item.path}
                onClick={() => go(item.path)}
                className={cn(
                  "w-full text-left px-3 py-1.5 rounded-md text-sm",
                  isSubItemActive(item.path, pathname, siblings)
                    ? "bg-g6-primary/10 text-g6-primary-active font-medium"
                    : "text-foreground/70"
                )}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <ScrollArea className="flex-1">
        <div className="flex flex-col py-2 px-2">
          {groups.map(({ group, modules }) =>
            modules.length === 0 ? null : (
              <div key={group} className="mb-3">
                <span className="block px-3 pt-2 pb-1 text-[10px] font-mono uppercase tracking-[0.12em] text-muted-foreground">
                  {group}
                </span>
                <div className="flex flex-col gap-0.5">
                  {modules.map(renderModule)}
                </div>
              </div>
            )
          )}
          {SYSTEM_MODULES.length > 0 && (
            <>
              <div className="border-t border-border my-2" />
              {SYSTEM_MODULES.map(renderModule)}
            </>
          )}
        </div>
      </ScrollArea>
      <div className="border-t border-border px-1.5 py-1.5 flex items-center gap-1">
        <div className="flex-1">
          <UserMenu />
        </div>
        <NotificationBell />
      </div>
    </div>
  );
}
