import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { sampleOutputs } from "../mocks/sample-outputs";
import { AdDetailDrawerVariantA } from "./AdDetailDrawerVariantA";
import { AdDetailDrawerVariantB } from "./AdDetailDrawerVariantB";

/**
 * AdDetailDrawer — URL-driven wrapper that picks the right variant.
 *
 * URL contract:
 *   ?ad=<output-id>   → opens the drawer for that output
 *   ?drawer=a|b       → which variant renders (defaults to "a")
 *
 * Closing the drawer (X / Esc / backdrop) strips both params from the URL
 * so back-button history is clean.
 *
 * Mount this once at the StudioLibrary page level. The Sheet primitive
 * portals to <body>, so it overlays the rest of the page (including any
 * AngleViewMoreDrawer already open — stacks naturally via z-index from
 * Radix Portal).
 */
export function AdDetailDrawer() {
  const [searchParams, setSearchParams] = useSearchParams();
  const adId = searchParams.get("ad");
  const variant: "a" | "b" = searchParams.get("drawer") === "b" ? "b" : "a";

  const output = useMemo(
    () => (adId ? sampleOutputs.find((o) => o.id === adId) ?? null : null),
    [adId],
  );

  const close = useCallback(() => {
    setSearchParams(
      (prev) => {
        const sp = new URLSearchParams(prev);
        sp.delete("ad");
        sp.delete("drawer");
        return sp;
      },
      { replace: false },
    );
  }, [setSearchParams]);

  const switchVariant = useCallback(() => {
    setSearchParams(
      (prev) => {
        const sp = new URLSearchParams(prev);
        sp.set("drawer", variant === "a" ? "b" : "a");
        return sp;
      },
      { replace: true },
    );
  }, [setSearchParams, variant]);

  if (!output) return null;

  return variant === "a" ? (
    <AdDetailDrawerVariantA
      output={output}
      open={true}
      onClose={close}
      onSwitchVariant={switchVariant}
    />
  ) : (
    <AdDetailDrawerVariantB
      output={output}
      open={true}
      onClose={close}
      onSwitchVariant={switchVariant}
    />
  );
}
