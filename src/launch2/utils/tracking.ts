/**
 * URL tracking — appends a UTM/param template to a destination URL, resolving
 * {{campaign}} / {{adset}} tokens. Used per-ad at launch and previewed in the
 * flow. (Meta's own URL-params field works the same way.)
 */
export function buildTrackedUrl(
  baseUrl: string,
  utmTemplate: string,
  ctx: { campaign?: string; adset?: string },
): string {
  if (!baseUrl) return "";
  const params = (utmTemplate || "")
    .trim()
    .replace(/\{\{\s*campaign\s*\}\}/g, encodeURIComponent(ctx.campaign ?? ""))
    .replace(/\{\{\s*adset\s*\}\}/g, encodeURIComponent(ctx.adset ?? ""));
  if (!params) return baseUrl;
  const sep = baseUrl.includes("?") ? "&" : "?";
  return `${baseUrl}${sep}${params}`;
}
