/**
 * Minimal CSV builder. Escapes commas, quotes, and newlines per RFC 4180.
 * No external dep. Used by CSVExportButton and bulk-toolbar export.
 */

function escapeCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function toCSV<T extends Record<string, unknown>>(rows: T[], columns: Array<keyof T>): string {
  const header = columns.map((c) => escapeCell(String(c))).join(",");
  const body = rows
    .map((row) => columns.map((c) => escapeCell(row[c])).join(","))
    .join("\n");
  return header + "\n" + body;
}

export function downloadCSV(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
