/**
 * Launch Detail — finished-run actions (clone / report / export).
 *
 * Three small, single-purpose actions surfaced on the Detail header once a run
 * has finished. Kept here (not inline in Launch2Detail) so the screen body stays
 * focused on the reliability accounting. All three are content-only and lean on
 * the frozen service + util contract:
 *   - Clone  → service.clonePlanFromRun(run.id) → /launch2/new?draft=<id>
 *   - Report → /reports/fb?launch=<run.id> (Reports module, filtered)
 *   - Export → triggerCsvDownload(`${run.name}.csv`, unitsToCsv(run))
 */
import { Copy, Download, ExternalLink } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import type { MetaLaunchService } from "../../services/MetaLaunchService";
import type { LaunchRun } from "../../types";
import { unitsToCsv, triggerCsvDownload } from "../../utils/csv";

/**
 * "Clone / relaunch" — clones a finished run's captured plan into a fresh draft
 * and opens the flow on it. Renders nothing if the run never captured a
 * sourcePlan (older runs / nothing to clone).
 */
export function CloneRelaunchButton({
  run,
  service,
  onCloned,
}: {
  run: LaunchRun;
  service: MetaLaunchService;
  onCloned: (draftId: string) => void;
}) {
  if (!run.sourcePlan) return null;

  const handleClone = () => {
    const draft = service.clonePlanFromRun(run.id);
    if (draft) {
      toast.success("Cloned to a new draft", {
        description: `“${run.name}” copied — pick up at Step 1 to relaunch.`,
      });
      onCloned(draft.id);
    } else {
      toast.error("Couldn’t clone this launch", {
        description: "Its original setup wasn’t captured, so there’s nothing to copy.",
      });
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={handleClone}>
      <Copy className="h-4 w-4" />
      Clone / relaunch
    </Button>
  );
}

/**
 * "View report" — deep-links into the Reports module, pre-filtered to this
 * launch. A caption next to it sets the expectation that it leaves Launch 2.0.
 */
export function ReportRedirectButton({
  run,
  onView,
}: {
  run: LaunchRun;
  onView: (path: string) => void;
}) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => onView(`/reports/fb?launch=${encodeURIComponent(run.id)}`)}
    >
      <ExternalLink className="h-4 w-4" />
      View report
    </Button>
  );
}

/**
 * "Export CSV" — downloads the generated ad units (client-side) under the run's
 * name. Disabled until at least one unit exists (e.g. an empty scheduled run).
 */
export function CsvExportButton({ run }: { run: LaunchRun }) {
  const handleExport = () => {
    triggerCsvDownload(`${run.name}.csv`, unitsToCsv(run));
    toast.success("CSV exported", {
      description: `${run.units.length} ad ${run.units.length === 1 ? "row" : "rows"} from “${run.name}”.`,
    });
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={run.units.length === 0}
    >
      <Download className="h-4 w-4" />
      Export CSV
    </Button>
  );
}
