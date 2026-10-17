// A private-lab startup projection, not an authority or a permission grant.
// Callers must obtain each observation from its owning service. A local Ready
// tunnel, old task presence, or stale game tick cannot advance a later stage.
import type { DesktopMcpTunnelScope } from "./desktop-mcp-tunnel";
export type PrivateLabStage =
  | "account" | "native" | "transport" | "task" | "game"
  | "responses" | "activity" | "ready" | "expired";

export type PrivateLabExpected = Readonly<{
  profileId: string;
  taskId: string;
  helixConversationId: string;
  roomId: string;
  worldId: string;
  playerId: string;
  expiresAt: number;
}>;

export type PrivateLabObservations = Readonly<{
  account: null | Readonly<{ active: boolean; profileId: string; sessionId: string }>;
  native: null | Readonly<{ healthy: boolean; processEpoch: string }>;
  transport: null | Readonly<{
    ready: boolean; scope: DesktopMcpTunnelScope;
    authenticatedTaskId: string | null; checkInAt: number | null;
  }>;
  task: null | Readonly<{
    status: "active" | "pending" | "expired" | "revoked";
    taskId: string; helixConversationId: string; expiresAt: number;
  }>;
  game: null | Readonly<{
    roomId: string; worldId: string; playerId: string;
    runVerified: boolean; actionAuthorityActive: boolean;
    lastTickAt: number | null; manualOverride: boolean;
  }>;
  responses: null | Readonly<{
    ownKeyReady: boolean; shadowApprovalActive: boolean;
    remainingCalls: number; remainingTokens: number;
  }>;
  activity: null | Readonly<{
    exactTaskId: string; codexReaderReady: boolean;
    responsesLaneReady: boolean;
  }>;
}>;

export type PrivateLabReadiness = Readonly<{
  schema: "casimir.private_lab_readiness.v1";
  stage: PrivateLabStage;
  reason: string;
  ready: boolean;
  // This projection cannot itself authorize an environment effect or model call.
  authorityGranted: false;
}>;

const result = (stage: PrivateLabStage, reason: string): PrivateLabReadiness => Object.freeze({
  schema: "casimir.private_lab_readiness.v1" as const,
  stage, reason, ready: stage === "ready", authorityGranted: false as const,
});

export function derivePrivateLabReadiness(
  expected: PrivateLabExpected,
  observed: PrivateLabObservations,
  now: number,
): PrivateLabReadiness {
  if (!Number.isFinite(now) || !Number.isFinite(expected.expiresAt) ||
      expected.expiresAt <= now) return result("expired", "lab_session_expired");
  if (!expected.profileId || !expected.taskId || !expected.helixConversationId ||
      !expected.roomId || !expected.worldId || !expected.playerId)
    return result("account", "lab_identity_incomplete");
  if (!observed.account?.active || !observed.account.sessionId ||
      observed.account.profileId !== expected.profileId)
    return result("account", "account_not_current");
  if (!observed.native?.healthy || !observed.native.processEpoch)
    return result("native", "native_service_not_healthy");
  if (!observed.transport?.ready || observed.transport.scope !== "full_helix_agent")
    return result("transport", "full_transport_not_ready");
  if (observed.transport.authenticatedTaskId !== expected.taskId ||
      observed.transport.checkInAt === null ||
      !Number.isFinite(observed.transport.checkInAt) ||
      observed.transport.checkInAt > now + 5_000 ||
      now - observed.transport.checkInAt > 30_000)
    return result("transport", "exact_task_check_in_missing_or_stale");
  if (observed.task?.status !== "active" ||
      observed.task.taskId !== expected.taskId ||
      observed.task.helixConversationId !== expected.helixConversationId ||
      !Number.isFinite(observed.task.expiresAt) ||
      observed.task.expiresAt <= now)
    return result("task", "exact_task_binding_not_active");
  if (!observed.game?.runVerified || !observed.game.actionAuthorityActive ||
      observed.game.manualOverride || observed.game.roomId !== expected.roomId ||
      observed.game.worldId !== expected.worldId ||
      observed.game.playerId !== expected.playerId ||
      observed.game.lastTickAt === null ||
      !Number.isFinite(observed.game.lastTickAt) ||
      observed.game.lastTickAt > now + 1_000 ||
      now - observed.game.lastTickAt > 5_000)
    return result("game", "verified_player_run_not_ready");
  if (!observed.responses?.ownKeyReady || !observed.responses.shadowApprovalActive ||
      !Number.isFinite(observed.responses.remainingCalls) ||
      !Number.isFinite(observed.responses.remainingTokens) ||
      observed.responses.remainingCalls < 1 || observed.responses.remainingTokens < 1)
    return result("responses", "bounded_shadow_budget_not_ready");
  if (!observed.activity?.codexReaderReady || !observed.activity.responsesLaneReady ||
      observed.activity.exactTaskId !== expected.taskId)
    return result("activity", "exact_task_activity_not_ready");
  return result("ready", "verified_private_lab_checkpoint");
}
