/**
 * PostPickerModal — "Select posts" picker for the post-ID import prototype.
 *
 * Scope: the post-import-ON accounts selected in Step 3's distribution rail
 * (accountIds). Groups those accounts' Facebook Pages (TargetPair.fbPageId)
 * and lists each page's running posts (RUNNING_ADS) as ad-preview-style cards
 * (rendered by the shared PostCardPreview component) — mimics the brand-row +
 * media + meta-row pattern from IndustryInsightsAdsCard / InsightAdCard
 * (src/components/insights-v2, src/components/insights) rather than a slim
 * table row.
 *
 * Multi-select, whole-card clickable. Pages with zero posts (no RUNNING_ADS
 * for that fbPageId, or all of a page's posts filtered out) are dropped
 * entirely — never rendered — since a 0-ad account is already correctly
 * flagged elsewhere (deriveV2/reducer/reviewModel/Step3AdDistributionV3).
 *
 * Shell: Radix Dialog, mimics the composition of
 * src/launchv2/screens/steps/shared/RunningPickerModal.tsx (Dialog +
 * DialogContent, rounded-2xl, internal scroll region, header/body/footer).
 * Visual tokens follow the literal Fabfunnel v1.2 hex values already used by
 * its sibling CreativeImportModal.tsx and AccountSelectorPanel.tsx in this
 * same directory (rgba text tokens, #e7e5dc/#2a2a2a borders, #8FB821 lime
 * fill, #F5FBE2/#1D2A09 lime-tinted surfaces, #749818/#C3E165 lime borders)
 * rather than the generic shadcn CSS-var tokens RunningPickerModal happens
 * to use — kept consistent with the rest of Step 3's distribution surface.
 *
 * Per-page accordion: each page renders as a header row (chevron + a stacked
 * account-identity/page-name block + post-count caption) that is always
 * visible. Only the FIRST page
 * in the current filtered list starts expanded; the rest start collapsed —
 * but a collapsed page still shows a "peek strip" of up to 4 thumbnails (+N
 * overflow chip) so its posts are never invisible/missable. Expanding a page
 * renders its FULL grid inline (no per-section max-h scroll, no "show
 * all/show less") — the modal's own single scroll body is the only scroll
 * region, so the accordion (not an inner scroll cap) is what keeps a
 * 250-post page from overwhelming the view.
 *
 * Format/status filters render as two fused segmented pill-tracks (mirrors
 * the compact toolbar pattern used elsewhere in Step 3) rather than the
 * previous separate labeled chip rows.
 */
import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Lock, Search } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { RUNNING_ADS } from "../../../data";
import type { PlanV2, RunningAdV2 } from "../../../types";
import PostCardPreview from "./PostCardPreview";

/* ── Props (contract — must match Agent C's wiring exactly) ─────────────── */

export interface PostPickerModalProps {
  open: boolean;
  onClose: () => void;
  plan: PlanV2; // from "../../../types"
  accountIds: string[]; // scope: the post-import-ON accounts selected in Step 3's rail
  selectedIds: string[]; // RunningAdV2.id[] currently selected
  onConfirm: (ids: string[]) => void; // replaces the selection
}

/* ── Derived page-group shape ────────────────────────────────────────────── */

interface PageGroup {
  fbPageId: string;
  pageName: string;
  accounts: { id: string; name: string }[];
  ads: RunningAdV2[];
}

/* ── Peek strip — how many thumbnails a collapsed page header shows before
   folding the rest into a "+N" chip. ───────────────────────────────────── */

const PEEK_COUNT = 4;

/* ── Format / status filter chips (mirrors CreativeImportModal's FORMAT_CHIPS
   row + FormatChip button, adapted to this file's literal-hex tokens) ────── */

type FormatFilter = "ALL" | "IMAGE" | "VIDEO" | "CAROUSEL";
type StatusFilter = "ALL" | "PUBLISHED" | "PAUSED";

const FORMAT_CHIPS: FormatFilter[] = ["ALL", "IMAGE", "VIDEO", "CAROUSEL"];
const STATUS_CHIPS: StatusFilter[] = ["ALL", "PUBLISHED", "PAUSED"];

const FORMAT_DISPLAY: Record<string, FormatFilter> = {
  single_image: "IMAGE",
  single_video: "VIDEO",
  carousel: "CAROUSEL",
};

const FORMAT_CHIP_LABEL: Record<FormatFilter, string> = {
  ALL: "All",
  IMAGE: "Image",
  VIDEO: "Video",
  CAROUSEL: "Carousel",
};

const STATUS_CHIP_LABEL: Record<StatusFilter, string> = {
  ALL: "All",
  PUBLISHED: "Published",
  PAUSED: "Paused",
};

function formatMatchesFilter(format: RunningAdV2["format"], filter: FormatFilter): boolean {
  if (filter === "ALL") return true;
  return FORMAT_DISPLAY[format] === filter;
}

function statusMatchesFilter(status: RunningAdV2["status"], filter: StatusFilter): boolean {
  if (filter === "ALL") return true;
  if (filter === "PUBLISHED") return status === "active";
  return status === "paused";
}

/* ── Segmented filter option — one pill inside a fused
   `inline-flex rounded-full bg-[#F0F0EC] dark:bg-[#1B1B1F] p-0.5` track.
   Active = lime fill; inactive = muted text only (the shared track bg is
   the "unselected" surface, so inactive options carry no bg of their own). ─ */

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-full px-2.5 py-1 font-mono text-[11px] transition-colors",
        active
          ? "bg-[#8FB821] text-[#121212]"
          : "text-[rgba(15,15,12,0.62)] hover:text-[rgba(15,15,12,0.92)] dark:text-[rgba(255,255,255,0.62)] dark:hover:text-[rgba(255,255,255,0.92)]",
      )}
    >
      {label}
    </button>
  );
}

/* ── Page accordion section — always-visible header (chevron + a stacked
   account-identity/page-name block + post-count caption), a collapsed-state
   peek strip of thumbnails so a folded page is never missable, and the full
   post grid when expanded. Pages with zero posts are filtered out upstream
   (see filteredGroups) and never reach this component. ────────────────── */

function PageAccordion({
  group,
  selectedIds,
  onToggle,
  expanded,
  onToggleExpand,
}: {
  group: PageGroup;
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  expanded: boolean;
  onToggleExpand: () => void;
}) {
  const identity =
    group.accounts.length <= 1 ? (
      <span className="truncate text-[13px] font-medium text-[rgba(15,15,12,0.92)] dark:text-[rgba(255,255,255,0.92)]">
        {group.accounts[0]?.name ?? "—"}
      </span>
    ) : (
      <span className="shrink-0 rounded-full bg-[#F5FBE2] px-2 py-0.5 font-mono text-[11px] tabular-nums text-[#5B7611] dark:bg-[#1D2A09] dark:text-[#C3E165]">
        {group.accounts.length} ad accounts
      </span>
    );

  return (
    <div className="space-y-2.5">
      <button
        type="button"
        onClick={onToggleExpand}
        aria-expanded={expanded}
        className="flex w-full items-center gap-2 rounded-xl px-1 py-1 text-left transition-colors hover:bg-foreground/[0.03]"
      >
        {expanded ? (
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-[rgba(15,15,12,0.45)] dark:text-[rgba(255,255,255,0.45)]" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[rgba(15,15,12,0.45)] dark:text-[rgba(255,255,255,0.45)]" />
        )}

        <span className="flex min-w-0 flex-1 items-center gap-2">
          <span className="flex min-w-0 flex-col">
            {identity}
            <span className="truncate text-[11px] text-[rgba(15,15,12,0.55)] dark:text-[rgba(255,255,255,0.55)]">
              {group.pageName}
            </span>
          </span>
          <span className="ml-auto shrink-0 font-mono text-[11px] tabular-nums text-[rgba(15,15,12,0.55)] dark:text-[rgba(255,255,255,0.55)]">
            {group.ads.length} post{group.ads.length !== 1 ? "s" : ""}
          </span>
        </span>

        {!expanded && (
          <div className="flex shrink-0 items-center gap-1">
            {group.ads.slice(0, PEEK_COUNT).map((ad) => (
              <img
                key={ad.id}
                src={ad.thumbnail}
                alt=""
                loading="lazy"
                className="h-9 w-9 rounded-md object-cover"
              />
            ))}
            {group.ads.length > PEEK_COUNT && (
              <span className="flex h-9 items-center rounded-md bg-[#F0F0EC] px-1.5 font-mono text-[11px] text-[rgba(15,15,12,0.55)] dark:bg-[#1B1B1F] dark:text-[rgba(255,255,255,0.55)]">
                +{group.ads.length - PEEK_COUNT}
              </span>
            )}
          </div>
        )}
      </button>

      {expanded && (
        <div className="grid grid-cols-3 gap-2.5">
          {group.ads.map((ad) => (
            <PostCardPreview
              key={ad.id}
              ad={ad}
              pageName={group.pageName}
              selected={selectedIds.has(ad.id)}
              onToggle={() => onToggle(ad.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Main component ──────────────────────────────────────────────────────── */

export default function PostPickerModal({
  open,
  onClose,
  plan,
  accountIds,
  selectedIds,
  onConfirm,
}: PostPickerModalProps) {
  const [draftIds, setDraftIds] = useState<Set<string>>(() => new Set(selectedIds));
  const [query, setQuery] = useState("");
  const [formatFilter, setFormatFilter] = useState<FormatFilter>("ALL");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  // Per-page expand/collapse state — keyed by fbPageId, defaults to collapsed
  // (via the falsy fallback at read time) when a page has no entry yet. The
  // default-open shape (only the first filtered page) is (re)computed by the
  // effect below, not here.
  const [expandedPages, setExpandedPages] = useState<Record<string, boolean>>({});

  // Reseed the draft (and clear any stale search) from the committed
  // selection every time the modal opens. expandedPages' default-open shape
  // is handled by the effect further down, which also depends on `open`.
  useEffect(() => {
    if (open) {
      setDraftIds(new Set(selectedIds));
      setQuery("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Derive page groups from the scoped accounts, keyed by fbPageId.
  const pageGroups = useMemo<PageGroup[]>(() => {
    const scoped = plan.targets.filter((t) => accountIds.includes(t.accountId));
    const map = new Map<string, PageGroup>();

    scoped.forEach((t) => {
      const key = t.fbPageId;
      if (!map.has(key)) {
        map.set(key, { fbPageId: key, pageName: t.pageName || key, accounts: [], ads: [] });
      }
      const g = map.get(key)!;
      if (!g.accounts.some((a) => a.id === t.accountId)) {
        g.accounts.push({ id: t.accountId, name: t.accountName });
      }
    });

    // Strongest/most-reused-worthy posts first: sort by trailing-30d spend
    // descending (undefined spend treated as 0) so the user doesn't have to
    // hunt through a long page for its best performers.
    map.forEach((g) => {
      g.ads = RUNNING_ADS.filter((ad) => ad.fbPageId === g.fbPageId).sort(
        (a, b) => (b.spend30d ?? 0) - (a.spend30d ?? 0),
      );
    });

    return Array.from(map.values());
  }, [plan.targets, accountIds]);

  // Combined filter — search text + format + status, ANDed together, applied
  // within each group; groups with zero matches are hidden entirely. A page
  // that is *genuinely* empty (zero posts before any filtering — no
  // RUNNING_ADS for that fbPageId) is dropped unconditionally, regardless of
  // whether a filter is active, since this picker never renders empty page
  // groups. Spend-descending order from pageGroups is preserved (filtering
  // doesn't reorder).
  const trimmedQuery = query.trim();
  const hasActiveFilter = trimmedQuery.length > 0 || formatFilter !== "ALL" || statusFilter !== "ALL";
  const filteredGroups = useMemo<PageGroup[]>(() => {
    const q = trimmedQuery.toLowerCase();
    return pageGroups.flatMap((g) => {
      if (g.ads.length === 0) return [];
      if (!hasActiveFilter) return [g];
      const ads = g.ads.filter(
        (ad) =>
          (!q || ad.name.toLowerCase().includes(q)) &&
          formatMatchesFilter(ad.format, formatFilter) &&
          statusMatchesFilter(ad.status, statusFilter),
      );
      return ads.length > 0 ? [{ ...g, ads }] : [];
    });
  }, [pageGroups, hasActiveFilter, trimmedQuery, formatFilter, statusFilter]);

  // Default accordion shape: only the FIRST page in the CURRENT filtered list
  // starts expanded (filteredGroups never contains empty page groups, so
  // "first" is always a page with posts), every other page starts collapsed
  // (still visible via its header + peek strip). Recomputed whenever the
  // modal opens or the filtered result set changes (search/format/status) —
  // typing a search or switching a filter re-shows a fresh, predictable shape
  // rather than leaving whatever expand state the previous result set had
  // reached.
  useEffect(() => {
    if (!open) return;
    const firstGroup = filteredGroups[0];
    setExpandedPages(firstGroup ? { [firstGroup.fbPageId]: true } : {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, trimmedQuery, formatFilter, statusFilter]);

  function toggleAd(id: string) {
    setDraftIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleExpand(fbPageId: string) {
    setExpandedPages((prev) => ({ ...prev, [fbPageId]: !prev[fbPageId] }));
  }

  function handleConfirm() {
    onConfirm(Array.from(draftIds));
    onClose();
  }

  // Header title: 1 scoped account → its name; else → count.
  const singleAccountName =
    accountIds.length === 1
      ? plan.targets.find((t) => t.accountId === accountIds[0])?.accountName ?? accountIds[0]
      : null;
  const title = singleAccountName
    ? `Select posts — ${singleAccountName}`
    : `Select posts — ${accountIds.length} ad accounts`;

  // Footer stats: total selected posts + unique accounts across pages with ≥1 selected post.
  // Operates on ALL of draftIds/pageGroups (not the filtered/expanded view), so
  // selections inside a collapsed or filtered-out page still count.
  const totalSelected = draftIds.size;
  const accountsInLaunch = useMemo(() => {
    const set = new Set<string>();
    pageGroups.forEach((g) => {
      if (g.ads.some((ad) => draftIds.has(ad.id))) {
        g.accounts.forEach((a) => set.add(a.id));
      }
    });
    return set.size;
  }, [pageGroups, draftIds]);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent
        onInteractOutside={(e) => e.preventDefault()}
        className="flex max-h-[85vh] w-full max-w-[900px] flex-col gap-0 overflow-hidden rounded-2xl border border-[#e7e5dc] bg-white p-0 dark:border-[#2a2a2a] dark:bg-[#1E1E23]"
      >
        {/* Radix accessibility requirement — visible title rendered below */}
        <DialogTitle className="sr-only">{title}</DialogTitle>

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-0.5 border-b border-[#e7e5dc] px-6 py-5 dark:border-[#2a2a2a]">
          <span className="text-[15px] font-medium tracking-[-0.01em] text-[rgba(15,15,12,0.92)] dark:text-[rgba(255,255,255,0.92)]">
            {title}
          </span>
          <span className="text-[13px] text-[rgba(15,15,12,0.62)] dark:text-[rgba(255,255,255,0.62)]">
            Published and dark posts from your selected pages
          </span>
        </div>

        {/* ── Toolbar — compact search left, segmented filters right ──────── */}
        <div className="flex items-center justify-between gap-4 border-b border-[#e7e5dc] px-6 py-3 dark:border-[#2a2a2a]">
          <div className="relative flex h-9 w-[240px] flex-none items-center">
            <Search className="absolute left-3.5 h-3.5 w-3.5 text-[rgba(15,15,12,0.45)] dark:text-[rgba(255,255,255,0.45)]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search posts..."
              className="h-9 w-full rounded-[28px] border border-[#e7e5dc] bg-white pl-9 pr-4 text-[13px] text-[rgba(15,15,12,0.92)] outline-none transition-all placeholder:font-mono placeholder:text-[rgba(15,15,12,0.4)] focus:border-[#8FB821]/50 focus:shadow-[0_0_0_3px_rgba(143,184,33,0.15)] dark:border-[#2a2a2a] dark:bg-[#1E1E23] dark:text-[rgba(255,255,255,0.92)] dark:placeholder:text-[rgba(255,255,255,0.4)]"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-full bg-[#F0F0EC] p-0.5 dark:bg-[#1B1B1F]">
              {FORMAT_CHIPS.map((chip) => (
                <FilterChip
                  key={chip}
                  label={FORMAT_CHIP_LABEL[chip]}
                  active={formatFilter === chip}
                  onClick={() => setFormatFilter(chip)}
                />
              ))}
            </div>
            <div className="inline-flex rounded-full bg-[#F0F0EC] p-0.5 dark:bg-[#1B1B1F]">
              {STATUS_CHIPS.map((chip) => (
                <FilterChip
                  key={chip}
                  label={STATUS_CHIP_LABEL[chip]}
                  active={statusFilter === chip}
                  onClick={() => setStatusFilter(chip)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* ── Page groups (scroll area) ───────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto bg-[#FAFAF7] px-6 py-4 dark:bg-[#18181B]">
          {pageGroups.length === 0 ? (
            <div className="flex flex-col items-center gap-1 py-12 text-center">
              <p className="text-[13px] font-medium text-[rgba(15,15,12,0.62)] dark:text-[rgba(255,255,255,0.62)]">
                No pages in scope
              </p>
              <p className="font-mono text-[11px] text-[rgba(15,15,12,0.45)] dark:text-[rgba(255,255,255,0.45)]">
                Turn on post import for at least one account in the rail
              </p>
            </div>
          ) : filteredGroups.length === 0 ? (
            <div className="flex flex-col items-center gap-1 py-12 text-center">
              <p className="text-[13px] font-medium text-[rgba(15,15,12,0.62)] dark:text-[rgba(255,255,255,0.62)]">
                {!hasActiveFilter
                  ? "No posts available on your selected pages"
                  : trimmedQuery
                    ? <>No posts match &ldquo;{trimmedQuery}&rdquo;</>
                    : "No posts match your filters"}
              </p>
              <p className="font-mono text-[11px] text-[rgba(15,15,12,0.45)] dark:text-[rgba(255,255,255,0.45)]">
                {!hasActiveFilter
                  ? "None of your selected pages have posts to show"
                  : trimmedQuery
                    ? "Try a different search term"
                    : "Try adjusting the format or status filter"}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredGroups.map((g) => (
                <PageAccordion
                  key={g.fbPageId}
                  group={g}
                  selectedIds={draftIds}
                  onToggle={toggleAd}
                  expanded={!!expandedPages[g.fbPageId]}
                  onToggleExpand={() => toggleExpand(g.fbPageId)}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Locked strip (above the footer) ─────────────────────────────── */}
        <div className="px-6 pt-3">
          <div className="flex items-center gap-2 rounded-xl bg-[#F0F0EC] px-3 py-2 dark:bg-[#1B1B1F]">
            <Lock className="h-3 w-3 shrink-0 text-[rgba(15,15,12,0.62)] dark:text-[rgba(255,255,255,0.62)]" />
            <p className="text-[12px] text-[rgba(15,15,12,0.62)] dark:text-[rgba(255,255,255,0.62)]">
              Page split locked while post import is on — posts run only from their owner page.
            </p>
          </div>
        </div>

        {/* ── Footer ───────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-3 border-t border-[#e7e5dc] px-6 py-4 dark:border-[#2a2a2a]">
          <span className="font-mono text-[11px] tabular-nums text-[rgba(15,15,12,0.55)] dark:text-[rgba(255,255,255,0.55)]">
            {totalSelected} post{totalSelected !== 1 ? "s" : ""} selected · ads will be created in {accountsInLaunch}{" "}
            account{accountsInLaunch !== 1 ? "s" : ""}
          </span>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-[#e7e5dc] px-4 py-2 text-[13px] font-medium text-[rgba(15,15,12,0.75)] transition-colors hover:bg-[#F0F0EC] dark:border-[#2a2a2a] dark:text-[rgba(255,255,255,0.75)] dark:hover:bg-[#1B1B1F]"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={totalSelected === 0}
              onClick={handleConfirm}
              className="rounded-full bg-[#8FB821] px-5 py-2 text-[13px] font-medium text-[#121212] transition-colors hover:bg-[#AACF32] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Use posts
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
