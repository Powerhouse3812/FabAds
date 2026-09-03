/**
 * DesktopOnlyPrompt — the "disabled and explained" pattern, as one reusable
 * primitive. See `MOBILE_SPEC_B.md` §2.1 (this component's spec) and §1.2
 * (why the pattern exists at all).
 *
 * WHAT BATCH A GOT WRONG (§1.2)
 * Batch A made desktop-only controls a real `disabled` `<button>`. A truly
 * `disabled` element is pulled out of the tab order and announces nothing to
 * a screen reader — it just silently doesn't respond, with no way to
 * discover why. That is the exact failure this component exists to undo:
 * the trigger stays a real, focusable, keyboard-activatable `<button>` —
 * `aria-disabled="true"`, never the `disabled` attribute — and activating it
 * always opens an explanation, never a no-op.
 *
 * WHAT THIS MUST NOT BECOME (Maalik's ruling, §1.2)
 * "Send to desktop", not "send it to me". There is exactly ONE functional
 * action in the prompt — **Copy link for desktop** — and nothing else. No
 * email, no share-sheet, no notify-me. Do not add one, even if a future spec
 * seems to gesture at it; go back and confirm with Maalik first.
 *
 * REASON SOURCING — the single-story rule
 * When `path` is given, the one-sentence reason is read LIVE from
 * `resolveMobilePolicy(path).reason` — never hand-authored here — so this
 * prompt and the `BestOnDesktop` gate the same route renders can never end up
 * telling the user two different stories about why a surface is blocked.
 * `reason` is only consulted when there is no `path` at all (a control that
 * doesn't point at a route — Genie's Regenerate/Launch buttons are disabled
 * actions, not blocked pages). Passing both is not an error, but the policy
 * always wins; a dev-only console.warn flags the disagreement so it gets
 * cleaned up rather than silently drifting further (see `mobileRoutePolicy`'s
 * own dev audit for the established idiom this borrows).
 *
 * VIEWPORT-AGNOSTIC, LIKE BestOnDesktop
 * This component never calls `useIsMobile()` or reads the viewport. The
 * caller alone decides WHEN a control is desktop-only (from
 * `resolveMobilePolicy`, from a static "this action needs Genie's new-gen
 * flow" rule, whatever) — baking a viewport check in here would break any
 * caller that isn't rendering exclusively on a known-mobile branch.
 *
 * TWO SHAPES, ONE CONTRACT
 * The two real consumers (a full-width nav row in the More sheet; a small
 * icon button on a Genie library card) need different-looking triggers, so
 * `shape` picks the layout while this component still owns the actual
 * `<button>` — its a11y contract (`aria-disabled`, focusable, ≥44px) is not
 * something either consumer should have to re-derive correctly, which is
 * exactly the mistake batch A made once already:
 *   - `shape="row"` — a full-width, left-aligned row. Base classes match
 *     `MobileNavContent`'s existing blocked-row look
 *     (`w-full min-h-11 ... text-muted-foreground/60 cursor-not-allowed`)
 *     so swapping a dead `disabled` row for this component is a drop-in, not
 *     a redesign.
 *   - `shape="iconButton"` — a compact 32×32 glyph button, matching
 *     `OutputCard.tsx`'s existing `FooterIconBtn` footprint exactly (Genie
 *     library card footer). A literal 44×44 box would blow out that card's
 *     40px-tall footer row, so the 44px floor is met with an invisible
 *     hit-area expansion instead — `after:absolute after:-inset-1.5` grows
 *     the CLICKABLE region by 6px on every side (32 + 6 + 6 = 44) without
 *     growing the visible glyph. This is the same technique already used in
 *     `src/components/ui/sidebar.tsx` (`SidebarGroupAction`, "Increases the
 *     hit area of the button on mobile") — not a new idea, just reused.
 * Either shape still takes its icon/label content from `children` — this
 * component supplies the disabled-look tokens, the trailing/corner
 * indicator glyph, and the open behaviour; it does not decide what the
 * control is FOR. That split is what "trigger presentation is
 * caller-controlled" (§2.1) means in practice: pick a shape, hand it content.
 *
 * NO OUTSIDE-CLICK DISMISS (INV-8, app-wide)
 * `DialogContent` (see `ui/dialog.tsx`) already blocks outside-click/outside
 * -interact dismissal by construction — that is a standing rule applied at
 * the primitive, not something this file re-implements. The built-in tiny ✕
 * is hidden (`[&>button]:hidden`, the same idiom `StatusConfirmDialog` and
 * `SessionChangesSheet` already use to suppress it) and replaced with ONE
 * explicit `min-h-11` "Close" button — so there is exactly one close control,
 * and it is unmistakably a control, not an 8px corner glyph.
 */
import { useCallback, useState, type ReactNode } from "react";
import { Lock, Monitor, type LucideIcon } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { resolveMobilePolicy } from "@/components/shell/mobileRoutePolicy";

/** Same fallback wording `BestOnDesktop` uses when it has no specific reason —
 *  reused so an un-classified control and an un-classified route read as the
 *  same kind of honest-but-generic message, not two different voices. */
const GENERIC_REASON =
  "This experience is designed for a larger screen. Open this link on a laptop or larger display.";

const ROW_BASE =
  "w-full min-h-11 flex items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm text-muted-foreground/60 cursor-not-allowed";

/**
 * 32×32 visible box (matches `OutputCard.tsx`'s `FooterIconBtn`) + a
 * `-inset-1.5` (6px) hit-area expansion on all sides = 44×44 clickable
 * region. See the file header for why this is a hit-area trick rather than a
 * literal `min-h-11 min-w-11` box.
 */
const ICON_BUTTON_BASE =
  "relative inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground/60 cursor-not-allowed after:absolute after:-inset-1.5";

export interface DesktopOnlyPromptProps {
  /**
   * Human name of the surface, e.g. "Reports", "Launch", "Regenerate". Used
   * verbatim in the dialog title ("{label} is best on desktop") — reusing
   * `BestOnDesktop`'s exact phrasing so the two screens read as one voice.
   * When `path` is also given, prefer the same string
   * `resolveMobilePolicy(path).label` would produce; a dev-only warning
   * fires if they disagree.
   */
  label: string;
  /**
   * The blocked ROUTE this control ultimately points at (e.g. a nav module's
   * `mod.path`). When given:
   *   - the reason shown is read live from `resolveMobilePolicy(path).reason`
   *     (the `reason` prop is ignored, see the file header),
   *   - the default copy-link target becomes this path resolved against
   *     `window.location.origin`.
   * Omit for a control that isn't a blocked route at all — a disabled
   * ACTION, like Genie's Regenerate/Launch buttons — and pass `reason`
   * (and usually `copyUrl`) explicitly instead.
   */
  path?: string;
  /**
   * Required when `path` is omitted. Ignored (with a dev warning if it
   * disagrees) when `path` is given, because the resolved policy reason
   * always wins there — see "REASON SOURCING" above.
   */
  reason?: string;
  /**
   * Absolute URL the "Copy link for desktop" button copies. Defaults to
   * `path` resolved against the real origin (`window.location.origin +
   * path`) so the copied link is never a bare relative path — a relative
   * path pasted into a laptop's address bar would resolve against whatever
   * page is already open there, not this app. With no `path` either, falls
   * back to the current page's own absolute URL (mirrors `BestOnDesktop`'s
   * default). Provide this explicitly for a non-route action that should
   * still hand back a useful link (e.g. Genie's Regenerate button pointing
   * at the library page it lives on, not nothing).
   */
  copyUrl?: string;
  /** Which real consumer shape this trigger renders as. Defaults to "row". */
  shape?: "row" | "iconButton";
  /**
   * Icon+label content INSIDE the trigger button — whatever the caller's
   * layout needs (a module icon + label + trailing chip for a nav row; a
   * single glyph for an icon button). This component appends its own
   * disabled-indicator glyph after `children`; it does not touch what you
   * pass here.
   */
  children: ReactNode;
  /**
   * Extra classes merged onto the trigger `<button>` — use this for layout
   * tweaks (e.g. a sub-item row's tighter `px-3 py-1.5 gap-2` vs the
   * top-level row's `px-3 py-2 gap-2.5`), not to fight the shape's
   * non-negotiables. The ≥44px hit target holds regardless: `min-h-11` on
   * "row" is a real height CSS `min-height` always wins over a smaller
   * `height` utility you might merge in, and the "iconButton" hit-area
   * expansion is on a separate `after:` pseudo-element your `className`
   * doesn't touch at all.
   */
  className?: string;
  /**
   * Accessible name for the trigger. Required in practice for
   * `shape="iconButton"` (icon-only, no visible text) — defaults to `label`
   * when omitted, matching `OutputCard.tsx`'s existing
   * `aria-label={label}` convention for its footer icon buttons. For
   * `shape="row"` leave this unset unless the visible content genuinely
   * doesn't describe the control — setting an `aria-label` there overrides
   * the button's visible text as its accessible name, which should only
   * happen on purpose.
   */
  triggerAriaLabel?: string;
  /**
   * Show the disabled-indicator glyph (default `Lock`) on the trigger.
   * Defaults to `true`. Set `false` if the surrounding row already carries
   * its own "Desktop"-style chip and a second glyph would be redundant
   * clutter rather than reinforcement — that's a per-call-site visual
   * judgment, not something this component should force either way.
   */
  showIndicatorIcon?: boolean;
  /** Swap the default `Lock` glyph for e.g. `ExternalLink` if that fits the
   *  surrounding iconography better. Purely decorative (`aria-hidden`). */
  indicatorIcon?: LucideIcon;
}

function resolveReason(
  label: string,
  path: string | undefined,
  explicitReason: string | undefined,
): string {
  if (path) {
    const policy = resolveMobilePolicy(path);
    if (import.meta.env.DEV) {
      if (explicitReason && explicitReason !== policy.reason) {
        console.warn(
          `[DesktopOnlyPrompt] "${label}" passed both \`path="${path}"\` and a \`reason\` prop that ` +
            `disagrees with resolveMobilePolicy("${path}").reason. The policy's reason always wins here ` +
            `— that is the whole point of sourcing it live (MOBILE_SPEC_B.md §2.1) — so drop the \`reason\` prop.`,
        );
      }
      if (policy.label !== label) {
        console.warn(
          `[DesktopOnlyPrompt] label "${label}" doesn't match resolveMobilePolicy("${path}").label ` +
            `("${policy.label}"). This prompt and the BestOnDesktop gate it points at should name the ` +
            `surface the same way.`,
        );
      }
    }
    return policy.reason ?? GENERIC_REASON;
  }
  if (import.meta.env.DEV && !explicitReason) {
    console.warn(
      `[DesktopOnlyPrompt] "${label}" has neither \`path\` nor \`reason\` — falling back to a generic ` +
        `message. Pass \`path\` for a blocked route, or \`reason\` for a non-route target (e.g. Genie's ` +
        `Regenerate/Launch buttons).`,
    );
  }
  return explicitReason ?? GENERIC_REASON;
}

function resolveAbsoluteUrl(path: string | undefined, copyUrl: string | undefined): string {
  if (copyUrl) return copyUrl;
  if (typeof window === "undefined") return path ?? "";
  return path ? `${window.location.origin}${path}` : window.location.href;
}

export function DesktopOnlyPrompt({
  label,
  path,
  reason,
  copyUrl,
  shape = "row",
  children,
  className,
  triggerAriaLabel,
  showIndicatorIcon = true,
  indicatorIcon,
}: DesktopOnlyPromptProps) {
  const [open, setOpen] = useState(false);
  const resolvedReason = resolveReason(label, path, reason);
  const url = resolveAbsoluteUrl(path, copyUrl);
  const Indicator = indicatorIcon ?? Lock;

  // Same clipboard + toast mechanism as `BestOnDesktop.handleCopyLink` and
  // `InsightAdDetailDrawer`'s Copy Page ID — one copy-to-clipboard idiom for
  // the whole app, not a second one invented here.
  const handleCopy = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
      toast.error("Clipboard unavailable");
      return;
    }
    // MONITOR FIX (batch B final gate): awaited, not fire-and-forget. The
    // app's older idiom (`void writeText(); toast.success(...)`) shows "Link
    // copied" even when the write REJECTS — observed live as an uncaught
    // NotAllowedError ("Document is not focused") with a success toast still
    // on screen. Spec B §2.1 gives this prompt exactly ONE functional action
    // and §3 requires it to really work, so it must not claim success it
    // didn't get.
    navigator.clipboard.writeText(url).then(
      () => toast.success("Link copied"),
      () => toast.error("Could not copy link"),
    );
  }, [url]);

  const isIconButton = shape === "iconButton";

  return (
    <>
      <button
        type="button"
        // aria-disabled, NEVER the `disabled` attribute — see file header.
        aria-disabled="true"
        aria-haspopup="dialog"
        aria-label={triggerAriaLabel ?? (isIconButton ? label : undefined)}
        onClick={() => setOpen(true)}
        className={cn(isIconButton ? ICON_BUTTON_BASE : ROW_BASE, className)}
      >
        {children}
        {showIndicatorIcon &&
          (isIconButton ? (
            <span
              aria-hidden="true"
              className="absolute -bottom-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-muted ring-1 ring-border"
            >
              <Indicator className="h-2 w-2" strokeWidth={2.5} />
            </span>
          ) : (
            <Indicator aria-hidden="true" className="ml-auto h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
          ))}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        {/* Built-in ✕ suppressed — the explicit min-h-11 "Close" button below
            is the only close control (same idiom as StatusConfirmDialog's
            Sheet branch and SessionChangesSheet). Outside-click/Escape-drag
            dismissal is already blocked at the DialogContent primitive
            (INV-8) — nothing to add here. */}
        <DialogContent className="max-w-sm gap-5 text-center [&>button]:hidden">
          <div className="flex flex-col items-center gap-3">
            <Monitor className="h-10 w-10 text-primary" aria-hidden="true" />
            <DialogHeader className="items-center gap-1.5 text-center">
              <DialogTitle className="text-base">{label} is best on desktop</DialogTitle>
              <DialogDescription>{resolvedReason}</DialogDescription>
            </DialogHeader>
          </div>

          {/* Wrapped in a div, not left as direct DialogContent children —
              `[&>button]:hidden` above only targets DIRECT `<button>`
              children (Radix's own ✕), and these two buttons must stay
              visible. */}
          <div className="flex flex-col gap-2">
            <Button
              type="button"
              onClick={handleCopy}
              aria-label={`Copy link to ${label} for desktop`}
              className="min-h-11 w-full"
            >
              Copy link for desktop
            </Button>
            {url && (
              <p className="w-full truncate break-all text-xs text-muted-foreground/80" title={url}>
                {url}
              </p>
            )}
            <DialogClose asChild>
              <Button type="button" variant="ghost" className="min-h-11 w-full">
                Close
              </Button>
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default DesktopOnlyPrompt;
