/**
 * Shared helpers for the Boards surfaces (Boards page, Board detail, save
 * modal, pinned-boards nav). Pure functions + one toast helper.
 */
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { togglePin, MAX_PINNED_BOARDS } from "@/lib/insights-v3/stores";
import type { Board, SavableType } from "@/lib/insights-v3/types";

/** Display order for type filters and count chips. */
export const BOARD_TYPE_ORDER: SavableType[] = [
  "ad", "hook", "framework", "angle", "concept", "domain", "page", "landing-page", "offer",
];

export const BOARD_TYPE_PLURAL: Record<SavableType, string> = {
  ad: "Ads",
  hook: "Hooks",
  framework: "Frameworks",
  angle: "Angles",
  concept: "Concepts",
  domain: "Domains",
  page: "Pages",
  "landing-page": "Landing pages",
  offer: "Offers",
};

export type TypeCounts = Record<SavableType, number>;

export function emptyTypeCounts(): TypeCounts {
  return { ad: 0, hook: 0, framework: 0, angle: 0, concept: 0, domain: 0, page: 0, "landing-page": 0, offer: 0 };
}

export function typeCounts(board: Pick<Board, "items">): TypeCounts {
  const out = emptyTypeCounts();
  for (const i of board.items) out[i.ref.type] += 1;
  return out;
}

/** "3 days ago". Bad input gives "". */
export function relativeTime(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${formatDistanceToNow(d)} ago`;
}

/** Pin / unpin with feedback. The cap is 5; hitting it is explained, never silent. */
export function togglePinWithToast(board: Pick<Board, "id" | "name" | "pinned">): void {
  const r = togglePin(board.id);
  if ("reason" in r) {
    if (r.reason === "limit") {
      toast.error(`You can pin up to ${MAX_PINNED_BOARDS} boards`, { description: "Unpin one first, then pin this board." });
    } else {
      toast.error("That board no longer exists");
    }
    return;
  }
  toast.success(r.pinned ? `Pinned “${board.name}”` : `Unpinned “${board.name}”`);
}
