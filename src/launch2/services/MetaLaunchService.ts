/**
 * MetaLaunchService — the single interface the whole Launch 2.0 module talks to.
 *
 * Today this is backed by a mock (mockMetaLaunchService.ts) that simulates
 * realistic partial failures + throttled progress. Later, a real
 * implementation hits the Meta Graph API behind THIS SAME interface — screens
 * never change.
 */
import type {
  AccountHealth,
  AdAccount,
  ActivityEvent,
  Catalogue,
  LaunchPlan,
  LaunchRun,
  WinnerStrategy,
} from "../types";

/** Events the service broadcasts so screens can re-render live. */
export type Launch2Event =
  | { type: "run-updated"; run: LaunchRun }
  | { type: "runs-updated" }
  | { type: "drafts-updated" };

export type Launch2Listener = (event: Launch2Event) => void;

export interface MetaLaunchService {
  /* ---- launches (runs) ---- */
  listLaunches(): LaunchRun[];
  getLaunch(id: string): LaunchRun | undefined;

  /**
   * Submit a plan. IDEMPOTENT: launching the same plan id twice returns the
   * existing run instead of creating duplicates. Returns the run immediately
   * (status "queued"/"scheduled"); progress streams via subscribe().
   */
  launch(plan: LaunchPlan): LaunchRun;

  /**
   * Retry ONLY the failed units of a run. Never touches created units, never
   * re-runs the whole batch. Retryable failures mostly recover; non-retryable
   * stay failed.
   */
  retryFailed(runId: string): LaunchRun | undefined;

  /* ---- drafts (autosave) ---- */
  listDrafts(): LaunchPlan[];
  getDraft(id: string): LaunchPlan | undefined;
  saveDraft(plan: LaunchPlan): void;
  deleteDraft(id: string): void;

  /* ---- live demo control (mock only; no-op on real impl) ---- */
  /** Resume ticking any in-flight runs (called when a screen mounts). */
  resumeLiveRuns(): void;
  /** Pause ticking (called when the module unmounts) to save timers. */
  pauseLiveRuns(): void;

  /* ---- reference data (mock; real impl fetches from Meta) ---- */
  listAccounts(): AdAccount[];
  getAccount(id: string): AdAccount | undefined;
  listCatalogues(accountId?: string): Catalogue[];
  listWinners(): WinnerStrategy[];
  listActivity(): ActivityEvent[];
  listAccountHealth(): AccountHealth[];

  /* ---- pub/sub ---- */
  subscribe(listener: Launch2Listener): () => void;
}
