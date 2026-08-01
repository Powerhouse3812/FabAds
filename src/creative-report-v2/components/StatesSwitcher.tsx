/**
 * StatesSwitcher — dev-only footer control to force every §8 state on demand
 * (handoff §10.5). Two kinds of state:
 *   • Data-status states (empty / loading / error / filtered-empty / low-data)
 *     ride the ?state= param, read by ForcedStateContext.
 *   • Scenario states (fatigue / dedup / archived / new / cross-platform /
 *     unsaved) are reached by navigating to a URL that naturally exhibits them.
 * Gated behind import.meta.env.DEV by the caller.
 */
import { useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FlaskConical } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { P } from "@/creative-report-v2/lib/paramSchema";
import { useReportBasePath } from "@/creative-report-v2/state/ReportBasePathContext";

interface StateOption {
  key: string;
  label: string;
  /** Either set ?state= (forced data status) or navigate to a URL. */
  apply: (nav: ReturnType<typeof useNavigate>) => void;
}

/** Built per-version: the switcher must land you on the SAME Creative Report
 *  version you triggered it from (2.0 vs 3.0), otherwise forcing a state on
 *  3.0 would silently bounce you into 2.0. */
function buildOptions(BASE: string): StateOption[] {
  return [
    { key: "live", label: "Live data", apply: (nav) => nav(`${BASE}`) },
    { key: "loading", label: "Loading", apply: (nav) => nav(`${BASE}?state=loading`) },
    { key: "empty", label: "Empty (no account)", apply: (nav) => nav(`${BASE}?state=empty`) },
    { key: "filtered-empty", label: "Filtered-empty", apply: (nav) => nav(`${BASE}/creatives?state=filtered-empty`) },
    { key: "low-data", label: "Low data (n=)", apply: (nav) => nav(`${BASE}?state=low-data`) },
    { key: "error", label: "Error", apply: (nav) => nav(`${BASE}?state=error`) },
    { key: "fatigue", label: "Fatigue flags", apply: (nav) => nav(`${BASE}/creatives?bucket=fatiguing`) },
    { key: "dedup", label: "Dedup uncertain (92%)", apply: (nav) => nav(`${BASE}/creatives?creative=cr-001`) },
    { key: "archived", label: "Deleted / archived ad", apply: (nav) => nav(`${BASE}/creatives?status=archived`) },
    { key: "new", label: "New creative (no perf)", apply: (nav) => nav(`${BASE}/creatives?bucket=new`) },
    {
      key: "cross-platform",
      label: "Cross-platform compare",
      apply: (nav) => nav(`${BASE}/compare?mode=contexts&ids=cr-003`),
    },
    { key: "unsaved", label: "Unsaved view config", apply: (nav) => nav(`${BASE}/views`) },
  ];
}

export function StatesSwitcher() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const basePath = useReportBasePath();
  const OPTIONS = useMemo(() => buildOptions(basePath), [basePath]);
  const forced = params.get(P.state);
  const current = forced ? OPTIONS.find((o) => o.key === forced)?.key ?? "live" : "live";

  return (
    <div className="flex items-center gap-1.5">
      <FlaskConical className="h-3.5 w-3.5 text-muted-foreground" />
      <span className="text-xs text-muted-foreground">States</span>
      <Select
        value={current}
        onValueChange={(key) => {
          const opt = OPTIONS.find((o) => o.key === key);
          opt?.apply(navigate);
        }}
      >
        <SelectTrigger className="h-6 w-[190px] border-dashed text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Data states</SelectLabel>
            {OPTIONS.slice(0, 6).map((o) => (
              <SelectItem key={o.key} value={o.key} className="text-xs">
                {o.label}
              </SelectItem>
            ))}
            <SelectLabel>Scenario states</SelectLabel>
            {OPTIONS.slice(6).map((o) => (
              <SelectItem key={o.key} value={o.key} className="text-xs">
                {o.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}
