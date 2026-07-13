import { ReactNode } from "react";
import { Gift, ShieldCheck } from "lucide-react";

import heroLogo from "@/assets/auth/hero-logo.svg";
import heroMockup from "@/assets/auth/hero-mockup.png";

/**
 * AuthLayout — shared split-screen shell for the auth flows (Figma frame
 * "Frame 2147225558", node 10990:44968; left panel node 11362:45128).
 * Unlike the earlier per-flow illustration hero, the redesigned shell uses
 * ONE fixed dark-green hero panel across every auth screen. Right: the form
 * area (children), width-capped to the Figma column width (500px) and
 * vertically centered — unchanged from before.
 */
export type AuthHero = "signup" | "login" | "password";

/**
 * Hero background gradient — copied verbatim from the Figma node's
 * `background-image` (node 11362:45128): a flat 20% black wash layered over
 * a diagonal wash from yellow-green to a dark blue-green. This is a
 * marketing-surface color, not one of the app's semantic tokens, so it's
 * intentionally hardcoded here rather than added to the design-token scale.
 */
const HERO_GRADIENT =
  "linear-gradient(90deg, rgba(0, 0, 0, 0.2) 0%, rgba(0, 0, 0, 0.2) 100%), linear-gradient(169.44deg, rgb(132, 178, 25) 19.43%, rgb(38, 50, 56) 134.5%)";

export function AuthLayout({
  hero,
  children,
}: {
  /** @deprecated The redesigned shell uses one fixed hero panel (Figma
   *  10990:44968); this prop is ignored and kept only while call sites
   *  migrate. */
  hero?: AuthHero;
  children: ReactNode;
}) {
  void hero;
  return (
    <div className="flex min-h-screen bg-background">
      {/* Hero panel — fixed dark-green marketing hero shared by every auth
          screen (Figma node 11362:45128). Hidden on small screens so the
          form keeps full width on mobile (Figma has no mobile hero frame). */}
      {/* sticky + h-screen: when the form column grows taller than the
          viewport (e.g. the plan-selection step) the page scrolls, but the
          hero stays pinned instead of scrolling away. */}
      <div
        className="sticky top-0 hidden h-screen w-1/2 flex-col overflow-hidden lg:flex"
        style={{ backgroundImage: HERO_GRADIENT }}
      >
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex flex-col gap-4 px-14 pt-14">
            <img src={heroLogo} alt="FabFunnel" className="h-5 w-auto self-start" />
            <div className="flex max-w-[480px] flex-col gap-3">
              <h1 className="text-[30px] font-semibold leading-[38px] text-white">
                Launch at Scale. Optimize in Real Time
              </h1>
              <p className="text-[14px] leading-[22px] text-white/85">
                FabFunnel brings launch, automation, and campaign control under one roof—so you can scale faster,
                with less effort.
              </p>
            </div>
          </div>

          {/* Product mockup composite (laptop + phone dashboards) — exported
              as one flattened Figma asset (node 11362:45345) rather than
              rebuilt from device bezels + screenshots in HTML. Normal-flow,
              bottom-aligned, and capped by the remaining panel height
              (object-contain) so it shrinks on short viewports instead of
              overlapping the copy above. Anchored bottom-left per Figma; the
              top-edge mask fades its baked-in background into the live CSS
              gradient so no hard seam shows. */}
          <div className="flex min-h-0 flex-1 items-end pt-6">
            <img
              src={heroMockup}
              alt=""
              className="ml-[-48px] max-h-full w-[94%] max-w-[640px] object-contain object-left-bottom"
              style={{
                maskImage: "linear-gradient(to top, black 78%, transparent 100%)",
                WebkitMaskImage: "linear-gradient(to top, black 78%, transparent 100%)",
              }}
            />
          </div>
        </div>

        {/* Footer badge row (Figma node 11362:45352) */}
        <div className="flex items-center justify-between gap-6 px-14 pb-10 pt-4">
          <div className="flex items-center gap-3 text-sm text-white/45">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            24X7 support
          </div>
          <img src={heroLogo} alt="FabFunnel" className="h-4 w-auto opacity-90" />
          <div className="flex items-center gap-3 text-sm text-white/45">
            <Gift className="h-4 w-4" aria-hidden="true" />
            14 days free trial
          </div>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex w-full items-center justify-center p-6 lg:w-1/2">
        <div className="w-full max-w-[500px]">{children}</div>
      </div>
    </div>
  );
}
