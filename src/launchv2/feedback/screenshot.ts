/**
 * Screenshot capture for the feedback widget.
 *
 * Uses `modern-screenshot` (handles modern CSS — oklch, backdrop-blur — far
 * better than html2canvas). Output is a downscaled, compressed JPEG data URL
 * so it fits in a single Supabase text column without a Storage bucket.
 *
 * IMPORTANT: capture the screen BEFORE the feedback sheet opens, so the widget
 * chrome doesn't appear in the shot. The button calls captureScreen() first,
 * then opens the sheet with the returned data URL.
 *
 * Cross-origin images render only if the host sends CORS headers (Unsplash
 * does; arbitrary <img> from no-CORS hosts may come out blank — known limit).
 */

import { domToJpeg } from "modern-screenshot";

const MAX_WIDTH = 1400;

/** Capture the current viewport as a compressed JPEG data URL, or null on failure. */
export async function captureScreen(): Promise<string | null> {
  try {
    const root =
      (document.getElementById("root") as HTMLElement | null) ?? document.body;

    const width = root.clientWidth || window.innerWidth;
    const scale = width > MAX_WIDTH ? MAX_WIDTH / width : 1;

    const dataUrl = await domToJpeg(root, {
      quality: 0.72,
      scale,
      backgroundColor: getComputedStyle(document.body).backgroundColor || "#121212",
      // Skip the feedback widget itself if it's somehow already in the tree.
      filter: (node) => {
        if (node instanceof HTMLElement && node.dataset?.feedbackWidget === "true") {
          return false;
        }
        return true;
      },
    });
    return dataUrl;
  } catch {
    return null;
  }
}

/** Read a user-uploaded image File into a data URL (for "upload another"). */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
