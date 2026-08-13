import * as React from "react";

/**
 * INV-2 (mobile shell): this number MUST stay equal to Tailwind's stock `md`.
 * The shell gates layout with `md:` utilities and gates route policy with this
 * hook — if the two ever disagree there is a viewport band that paints mobile
 * chrome while the route gate believes it is desktop.
 */
export const MOBILE_BREAKPOINT = 768;
export const MOBILE_MEDIA_QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`;

export function useIsMobile() {
  // Seeded synchronously: the previous `useState<boolean|undefined>(undefined)`
  // returned `!!undefined === false` on the first frame, i.e. it reported
  // "desktop" on a phone until the effect ran. Anything that must not mount on
  // mobile (see MobileRouteGate) would flash first.
  const [isMobile, setIsMobile] = React.useState<boolean>(() =>
    typeof window === "undefined"
      ? false
      : window.matchMedia(MOBILE_MEDIA_QUERY).matches,
  );

  React.useEffect(() => {
    const mql = window.matchMedia(MOBILE_MEDIA_QUERY);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return isMobile;
}
