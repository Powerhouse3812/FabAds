/**
 * Column sets (fixed px widths) for the two tables. The table is exactly the
 * sum of these, so the layout is predictable: at 1440px with the sub-nav open
 * the frame is ~1121px wide and every column, Actions included, fits. Actions
 * is also sticky-right, so it stays visible on narrower screens.
 */
import type { AdvertiserKind } from "@/lib/insights-v3/types";
import type { Column } from "./tableParts";

export const advertiserColumns = (kind: AdvertiserKind): Column[] => [
  { key: "name", label: kind === "page" ? "Page" : "Domain", width: 190, sticky: true },
  { key: "ads", label: "Total + active ads", width: 88 },
  { key: "winners", label: "Winning ads + longest run", width: 124 },
  { key: "trend", label: "Launch trend", width: 124 },
  { key: "top", label: "Top framework / hook / concept", width: 204 },
  { key: "where", label: "Industry + category", width: 120 },
  { key: "lps", label: "Landing pages / offers", width: 76 },
  { key: "actions", label: "Actions", width: kind === "page" ? 164 : 128, stickyRight: true },
];

export const LP_COLUMNS: Column[] = [
  { key: "page", label: "Page", width: 290, sticky: true },
  { key: "offer", label: "Offer", width: 200 },
  { key: "funnel", label: "Funnel type", width: 130 },
  { key: "ads", label: "Ads (total + active)", width: 120 },
  { key: "advertisers", label: "Competitors", width: 100 },
  { key: "winners", label: "Winners", width: 84 },
  { key: "actions", label: "Actions", width: 90, stickyRight: true },
];

export const columnsWidth = (cols: Column[]): number => cols.reduce((n, c) => n + c.width, 0);
