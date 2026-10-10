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
