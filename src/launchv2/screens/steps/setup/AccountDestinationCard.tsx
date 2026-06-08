/**
 * AccountDestinationCard — one collapsible card per ad account in Step 2 §1
 * (Ad accounts & pages). Shows page selection chips with live cap meters and a
 * pixel dropdown for the account. Used by the accounts-and-pages section of the
 * Launch v2 Setup step.
 */
import { useState } from "react";
import { ChevronDown, X, Zap, CircleSlash } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AdAccount } from "@/launch2/types";
import { MAX_ADS_PER_PAGE } from "../../../types";
import { pageActiveAds } from "../../../data";
import { CapMeter } from "./CapMeter";

export function AccountDestinationCard({
  account,
  selectedPageIds,
  pixelId,
  demandByPage,
  onTogglePage,
  onSetPixel,
  onRemove,
}: {
  account: AdAccount;
  selectedPageIds: Set<string>;
  pixelId: string | undefined;
  demandByPage: Map<string, number>;
  onTogglePage: (pageId: string) => void;
  onSetPixel: (pixelId: string | undefined) => void;
  onRemove: () => void;
}) {
  const [open, setOpen] = useState(true);

  const hasSelection = selectedPageIds.size > 0;
  const restricted = account.status !== "active";

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="w-full rounded-2xl border border-border bg-card">
        {/* ── Header (always visible) ── */}
        <div className="flex items-center gap-2.5 px-3 py-2.5">
          {/* Checkbox */}
          <span
            className={cn(
              "flex h-[14px] w-[14px] flex-shrink-0 items-center justify-center rounded-[3px] border transition-all",
              hasSelection ? "border-primary bg-primary" : "border-border",
            )}
          >
            {hasSelection && (
              <svg
                width="9"
                height="7"
                viewBox="0 0 9 7"
                fill="none"
                className="shrink-0"
              >
                <path
                  d="M1 3.5L3.2 6L8 1"
                  stroke="#121212"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </span>

          {/* Account name */}
          <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
            {account.name}
          </span>

          {/* Currency badge */}
          <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
            {account.currency}
          </span>

          {/* Restricted badge */}
          {restricted && (
            <span className="flex items-center gap-1 shrink-0">
              <CircleSlash className="h-3.5 w-3.5 text-destructive" />
              <span className="text-[11px] font-medium text-destructive capitalize">
                {account.status}
              </span>
            </span>
          )}

          {/* Collapse/expand button (CollapsibleTrigger) */}
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted/60 transition-colors"
              aria-label={open ? "Collapse" : "Expand"}
            >
              <ChevronDown
                className={cn(
                  "h-4 w-4 transition-transform",
                  !open && "-rotate-90",
                )}
              />
            </button>
          </CollapsibleTrigger>

          {/* Remove button */}
          <button
            type="button"
            onClick={onRemove}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            aria-label="Remove account"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* ── Collapsible body ── */}
        <CollapsibleContent>
          {/* Separator */}
          <div className="border-t border-border mx-3" />

          <div className="space-y-4 px-3 pb-3 pt-3">
            {/* ── Pages section ── */}
            <div className="space-y-2">
              <span className="text-xs font-medium text-muted-foreground">
                Pages
              </span>
              <div className="flex flex-wrap gap-2">
                {account.pages.map((pg) => {
                  const current = pageActiveAds(pg.fbPageId);
                  const on = selectedPageIds.has(pg.id);
                  const planned = on
                    ? (demandByPage.get(pg.fbPageId) ?? 0)
                    : 0;
                  const full = current >= MAX_ADS_PER_PAGE;

                  return (
                    <button
                      key={pg.id}
                      type="button"
                      onClick={() => onTogglePage(pg.id)}
                      disabled={full && !on}
                      className={cn(
                        "flex flex-col gap-1 rounded-2xl border px-3 py-2 text-left transition-colors",
                        on
                          ? "border-primary bg-primary/5"
                          : full
                            ? "border-border bg-card cursor-not-allowed opacity-60"
                            : "border-border bg-card hover:bg-accent cursor-pointer",
                      )}
                    >
                      {/* Top row */}
                      <span className="flex items-center gap-1.5">
                        {/* Mini checkbox 12×12 */}
                        <span
                          className={cn(
                            "flex h-3 w-3 shrink-0 items-center justify-center rounded-[2px] border",
                            on
                              ? "border-primary bg-primary"
                              : "border-muted-foreground/40",
                          )}
                        >
                          {on && (
                            <svg
                              width="7"
                              height="5"
                              viewBox="0 0 7 5"
                              fill="none"
                            >
                              <path
                                d="M0.5 2.5L2.2 4.5L6.5 0.5"
                                stroke="#121212"
                                strokeWidth="1.2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          )}
                        </span>
                        <span className="text-sm font-medium text-foreground">
                          {pg.name}
                        </span>
                        {full && !on && (
                          <span className="rounded-full bg-destructive/10 px-1.5 py-0.5 text-[10px] font-medium text-destructive">
                            At cap
                          </span>
                        )}
                      </span>

                      {/* Cap meter — only when selected */}
                      {on && (
                        <span className="pl-[1.125rem]">
                          <CapMeter current={current} demand={planned} />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── Pixel section ── */}
            <div className="space-y-1.5">
              <span className="text-xs font-medium text-muted-foreground">
                Pixel{" "}
                <span className="font-normal opacity-60">· optional</span>
              </span>
              {account.pixels.length === 0 ? (
                <p className="text-[11px] text-muted-foreground">
                  No pixels connected to this account.
                </p>
              ) : (
                <Select
                  value={pixelId ?? ""}
                  onValueChange={(v) =>
                    onSetPixel(v === "" ? undefined : v)
                  }
                >
                  <SelectTrigger className="h-9 w-full max-w-xs">
                    <SelectValue placeholder="Select a pixel" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No pixel</SelectItem>
                    {account.pixels.map((px) => (
                      <SelectItem key={px.id} value={px.id}>
                        <span className="flex items-center gap-1.5">
                          <Zap className="h-3 w-3 text-muted-foreground" />
                          {px.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
