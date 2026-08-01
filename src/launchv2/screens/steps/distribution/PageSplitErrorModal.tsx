/**
 * PageSplitErrorModal — 12-entry edge-case reference list.
 *
 * A scrollable list of all known page-split edge cases. Active entries
 * (derived from live pageDemand + currentMode) float to the top and show
 * their suggestions. Inactive entries are dimmed but always visible.
 *
 * Design system: FabFunnel v1.2 — lime #8FB821, error #ff4d4f/#cf1322,
 * rounded-2xl, Geist Mono numbers, off-white bg-base.
 */

import React from "react";
import { cn } from "@/lib/utils";
import type { PageDemand } from "../../../deriveV2";
import type { PageDistribution } from "../../../types";

export type PageSplitErrorModalProps = {
  open: boolean;
  onClose: () => void;
  pageDemand: PageDemand[];
  currentMode: PageDistribution;
  onApplyFix: (mode: PageDistribution) => void;
};

// ── Entry type ────────────────────────────────────────────────────────────────

type Severity = "error" | "warning" | "info";

interface Entry {
  id: string;
  severity: Severity;
  title: string;
  when: string;
  suggestions: string[];
  active: boolean;
}

// ── Build entries from live props ─────────────────────────────────────────────

function buildEntries(
  pageDemand: PageDemand[],
  currentMode: PageDistribution
): Entry[] {
  const overPages       = pageDemand.filter((p) => p.over);
  const totalDemand     = pageDemand.reduce((s, p) => s + p.demand, 0);
  const totalAvailable  = pageDemand.reduce((s, p) => s + p.available, 0);
  const allFull         = pageDemand.length > 0 && pageDemand.every((p) => p.available === 0);
  const hasFullPages    = pageDemand.some((p) => p.available === 0);
  const unequalCapacity =
    pageDemand.length > 1 &&
    new Set(pageDemand.map((p) => p.available)).size > 1;
  const minAvail   = pageDemand.length > 0 ? Math.min(...pageDemand.map((p) => p.available)) : 0;
  const equalShare = pageDemand.length > 0 ? Math.ceil(totalDemand / pageDemand.length) : 0;
  const noPages    = pageDemand.length === 0;
  const singlePage = pageDemand.length === 1;
  const pageCount  = pageDemand.length;
  const adsPerPage = pageDemand[0]?.demand ?? 0;

  return [
    // ── ERRORS ──────────────────────────────────────────────────────────────
    {
      id: "equal_under_slotted",
      severity: "error",
      title: "Equal split — page under capacity",
      when: `One or more pages don't have enough free slots to absorb their equal share. Equal share = ${equalShare} ads/page, but at least one page has only ${minAvail} slots free.`,
      suggestions: [
        "Switch to Fill First — routes ads to pages that have room, skips full ones",
        "Remove the under-capacity page from your selection",
        "Reduce total ad count so the equal share fits in the smallest page",
      ],
      active:
        currentMode === "equal" &&
        pageDemand.length > 0 &&
        minAvail < equalShare &&
        totalDemand > 0,
    },
    {
      id: "equal_page_full",
      severity: "error",
      title: "Equal split — page completely full",
      when: "At least one selected page has 0 free ad slots. Equal distribution requires every page to receive ads — a full page makes this impossible.",
      suggestions: [
        "Remove the full page from your selection",
        "Switch to Fill First — it automatically skips full pages",
        "Pause existing ads on that page in Meta Ads Manager first",
      ],
      active: currentMode === "equal" && hasFullPages,
    },
    {
      id: "fill_first_total_overflow",
      severity: "error",
      title: "Fill First — total ads exceed all available slots",
      when: `Total ads to place (${totalDemand}) exceeds combined free slots across all selected pages (${totalAvailable}). Fill First can route around individual full pages but cannot create slots that don't exist.`,
      suggestions: [
        "Add more pages with available capacity",
        "Reduce structure (fewer ads per ad set)",
        "Remove some creatives to lower total ad count",
      ],
      active:
        currentMode === "fill_first" &&
        totalDemand > totalAvailable &&
        pageDemand.length > 0,
    },
    {
      id: "all_pages_full",
      severity: "error",
      title: "All selected pages at cap",
      when: "Every connected page has reached the 250-ad limit. No distribution mode can place ads — there are no available slots anywhere.",
      suggestions: [
        "Pause or delete existing ads on these pages in Meta Ads Manager",
        "Add different pages with available capacity",
      ],
      active: allFull,
    },
    {
      id: "no_pages",
      severity: "error",
      title: "No pages selected",
      when: "No Facebook Pages are connected to this launch. Page split cannot distribute ads without destinations.",
      suggestions: [
        "Go to the Accounts section and connect at least one ad account with a Facebook Page",
      ],
      active: noPages,
    },
    {
      id: "one_page_full",
      severity: "error",
      title: "One Page — selected page is full",
      when: "One Page mode sends all ads to a single page. That page has 0 free slots — no ads can be placed.",
      suggestions: [
        "Select a different page with available capacity",
        "Switch to Fill First to distribute across all pages automatically",
      ],
      active: currentMode === "one_page" && singlePage && hasFullPages,
    },
    // ── WARNINGS ────────────────────────────────────────────────────────────
    {
      id: "duplicate_multiplication",
      severity: "warning",
      title: "Duplicate — ad count multiplies per page",
      when: `Duplicate creates a full copy of all ads on each page. With ${pageCount} pages, your ${adsPerPage} ads become ${adsPerPage * pageCount} total. Each new page added multiplies the total again.`,
      suggestions: [
        "Confirm you want this many ads — high ad counts can slow delivery optimisation",
        "Consider Fill First if you want ads distributed rather than duplicated",
      ],
      active: currentMode === "duplicate" && pageCount > 1,
    },
    {
      id: "duplicate_structure_multiplication",
      severity: "warning",
      title: "Duplicate — full campaign structure multiplies",
      when: "Duplicate copies campaigns, ad sets, and ads — not just ads. If you have 2 campaigns × 3 ad sets × 5 ads, each page gets the entire structure. With 3 pages that's 6 campaigns, 18 ad sets, 45 ads.",
      suggestions: [
        "Review your structure before confirming — the total can grow quickly with nested campaigns",
        "Use Ad Set level duplication if you only need one layer copied",
      ],
      active: currentMode === "duplicate" && pageCount > 1,
    },
    {
      id: "duplicate_near_cap",
      severity: "warning",
      title: "Duplicate — page will approach cap after launch",
      when: "After duplication, at least one page will be near or over the 250-ad limit. The page currently has limited slots and the duplicated ads will fill most or all of them.",
      suggestions: [
        "Check the page capacity before launching",
        "Pause older ads on that page to free up slots",
      ],
      active: currentMode === "duplicate" && overPages.length > 0,
    },
    {
      id: "equal_unequal_capacity",
      severity: "warning",
      title: "Equal split — pages have unequal capacity",
      when: "Your selected pages have different numbers of free slots. Equal mode assigns the same number of ads to each page — if the equal share exceeds any page's capacity, it will overflow.",
      suggestions: [
        "Check that the equal share fits within the smallest page's available slots",
        "Switch to Fill First for automatic capacity-aware routing",
      ],
      active: currentMode === "equal" && unequalCapacity,
    },
    // ── INFO ─────────────────────────────────────────────────────────────────
    {
      id: "fill_first_pages_skipped",
      severity: "info",
      title: "Fill First — full pages will be skipped",
      when: "Fill First automatically skips pages with 0 available slots. This is intentional behaviour — but it means some selected pages will receive no ads in this launch.",
      suggestions: [
        "This is expected — no action needed unless you require ads on all pages",
        "Pause existing ads on skipped pages if you need them included",
      ],
      active: currentMode === "fill_first" && hasFullPages && !allFull,
    },
    {
      id: "one_page_concentration",
      severity: "info",
      title: "One Page — single point of failure",
      when: "All ads are concentrated on one page. If Meta restricts or limits that page, every ad in this launch stops simultaneously.",
      suggestions: [
        "Add backup pages as a safety net",
        "Consider Fill First to spread risk across multiple pages",
      ],
      active: currentMode === "one_page",
    },
  ];
}

// ── Severity sort weight ──────────────────────────────────────────────────────

const SEVERITY_ORDER: Record<Severity, number> = { error: 0, warning: 1, info: 2 };

function sortEntries(entries: Entry[]): Entry[] {
  return [...entries].sort((a, b) => {
    // Active first, then inactive
    if (a.active !== b.active) return a.active ? -1 : 1;
    // Within same active state: errors → warnings → info
    return SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
  });
}

// ── Entry row ─────────────────────────────────────────────────────────────────

function EntryRow({ entry }: { entry: Entry }) {
  return (
    <div
      className={cn(
        "py-4 space-y-2",
        "border-b border-[#e7e5dc] dark:border-[#2a2a2a] last:border-0"
      )}
    >
      {/* Row 1: severity dot + title + ACTIVE badge */}
      <div className="flex items-center gap-2">
        <div
          className={cn("w-2 h-2 rounded-full flex-shrink-0", {
            "bg-[#ff4d4f]": entry.severity === "error",
            "bg-[#faad14]": entry.severity === "warning",
            "bg-[rgba(15,15,12,0.25)]": entry.severity === "info",
          })}
        />
        <span
          className={cn(
            "text-[12px] font-semibold flex-1",
            entry.active
              ? "text-[rgba(15,15,12,0.92)] dark:text-[rgba(255,255,255,0.92)]"
              : "text-[rgba(15,15,12,0.45)] dark:text-[rgba(255,255,255,0.45)]"
          )}
        >
          {entry.title}
        </span>
        {entry.active && (
          <span
            className={cn(
              "font-mono text-[8px] uppercase tracking-[0.06em] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0",
              {
                "bg-[rgba(255,77,79,0.12)] text-[#cf1322]":
                  entry.severity === "error",
                "bg-[rgba(250,173,20,0.12)] text-[#874d00]":
                  entry.severity === "warning",
                "bg-[#F0F0EC] text-[rgba(15,15,12,0.55)]":
                  entry.severity === "info",
              }
            )}
          >
            Active
          </span>
        )}
      </div>

      {/* Row 2: when description — always shown, dimmed if inactive */}
      <p
        className={cn(
          "font-mono text-[10px] leading-relaxed ml-4",
          entry.active
            ? "text-[rgba(15,15,12,0.65)] dark:text-[rgba(255,255,255,0.65)]"
            : "text-[rgba(15,15,12,0.35)] dark:text-[rgba(255,255,255,0.35)]"
        )}
      >
        {entry.when}
      </p>

      {/* Row 3: suggestions — only for active entries */}
      {entry.active && entry.suggestions.length > 0 && (
        <div className="ml-4 space-y-1">
          {entry.suggestions.map((s, i) => (
            <div key={i} className="flex items-start gap-1.5">
              <span className="text-[#8FB821] text-[10px] flex-shrink-0 mt-px">
                →
              </span>
              <span className="font-mono text-[10px] text-[rgba(15,15,12,0.65)] dark:text-[rgba(255,255,255,0.65)]">
                {s}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────────

export function PageSplitErrorModal({
  open,
  onClose,
  pageDemand,
  currentMode,
  onApplyFix: _onApplyFix,
}: PageSplitErrorModalProps) {
  if (!open) return null;

  const entries     = buildEntries(pageDemand, currentMode);
  const sorted      = sortEntries(entries);
  const activeCount = entries.filter((e) => e.active).length;
  const total       = entries.length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
    >
      <div
        className="w-full max-w-[460px] flex flex-col rounded-2xl bg-[#FAFAF7] dark:bg-[#18181B] shadow-2xl overflow-hidden"
        style={{ maxHeight: "80vh" }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="pse-title"
      >
        {/* Sticky header */}
        <div className="flex-shrink-0 flex items-center justify-between px-5 py-4 border-b border-[#e7e5dc] dark:border-[#2a2a2a] bg-[#FAFAF7] dark:bg-[#18181B]">
          <div>
            <h3
              id="pse-title"
              className="text-[14px] font-semibold tracking-[-0.01em] text-[rgba(15,15,12,0.92)] dark:text-[rgba(255,255,255,0.92)]"
            >
              Page Split · Edge Cases
            </h3>
            <p className="font-mono text-[10px] text-[rgba(15,15,12,0.45)] dark:text-[rgba(255,255,255,0.45)] mt-0.5">
              {activeCount > 0 ? (
                <span className="text-[#cf1322]">{activeCount} active</span>
              ) : (
                <span className="text-[#237804] dark:text-[#49aa19]">0 active</span>
              )}
              {" · "}
              {total} total
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-[#F0F0EC] dark:hover:bg-[#27272A] transition-colors text-[rgba(15,15,12,0.45)] dark:text-[rgba(255,255,255,0.45)]"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Scrollable entry list */}
        <div className="flex-1 overflow-y-auto px-5">
          {sorted.map((entry) => (
            <EntryRow key={entry.id} entry={entry} />
          ))}
        </div>
      </div>
    </div>
  );
}
