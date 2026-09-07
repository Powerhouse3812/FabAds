import { useNavigate, useParams } from "react-router-dom";
import { GeneratedOutputsTab } from "../../library/tabs/GeneratedOutputsTab";
import { LibraryTopBar } from "../../components/LibraryTopBar";
import { PreviewPane } from "../../components/PreviewPane";
import { sampleOutputs } from "../../mocks/sample-outputs";

/**
 * Modular variant — Library.
 *
 * Single outputs_module on the cosmic canvas. No tab strip — Library is
 * outputs-only; other asset classes live in Assets. Distinct LAYOUT vs the
 * other 3 variants: the `g6-halo` cosmic background with no card wrapper at
 * all (single-module page — wrapping again would create a redundant
 * breadcrumb, per the earlier UX-audit P0 this file already documented).
 *
 * A-12.198: dropped the local ">generations.outputs" breadcrumb / h2 title /
 * subtitle / "generate" header, the local search + brand + performance
 * chrome, the fabricated "142 outputs across all batches" literal (moved by
 * zero filters), and `<LibraryQueueStrip />` — a second progress system
 * stacked above the canonical one, fed by a hardcoded mock. The canonical
 * `<LibraryTopBar />` + `<GeneratedOutputsTab />` (its internal
 * `LibraryToolbar`) now own all of that, with a real filtered count and a
 * working view toggle. Same fix `StudioLibrary` already had.
 */
export function ModularLibrary() {
  const { assetId } = useParams<{ assetId?: string }>();
  const navigate = useNavigate();

  const previewOutput = assetId ? sampleOutputs.find((o) => o.id === assetId) ?? null : null;

  return (
    <div className="g6-halo relative flex h-full flex-col">
      <div className="relative z-10 flex flex-1 gap-3 overflow-hidden">
        {/* Single-module page — no inner module-card wrapper. LibraryTopBar's
            breadcrumb + h1 already establish "this is the Library page";
            wrapping again creates a redundant breadcrumb (P0 from UX audit,
            option A). */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <LibraryTopBar />
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <GeneratedOutputsTab />
          </div>
        </div>

        <PreviewPane
          output={previewOutput}
          onClose={() => navigate("/iq/genie6/library")}
        />
      </div>
    </div>
  );
}
