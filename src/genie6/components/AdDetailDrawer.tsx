import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { sampleOutputs } from "../mocks/sample-outputs";
import { AdDetailDrawerVariantA } from "./AdDetailDrawerVariantA";
import { AdDetailDrawerVariantC } from "./AdDetailDrawerVariantC";

/**
 * AdDetailDrawer — URL-driven wrapper for the ad-detail Sheet.
 *
 * URL contract:
 *   ?ad=<output-id>       → opens the drawer for that output
 *   ?drawer=a|c           → variant selector (defaults to "a")
 *
 * Variant A (Reference) and Variant C (Asymmetric Bento) are the two
 * supported drawers. Variant B (Workflow-first) was deleted in A-12.192.
 *
 * Closing the drawer (X / Esc / backdrop) strips both `?ad` and `?drawer`
 * params from the URL. Switching variant flips `?drawer` in place
 * (replace navigation, so back-button still closes the sheet cleanly).
 */
export function AdDetailDrawer() {
  const [searchParams, setSearchParams] = useSearchParams();
  const adId = searchParams.get("ad");
  const variant: "a" | "c" = searchParams.get("drawer") === "c" ? "c" : "a";

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
        sp.set("drawer", variant === "a" ? "c" : "a");
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
    <AdDetailDrawerVariantC
      output={output}
      open={true}
      onClose={close}
      onSwitchVariant={switchVariant}
    />
  );
}
