/**
 * Creative Element Insights list. One row per framework / hook / angle / concept.
 * Columns follow the spec table exactly:
 *   Item · Ads using it + share · Winning ads + avg days live · Trend ·
 *   Example + top advertisers · Market footprint · actions.
 *
 * The whole row opens the element overlay (Enter / Space too). Every control
 * inside a row stops propagation (the kit buttons already do).
 * Narrow viewports scroll inside the container only, never the page.
 */
import { memo, useCallback, useState, type KeyboardEvent } from "react";
import { ImageOff, Play } from "lucide-react";
import type { ElementType } from "@/lib/insights-v3/types";
import { MODULE_NOW, getAd } from "@/lib/insights-v3/data";
import { buildDownloads, formatDays, type ElementRow } from "@/lib/insights-v3/selectors";
import { useBoardCountForItem } from "@/lib/insights-v3/stores";
import type { Scope } from "@/lib/insights-v3/types";
import { cn } from "@/lib/utils";
import {
  ChangeChip,
  ElementActions,
  Hint,
  InfoGlyph,
  NewBadge,
  TrendSpark,
  TruncatedText,
  fmtInt,
  useAdDrawer,
  useDetailStack,
} from "@/components/insights-v3/shared";
import { TYPE_ICON } from "@/components/insights-v3/shared/typeMeta";
import { UseInGenie } from "@/components/insights-v3/genie/UseInGenie";
import { ELEMENT_NOUN_SINGULAR } from "./constants";

const PAGE_SIZE = 50;

const TH = "whitespace-nowrap px-3 py-2 text-left text-xs font-medium text-muted-foreground";

function Th({ children, tip, className }: { children: string; tip: string; className?: string }) {
  return (
    <th scope="col" className={cn(TH, className)}>
      <span className="inline-flex items-center gap-1">
        {children}
        <InfoGlyph tip={tip} />
      </span>
    </th>
  );
}

/** One example ad: thumbnail that opens the ad drawer. */
function ExampleThumb({ adId }: { adId: string | null }) {
  const drawer = useAdDrawer();
  const ad = adId ? getAd(adId) : undefined;
  if (!ad) {
    return (
      <Hint content="No example ad is available for this item in this scope.">
        <span
          tabIndex={0}
          role="img"
          aria-label="No example ad available"
          className="flex h-14 w-11 shrink-0 items-center justify-center rounded-md border border-dashed border-border bg-muted/40 text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ImageOff className="h-4 w-4" aria-hidden="true" />
        </span>
      </Hint>
    );
  }
  return (
    <Hint content={`Open example ad: ${ad.headline}`}>
      <button
        type="button"
        aria-label={`Open example ad: ${ad.headline}`}
        onClick={(e) => {
          e.stopPropagation();
          drawer.open(ad.id);
        }}
        className="relative h-14 w-11 shrink-0 overflow-hidden rounded-md border border-border bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {ad.thumbnailUrl ? (
          <img src={ad.thumbnailUrl} alt="" loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-muted-foreground">
            <ImageOff className="h-4 w-4" aria-hidden="true" />
          </span>
        )}
        {ad.mediaKind === "video" && (
          <span className="absolute bottom-0.5 right-0.5 rounded-full bg-background/80 p-0.5 text-foreground">
            <Play className="h-2.5 w-2.5 fill-current" aria-hidden="true" />
          </span>
        )}
      </button>
    </Hint>
  );
}

interface RowProps {
  row: ElementRow;
  type: ElementType;
  scope: Scope;
  isNew: boolean;
}

const ElementTableRow = memo(function ElementTableRow({ row, type, scope, isNew }: RowProps) {
  const detail = useDetailStack();
  const savedCount = useBoardCountForItem({ type, id: row.id });
  const ref = { type, id: row.id };
  const Icon = TYPE_ICON[type];

  const open = useCallback(() => detail.push({ kind: "element", elementType: type, id: row.id }), [detail, type, row.id]);
  const onKeyDown = (e: KeyboardEvent<HTMLTableRowElement>) => {
    if (e.target !== e.currentTarget) return; // keep Enter/Space for the buttons inside the row
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      open();
    }
  };

  return (
    <tr
      tabIndex={0}
      aria-label={`Open ${row.label}`}
      onClick={open}
      onKeyDown={onKeyDown}
      className="cursor-pointer border-t border-border align-top transition-colors hover:bg-primary/5 focus-visible:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
    >
      {/* Item */}
      <td className="max-w-[280px] px-3 py-3">
        <div className="flex min-w-0 items-start gap-2">
          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/15 text-primary-text">
            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-1.5">
              <TruncatedText text={row.label} className="text-sm font-medium text-foreground" focusable={false} />
              {isNew && <NewBadge />}
            </div>
            {row.description && (
              // Plain line-clamp (not TruncatedText's -webkit-box + overflow) so the first glyph of a wrapped line is never clipped.
              <Hint content={row.description}>
                <p className="mt-0.5 line-clamp-2 px-px -mx-px text-xs leading-4 text-muted-foreground">{row.description}</p>
              </Hint>
            )}
          </div>
        </div>
      </td>

      {/* Ads using it + share % */}
      <td className="px-3 py-3">
        <div className="font-mono text-sm font-semibold tabular-nums text-foreground">{fmtInt(row.adsUsing)}</div>
        <div className="mt-1 flex items-center gap-2">
          <div
            role="img"
            aria-label={`${row.sharePct}% of ads with a ${ELEMENT_NOUN_SINGULAR[type]} identified`}
            className="h-1.5 w-16 overflow-hidden rounded-full bg-primary/15"
          >
            <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, Math.max(row.adsUsing > 0 ? 3 : 0, row.sharePct))}%` }} />
          </div>
          <span className="font-mono text-xs tabular-nums text-muted-foreground">{row.sharePct}%</span>
        </div>
      </td>

      {/* Winning ads + avg days live */}
      <td className="px-3 py-3">
        <div className="font-mono text-sm font-semibold tabular-nums text-foreground">{fmtInt(row.winningAds)}</div>
        <div className="mt-1 text-xs text-muted-foreground">
          {row.avgDaysLive == null ? (
            <Hint content="No ad using this has a known start date, so days live can't be averaged.">
              <span tabIndex={0} className="rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                Start date unknown
              </span>
            </Hint>
          ) : (
            <Hint content={`Average over the ${fmtInt(row.avgDaysLiveBasedOn)} ads with a known start date.`}>
              <span tabIndex={0} className="rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                avg <span className="font-mono tabular-nums">{formatDays(row.avgDaysLive)}</span> live
              </span>
            </Hint>
          )}
        </div>
      </td>

      {/* Trend */}
      <td className="min-w-[184px] px-3 py-3">
        <TrendSpark series={row.trend} width={88} height={26} />
        <div className="mt-1 text-[11px] text-muted-foreground">{row.trend.unit}</div>
        <ChangeChip changePct={row.changePct} compact className="mt-1 whitespace-nowrap" />
      </td>

      {/* Example + top advertisers */}
      <td className="max-w-[260px] px-3 py-3">
        <div className="flex items-start gap-2.5">
          <ExampleThumb adId={row.exampleAdId} />
          <ul className="min-w-0 space-y-0.5" aria-label="Competitors using it most">
            {row.topAdvertisers.length === 0 && <li className="text-xs text-muted-foreground">No competitor data</li>}
            {row.topAdvertisers.map((a) => (
              <li key={a.id} className="min-w-0">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    detail.push({ kind: "advertiser", advertiserKind: "page", id: a.id });
                  }}
                  aria-label={`Open competitor ${a.label}`}
                  className="flex max-w-[170px] items-baseline gap-1.5 rounded-sm text-left text-xs text-foreground hover:text-primary-text hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <TruncatedText text={a.label} focusable={false} />
                  <span className="shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground">{a.count}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </td>

      {/* Market footprint */}
      <td className="px-3 py-3">
        <dl className="grid grid-cols-[auto_auto] gap-x-4 gap-y-0.5 text-xs">
          <div className="flex items-baseline gap-1.5">
            <dd className="font-mono text-sm font-semibold tabular-nums text-foreground">{fmtInt(row.liveAds)}</dd>
            <dt className="text-muted-foreground">live ads</dt>
          </div>
          <div className="flex items-baseline gap-1.5">
            <dd className="font-mono text-sm font-semibold tabular-nums text-foreground">{fmtInt(row.advertiserCount)}</dd>
            <dt className="text-muted-foreground">competitors</dt>
          </div>
          <div className="flex items-baseline gap-1.5">
            <dd className="font-mono text-sm font-semibold tabular-nums text-foreground">
              {row.longestRunDays == null ? "—" : fmtInt(row.longestRunDays)}
            </dd>
            <dt className="text-muted-foreground">{row.longestRunDays == null ? "run unknown" : `${row.longestRunDays === 1 ? "day" : "days"} longest run`}</dt>
          </div>
          <div className="flex items-baseline gap-1.5">
            <dd className="font-mono text-sm font-semibold tabular-nums text-foreground">{fmtInt(row.totalClones)}</dd>
            <dt className="text-muted-foreground">clones</dt>
          </div>
        </dl>
      </td>

      {/* Actions */}
      <td className="px-3 py-3">
        <ElementActions
          target={ref}
          savedCount={savedCount}
          buildDownload={() => buildDownloads(ref, { scope, now: MODULE_NOW })}
          genieSlot={<UseInGenie target={ref} variant="icon" />}
        />
      </td>
    </tr>
  );
});

export interface ElementTableProps {
  rows: ElementRow[];
  type: ElementType;
  scope: Scope;
  /** Ids that are New since the user's last visit. */
  newIds: Set<string>;
}

export function ElementTable({ rows, type, scope, newIds }: ElementTableProps) {
  const [visible, setVisible] = useState(PAGE_SIZE);
  const shown = rows.slice(0, visible);
  const noun = ELEMENT_NOUN_SINGULAR[type];

  return (
    <div className="min-w-0 rounded-xl border border-border bg-card">
      <div className="overflow-x-auto rounded-xl">
        <table className="w-full min-w-[1080px] border-collapse text-sm">
          <caption className="sr-only">{`Creative ${noun} in scope, one row each. Press Enter on a row to open its details.`}</caption>
          <thead className="bg-muted/40">
            <tr>
              <th scope="col" className={TH}>
                {type === "hook" ? "Hook style" : ELEMENT_NOUN_SINGULAR[type].replace(/^./, (c) => c.toUpperCase())}
              </th>
              <Th tip={`Ads using this ${noun}, and the share of ads in scope with a ${noun} identified.`}>Ads using it</Th>
              <Th tip="Winning ads (seen live, 14+ days running, 2+ clones; never likes) and the average days live of the ads using it.">
                Winning ads
              </Th>
              <Th tip="New ads launched per bucket, with the change against the previous equal period.">Trend</Th>
              <Th tip="One example ad (a winner if there is one) and the pages running it most. Counts are ads.">
                Example · top competitors
              </Th>
              <Th tip="Live ads, distinct competitors, the longest run in days and total clones across every ad using it.">
                Market footprint
              </Th>
              <th scope="col" className={cn(TH, "text-right")}>
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {shown.map((row) => (
              <ElementTableRow key={row.id} row={row} type={type} scope={scope} isNew={newIds.has(row.id)} />
            ))}
          </tbody>
        </table>
      </div>
      {rows.length > shown.length && (
        <div className="flex items-center justify-center gap-3 border-t border-border px-3 py-3 text-xs text-muted-foreground">
          <span>
            Showing <span className="font-mono tabular-nums">{fmtInt(shown.length)}</span> of{" "}
            <span className="font-mono tabular-nums">{fmtInt(rows.length)}</span>
          </span>
          <button
            type="button"
            onClick={() => setVisible((v) => v + PAGE_SIZE)}
            className="h-8 rounded-md border border-primary/40 bg-primary/10 px-3 text-sm font-medium text-primary-text hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Show {Math.min(PAGE_SIZE, rows.length - shown.length)} more
          </button>
        </div>
      )}
    </div>
  );
}
