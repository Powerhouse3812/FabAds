/**
 * LaunchConfirmModal — single source of truth before committing a real-money launch.
 *
 * Consolidates: daily total (hero), structural counts, objective/format,
 * audience template name, spread + page-distribution, cap status. Adds a
 * typed-LAUNCH safeguard above a fixed USD-equivalent threshold ($120 daily).
 *
 * Pure surface — reads plan via UseFlowV2 and calls `onConfirm` (async); the
 * caller wires that into `service.launch(plan)` + navigation.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Check, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/launch2/utils/time";
import { getTemplate } from "../data";
import { adSetCount, capCheck, dailyTotalBudget, estimateAds } from "../deriveV2";
import type { UseFlowV2 } from "../state/useFlowV2";

const TYPED_LAUNCH_THRESHOLD_USD = 120;

/** Convert a daily amount in `currency` to a USD-equivalent — fixed agency rates. */
function toUsdEquivalent(amount: number, currency: string): number {
  switch (currency.toUpperCase()) {
    case "INR":
      return amount / 84;
    case "EUR":
      return amount * 1.08;
    case "GBP":
      return amount * 1.27;
    case "USD":
    default:
      return amount;
  }
}

/** Human-friendly label for spread mode. */
function spreadLabel(spread: string): string {
  switch (spread) {
    case "stacked":
      return "Stacked";
    case "one_per_adset":
      return "One per ad set";
    case "multiply":
      return "Multiply";
    case "round_robin":
      return "Rotating";
    case "manual":
      return "Manual";
    default:
      return spread;
  }
}

/** Human-friendly label for page-distribution mode. */
function distributionLabel(d: string): string {
  switch (d) {
    case "fill_first":
      return "Fill first";
    case "equal":
      return "Equal split";
    case "duplicate":
      return "Duplicate to all";
    case "one_page":
      return "One page";
    default:
      return d;
  }
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  flow: UseFlowV2;
  onConfirm: () => Promise<void>;
}

export default function LaunchConfirmModal({ open, onOpenChange, flow, onConfirm }: Props) {
  const { plan } = flow;

  // ── Derived numbers (memoised on plan reference) ──────────────────
  const dailyTotal = useMemo(() => dailyTotalBudget(plan), [plan]);
  const adsTotal = useMemo(() => estimateAds(plan), [plan]);
  const adSets = useMemo(() => adSetCount(plan), [plan]);
  const currency = plan.targets[0]?.currency ?? "USD";

  // unique account count from targets
  const accountCount = useMemo(() => {
    const seen = new Set<string>();
    plan.targets.forEach((t) => seen.add(t.accountId));
    return seen.size;
  }, [plan.targets]);

  const pageCount = plan.targets.length;
  const template = plan.targetingTemplateId ? getTemplate(plan.targetingTemplateId) : undefined;
  const cap = useMemo(() => capCheck(plan), [plan]);

  // ── Typed-LAUNCH safeguard ────────────────────────────────────────
  const dailyUsd = toUsdEquivalent(dailyTotal, currency);
  const requiresTypedConfirm = dailyUsd >= TYPED_LAUNCH_THRESHOLD_USD;
  const [confirmText, setConfirmText] = useState("");
  const confirmInputRef = useRef<HTMLInputElement>(null);
  const typedOk = !requiresTypedConfirm || confirmText === "LAUNCH";

  // ── Launching state ───────────────────────────────────────────────
  const [launching, setLaunching] = useState(false);

  // Reset transient state on close / reopen
  useEffect(() => {
    if (!open) {
      setConfirmText("");
      setLaunching(false);
    }
  }, [open]);

  // Autofocus the LAUNCH input when it appears
  useEffect(() => {
    if (open && requiresTypedConfirm) {
      // wait a tick for Dialog mount
      const t = setTimeout(() => confirmInputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [open, requiresTypedConfirm]);

  // ── Block launch when there are cap errors ────────────────────────
  const blockedByCap = !cap.ok;
  const canLaunch = typedOk && !blockedByCap && !launching;

  const handleConfirm = async () => {
    if (!canLaunch) return;
    setLaunching(true);
    try {
      await onConfirm();
    } finally {
      setLaunching(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !launching && onOpenChange(o)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ready to launch?</DialogTitle>
        </DialogHeader>

        {/* ── Hero: daily total ─────────────────────────────────── */}
        <div className="rounded-2xl border border-primary/30 bg-primary/5 px-4 py-4">
          <div className="font-mono tabular-nums text-[32px] leading-none font-semibold text-foreground">
            {formatMoney(dailyTotal, currency)}
            <span className="ml-2 text-[13px] font-normal text-muted-foreground">/ day</span>
          </div>
          <div className="mt-1.5 font-mono text-[11px] tabular-nums text-muted-foreground">
            ~{formatMoney(dailyTotal * 7, currency)} over 7d est.
          </div>
        </div>

        {/* ── What's launching ──────────────────────────────────── */}
        <Section label="What's launching">
          <Row>
            <Num value={adsTotal} /> ads
            <Dot />
            <Num value={adSets} /> ad set{adSets === 1 ? "" : "s"}
            <Dot />
            <Num value={plan.structure.campaigns} /> campaign{plan.structure.campaigns === 1 ? "" : "s"}
          </Row>
          <Row>
            <Num value={accountCount} /> account{accountCount === 1 ? "" : "s"}
            <Dot />
            <Num value={pageCount} /> Page{pageCount === 1 ? "" : "s"}
          </Row>
          <Row>
            <span className="text-muted-foreground">Objective:</span> {labelize(plan.objective)}
            <Dot />
            <span className="text-muted-foreground">Format:</span> {labelize(plan.format)}
          </Row>
          {template && (
            <Row>
              <span className="text-muted-foreground">Audience:</span> {template.name}
            </Row>
          )}
          <Row>
            <span className="text-muted-foreground">Spread:</span> {spreadLabel(plan.spread)}
            <Dot />
            <span className="text-muted-foreground">Page split:</span> {distributionLabel(plan.pageDistribution)}
          </Row>
          <Row>
            <span className="text-muted-foreground">Structure:</span>{" "}
            <span className="font-mono tabular-nums">
              {plan.structure.campaigns}C × {plan.structure.adSetsPerCampaign}AS × {plan.structure.adsPerAdSet}Ad
            </span>
          </Row>
        </Section>

        {/* ── Cap status ───────────────────────────────────────── */}
        <Section label="Cap status">
          {cap.ok ? (
            <div className="flex items-center gap-2 text-[13px] text-foreground">
              <Check className="h-4 w-4 text-primary" />
              All pages under 250 limit
            </div>
          ) : (
            <div className="flex items-start gap-2 text-[13px] text-foreground">
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
              <div className="min-w-0">
                <div>
                  {cap.offenders.length} page{cap.offenders.length === 1 ? "" : "s"} over cap
                </div>
                <div className="truncate text-[11px] text-muted-foreground">
                  {cap.offenders[0]?.pageName}
                  {cap.offenders.length > 1 ? ` + ${cap.offenders.length - 1} more` : ""}
                  <span className="ml-1">(view in Step 3)</span>
                </div>
              </div>
            </div>
          )}
        </Section>

        {/* ── Typed-LAUNCH safeguard (only above threshold) ───── */}
        {requiresTypedConfirm && (
          <div className="rounded-xl border border-amber-500/40 bg-amber-500/5 px-3 py-3">
            <div className="flex items-start gap-2 text-[12px]">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
              <div className="min-w-0 flex-1">
                <div className="text-foreground">
                  Daily spend ≥ ${TYPED_LAUNCH_THRESHOLD_USD} — type LAUNCH to confirm
                </div>
                <input
                  ref={confirmInputRef}
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  className={cn(
                    "mt-2 w-full rounded-lg border bg-background px-2.5 py-1.5 font-mono text-[13px] tabular-nums outline-none focus:ring-2 focus:ring-primary/40",
                    typedOk && confirmText.length > 0
                      ? "border-primary/60"
                      : "border-amber-400/60",
                  )}
                  placeholder="LAUNCH"
                  spellCheck={false}
                  autoCapitalize="characters"
                />
                <p className="mt-1 text-[10px] text-muted-foreground">
                  Type LAUNCH to confirm — high-spend safeguard
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Actions ──────────────────────────────────────────── */}
        <div className="flex items-center justify-end gap-2 pt-1">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={launching}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!canLaunch}
            title={
              blockedByCap
                ? "Resolve cap errors in Step 3 before launching"
                : !typedOk
                  ? "Type LAUNCH to confirm"
                  : undefined
            }
          >
            {launching ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Launching…
              </>
            ) : (
              <>
                Launch <span className="opacity-60">·</span>{" "}
                <span className="font-mono tabular-nums">{formatMoney(dailyTotal, currency)}</span>
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ── small layout helpers ──────────────────────────────────────── */

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="font-mono text-[10px] uppercase tracking-[0.06em] text-muted-foreground/70">
        {label}
      </div>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[13px] text-foreground">
      {children}
    </div>
  );
}

function Num({ value }: { value: number }) {
  return <span className="font-mono tabular-nums font-medium">{value}</span>;
}

function Dot() {
  return <span className="text-muted-foreground/60">·</span>;
}

/** Replace underscores with spaces and lower-case — quick formatting for enums. */
function labelize(s: string | null | undefined): string {
  if (!s) return "—";
  return s.replace(/_/g, " ").toLowerCase();
}
