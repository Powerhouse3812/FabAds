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
import { AlertTriangle, Loader2 } from "lucide-react";
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

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  flow: UseFlowV2;
  onConfirm: () => Promise<void>;
  /** Pass true when runPreflight returns any tier="error" issue — blocks launch. */
  preflightBlocked?: boolean;
}

export default function LaunchConfirmModal({ open, onOpenChange, flow, onConfirm, preflightBlocked = false }: Props) {
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
  // USD-only (lock #5): the daily total is already USD — no conversion.
  const requiresTypedConfirm = dailyTotal >= TYPED_LAUNCH_THRESHOLD_USD;
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

  // ── Block launch when there are cap errors or pre-flight errors ──────
  const blockedByCap = !cap.ok;
  const canLaunch = typedOk && !blockedByCap && !preflightBlocked && !launching;

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
          <DialogTitle>Launch {adsTotal} ad{adsTotal === 1 ? "" : "s"} to Meta?</DialogTitle>
        </DialogHeader>

        {/* ── Bullet summary ────────────────────────────────────── */}
        <ul className="space-y-1.5 text-[13px] text-foreground">
          <Bullet>
            <Num value={plan.structure.campaigns} /> campaign{plan.structure.campaigns === 1 ? "" : "s"}
            <Dot />
            <Num value={adSets} /> ad set{adSets === 1 ? "" : "s"}
            <Dot />
            <Num value={adsTotal} /> ad{adsTotal === 1 ? "" : "s"}
          </Bullet>
          <Bullet>
            <span className="text-muted-foreground">First-day spend cap:</span>{" "}
            <span className="font-mono tabular-nums">{formatMoney(plan.budgetAmount, currency)}/account</span>
            {accountCount > 1 && (
              <span className="ml-1 text-muted-foreground">× {accountCount} accounts</span>
            )}
          </Bullet>
          <Bullet>
            <span className="text-muted-foreground">Daily budget:</span>{" "}
            <span className="font-mono tabular-nums">{formatMoney(dailyTotal, currency)}</span>
            <span className="ml-1 text-muted-foreground">total</span>
          </Bullet>
          <Bullet>
            <span className="text-muted-foreground">{pageCount} Page{pageCount === 1 ? "" : "s"} · {labelize(plan.objective)}</span>
            {template && <> · {template.name}</>}
          </Bullet>
          <Bullet>
            <span className="text-muted-foreground">Goes live immediately on publish.</span>
          </Bullet>
        </ul>

        {/* Helper text */}
        <p className="text-[12px] text-muted-foreground">
          Ads will be reviewed by Meta (1–24 hrs). You can pause anytime.
        </p>

        {/* Pre-flight errors (only when blocking) */}
        {preflightBlocked && (
          <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/5 px-3 py-2 text-[13px]">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
            <span>Pre-launch checks failed — resolve errors in the Review tab before launching.</span>
          </div>
        )}

        {/* Cap status (only when blocking) */}
        {!cap.ok && (
          <div className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-[13px] text-foreground">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
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
              preflightBlocked
                ? "Resolve pre-flight errors before launching"
                : blockedByCap
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
              <>Launch {adsTotal} ad{adsTotal === 1 ? "" : "s"}</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ── small layout helpers ──────────────────────────────────────── */

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex flex-wrap items-baseline gap-x-1.5 gap-y-1">
      <span className="mt-1 inline-block h-1 w-1 shrink-0 rounded-full bg-foreground/40" aria-hidden />
      <span className="flex flex-wrap items-baseline gap-x-1.5 gap-y-1">{children}</span>
    </li>
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
