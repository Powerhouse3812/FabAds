import { useRef, type ReactNode } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { ArrowLeft, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { BasedOnNote } from "./BasedOnNote";
import { DisabledSection } from "./DisabledSection";
import { TruncatedText } from "./TruncatedText";

export interface DetailOverlayProps {
  open: boolean;
  title: string;
  /** "Domain", "Hook", "Landing page" … shown as a chip next to the title. */
  typeLabel: string;
  subtitle?: ReactNode;
  avatar?: ReactNode;
  /** Header actions: Save, Download, Follow, Mark as competitor, Use in Genie … */
  actions?: ReactNode;
  /** With `onBack`, renders the "← {backLabel}" chip (nested drill-down). */
  backLabel?: string;
  onBack?: () => void;
  onClose: () => void;
  children: ReactNode;
}

/**
 * Large right-anchored overlay (≤1200px, full height, own scroll), modelled on the live
 * competitor detail. Radix Dialog: focus trapped, Esc closes, body scroll locked.
 * Outside clicks NEVER close it — only the X button or Esc.
 */
export function DetailOverlay({
  open,
  title,
  typeLabel,
  subtitle,
  avatar,
  actions,
  backLabel,
  onBack,
  onClose,
  children,
}: DetailOverlayProps) {
  const openerRef = useRef<HTMLElement | null>(null);
  const titleRef = useRef<HTMLHeadingElement | null>(null);
  return (
    <DialogPrimitive.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          // Standing rule: overlays never dismiss on outside click.
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
          // Esc closes only the TOP layer: nested → back one level; otherwise close. The X always closes all.
          onEscapeKeyDown={(e) => {
            e.preventDefault();
            if (onBack) onBack();
            else onClose();
          }}
          // Remember who opened us, then focus the title (never a tooltip trigger).
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            const a = document.activeElement;
            openerRef.current = a instanceof HTMLElement && a !== document.body ? a : null;
            titleRef.current?.focus({ preventScroll: true });
          }}
          onCloseAutoFocus={(e) => {
            e.preventDefault();
            const el = openerRef.current;
            if (el && el.isConnected) el.focus({ preventScroll: true });
            openerRef.current = null;
          }}
          aria-describedby={undefined}
          className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[1200px] flex-col border-l border-border bg-background shadow-2xl outline-none duration-300 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:w-[calc(100vw-48px)]"
        >
          <header className="shrink-0 border-b border-border bg-background px-4 py-3 sm:px-6">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="mb-2 inline-flex h-7 max-w-full items-center gap-1.5 rounded-full border border-border bg-card px-2.5 text-xs font-medium text-foreground hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <ArrowLeft className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <TruncatedText text={backLabel ? `Back to ${backLabel}` : "Back"} className="max-w-[260px]" focusable={false} />
              </button>
            )}
            <div className="flex items-start gap-3">
              {avatar && <div className="shrink-0">{avatar}</div>}
              <div className="min-w-0 flex-1">
                <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                  <DialogPrimitive.Title asChild>
                    <h2
                      ref={titleRef}
                      tabIndex={-1}
                      className="min-w-0 max-w-full text-lg font-semibold leading-6 text-foreground outline-none"
                    >
                      <TruncatedText text={title} className="max-w-[min(640px,70vw)]" />
                    </h2>
                  </DialogPrimitive.Title>
                  <span className="shrink-0 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary-text">
                    {typeLabel}
                  </span>
                </div>
                {subtitle && <div className="mt-0.5 min-w-0 text-sm text-muted-foreground">{subtitle}</div>}
              </div>
              {actions && <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">{actions}</div>}
              <DialogPrimitive.Close
                aria-label="Close"
                className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </DialogPrimitive.Close>
            </div>
          </header>
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overflow-x-hidden bg-muted/30 px-4 py-4 sm:px-6">
            {children}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export interface OverlaySectionProps {
  title: string;
  /** Adds the "Based on X ads" note. */
  basedOn?: number;
  /** Right-aligned action (e.g. "View all"). */
  action?: ReactNode;
  /** Missing data → renders a DisabledSection with this reason instead of children. */
  disabledReason?: string;
  minHeight?: number;
  children?: ReactNode;
  className?: string;
}

/** Section frame for overlay bodies. */
export function OverlaySection({ title, basedOn, action, disabledReason, minHeight, children, className }: OverlaySectionProps) {
  if (disabledReason) {
    return <DisabledSection title={title} reason={disabledReason} minHeight={minHeight} className={className} />;
  }
  return (
    <section
      aria-label={title}
      style={minHeight ? { minHeight } : undefined}
      className={cn("rounded-xl border border-border bg-card p-4", className)}
    >
      <header className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <div className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-0.5">
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          {basedOn !== undefined && <BasedOnNote ads={basedOn} />}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </header>
      <div className="mt-3 min-w-0">{children}</div>
    </section>
  );
}
