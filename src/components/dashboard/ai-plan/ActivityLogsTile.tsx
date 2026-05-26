/**
 * ActivityLogsTile — vertical timeline of recent system + user events.
 *
 * Why this exists
 * ---------------
 * The AI-plan dashboard right column needed an "audit trail at a glance" tile
 * so agency operators (Maalik's persona) can see what RRM, integrations, and
 * teammates did without leaving the dashboard. The existing
 * `ActivityLogsWidget.tsx` (used by full-plan dashboard) renders as a
 * badge-prefixed list — different visual language. Figma calls for a proper
 * vertical timeline: Clock icons in the left rail, dashed connector tails
 * between entries, "Today, 10:00 PM" two-tone timestamps, and inline platform
 * iconography on the right where relevant.
 *
 * Motif references (don't copy):
 *   - GitHub Actions run log — left rail icons + connector
 *   - Linear notification feed — two-tone timestamps
 *   - Vercel deployment history — dashed "in-flight" connectors
 *
 * Data
 * ----
 * Mocked inline for the redesign pass; real wiring lands when the activity-log
 * service exposes a per-workspace stream. Destructive events (e.g. profile
 * removed) tint the body copy with `text-destructive`.
 */
import { Link } from "react-router-dom";
import { Clock, Facebook } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActivityEntry {
  id: string;
  /** Human-readable timestamp split into day-relative + clock parts. */
  when: { day: string; time: string };
  /** Event copy. Hinglish/Hindi OK for realistic agency context. */
  body: string;
  /** "destructive" tints the body red; "info" is neutral foreground/65. */
  tone: "destructive" | "info";
  /** Optional platform icon shown at the right of the entry. */
  platform?: "facebook" | "meta";
}

const ENTRIES: ActivityEntry[] = [
  {
    id: "1",
    when: { day: "Today,", time: "10:00 PM" },
    body: "Profile removed: Rahul removed profile 'IdeaClan_FB' (ID: 12345)",
    tone: "destructive",
    platform: "facebook",
  },
  {
    id: "2",
    when: { day: "Today,", time: "9:42 PM" },
    body: "Rahul removed Profile 'IdeaClan_FB' (ID: 12345)",
    tone: "info",
    platform: "facebook",
  },
  {
    id: "3",
    when: { day: "Today,", time: "8:18 PM" },
    body: "You removed Ad account (ID: 90872)",
    tone: "info",
    platform: "meta",
  },
  {
    id: "4",
    when: { day: "Today,", time: "6:30 PM" },
    body: "Rule 'Pause Low Performance' applied to Ad set 'Test Ad set'. Action: Paused.",
    tone: "info",
  },
  {
    id: "5",
    when: { day: "Today,", time: "4:15 PM" },
    body: "Rule 'Adjust Bids' applied to Ad 'Ad creative 1'. Action: Bid decreased by 5%.",
    tone: "info",
  },
  {
    id: "6",
    when: { day: "Today,", time: "2:02 PM" },
    body: "Rule 'Optimize Budget' applied to campaign 'Summer sale'. Action: Budget increased by 10%.",
    tone: "info",
  },
];

interface ActivityLogsTileProps {
  className?: string;
}

export function ActivityLogsTile({ className }: ActivityLogsTileProps) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-border/60 bg-card",
        className,
      )}
      aria-label="Activity logs"
    >
      {/* Header — lime accent bar + eyebrow + live pulse, View all on right */}
      <header className="px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-2.5">
          <span
            aria-hidden
            className="block w-[3px] h-4 rounded-full bg-primary"
          />
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-foreground/55">
            Activity logs
          </p>
          {/* Live pulse dot — ping halo + solid pulse (same as NewAdsFetchedTile) */}
          <span className="relative inline-flex h-2 w-2 items-center justify-center">
            <span
              aria-hidden
              className="absolute inline-flex h-full w-full rounded-full bg-primary/60 animate-ping"
            />
            <span
              aria-hidden
              className="relative inline-flex h-2 w-2 rounded-full bg-primary animate-pulse"
            />
          </span>
        </div>
        <Link
          to="/activity-logs"
          className="text-[11.5px] text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
        >
          View all
          <span aria-hidden>→</span>
        </Link>
      </header>

      {/* Timeline body */}
      <div className="px-4 py-3 flex flex-col gap-4 max-h-[520px] overflow-y-auto">
        {ENTRIES.map((entry, idx) => (
          <TimelineRow
            key={entry.id}
            entry={entry}
            isLast={idx === ENTRIES.length - 1}
          />
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------- */
/* Timeline row — Clock + dashed tail rail, two-tone timestamp,   */
/* tone-aware body copy, optional platform icon on the right.     */
/* ------------------------------------------------------------- */

function TimelineRow({
  entry,
  isLast,
}: {
  entry: ActivityEntry;
  isLast: boolean;
}) {
  return (
    <div className="flex items-start gap-2">
      {/* Left rail — Clock icon + dashed connector tail */}
      <div className="flex flex-col items-center pt-1 shrink-0 w-4">
        <Clock
          aria-hidden
          className="h-4 w-4 text-muted-foreground/55"
          strokeWidth={2}
        />
        {!isLast && (
          <div
            aria-hidden
            className="w-px flex-1 border-l border-dashed border-border mt-1 min-h-[24px]"
          />
        )}
      </div>

      {/* Right column — timestamp + body */}
      <div className="flex-1 min-w-0 pb-1">
        <div className="flex items-center gap-1">
          <span className="text-[12px] text-foreground/65">
            {entry.when.day}
          </span>
          <span className="text-[12px] text-foreground/45 tabular-nums">
            {entry.when.time}
          </span>
        </div>
        <div className="flex items-start justify-between gap-3 mt-0.5">
          <p
            className={cn(
              "text-[14px] leading-snug",
              entry.tone === "destructive"
                ? "text-destructive"
                : "text-foreground/65",
            )}
          >
            {entry.body}
          </p>
          {entry.platform && (
            <PlatformIcon platform={entry.platform} />
          )}
        </div>
      </div>
    </div>
  );
}

function PlatformIcon({
  platform,
}: {
  platform: NonNullable<ActivityEntry["platform"]>;
}) {
  if (platform === "facebook") {
    return (
      <Facebook
        aria-hidden
        className="h-3.5 w-3.5 text-foreground/35 shrink-0 mt-0.5"
        strokeWidth={2}
      />
    );
  }
  // Meta — lucide doesn't ship a Meta glyph; render an "M" tag in the same
  // muted treatment. Reuse the Facebook shape proportions for visual parity.
  return (
    <span
      aria-hidden
      className="h-3.5 w-3.5 rounded-sm bg-foreground/10 text-foreground/45 text-[8px] font-bold flex items-center justify-center shrink-0 mt-0.5"
    >
      M
    </span>
  );
}

export default ActivityLogsTile;
