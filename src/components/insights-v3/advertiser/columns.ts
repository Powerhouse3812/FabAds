/**
 * Column sets (fixed px widths) for the two tables. The table is exactly the
 * sum of these, so the layout is predictable: at 1440px with the sub-nav open
 * the frame is ~1121px wide and every column, Actions included, fits (the Page
 * set is the widest at 1118px). Domain / Page: Name · Total + active ads ·
 * Winning ads · Longest run · Launch trend · Industry · Category · Landing
 * pages · Offers · Actions. Actions is sticky-right, so it stays visible on
 * narrower screens.
 */
import type { AdvertiserKind } from "@/lib/insights-v3/types";
import type { Column } from "./tableParts";

export const advertiserColumns = (kind: AdvertiserKind): Column[] => [
  { key: "name", label: kind === "page" ? "Page" : "Domain", width: kind === "page" ? 170 : 190, sticky: true },
  { key: "ads", label: "Total + active ads", width: 130 },
  { key: "winners", label: "Winning ads", width: 72 },
  { key: "longest", label: "Longest run", width: 82 },
  { key: "trend", label: "Launch trend", width: 116 },
  { key: "industry", label: "Industry", width: 126 },
  { key: "category", label: "Category", width: 126 },
  { key: "lps", label: "Landing pages", width: 72 },
  { key: "offers", label: "Offers", width: 60 },
  { key: "actions", label: "Actions", width: kind === "page" ? 164 : 128, stickyRight: true },
];

export const LP_COLUMNS: Column[] = [
  { key: "page", label: "Page", width: 290, sticky: true },
  { key: "offer", label: "Offer", width: 200 },
  { key: "funnel", label: "Funnel type", width: 130 },
  { key: "ads", label: "Ads (total + active)", width: 140 },
  { key: "advertisers", label: "Competitors", width: 100 },
  { key: "winners", label: "Winners", width: 84 },
  { key: "actions", label: "Actions", width: 90, stickyRight: true },
];

export const columnsWidth = (cols: Column[]): number => cols.reduce((n, c) => n + c.width, 0);
