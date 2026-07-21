/**
 * Automations — iter-2 P4. Three sections sharing one rules engine
 * (src/creative-report/automations/engine.ts): user-defined Rules
 * (categorise → auto-file into a board, or launch → auto-pause/queue),
 * Folders>Boards (Foreplay-style, smart boards driven by a categorise
 * rule), and a simulated scheduled Digest. Tab choice is presentational
 * only (not shareable state), so it's local state — same call already
 * made for Compare's chart-view toggle.
 */
import { useState } from "react";
import { cn } from "@/lib/utils";
import { RuleList } from "@/creative-report/automations/components/RuleList";
import { BoardsPanel } from "@/creative-report/automations/components/BoardsPanel";
import { DigestSettings } from "@/creative-report/automations/components/DigestSettings";
import { DigestPreview } from "@/creative-report/automations/components/DigestPreview";

const TABS = [
  { key: "rules", label: "Rules" },
  { key: "boards", label: "Boards" },
  { key: "digest", label: "Digest" },
] as const;
type Tab = (typeof TABS)[number]["key"];

export function Automations() {
  const [tab, setTab] = useState<Tab>("rules");

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-foreground">Automations</h1>
        <p className="text-sm text-muted-foreground">
          Rules that auto-file creatives into boards or auto-pause/queue them for relaunch — one
          engine, "Run now" only (no real background schedule in this prototype).
        </p>
      </div>

      <div className="inline-flex items-center rounded-md border border-border bg-muted p-0.5">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={cn(
              "rounded-[5px] px-3 py-1.5 text-[13px] font-medium transition-colors",
              tab === t.key
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "rules" && <RuleList />}
      {tab === "boards" && <BoardsPanel />}
      {tab === "digest" && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <DigestSettings />
          <DigestPreview />
        </div>
      )}
    </div>
  );
}
