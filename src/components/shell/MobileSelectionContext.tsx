import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

/**
 * MobileSelectionContext — the seam between the Industry Insights feed's
 * bulk-select checkboxes and the shell's bottom tab bar.
 *
 * WHY THIS EXISTS (spec B §2.2, Maalik's ruling)
 * Bulk select (spec B §1.1 item 6, restored after batch A removed it) needs a
 * bottom action bar, and the bottom is already occupied by `MobileTabBar`.
 * Stacking both would cost 112px of chrome on an 812px screen, so the bulk
 * bar REPLACES the tab row while a selection is active (the Gmail / Photos
 * pattern) — never both at once.
 *
 * WHY A CONTEXT, NOT PROPS
 * The checkboxes that DRIVE selection live on cards inside the routed feed
 * page, deep under `<Outlet/>`. The bar that DISPLAYS the count and RUNS the
 * two bulk operations is `MobileTabBar`, which — see the placement note
 * below — is not an ancestor/descendant of the feed at all, it's a sibling.
 * Neither side can prop-drill to the other, so the selection is hoisted into
 * a context both can reach.
 *
 * WHO OWNS WHAT
 * - The feed page calls `toggleSelected(id)` from its card checkboxes (the
 *   selection state conceptually "lives" in the feed in the sense that only
 *   the feed's UI ever puts an id into it) and calls `registerBulkHandlers`
 *   once it knows how to actually run each operation — open the multi-board
 *   save modal, mark the selected ads saved. The ids/count themselves are
 *   held in this provider's state so a sibling can read and clear them.
 * - `MobileTabBar` only reads `isSelecting`/`count`/`operations` to decide
 *   whether to swap its tab row for the bulk row, renders the two operation
 *   buttons wired to `operations[n].run`, and wires its Cancel control to
 *   `clearSelection`. It never touches `toggleSelected` — that button only
 *   exists on the feed's cards.
 *
 * PLACEMENT — read this before wiring the provider into AppLayout.tsx
 * `MobileRouteGate` mounts `MobileCapabilityContext` deep inside
 * `AppShell > main > (content div)`, wrapping ONLY the `<Outlet/>`. That is
 * correct for a gate-to-surface publish, but it is the WRONG level for this
 * context: in `AppLayoutInner` (src/components/AppLayout.tsx),
 * `<MobileTabBar/>` is rendered as a SIBLING of `<AppShell>` — added after it
 * in the same top-level flex column — not as a descendant of it. The lowest
 * common ancestor of the feed's `<Outlet/>` and `<MobileTabBar/>` is
 * therefore `AppLayoutInner`'s own returned tree, so `MobileSelectionProvider`
 * must wrap at or above that point: either around the whole `<div
 * className="h-[100dvh]…">` that `AppLayoutInner` returns, or — more in
 * keeping with the existing pattern — around `<AppLayoutInner/>` itself,
 * alongside the `CopilotProvider` / `NewGenerationOverlayProvider` /
 * `WelcomeCarouselProvider` stack already in the exported `AppLayout`.
 * Mounting it inside `AppShell` or inside `MobileRouteGate` would put
 * `MobileTabBar` outside the provider, and it would silently render the inert
 * default below — no selection would ever appear to swap the bar.
 *
 * WHY THIS CANNOT REMOUNT THE FEED (INV-1)
 * `MobileSelectionProvider` is a plain context provider with no route- or
 * param-derived key, and no `isMobile` (or any other) branch on its own
 * children — it renders the exact `children` reference it was handed, on
 * every render, unconditionally. Adding it as one more ancestor around
 * `AppLayoutInner` (or its returned tree) does not touch, wrap, or duplicate
 * the single `<Outlet/>` `MobileRouteGate` renders further down, and it does
 * not change where that Outlet sits in the tree. Entering or leaving
 * selection mode only updates this provider's own `useState` — a normal
 * re-render of an already-mounted subtree — never a remount. The Insights
 * feed's accumulated infinite-scroll position is untouched.
 *
 * The default value below (no provider present) is deliberately INERT, not
 * absent-and-crashing: `count: 0`, both operations `disabled: true`, every
 * setter a no-op. Same philosophy as `MobileCapabilityContext`'s permissive
 * default — anything rendered outside the provider (bring-up, an isolated
 * component harness, a surface that forgets to check) degrades to "no
 * selection possible" instead of throwing.
 */

/** Locked by spec B §2.2 — exactly these two, no more. */
export type MobileBulkOperationId = "add-to-board" | "save-ads";

export interface MobileBulkOperation {
  id: MobileBulkOperationId;
  /** Fixed copy ("Add to board" / "Save ads") — never caller-supplied. */
  label: string;
  /** Runs the operation against the CURRENT `selectedIds` (bound as a
   *  closure when the feed registers its handler) — callers never pass ids. */
  run: () => void;
  /** True until the feed page has registered a handler for this id via
   *  `registerBulkHandlers`. A disabled operation still renders (never an
   *  empty/missing button) so the bar's shape never jumps mid-session. */
  disabled: boolean;
}

export interface MobileSelectionValue {
  /** `count > 0`, as a named field so `MobileTabBar`'s swap condition reads
   *  as intent rather than a bare comparison at every call site. */
  isSelecting: boolean;
  count: number;
  selectedIds: string[];
  /** Always exactly two entries, in this fixed order: Add to board, Save ads. */
  operations: MobileBulkOperation[];
  /** Toggles one id in/out of the selection. Only the feed's card checkboxes
   *  call this. */
  toggleSelected: (id: string) => void;
  /** Empties the selection. Backs both the tab bar's Cancel control and
   *  whatever exit affordance the feed itself offers — "clear" and "cancel"
   *  are the same action (spec B §2.2). */
  clearSelection: () => void;
  /** The feed calls this once it can run each operation for real (it knows
   *  how to open the multi-board modal / mark ads saved). Handlers receive
   *  the ids selected AT THE MOMENT `run()` is invoked, not at registration
   *  time, so the feed does not need to re-register on every toggle. Merges
   *  with whatever was registered before, so the two operations can be wired
   *  independently and in either order. */
  registerBulkHandlers: (
    handlers: Partial<Record<MobileBulkOperationId, (ids: string[]) => void>>,
  ) => void;
}

const noop = () => {};

/** Order + copy are locked by spec B §2.2 ("exactly two: Add to board and
 *  Save ads") — do not add a third operation or rename these without a
 *  corresponding spec change. No bulk Copy link, no bulk Add to competitor. */
const OPERATION_ORDER: ReadonlyArray<{ id: MobileBulkOperationId; label: string }> = [
  { id: "add-to-board", label: "Add to board" },
  { id: "save-ads", label: "Save ads" },
];

const INERT_OPERATIONS: MobileBulkOperation[] = OPERATION_ORDER.map((op) => ({
  ...op,
  run: noop,
  disabled: true,
}));

/**
 * Default `{ count: 0, isSelecting: false, … }` is LOAD-BEARING, not a
 * placeholder — see the header comment. Mirrors
 * `MobileCapabilityContext`'s documented default philosophy.
 */
const INERT_VALUE: MobileSelectionValue = {
  isSelecting: false,
  count: 0,
  selectedIds: [],
  operations: INERT_OPERATIONS,
  toggleSelected: noop,
  clearSelection: noop,
  registerBulkHandlers: noop,
};

export const MobileSelectionContext = createContext<MobileSelectionValue>(INERT_VALUE);

export function useMobileSelection(): MobileSelectionValue {
  return useContext(MobileSelectionContext);
}

/** True while a bulk selection is active — the exact signal `MobileTabBar`
 *  swaps its tab row on. Split out so a consumer that only needs the boolean
 *  doesn't have to destructure the whole context, mirroring
 *  `useIsReadOnly`/`useIsMobileSurface` in `MobileCapabilityContext.tsx`. */
export function useHasMobileSelection(): boolean {
  return useMobileSelection().isSelecting;
}

export function MobileSelectionProvider({ children }: { children: ReactNode }) {
  const [selected, setSelected] = useState<Set<string>>(() => new Set());

  // Handlers are registered by the feed page once it knows how to run each
  // operation for real. A ref, not state: registering a handler must not
  // itself force a re-render — only the selection changing should. The
  // version counter is the (small, deliberate) signal that tells the
  // `operations` memo below to re-read the ref.
  const handlersRef = useRef<
    Partial<Record<MobileBulkOperationId, (ids: string[]) => void>>
  >({});
  const [handlerVersion, setHandlerVersion] = useState(0);

  const toggleSelected = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => {
    // Bail out on an already-empty set so Cancel/clear never produces an
    // extra render when there is nothing to clear.
    setSelected((prev) => (prev.size === 0 ? prev : new Set()));
  }, []);

  const registerBulkHandlers = useCallback(
    (handlers: Partial<Record<MobileBulkOperationId, (ids: string[]) => void>>) => {
      handlersRef.current = { ...handlersRef.current, ...handlers };
      setHandlerVersion((v) => v + 1);
    },
    [],
  );

  const selectedIds = useMemo(() => Array.from(selected), [selected]);

  const operations = useMemo<MobileBulkOperation[]>(
    () =>
      OPERATION_ORDER.map((op) => {
        const handler = handlersRef.current[op.id];
        return {
          ...op,
          // Bound here, against THIS render's `selectedIds`, so the tab bar
          // can call `run()` with no arguments and still always act on the
          // current selection.
          run: () => handler?.(selectedIds),
          disabled: !handler,
        };
      }),
    // `handlerVersion` picks up newly-registered handlers; `selectedIds`
    // keeps each `run` closure current. `handlersRef` itself is a ref and is
    // intentionally not a dependency.
    [handlerVersion, selectedIds],
  );

  const value = useMemo<MobileSelectionValue>(
    () => ({
      isSelecting: selectedIds.length > 0,
      count: selectedIds.length,
      selectedIds,
      operations,
      toggleSelected,
      clearSelection,
      registerBulkHandlers,
    }),
    [selectedIds, operations, toggleSelected, clearSelection, registerBulkHandlers],
  );

  return (
    <MobileSelectionContext.Provider value={value}>
      {children}
    </MobileSelectionContext.Provider>
  );
}
