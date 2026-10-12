/** My Feeds title-row actions (top-right): Industry · Category · Period (calendar) · sources gear. They hide with the title row on scroll. */
import { Settings2 } from "lucide-react";
import type { UserPrefs } from "@/lib/insights-v3/selectors";
import { ScopePills, type ScopePillsProps } from "@/components/insights-v3/shared";
import { SourcesPopover } from "./SourcesPopover";

export function FeedHeaderActions({ scopeProps, prefs, showScope }: { scopeProps: Omit<ScopePillsProps, "kind">; prefs: UserPrefs; showScope: boolean }) {
  return (
    <>
      {showScope && (
        <>
          <ScopePills kind="filters" {...scopeProps} />
          <ScopePills kind="period" {...scopeProps} />
        </>
      )}
      <SourcesPopover prefs={prefs} align="end">
        <button
          type="button"
          aria-label="Manage sources: what feeds My Feeds"
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring max-sm:h-9 max-sm:w-9"
        >
          <Settings2 className="h-4 w-4" aria-hidden="true" />
        </button>
      </SourcesPopover>
    </>
  );
}
