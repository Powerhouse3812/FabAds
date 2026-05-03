import { cn } from "@/lib/utils";
import type { SubItem } from "@/components/sidebar/modules";
import { isSubItemActive } from "@/components/sidebar/modules";

/**
 * SecondaryNavigationItem — a row in the light secondary panel.
 *
 * Spec:
 *   - Row height 28-32px (we use h-8 = 32px / py-1 = ~30px)
 *   - Text 13-14px
 *   - Icons 15-16px
 *   - Active = soft bg highlight
 *   - Hover = subtle bg
 *   - Indentation 14-16px per nesting level
 *   - Subtle vertical guide line for nested items (handled by parent container)
 *
 * Recursively renders children if `item.subItems` exists. Existing data
 * structure is preserved — no flattening, no reordering.
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
  const hasChildren = item.subItems && item.subItems.length > 0;

  // Indentation: 14px per depth level. depth=0 starts at the panel's px-3 baseline.
  const paddingLeftPx = 12 + depth * 14;

  return (
    <>
      <button
        type="button"
        onClick={() => onNavigate(item.path)}
        aria-current={active ? "page" : undefined}
        className={cn(
          "w-full text-left pr-2.5 rounded-md transition-colors flex items-center gap-2 h-8",
          active
            ? "bg-zinc-900/[0.06] text-zinc-900 font-medium"
            : "text-zinc-700 hover:bg-zinc-900/[0.04] hover:text-zinc-900"
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
        <span className="flex-1 truncate text-[13px] leading-[16px]">{item.label}</span>
        {/* Badge — preserved exactly as data provides */}
        {item.badge && (
          <span className="text-[10px] font-medium uppercase tracking-wider rounded px-1.5 py-0.5 shrink-0 bg-zinc-900/[0.06] text-zinc-600">
            {item.badge}
          </span>
        )}
      </button>

      {/* Nested children — render with depth+1 + vertical guide line on the left */}
      {hasChildren && (
        <div className="relative">
          {/* Vertical guide line — subtle, only when nesting exists per spec */}
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
