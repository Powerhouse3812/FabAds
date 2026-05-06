import { useEffect, type ReactNode } from "react";

/**
 * RightRail — Studio v4 slide-in column for heavy attach sources (Track C).
 *
 * Photoshop-toolbar pattern: appears as a fixed full-height column on the
 * right edge with a 1px left border + outside-click backdrop + Esc-to-close.
 * shadow-2xl is the ONE place we allow elevation in this build — slide-in
 * panels need to read as a layer above the form.
 *
 * Native fallback by design: v3's PickerColumn is a structural sibling
 * (in-flow, no overlay), which doesn't match the Step-4 pattern where the
 * rail must float above the wizard form regardless of layout.
 */

interface RightRailProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}

export function RightRail({ open, onClose, children }: RightRailProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      {/* Outside-click backdrop */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Rail panel */}
      <aside
        role="dialog"
        aria-modal="true"
        className="fixed right-0 top-0 z-50 flex h-full w-[400px] flex-col border-l border-border bg-background shadow-2xl"
      >
        {children}
      </aside>
    </>
  );
}
