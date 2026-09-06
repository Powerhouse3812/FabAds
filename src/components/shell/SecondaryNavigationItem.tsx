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
          // A-12.38 redesign: 32px tall, 16px radius (rounded-2xl), Geist 13px,
          // active = bg-foreground/[0.04] + medium weight.
          "flex h-8 w-full items-center gap-2 rounded-2xl pr-2 text-left transition-colors",
          // A11y: this had NO focus-visible style at all, so keyboard focus on
          // the entire second-tier sidebar showed only the 4%-opacity hover
          // tint — measured 1.08:1 against a required 3:1, on every surface in
          // the app. That's a keyboard user with no idea where they are.
          //
          // NOT the icon rail's lime ring: that ring is `#c3eb42` (banned in
          // DS v1.2) and only reaches 12:1 because the rail is near-black. On
          // this light panel lime measures ~1.3:1. A near-black ring on the
          // light ground is the readable choice here, and it matches the
          // native outline the main content area already uses.
          "outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          active
            ? "bg-foreground/[0.04] text-foreground font-medium"
            : "text-foreground/65 hover:bg-foreground/[0.04] hover:text-foreground",
          // Deprioritized = 50% opacity; weight stays normal.
          item.deprioritized && !active && "opacity-50 hover:opacity-80",
        )}
        style={{ paddingLeft: `${paddingLeftPx}px` }}
      >
        {ItemIcon && (
          <ItemIcon
            className={cn(
              "h-4 w-4 shrink-0",
              active ? "text-foreground" : "text-foreground/45",
            )}
          />
        )}
        <span
          className={cn(
            "flex-1 truncate text-[13px] leading-4",
            // Deprioritized stays italic per existing convention.
            item.deprioritized && !active && "italic",
          )}
        >
          {item.label}
        </span>
        {item.badge && (
          <span className="shrink-0 rounded-full bg-foreground/[0.06] px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-foreground/65">
            {item.badge}
          </span>
        )}
        {hasChildren && (
          <ChevronRight
            className={cn(
              "h-3.5 w-3.5 shrink-0 text-foreground/45 transition-transform duration-200",
              open && "rotate-90",
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
            className="absolute bottom-0 top-0 w-px bg-foreground/[0.08]"
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
