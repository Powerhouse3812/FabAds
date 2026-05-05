import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SubItem } from "@/components/sidebar/modules";
import { isSubItemActive } from "@/components/sidebar/modules";

/**
 * SecondaryNavigationItem — a row in the light secondary panel.
 *
 * Spec:
 *   - Row height 28-32px (h-8 = 32px / py-1 = ~30px)
 *   - Text 13-14px
 *   - Icons 16px (h-4 w-4) — matches parent rail icon size for visual consistency
 *   - Active = soft bg highlight
 *   - Hover = subtle bg
 *   - Indentation 14-16px per nesting level
 *   - Vertical guide line for nested levels
 *
 * A-10.6: items with `subItems` get a CHEVRON toggle. Click toggles open/close
 * (local React state, no global persistence). Default open if any descendant
 * is active (so the active sub-item is visible on first render).
 */
export function SecondaryNavigationItem({
  item,
  pathname,
  siblingPaths,
  onNavigate,
  depth = 0,
}: {
  item: SubItem;
  pathname: string;
  siblingPaths: string[];
  onNavigate: (path: string) => void;
  depth?: number;
}) {
  const ItemIcon = item.icon;
  const active = isSubItemActive(item.path, pathname, siblingPaths);
  const hasChildren = !!(item.subItems && item.subItems.length > 0);

  // Default open if THIS or any descendant is active.
  const descendantActive =
    hasChildren &&
    item.subItems!.some((c) =>
      isSubItemActive(c.path, pathname, siblingPaths) ||
      (c.subItems?.some((cc) => isSubItemActive(cc.path, pathname, siblingPaths)) ?? false)
    );
  const [open, setOpen] = useState(active || descendantActive);

  const paddingLeftPx = 12 + depth * 14;

  const handleClick = () => {
    if (hasChildren) {
      // Click on parent: toggle expansion AND navigate (matches ClickUp + Notion).
      setOpen((p) => !p);
    }
    onNavigate(item.path);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        aria-current={active ? "page" : undefined}
        aria-expanded={hasChildren ? open : undefined}
        className={cn(
          "w-full text-left pr-2 rounded-md transition-colors flex items-center gap-2 h-8",
          active
            ? "bg-zinc-900/[0.06] text-zinc-900 font-medium"
            : "text-zinc-700 hover:bg-zinc-900/[0.04] hover:text-zinc-900",
          // A-11.15: deprioritized = legacy/archive entry. Reduced opacity
          // + lighter weight so users don't focus on it. Active-state still
          // resolves cleanly when clicked.
          item.deprioritized && !active && "opacity-50 hover:opacity-80",
        )}
        style={{ paddingLeft: `${paddingLeftPx}px` }}
      >
        {ItemIcon && (
          <ItemIcon
            className={cn(
              "h-4 w-4 shrink-0",
              active ? "text-zinc-900" : "text-zinc-500"
            )}
          />
        )}
        <span className={cn(
          "flex-1 truncate text-[13px] leading-[16px]",
          item.deprioritized && !active && "italic",
        )}>{item.label}</span>
        {item.badge && (
          <span className="text-[10px] font-medium uppercase tracking-wider rounded px-1.5 py-0.5 shrink-0 bg-zinc-900/[0.06] text-zinc-600">
            {item.badge}
          </span>
        )}
        {hasChildren && (
          <ChevronRight
            className={cn(
              "h-3.5 w-3.5 shrink-0 text-zinc-500 transition-transform duration-200",
              open && "rotate-90"
            )}
          />
        )}
      </button>

      {/* Nested children */}
      {hasChildren && open && (
        <div className="relative">
          {/* Vertical guide line */}
          <span
            aria-hidden
            className="absolute top-0 bottom-0 w-px bg-zinc-900/[0.08]"
            style={{ left: `${paddingLeftPx + 8}px` }}
          />
          {item.subItems!.map((child) => (
            <SecondaryNavigationItem
              key={child.path}
              item={child}
              pathname={pathname}
              siblingPaths={siblingPaths}
              onNavigate={onNavigate}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </>
  );
}
