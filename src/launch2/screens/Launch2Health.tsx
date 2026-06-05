/**
 * Launch 2.0 — Account Health.
 *
 * LEGITIMATE RECOVERY ONLY. The single signal is the 250-active-ads-per-Page
 * cap: how much headroom each Page has, and which accounts are restricted and
 * need resolving in Meta. NO performance metrics (no ROAS / CTR / spend) and
 * absolutely no account-cycling / ban-evasion framing — every issue routes the
 * user to a legitimate fix (rotate ads to free slots, resolve a review in Meta
 * Business Manager) or to launch where there's genuine headroom.
 *
 * Renders content-only inside the FabAds shell.
 */
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ArrowUpRight,
  ExternalLink,
  HeartPulse,
  Layers,
  Plus,
  ShieldAlert,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useLaunch2 } from "../state/Launch2Context";
import type { AccountHealth } from "../types";
import {
  AccountStatusBadge,
  AT_CAP,
  CapMeter,
  NEAR_CAP,
  SectionLabel,
  StatTile,
  capTier,
  ERR_TEXT,
  WARN_TEXT,
} from "./settings/parts";

/* Meta Business Manager (account-review resolution lives there, not here). */
const META_BUSINESS_HELP = "https://business.facebook.com/";

interface RecoveryAction {
  key: string;
  severity: "warn" | "error";
  title: string;
  detail: string;
  /** Optional in-app navigation target. */
  to?: string;
  toLabel?: string;
  /** Optional external (Meta) resolution link. */
  href?: string;
  hrefLabel?: string;
}

/** Turn the contract's health.issues[] + cap state into concrete, legit actions. */
function deriveActions(h: AccountHealth): RecoveryAction[] {
  const actions: RecoveryAction[] = [];

  if (h.status === "restricted" || h.status === "disabled") {
    actions.push({
      key: `${h.accountId}-review`,
      severity: "error",
      title: h.status === "disabled" ? "Account disabled" : "Account in review",
      detail:
        "New ad delivery is limited until this is resolved with Meta. Open a review or appeal in Business Manager — Launch will resume once the account is cleared.",
      href: META_BUSINESS_HELP,
      hrefLabel: "Resolve in Meta Business Manager",
    });
  }

  const fullPages = h.pages.filter((p) => capTier(p.activeAds, p.capacity) === "full");
  const nearPages = h.pages.filter((p) => capTier(p.activeAds, p.capacity) === "near");

  for (const p of fullPages) {
    actions.push({
      key: `${h.accountId}-${p.pageId}-cap`,
      severity: "error",
      title: `${p.pageName} is at the ${p.capacity}-ad cap`,
      detail:
        "This Page can't take new active ads. Pause or rotate out finished ads to free slots before launching here again.",
    });
  }
  for (const p of nearPages) {
    const free = Math.max(0, p.capacity - p.activeAds);
    actions.push({
      key: `${h.accountId}-${p.pageId}-near`,
      severity: "warn",
      title: `${p.pageName} is near the cap`,
      detail: `Only ${free} active-ad slot${free === 1 ? "" : "s"} left before the ${p.capacity} cap. Plan the next launch's size accordingly or rotate ads to free room.`,
    });
  }

  return actions;
}

/** Does this account have any Page with real headroom to launch into? */
function hasHeadroom(h: AccountHealth): boolean {
  if (h.status !== "active") return false;
  return h.pages.some((p) => capTier(p.activeAds, p.capacity) === "healthy");
}

export default function Launch2Health() {
  const service = useLaunch2();
  const navigate = useNavigate();
  const health = service.listAccountHealth();

  /* ---- summary signal (font-mono counts) ---- */
  const allPages = health.flatMap((h) => h.pages);
  const accountsCount = health.length;
  const nearCapPages = allPages.filter((p) => p.activeAds >= NEAR_CAP && p.activeAds < AT_CAP).length;
  const atCapPages = allPages.filter((p) => p.activeAds >= AT_CAP).length;
  const restrictedAccounts = health.filter((h) => h.status !== "active").length;
  const allHealthy = nearCapPages === 0 && atCapPages === 0 && restrictedAccounts === 0;

  /* ---- zero-data composed empty state ---- */
  if (health.length === 0) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <Header />
        <Card className="rounded-2xl">
          <CardContent className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/[0.12]">
              <HeartPulse className="h-6 w-6 text-foreground/70" />
            </span>
            <div className="space-y-1">
              <h2 className="text-base font-semibold text-foreground">No connected ad accounts yet</h2>
              <p className="mx-auto max-w-md text-sm text-muted-foreground">
                Once an ad account is connected, you'll see each Page's headroom against the {AT_CAP} active-ad cap and
                any reviews to resolve here.
              </p>
            </div>
            <Button onClick={() => navigate("/launch2/settings")} variant="outline" className="rounded-full">
              Manage connected assets
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Header />

      {/* Summary signal */}
      <Card className="rounded-2xl">
        <CardContent className="p-4">
          <SectionLabel
            trailing={
              <span className="text-[11px] font-normal normal-case tracking-normal text-muted-foreground">
                Capacity only — no performance metrics
              </span>
            }
          >
            At a glance
          </SectionLabel>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile label="Accounts" value={accountsCount} />
            <StatTile label="Pages near cap" value={nearCapPages} tone={nearCapPages > 0 ? "warn" : undefined} hint={`≥ ${NEAR_CAP} active`} />
            <StatTile label="Pages at cap" value={atCapPages} tone={atCapPages > 0 ? "error" : undefined} hint={`= ${AT_CAP} active`} />
            <StatTile
              label="Restricted accounts"
              value={restrictedAccounts}
              tone={restrictedAccounts > 0 ? "error" : undefined}
              hint="resolve in Meta"
            />
          </div>
          {allHealthy ? (
            <p className="mt-3 text-xs text-muted-foreground">
              All Pages have headroom and no accounts are in review. Good to launch.
            </p>
          ) : null}
        </CardContent>
      </Card>

      {/* Per-account health */}
      <div className="space-y-4">
        {health.map((h) => (
          <AccountHealthCard key={h.accountId} health={h} onNewLaunch={() => navigate("/launch2/new")} />
        ))}
      </div>
    </div>
  );
}

function Header() {
  return (
    <div className="space-y-1">
      <h1 className="text-xl font-semibold tracking-[-0.01em] text-foreground">Account Health</h1>
      <p className="text-sm text-muted-foreground">
        Every Facebook Page can run up to {AT_CAP} active ads. Track headroom, free up full Pages, and resolve account
        reviews so launches keep delivering.
      </p>
    </div>
  );
}

function AccountHealthCard({ health: h, onNewLaunch }: { health: AccountHealth; onNewLaunch: () => void }) {
  const actions = deriveActions(h);
  const headroomOk = hasHeadroom(h);

  return (
    <Card className="rounded-2xl">
      <CardContent className="p-4">
        {/* Account header */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-foreground">{h.accountName}</h2>
            <AccountStatusBadge status={h.status} />
          </div>
          {headroomOk ? (
            <Button size="sm" variant="outline" className="h-8 rounded-full" onClick={onNewLaunch}>
              <Plus className="h-4 w-4" />
              New launch
            </Button>
          ) : null}
        </div>

        {/* Per-page cap meters */}
        <div className="mt-3 grid gap-x-6 gap-y-3 sm:grid-cols-2">
          {h.pages.map((p) => (
            <div key={p.pageId} className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-foreground">{p.pageName}</span>
              </div>
              <CapMeter activeAds={p.activeAds} capacity={p.capacity} />
            </div>
          ))}
        </div>

        {/* Recovery / guidance actions */}
        {actions.length > 0 ? (
          <>
            <Separator className="my-4" />
            <div className="space-y-2">
              {actions.map((a) => (
                <ActionCard key={a.key} action={a} onNewLaunch={onNewLaunch} headroomOk={headroomOk} />
              ))}
            </div>
          </>
        ) : (
          <p className="mt-3 text-xs text-muted-foreground">Healthy — every Page has room for new ads.</p>
        )}
      </CardContent>
    </Card>
  );
}

function ActionCard({
  action: a,
  onNewLaunch,
  headroomOk,
}: {
  action: RecoveryAction;
  onNewLaunch: () => void;
  headroomOk: boolean;
}) {
  const isError = a.severity === "error";
  const accent = isError ? ERR_TEXT : WARN_TEXT;
  const bg = isError ? "rgba(255,77,79,0.06)" : "rgba(250,173,20,0.08)";
  const border = isError ? "rgba(255,77,79,0.35)" : "rgba(250,173,20,0.4)";
  const Icon = isError ? ShieldAlert : AlertTriangle;

  return (
    <div className="flex items-start gap-3 rounded-xl border px-3 py-2.5" style={{ backgroundColor: bg, borderColor: border }}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" style={{ color: accent }} />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-foreground">{a.title}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{a.detail}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {a.href ? (
            <a
              href={a.href}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-medium text-foreground transition-colors hover:border-foreground/20"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              {a.hrefLabel ?? "Open Meta"}
            </a>
          ) : null}
          {/* Cap issues route to a launch where there's headroom (legit recovery). */}
          {!a.href && headroomOk ? (
            <button
              type="button"
              onClick={onNewLaunch}
              className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-medium text-foreground transition-colors hover:border-foreground/20"
            >
              <ArrowUpRight className="h-3.5 w-3.5" />
              Launch where there's headroom
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
