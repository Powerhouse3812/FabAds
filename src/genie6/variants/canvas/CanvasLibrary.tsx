import { useNavigate, useParams } from "react-router-dom";
import { GeneratedOutputsTab } from "../../library/tabs/GeneratedOutputsTab";
import { LibraryTopBar } from "../../components/LibraryTopBar";
import { PreviewPane } from "../../components/PreviewPane";
import { sampleOutputs } from "../../mocks/sample-outputs";

/**
 * Canvas variant — Library.
 *
 * Outputs-only. Hooks / Angles / Concepts / Templates / Avatars / Audiences
 * moved to Assets. Distinct LAYOUT vs the other 3 variants: a canvas-floor
 * background wash behind an unboxed content column, split against the
 * click-to-preview `<PreviewPane />` rail.
 *
 * A-12.198: dropped the local eyebrow/title/"+New" header, the local
 * search + brand + performance + grid/list chrome, and `<LibraryQueueStrip />`
 * — all three duplicated furniture the canonical `<LibraryTopBar />` +
 * `<GeneratedOutputsTab />` (its internal `LibraryToolbar`) already own, and
 * the fake "142 outputs" count / dead grid-list toggle / hardcoded queue mock
 * this variant was carrying. Same fix `StudioLibrary` already had — the view
 * toggle and filters now actually work here too.
 */
export function CanvasLibrary() {
  const { assetId } = useParams<{ assetId?: string }>();
  const navigate = useNavigate();

  const previewOutput = assetId ? sampleOutputs.find((o) => o.id === assetId) ?? null : null;

  return (
    <div className="relative flex h-full flex-col overflow-hidden">
      <div className="absolute inset-0 g6-canvas-floor opacity-40 pointer-events-none" />

      <div className="relative z-10 flex flex-1 overflow-hidden">
        <div className="flex flex-1 flex-col overflow-hidden">
          <LibraryTopBar />
          <div className="flex-1 overflow-y-auto px-5 py-4">
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
