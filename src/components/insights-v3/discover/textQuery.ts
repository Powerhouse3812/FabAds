/** Free-text narrowing for Discover and My Feeds (`?q=`), applied to the SOURCE ads before scope and tags. */
import type { Ad } from "@/lib/insights-v3/types";

const haystacks = new WeakMap<Ad, string>();

function haystack(ad: Ad): string {
  let s = haystacks.get(ad);
  if (s == null) {
    s = [
      ad.headline,
      ad.primaryText,
      ad.pageName,
      ad.ctaLabel ?? "",
      ad.analysis.hookText ?? "",
      ad.analysis.angleText ?? "",
      ad.analysis.keywords.join(" "),
    ]
      .join(" \u0001 ")
      .toLowerCase();
    haystacks.set(ad, s);
  }
  return s;
}

/** Case-insensitive match on headline, primary text, page name, keywords, hook text, angle text and CTA. Empty query keeps everything. */
export function filterAdsByQuery(ads: Ad[], rawQuery: string): Ad[] {
  const q = rawQuery.trim().toLowerCase();
  return q ? ads.filter((a) => haystack(a).includes(q)) : ads;
}
