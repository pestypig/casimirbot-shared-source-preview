import { z } from "zod";
import { parseDesktopMcpTunnelState } from "./desktop-mcp-tunnel";
import { privateEnvironmentStateSchema } from "./desktop-environment-home";
import { privateClockPermissionStateSchema } from "./desktop-private-clock-permission";
import { helixAgentConnectionStatusSchema } from "./helix-agent-client-profile";

const state = z.enum(["unknown", "missing", "current", "stale", "mismatch"]);
export const localPersonalConnectionStatusSchema = z.object({
  schema: z.literal("casimirbot.local_personal_connection_status.v1"),
  purpose: z.literal("bounded_personal_clock"), profile: z.literal("codex_app"),
  connectionRef: z.string().regex(/^connection:[a-f0-9]{64}$/).nullable(), accountDeviceClientMatch: state,
  observedAt: z.string().datetime(), expiresAt: z.string().datetime(),
  transport: z.enum(["unknown", "unconfigured", "stopped", "starting", "ready", "degraded", "stopping", "blocked", "limited"]),
  controlPlane: z.literal("unknown"), attachment: state, catalog: state,
  requiredTool: z.enum(["unknown", "verified_by_operation"]),
  installation: state, version: z.string().nullable(), artifactSha256: z.string().nullable(),
  grant: z.enum(["unknown", "missing", "current", "expired", "mismatch"]), grantExpiresAt: z.string().nullable(),
  lastResult: z.enum(["unavailable", "historical_success", "outcome_unknown", "absent"]),
  next: z.object({ action: z.enum(["inspect", "native_setup", "start_explicitly", "wait", "refresh_catalog", "attach_client", "review_installation", "review_grant", "verify_operation"]),
    actor: z.enum(["owner", "external_client", "native_supervisor"]), reason: z.string(),
    completion: z.string(), panel: z.enum(["device-check", "environment-home", "agent-access"]) }).strict(),
  localOnly: z.literal(true), credentialIncluded: z.literal(false), answerAuthority: z.literal(false),
  taskBindingRequired: z.literal(false), publicAcceptance: z.literal(false),
}).strict();
export type LocalPersonalConnectionStatus = z.infer<typeof localPersonalConnectionStatusSchema>;

/** Projection only. No execution, self-grant, implicit renew/restart, or trust in
 * the aggregate agent_ready field (which also includes optional task binding). */
export function projectLocalPersonalConnection(input: {
  now: number; tunnel?: unknown; installation?: unknown; permission?: unknown; client?: unknown;
  connectionRef?: string;
  history?: "historical_success" | "outcome_unknown" | "absent";
}): LocalPersonalConnectionStatus {
  const tunnel = parseDesktopMcpTunnelState(input.tunnel);
  const installation = privateEnvironmentStateSchema.safeParse(input.installation);
  const permission = privateClockPermissionStateSchema.safeParse(input.permission);
  const client = helixAgentConnectionStatusSchema.safeParse(input.client);
  const native = installation.success && installation.data.packageId === "com.casimirbot.system.clock" ? installation.data : null;
  const grant = permission.success ? permission.data : null;
  const connection = client.success ? client.data : null;
  const profileMatch = connection?.selected_client_profile === "codex_app";
  const fresh = Boolean(profileMatch && !connection?.authorization_changed_after_presence && connection?.readiness.client_authorization === "active" && connection?.proof_basis === "authenticated_presence_tool" &&
    connection.observed_at && Date.parse(connection.observed_at) <= input.now &&
    input.now - Date.parse(connection.observed_at) <= 30000 && connection.heartbeat_expires_at &&
    Date.parse(connection.heartbeat_expires_at) > input.now && connection.authenticated_mcp_client_ref &&
    connection.readiness.client_presence === "online");
  const attachment = connection && !profileMatch ? "mismatch" : fresh ? "current" : connection ? "stale" : "unknown";
  const catalog = !fresh ? "unknown" : connection!.catalog_reenumeration_required ||
    connection!.readiness.catalog_sync !== "current" ? "stale" : "current";
  const grantState = !grant ? "unknown" : !grant.allowed ? "missing" :
    !native?.installationRef || grant.installationRef !== native.installationRef ||
    (fresh && grant.clientRef !== connection!.authenticated_mcp_client_ref) ? "mismatch" :
    !grant.expiresAt || Date.parse(grant.expiresAt) <= input.now ? "expired" : "current";
  const transport = !tunnel ? "unknown" : tunnel.status === "ready" &&
    (!tunnel.ready || !tunnel.processRunning || !tunnel.healthy) ? "degraded" :
    tunnel.status === "ready" && tunnel.scope !== "full_helix_agent" ? "limited" : tunnel.status;
  const expiresAt = Math.min(input.now + 30000,
    fresh ? Date.parse(connection!.heartbeat_expires_at!) : input.now + 30000,
    grantState === "current" ? Date.parse(grant!.expiresAt!) : input.now + 30000);
  let action: LocalPersonalConnectionStatus["next"]["action"] = "inspect";
  let actor: LocalPersonalConnectionStatus["next"]["actor"] = "owner";
  let panel: LocalPersonalConnectionStatus["next"]["panel"] = "device-check";
  let reason = "Inspect native status before repair.";
  let completion = "Fresh native status; no resource creation.";
  if (transport === "unconfigured" || transport === "blocked") {
    action = "native_setup"; reason = "Protected native setup needs owner input.";
    completion = "Native supervisor confirms configured transport; credentials stay in protected controls.";
  } else if (["stopped", "limited", "degraded"].includes(transport)) {
    action = "start_explicitly"; reason = "Review current scope and operator Stop before an explicit transition.";
    completion = "Existing transition request inspected and native Full Harness result confirmed.";
  } else if (["starting", "stopping"].includes(transport)) {
    action = "wait"; actor = "native_supervisor"; reason = "Existing native transition is pending.";
    completion = "Inspect that transition; do not submit a duplicate.";
  } else if (transport === "ready" && attachment !== "current") {
    action = "attach_client"; actor = "external_client"; panel = "agent-access";
    reason = "Native readiness does not prove external Codex attachment.";
    completion = "Current authenticated presence from the selected profile; task pairing is optional for bounded tools.";
  } else if (transport === "ready" && catalog !== "current") {
    action = "refresh_catalog"; actor = "external_client"; panel = "agent-access";
    reason = "Reconnect the existing client or refresh its catalog; do not rebuild the tunnel.";
    completion = "Current authenticated catalog and exact clock tool discovery.";
  } else if (transport === "ready" && native?.status !== "installed_stopped") {
    action = "review_installation"; panel = "environment-home"; reason = "Reviewed installation is not confirmed.";
    completion = "Matching installation version and artifact hash.";
  } else if (transport === "ready" && (grantState !== "current" || !grant?.transportReady)) {
    action = "review_grant"; panel = "environment-home"; reason = "Program access needs separate current owner consent.";
    completion = "Existing permission control confirms exact installation/client and finite expiry.";
  } else if (transport === "ready") {
    action = "verify_operation"; actor = "external_client"; panel = "environment-home";
    reason = "Discover helix_private_clock_observe and request one bounded read; retained history is not current proof.";
    completion = "External installed-operation evidence correlated to client, request and artifact; unknown outcomes are inspected without replay.";
  }
  return localPersonalConnectionStatusSchema.parse({
    schema: "casimirbot.local_personal_connection_status.v1", purpose: "bounded_personal_clock", profile: "codex_app",
    connectionRef: input.connectionRef ?? null, accountDeviceClientMatch: grantState === "mismatch" ? "mismatch" :
      fresh && grantState === "current" ? "current" : "unknown",
    observedAt: new Date(input.now).toISOString(), expiresAt: new Date(expiresAt).toISOString(),
    transport, controlPlane: "unknown", attachment, catalog, requiredTool: "unknown",
    installation: !native ? "unknown" : native.status === "installed_stopped" && native.installationRef ? "current" : "missing",
    version: native && /^\d+\.\d+\.\d+(?:-[a-z0-9]+(?:\.[a-z0-9]+)*)?$/i.test(native.version) ? native.version : null,
    artifactSha256: native?.artifactSha256 ?? null,
    grant: grantState, grantExpiresAt: grant?.expiresAt ?? null,
    lastResult: input.history ?? "unavailable", next: { action, actor, panel, reason, completion },
    localOnly: true, credentialIncluded: false, answerAuthority: false, taskBindingRequired: false, publicAcceptance: false,
  });
}
