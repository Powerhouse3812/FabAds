/**
 * CSV export of a launch's generated ad units. Schema is explicit (the dev's
 * Unified Builder left it "unspecified") so the export is stable + re-importable
 * later. Triggered by a user click in the UI — client-side only.
 */
import type { LaunchRun } from "../types";

const HEADER = [
  "name",
  "campaign",
  "ad_set",
  "creative",
  "ad_account",
  "page",
  "status",
  "failure",
  "destination_url",
];

function esc(value: string | number): string {
  const s = String(value ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function unitsToCsv(run: LaunchRun): string {
  const rows = run.units.map((u) =>
    [
      u.name || u.adSetName,
      u.campaignName,
      u.adSetName,
      u.creativeName,
      u.target.accountName,
      u.target.pageName,
      u.status,
      u.failure?.code ?? "",
      u.destinationUrl ?? "",
    ]
      .map(esc)
      .join(","),
  );
  return [HEADER.join(","), ...rows].join("\n");
}

/** Trigger a client-side download of the CSV (user-initiated). */
export function triggerCsvDownload(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
