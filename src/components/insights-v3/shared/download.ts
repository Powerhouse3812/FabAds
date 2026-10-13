import type { DownloadFile } from "@/lib/insights-v3/types";

/** Triggers a client-side download. Text → Blob; url → anchor with the `download` attribute. */
export function triggerDownload(file: DownloadFile): void {
  const a = document.createElement("a");
  a.download = file.filename;
  a.rel = "noopener";
  if (file.kind === "text") {
    const blob = new Blob([file.content], { type: `${file.mime};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    a.href = url;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  } else {
    a.href = file.url;
    a.target = "_blank"; // cross-origin files ignore `download`; never navigate the app away
    document.body.appendChild(a);
    a.click();
    a.remove();
  }
}

/** What a download builder may return: one file, several (media + text), or nothing. */
export type DownloadBuild = DownloadFile | DownloadFile[] | null | undefined;

/** Normalises a builder result to a file list. Null / empty → []. */
export function normalizeDownloads(result: DownloadBuild): DownloadFile[] {
  if (!result) return [];
  return Array.isArray(result) ? result.filter(Boolean) : [result];
}

export const MULTI_DOWNLOAD_GAP_MS = 150;

/** Triggers each file in sequence with a small gap so browsers don't drop the second. */
export async function triggerDownloads(files: DownloadFile[], gapMs = MULTI_DOWNLOAD_GAP_MS): Promise<void> {
  for (let i = 0; i < files.length; i++) {
    if (i > 0) await new Promise<void>((r) => window.setTimeout(r, gapMs));
    triggerDownload(files[i]);
  }
}
