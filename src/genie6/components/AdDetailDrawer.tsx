import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { sampleOutputs } from "../mocks/sample-outputs";
import { useBatches } from "../lib/genieRunStore";
import { AdDetailDrawerContent } from "./AdDetailDrawerContent";

/**
 * AdDetailDrawer — URL-driven wrapper for the canonical Ad-Detail Sheet.
 *
 * URL contract:
 *   ?ad=<output-id>   → opens the drawer for that output
 *
 * A-12.196 collapsed Variant A + Variant C into a single canonical drawer
 * (`AdDetailDrawerContent`). The variant toggle pill, `?drawer=a|c` switch,
 * and both old variant files are gone. Closing strips `?ad` and any
 * lingering `?drawer` legacy param.
 *
 * Genie 2.0 §10 — "If it came from Genie, the full generation detail is
 * saved in its properties." The real batch (not the same-brand guess
 * `SameBatchGrid` used to fall back to) is resolved here, once, and threaded
 * down — the join key is `RunItem.outputId` (see genieRunTypes.ts).
 */
export function AdDetailDrawer() {
  const [searchParams, setSearchParams] = useSearchParams();
  const adId = searchParams.get("ad");
  const batches = useBatches();

  const output = useMemo(
    () => (adId ? sampleOutputs.find((o) => o.id === adId) ?? null : null),
    [adId],
  );

  const batch = useMemo(() => {
    if (!adId) return undefined;
    return batches.find((b) => b.items.some((i) => i.outputId === adId));
  }, [adId, batches]);

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

  const selectSibling = useCallback(
    (id: string) => {
      setSearchParams(
        (prev) => {
          const sp = new URLSearchParams(prev);
          sp.set("ad", id);
          return sp;
        },
        { replace: false },
      );
    },
    [setSearchParams],
  );

  if (!output) return null;

  return (
    <AdDetailDrawerContent
      output={output}
      batch={batch}
      open={true}
      onClose={close}
      onSelectSibling={selectSibling}
    />
  );
}
