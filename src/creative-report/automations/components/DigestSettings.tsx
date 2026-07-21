/**
 * DigestSettings — scheduled-digest config panel (iter-2 P4).
 *
 * SIMULATED ONLY: this prototype has no backend cron and sends no real
 * email/Slack message. Enabling the toggle just persists a config
 * (useDigestConfig/setDigestConfig, localStorage-backed) that
 * DigestPreview reads to render what the digest WOULD contain. The
 * disclaimer below is load-bearing copy — do not remove or bury it.
 *
 * Compact by design: this sits inside the Automations screen next to
 * rules/boards, not as a standalone page.
 */
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import {
  DIGEST_CADENCES,
  WEEKDAY_LABELS,
  useDigestConfig,
  setDigestConfig,
  type DigestCadence,
} from "@/creative-report/automations/digestStore";

const CADENCE_LABELS: Record<DigestCadence, string> = {
  daily: "Daily",
  weekly: "Weekly",
};

/** Shared segmented-control look (Compare.tsx Cards/Line/Bar toggle pattern). */
function segmentClass(active: boolean): string {
  return cn(
    "rounded-[5px] px-3 py-1.5 text-[13px] font-medium transition-colors",
    active
      ? "bg-background text-foreground shadow-sm"
      : "text-muted-foreground hover:text-foreground",
  );
}

export function DigestSettings() {
  const config = useDigestConfig();
  const disabled = !config.enabled;

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-foreground">Scheduled digest</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            A recurring summary of winners, fatiguing creatives, and top movers.
          </p>
        </div>
        <Switch
          checked={config.enabled}
          onCheckedChange={(checked) => setDigestConfig({ enabled: checked })}
          aria-label={config.enabled ? "Disable scheduled digest" : "Enable scheduled digest"}
        />
      </div>

      <div
        className={cn(
          "mt-4 space-y-4",
          disabled && "pointer-events-none opacity-40",
        )}
        aria-disabled={disabled}
      >
        {/* Cadence */}
        <div>
          <p className="text-xs font-medium text-muted-foreground">Cadence</p>
          <div className="mt-1.5 inline-flex items-center rounded-md border border-border bg-muted p-0.5">
            {DIGEST_CADENCES.map((cadence) => (
              <button
                key={cadence}
                type="button"
                disabled={disabled}
                onClick={() => setDigestConfig({ cadence })}
                className={segmentClass(config.cadence === cadence)}
              >
                {CADENCE_LABELS[cadence]}
              </button>
            ))}
          </div>
        </div>

        {/* Day of week — only meaningful for weekly cadence */}
        {config.cadence === "weekly" && (
          <div>
            <p className="text-xs font-medium text-muted-foreground">Day of week</p>
            <div className="mt-1.5 inline-flex items-center rounded-md border border-border bg-muted p-0.5">
              {WEEKDAY_LABELS.map((label, day) => (
                <button
                  key={label}
                  type="button"
                  disabled={disabled}
                  onClick={() => setDigestConfig({ dayOfWeek: day })}
                  className={cn(segmentClass(config.dayOfWeek === day), "w-9")}
                  aria-label={label}
                  aria-pressed={config.dayOfWeek === day}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Time */}
        <div>
          <label htmlFor="digest-time" className="text-xs font-medium text-muted-foreground">
            Time
          </label>
          <input
            id="digest-time"
            type="time"
            disabled={disabled}
            value={config.time}
            onChange={(e) => setDigestConfig({ time: e.target.value })}
            className="mt-1.5 flex h-9 w-32 rounded-md border border-input bg-background px-2.5 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed"
          />
        </div>
      </div>

      <p className="mt-4 border-t border-border pt-3 text-xs text-muted-foreground">
        Prototype only — no real email or Slack message is ever sent, and nothing runs on a
        server. This just configures what the simulated digest would contain and when.
      </p>
    </div>
  );
}
