/**
 * Connector (AI access) — one-time demo seeding.
 *
 * Both stores seed only when their localStorage key was ABSENT at boot, never
 * when it merely holds an empty array. That distinction is what makes "Clear
 * all connections" a real, persistent zero state: clearing writes `[]`, the
 * key exists, and the seed never creeps back on reload.
 *
 * The two seeds have to happen together and in order — audit entries
 * denormalise `connectionName` and `agentKind` off the connections they
 * describe, so the connections must exist first. Doing it here rather than in
 * either store keeps that ordering in one obvious place instead of leaving it
 * as an implicit rule two modules both have to remember.
 *
 * Idempotent and safe to call from any surface's mount effect; the stores
 * themselves are the guard.
 */
import { seedAuditIfEmpty } from "@/connector/auditStore";
import { seedConnectionsIfEmpty, getConnections } from "@/connector/connectionsStore";
import { buildSeedAudit, buildSeedConnections } from "@/connector/seed";

let done = false;

export function bootstrapConnector(now: number = Date.now()): void {
  // Module-level latch on top of the per-store guards: React 18 StrictMode
  // double-invokes mount effects in development, and without this the audit
  // seed would run twice and duplicate every row.
  if (done) return;
  done = true;

  seedConnectionsIfEmpty(() => buildSeedConnections(now));
  seedAuditIfEmpty(() => buildSeedAudit(getConnections(), now));
}
