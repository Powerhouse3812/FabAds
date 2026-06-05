import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  Circle,
  Info,
  RefreshCcw,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  CapMeter,
  EmptyState,
  HealthDot,
  KpiTile,
  SectionHeader,
} from "@/launch2/components";
import { formatNumber } from "@/launch2/lib/format";
import { accounts, businessManagers, pages, pixels } from "@/launch2/mocks";
import { useLaunch2Overlay } from "@/launch2/shell/Launch2OverlayProvider";
import type { AdAccount, HealthStatus } from "@/launch2/types";

/* ───────────────────────── defensive checklist (mock) ───────────────────────── */

interface DefensivePrompt {
  id: string;
  label: string;
  detail: string;
  done: boolean;
}

const DEFENSIVE_PROMPTS: DefensivePrompt[] = [
  {
    id: "df_diversify",
    label: "Pixel / BM diversification",
    detail: "Spread launches across ≥2 BMs and pixels so one restriction can't stall everything.",
    done: true,
  },
  {
    id: "df_preflight",
    label: "Compliance pre-flight",
    detail: "Run policy pre-check on copy + creative before dispatch — catch flags early.",
    done: true,
  },
  {
    id: "df_domain",
    label: "Domain verification",
    detail: "Verify the destination domain in Business settings (required for iOS / aggregated events).",
    done: false,
  },
  {
    id: "df_capi",
    label: "CAPI setup",
    detail: "Server-side Conversions API as a backstop for signal loss — improves event match quality.",
    done: false,
  },
];

/* ───────────────────────── account card ───────────────────────── */

function AccountCard({
  account,
  onCleanRelaunch,
}: {
  account: AdAccount;
  onCleanRelaunch: () => void;
}) {
  const accountPages = pages.filter((p) => p.accountId === account.id);
  const accountPixels = pixels.filter((px) => px.accountId === account.id);
  const needsRecovery = account.health !== "healthy";

  return (
    <div
      className={cn(
        "rounded-lg border bg-card p-4",
        account.health === "restricted"
          ? "border-[#ff4d4f]/40"
          : account.health === "review"
          ? "border-[#faad14]/40"
          : "border-border",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate text-sm font-semibold text-foreground">{account.name}</span>
            <HealthDot status={account.health} showLabel />
          </div>
          <p className="mt-0.5 font-g6-mono text-[11px] text-muted-foreground">
            {account.id} · {account.currency}
          </p>
        </div>
        {needsRecovery && (
          <Button
            variant="outline"
            size="sm"
            className="h-8 shrink-0 text-xs"
            onClick={onCleanRelaunch}
          >
            <RefreshCcw className="h-3.5 w-3.5" />
            Clean relaunch
          </Button>
        )}
      </div>

      {/* Rejection / restriction reason */}
      {account.note && (
        <div
          className={cn(
            "mt-3 flex items-start gap-2 rounded-md px-3 py-2 text-xs",
            account.health === "restricted"
              ? "bg-[#ff4d4f]/10 text-[hsl(var(--error-text))]"
              : "bg-[#faad14]/10 text-[hsl(var(--warning-text))]",
          )}
        >
          <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{account.note}</span>
        </div>
      )}

      {/* Pages — with cap headroom */}
      <div className="mt-4">
        <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Pages · 250-ad cap
        </p>
        <div className="space-y-3">
          {accountPages.length === 0 && (
            <p className="text-xs text-muted-foreground">No pages connected.</p>
          )}
          {accountPages.map((page) => (
            <div key={page.id}>
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex min-w-0 items-center gap-1.5">
                  <HealthDot status={page.health} />
                  <span className="truncate text-xs text-foreground">{page.name}</span>
                </span>
              </div>
              <CapMeter current={page.adCount} limit={page.capLimit} className="mt-1.5" />
            </div>
          ))}
        </div>
      </div>

      {/* Pixels */}
      <div className="mt-4">
        <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Pixels
        </p>
        <div className="space-y-1.5">
          {accountPixels.length === 0 && (
            <p className="text-xs text-muted-foreground">No pixels connected.</p>
          )}
          {accountPixels.map((px) => (
            <div key={px.id} className="flex items-center justify-between gap-2 text-xs">
              <span className="inline-flex min-w-0 items-center gap-1.5">
                <span
                  className={cn(
                    "h-2 w-2 shrink-0 rounded-full",
                    px.status === "active" ? "bg-[#52c41a]" : "bg-muted-foreground/50",
                  )}
                />
                <span className="truncate text-foreground">{px.name}</span>
                <span
                  className={cn(
                    px.status === "active"
                      ? "text-[hsl(var(--success-text))]"
                      : "text-muted-foreground",
                  )}
                >
                  {px.status === "active" ? "active" : "inactive"}
                </span>
              </span>
              <span className="shrink-0 font-g6-mono text-[11px] text-muted-foreground">
                {formatNumber(px.eventsLast7d)} ev / 7d
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── screen ───────────────────────── */

export function Launch2Health() {
  const navigate = useNavigate();
  const { open } = useLaunch2Overlay();
  const [prompts, setPrompts] = useState<DefensivePrompt[]>(DEFENSIVE_PROMPTS);

  const posture = useMemo(
    () =>
      accounts.reduce(
        (acc, a) => {
          acc[a.health] += 1;
          return acc;
        },
        { healthy: 0, review: 0, restricted: 0 } as Record<HealthStatus, number>,
      ),
    [],
  );

  const needRecovery = accounts.filter((a) => a.health !== "healthy");
  const allHealthy = needRecovery.length === 0;

  // Group accounts by BM.
  const byBm = useMemo(
    () =>
      businessManagers.map((bm) => ({
        bm,
        accts: accounts.filter((a) => a.bmId === bm.id),
      })),
    [],
  );

  const doneCount = prompts.filter((p) => p.done).length;

  function cleanRelaunch() {
    open("quick");
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-6 py-6 font-g6-sans">
      {/* Header */}
      <header className="space-y-1.5">
        <button
          type="button"
          onClick={() => navigate("/launch2")}
          className="font-g6-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground"
        >
          ← Launch 2.0
        </button>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="font-g6-sans text-xl font-bold tracking-tight text-foreground">
            Account health &amp; recovery
          </h1>
        </div>
        <p className="text-xs text-muted-foreground">
          Surface the reason, fix it, clean-relaunch into a healthy surface. Account survival is the
          win — not speed.
        </p>
      </header>

      {/* Posture summary */}
      <section className="grid grid-cols-3 gap-3">
        <KpiTile
          label="Healthy"
          value={formatNumber(posture.healthy)}
          sub="ready to launch"
          tone={posture.healthy > 0 ? "success" : "default"}
          icon={<ShieldCheck className="h-4 w-4" />}
        />
        <KpiTile
          label="In review"
          value={formatNumber(posture.review)}
          sub="pending policy decision"
          tone={posture.review > 0 ? "warning" : "default"}
        />
        <KpiTile
          label="Restricted"
          value={formatNumber(posture.restricted)}
          sub="recover before launching"
          tone={posture.restricted > 0 ? "error" : "default"}
        />
      </section>

      {/* Recovery alert OR all-healthy calm state */}
      {allHealthy ? (
        <EmptyState
          icon={<ShieldCheck className="h-5 w-5 text-[hsl(var(--success-text))]" />}
          title="All accounts healthy"
          description="Every connected account, Page, and pixel is clear. Keep diversifying so one flag never stalls a launch."
        />
      ) : (
        <div className="flex flex-col gap-2 rounded-lg border border-[#ff4d4f]/40 bg-[#ff4d4f]/10 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(var(--error-text))]" />
            <div>
              <p className="text-sm font-semibold text-foreground">
                {needRecovery.length} account{needRecovery.length > 1 ? "s" : ""} need attention
              </p>
              <p className="text-xs text-muted-foreground">
                Read each rejection reason below, then clean-relaunch the same plan into a healthy
                account / BM. No forced re-run of policy-flagged ads.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            className="shrink-0"
            onClick={cleanRelaunch}
          >
            <RefreshCcw className="h-4 w-4" />
            Clean relaunch
          </Button>
        </div>
      )}

      {/* Accounts grouped by BM */}
      <section className="space-y-5">
        {byBm.map(({ bm, accts }) => (
          <div key={bm.id}>
            <SectionHeader
              title={bm.name}
              sub={`${accts.length} account${accts.length > 1 ? "s" : ""}`}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              {accts.map((account) => (
                <AccountCard
                  key={account.id}
                  account={account}
                  onCleanRelaunch={cleanRelaunch}
                />
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* Defensive checklist */}
      <section>
        <SectionHeader
          title="Defensive pre-flight"
          sub="Lower the odds of a restriction before you launch. Tap to toggle."
        />
        <div className="grid gap-2 sm:grid-cols-2">
          {prompts.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() =>
                setPrompts((prev) =>
                  prev.map((x) => (x.id === p.id ? { ...x, done: !x.done } : x)),
                )
              }
              className="flex items-start gap-3 rounded-lg border border-border bg-card p-3 text-left transition-colors hover:border-foreground/20"
            >
              {p.done ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(var(--success-text))]" />
              ) : (
                <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              )}
              <div>
                <p
                  className={cn(
                    "text-sm font-medium",
                    p.done ? "text-muted-foreground line-through" : "text-foreground",
                  )}
                >
                  {p.label}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">{p.detail}</p>
              </div>
            </button>
          ))}
        </div>
        <p className="mt-2 font-g6-mono text-[11px] text-muted-foreground">
          {doneCount}/{prompts.length} defenses in place
        </p>
      </section>

      {/* Boundary note — REQUIRED */}
      <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/40 p-4">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Legitimate recovery only.</span> This surface
          helps you read a real rejection reason, fix the underlying issue, and relaunch a compliant
          plan into a healthy account. It does <span className="font-medium">not</span> do ban-evasion —
          no forced swap of policy-flagged ads, no rented-account migration to dodge enforcement, no
          identity laundering. If Meta flagged an ad for policy, fix the ad.
        </p>
      </div>
    </div>
  );
}
