import * as DialogPrimitive from "@radix-ui/react-dialog";
import { OnboardingShell } from "./OnboardingShell";
import { cn } from "@/lib/utils";

interface FirstLoginOnboardingModalProps {
  open: boolean;
  onComplete: () => void;
}

/**
 * Forced-flow onboarding modal — sits over /insights-v2/feed with a dark
 * backdrop. The user CANNOT dismiss it via Escape, backdrop click, or an
 * explicit X — only by completing the flow (Start Creating / Skip for now)
 * or by hitting Sign in. Matches Maalik's call: "no dismiss until
 * completion" + "compact centered Dialog (720px wide)".
 *
 * The wireframe positions onboarding as a first-login experience over
 * a blurred preview of the app. We mirror that by rendering on top of
 * the My Feeds page so prospects can see "this is what's behind the
 * onboarding."
 *
 * Named `FirstLoginOnboardingModal` to distinguish from the older
 * `OnboardingModal` in src/components/insights/ that picks industries.
 */
export function FirstLoginOnboardingModal({
  open,
  onComplete,
}: FirstLoginOnboardingModalProps) {
  return (
    <DialogPrimitive.Root open={open}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            "fixed inset-0 z-50 bg-black/70 backdrop-blur-sm",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          )}
        />
        <DialogPrimitive.Content
          onEscapeKeyDown={(e) => e.preventDefault()}
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
          className={cn(
            // Centered modal, 720px wide
            "fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%]",
            "w-[min(720px,calc(100vw-32px))]",
            "max-h-[min(900px,calc(100vh-32px))]",
            "flex flex-col",
            // Surface + radius + shadow
            "bg-background rounded-2xl border border-border shadow-2xl",
            "overflow-hidden",
            // Open / close transitions
            "duration-200",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            "data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]",
            "data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]",
          )}
        >
          {/* a11y — required by Radix Dialog, visually hidden */}
          <DialogPrimitive.Title className="sr-only">
            Onboarding
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            First-login onboarding flow demo
          </DialogPrimitive.Description>

          {/* Scrollable content area */}
          <div className="flex-1 min-h-0 overflow-y-auto">
            <OnboardingShell onComplete={onComplete} />
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
