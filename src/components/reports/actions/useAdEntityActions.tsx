/**
 * Reports — the ad-entity actions hub (status / budget / duplicate).
 *
 * MOUNT-ONCE RATIONALE (same as src/creative-report/actions/useCreativeActions.tsx)
 * Rows, the bulk bar, the detail drawer and the mobile action sheet all offer the
 * same verbs. If each call site owned its own confirm dialog, the app would carry
 * N copies of the same modal, N chances for their copy to drift apart, and a real
 * bug: a row unmounting (filtered away by the very write it just triggered) takes
 * its own dialog down mid-interaction. So one provider per surface owns the dialog
 * state and renders each overlay EXACTLY ONCE, below `children`. Call sites get a
 * plain function API and never hold overlay state.
 *
 * ── CONFIRMATION POLICY ──────────────────────────────────────────────────────
 * Friction where money STARTS flowing; undo where it stops.
 *
 *   Pause (single)      no dialog → apply + undo toast
 *   Activate (single)   CONFIRM → apply + undo toast   (the only single action
 *                       that starts spend)
 *   Archive             CONFIRM → apply + undo toast
 *   Duplicate           SHEET → apply + undo toast. It is not a confirm step:
 *                       the sheet exists because duplicate has two REQUIRED
 *                       inputs (how many copies, published Active or Paused)
 *                       that were previously answered for the user. Choosing
 *                       Active starts spend, so the sheet also carries the
 *                       account + Page active-ad limits and blocks an Active
 *                       batch that would not fit — offering Paused instead.
 *   Any BULK status     ALWAYS CONFIRM — mis-selection is the failure mode, and
 *                       the dialog is the only place the user sees the set.
 *
 * WHY NOT SYMMETRIC FRICTION
 * A dialog on both pause and activate looks even-handed and is worse. Pausing is
 * the safe, frequent, reversible move; gating it teaches the user that this
 * dialog is noise to be clicked through, and that trained dismissal then fires on
 * the one dialog that matters — the one where spend starts. Asymmetry is what
 * keeps the confirm meaningful. Everything reversible is covered by undo instead:
 * the toast for `EXEMPT_MS`, and the Session changes sheet after that.
 *
 * TOASTS
 * `sonner` — that is what Reports uses. (creative-report uses the other
 * `@/hooks/use-toast` shadcn hook; do not copy it here.) The toast duration is
 * the store's exported `EXEMPT_MS`, never a literal: the store keeps a
 * just-changed row exempt from the status filter for exactly that long, so if the
 * two numbers drift the row vanishes while its own Undo button is still visible.
 */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { toast } from "sonner";
import {
  EXEMPT_MS,
  canDuplicate,
  duplicateEntity,
  setBudget as writeBudget,
  setStatus as writeStatus,
  undo,
  type UndoToken,
} from "@/lib/ad-entity-write-store";
import {
  StatusConfirmDialog,
  describeEntity,
  type StatusConfirmRequest,
} from "@/components/reports/actions/StatusConfirmDialog";
import { BudgetEditSheet } from "@/components/reports/actions/BudgetEditSheet";
import { DuplicateEntitySheet } from "@/components/reports/actions/DuplicateEntitySheet";
import { SessionChangesSheet } from "@/components/reports/actions/SessionChangesSheet";
import { currencyForCountry } from "@/lib/reports-accounts";
import type {
  BudgetType,
  EntityStatus,
  ReportEntity,
} from "@/lib/reports-dummy-data";

/* ───────────────────────────── public API ───────────────────────────── */

export interface BudgetDraft {
  value?: number;
  type?: BudgetType;
}

export interface AdEntityActionsApi {
  setStatus: (entities: ReportEntity[], next: EntityStatus) => void;
  editBudget: (entity: ReportEntity) => void;
  duplicate: (entity: ReportEntity) => void;
  openSessionChanges: () => void;
}

/**
 * Overlay-host state. The overlays are all mounted by this provider (below
 * `children`); this is exposed separately from the verb API so a descendant can
 * drive a sheet, or write without opening one, without widening the verb API
 * that every row consumes.
 */
export interface AdEntityActionsHostState {
  /** Entity whose budget is being edited, or null. */
  budgetTarget: ReportEntity | null;
  budgetOpen: boolean;
  setBudgetOpen: (open: boolean) => void;
  /** Called by the budget sheet on submit: writes + fires the undo toast. */
  commitBudget: (entity: ReportEntity, next: BudgetDraft) => void;
  /** Entity being duplicated, or null. */
  duplicateTarget: ReportEntity | null;
  duplicateOpen: boolean;
  setDuplicateOpen: (open: boolean) => void;
  /** Called by the duplicate sheet on submit: writes N copies + one undo toast. */
  commitDuplicate: (
    entity: ReportEntity,
    count: number,
    status: EntityStatus,
  ) => void;
  sessionChangesOpen: boolean;
  setSessionChangesOpen: (open: boolean) => void;
}

const AdEntityActionsContext = createContext<AdEntityActionsApi | null>(null);
const AdEntityActionsHostContext = createContext<AdEntityActionsHostState | null>(null);

/** Convenience for call sites deciding whether to render a Duplicate control:
 *  ad accounts cannot be duplicated, so the control is hidden — not disabled. */
export function canDuplicateEntity(entity: ReportEntity): boolean {
  return canDuplicate(entity.level);
}

/* ───────────────────────────── formatting ───────────────────────────── */

const money = (symbol: string, value: number): string =>
  `${symbol}${value.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

const cadence = (type: BudgetType | undefined): string =>
  type === "Lifetime" ? " lifetime" : "/day";

/** `€450 → €540/day`, or `€450/day → €540 lifetime` when the cadence changed. */
function budgetDelta(entity: ReportEntity, next: BudgetDraft): string {
  const { symbol } = currencyForCountry(entity.country);
  const prevValue = entity.budgetValue;
  const nextValue = next.value ?? prevValue;
  const prevType = entity.budgetType;
  const nextType = next.type ?? prevType;

  if (nextValue === undefined) return "Budget updated";

  const to = money(symbol, nextValue);
  if (prevValue === undefined) return `Budget set to ${to}${cadence(nextType)}`;

  const from = money(symbol, prevValue);
  return prevType === nextType
    ? `${from} → ${to}${cadence(nextType)}`
    : `${from}${cadence(prevType)} → ${to}${cadence(nextType)}`;
}

/** Toast body for a duplicate: says the count AND what those copies are doing. */
function duplicateOutcome(count: number, status: EntityStatus): string {
  const what = `${count.toLocaleString("en-US")} ${count === 1 ? "copy" : "copies"}`;
  return status === "Active"
    ? `${what} created Active with zero metrics — they are delivering now.`
    : `${what} created Paused with zero metrics — nothing is spending until you set them Active.`;
}

function statusOutcome(entities: ReportEntity[], next: EntityStatus): string {
  const who =
    entities.length === 1
      ? describeEntity(entities[0])
      : `${entities.length} items`;
  if (next === "Active") return `${who} — now delivering.`;
  if (next === "Paused") return `${who} — delivery and spend stopped.`;
  return `${who} — archived, metrics kept.`;
}

/* ───────────────────────────── provider ───────────────────────────── */

export function AdEntityActionsProvider({ children }: { children: React.ReactNode }) {
  const [statusRequest, setStatusRequest] = useState<StatusConfirmRequest | null>(null);
  const [statusOpen, setStatusOpen] = useState(false);
  const [budgetTarget, setBudgetTarget] = useState<ReportEntity | null>(null);
  const [budgetOpen, setBudgetOpen] = useState(false);
  const [duplicateTarget, setDuplicateTarget] = useState<ReportEntity | null>(null);
  const [duplicateOpen, setDuplicateOpen] = useState(false);
  const [sessionChangesOpen, setSessionChangesOpen] = useState(false);

  /** Every write funnels through here so no path can ship without an undo. */
  const undoToast = useCallback((token: UndoToken, description: string) => {
    toast.success(token.label, {
      description,
      duration: EXEMPT_MS,
      action: { label: "Undo", onClick: () => undo(token) },
    });
  }, []);

  const applyStatus = useCallback(
    (entities: ReportEntity[], next: EntityStatus) => {
      if (entities.length === 0) return;
      undoToast(writeStatus(entities, next), statusOutcome(entities, next));
    },
    [undoToast],
  );

  const setStatus = useCallback(
    (entities: ReportEntity[], next: EntityStatus) => {
      if (entities.length === 0) return;

      // See CONFIRMATION POLICY in the header. Single Pause is the only status
      // write that lands with no dialog at all.
      const needsConfirm =
        entities.length > 1 || next === "Active" || next === "Archived";

      if (!needsConfirm) {
        applyStatus(entities, next);
        return;
      }

      setStatusRequest({ entities, next });
      setStatusOpen(true);
    },
    [applyStatus],
  );

  const confirmStatus = useCallback(
    (request: StatusConfirmRequest) => {
      applyStatus(request.entities, request.next);
    },
    [applyStatus],
  );

  const editBudget = useCallback((entity: ReportEntity) => {
    setBudgetTarget(entity);
    setBudgetOpen(true);
  }, []);

  const commitBudget = useCallback(
    (entity: ReportEntity, next: BudgetDraft) => {
      if (next.value === undefined && next.type === undefined) return;
      undoToast(writeBudget(entity, next), budgetDelta(entity, next));
    },
    [undoToast],
  );

  const duplicate = useCallback((entity: ReportEntity) => {
    // Call sites hide the control via `canDuplicateEntity`; this guard exists
    // because the store THROWS at account level and a keyboard shortcut or a
    // stale menu must not be able to crash the surface.
    if (!canDuplicate(entity.level)) return;
    // Opens the sheet instead of writing: count and publish-status are the
    // user's to choose. The write happens in `commitDuplicate`.
    setDuplicateTarget(entity);
    setDuplicateOpen(true);
  }, []);

  const commitDuplicate = useCallback(
    (entity: ReportEntity, count: number, status: EntityStatus) => {
      if (!canDuplicate(entity.level) || count < 1) return;
      // ONE token for all N copies — the user made one gesture, so Undo reverses
      // one gesture rather than peeling copies off one at a time.
      const { token } = duplicateEntity(entity, { count, status });
      undoToast(token, duplicateOutcome(count, status));
    },
    [undoToast],
  );

  const openSessionChanges = useCallback(() => {
    setSessionChangesOpen(true);
  }, []);

  const api = useMemo<AdEntityActionsApi>(
    () => ({ setStatus, editBudget, duplicate, openSessionChanges }),
    [setStatus, editBudget, duplicate, openSessionChanges],
  );

  const host = useMemo<AdEntityActionsHostState>(
    () => ({
      budgetTarget,
      budgetOpen,
      setBudgetOpen,
      commitBudget,
      duplicateTarget,
      duplicateOpen,
      setDuplicateOpen,
      commitDuplicate,
      sessionChangesOpen,
      setSessionChangesOpen,
    }),
    [
      budgetTarget,
      budgetOpen,
      commitBudget,
      duplicateTarget,
      duplicateOpen,
      commitDuplicate,
      sessionChangesOpen,
    ],
  );

  return (
    <AdEntityActionsContext.Provider value={api}>
      <AdEntityActionsHostContext.Provider value={host}>
        {children}
        <StatusConfirmDialog
          request={statusRequest}
          open={statusOpen}
          onOpenChange={setStatusOpen}
          onConfirm={confirmStatus}
        />
        {/* Both overlays mount here so they exist exactly once per Reports
            surface, same rationale as StatusConfirmDialog above.

            NOTE: BudgetEditSheet owns its own write + undo toast (it needs the
            pending value, the currency and the before/after strings, all of
            which live in its local state), so it takes no submit callback.
            `commitBudget` on the host state remains available for any other
            caller that wants to write a budget without opening the sheet. */}
        <BudgetEditSheet
          entity={budgetTarget}
          open={budgetOpen}
          onOpenChange={setBudgetOpen}
        />
        {/* Duplicate asks HOW MANY and PUBLISHED HOW, shows the account + Page
            active-ad limits, and blocks an Active batch that would not fit. It
            reports the answer back; the write + the single undo toast stay here
            with every other write on this surface. */}
        <DuplicateEntitySheet
          entity={duplicateTarget}
          open={duplicateOpen}
          onOpenChange={setDuplicateOpen}
          onConfirm={commitDuplicate}
        />
        <SessionChangesSheet
          open={sessionChangesOpen}
          onOpenChange={setSessionChangesOpen}
        />
      </AdEntityActionsHostContext.Provider>
    </AdEntityActionsContext.Provider>
  );
}

export function useAdEntityActions(): AdEntityActionsApi {
  const ctx = useContext(AdEntityActionsContext);
  if (!ctx) {
    throw new Error("useAdEntityActions must be used within AdEntityActionsProvider");
  }
  return ctx;
}

/** Overlay-host state — for a descendant that needs to drive one of the sheets
 *  directly. Row-level call sites want `useAdEntityActions()` instead. */
export function useAdEntityActionsHost(): AdEntityActionsHostState {
  const ctx = useContext(AdEntityActionsHostContext);
  if (!ctx) {
    throw new Error("useAdEntityActionsHost must be used within AdEntityActionsProvider");
  }
  return ctx;
}
