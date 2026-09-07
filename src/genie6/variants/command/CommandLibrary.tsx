import { useNavigate, useParams } from "react-router-dom";
import { GeneratedOutputsTab } from "../../library/tabs/GeneratedOutputsTab";
import { LibraryTopBar } from "../../components/LibraryTopBar";
import { PreviewPane } from "../../components/PreviewPane";
import { sampleOutputs } from "../../mocks/sample-outputs";

/**
 * Command variant — Library.
 *
 * Outputs-only. Dense ops view. Other asset classes live in Assets. Distinct
 * LAYOUT vs the other 3 variants: a bordered/boxed card panel (the "database"
 * feel) around the unified toolbar + body, split against the click-to-preview
 * `<PreviewPane />` rail.
 *
 * A-12.198: dropped the local Database-icon/title/"+New generation" header,
 * the local search + brand + performance chrome, the fabricated
 * "· 142 outputs" / "142 results" literals (a body rendering 50 that no
 * filter could move), and `<LibraryQueueStrip />` — a second progress system
 * stacked above the canonical one, fed by a hardcoded mock. The canonical
 * `<LibraryTopBar />` + `<GeneratedOutputsTab />` (its internal
 * `LibraryToolbar`) now own all of that, with a real filtered count and a
 * working view toggle. Same fix `StudioLibrary` already had.
 *
 * The card wrapper was previously a `<main>` — nested inside AppShell's own
 * `<main data-fabads-shell-main="v7">`, a duplicate landmark. It's a plain
 * `<div>` now; AppShell already supplies the page's one `<main>`.
 */
export function CommandLibrary() {
  const { assetId } = useParams<{ assetId?: string }>();
  const navigate = useNavigate();

  const previewOutput = assetId ? sampleOutputs.find((o) => o.id === assetId) ?? null : null;

  return (
    <div className="flex h-full flex-col p-3">
      <div className="flex flex-1 gap-3 overflow-hidden">
        <div className="flex flex-1 flex-col overflow-hidden rounded-g6-base border border-g6-border bg-g6-bg-container">
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
