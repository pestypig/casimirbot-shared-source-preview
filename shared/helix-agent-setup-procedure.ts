import type { HelixAgentClientReadiness } from "./helix-agent-client-readiness";

export type HelixAgentSetupActor = "owner" | "agent";

export type HelixAgentSetupStep = Readonly<{
  id: string;
  label: string;
  actor: HelixAgentSetupActor;
  route: "personal_mcp" | "task_pairing" | "environment_action";
  evidence: string;
  next: string;
}>;

/**
 * Credential-free guide shared by Agent Access and the MCP setup tool.
 * Pairing and environment actions are explicit branches, not personal MCP
 * startup requirements.
 */
export const HELIX_AGENT_SETUP_PROCEDURE = {
  schema: "helix.agent_setup_procedure.v2",
  rule: "Resume at the first checkpoint whose evidence is not current for this exact profile, MCP connection and task. A previous or different task's success is not current evidence. Stop on a typed denial or uncertain mutation and inspect or reconcile it before retrying.",
  startup_goal: "first_verified_read_only_mcp_call",
  task_pairing_fast_path: "When the owner wants Message Codex for one Helix chat, call helix_agent_setup_resume_exact_task with this task's own client_continuation_ref and that chat's ID. It checks in, reuses finite registration or pairing, and returns the next owner checkpoint. After the owner approves a private invitation, call the same tool again. On R66 or later, an older connected tool catalog can instead call helix_reasoning_pairing_accept_private with id helix-chat:<exact Helix chat ID>; that selector accepts only a unique owner-approved private invitation for this authenticated task without a copied pairing ID. On an older installed server, use the public pairing ID after approval. After an EXE restart with an already accepted pairing, helix_reasoning_pairing_recover_current is the secret-free fallback when the setup tool is not exposed by this connection. None of these paths renew pairing consent or grant environment actions.",
  source_failure_recovery: "If this exact task cannot see or call the matching CasimirBot MCP setup tool, stop before invitation review. A locally Ready tunnel or another task's success is not this task's authenticated check-in. Refresh the matching Source only if its tool catalog is absent or stale; reconnect only if its connection or authorization failed. A listed tool can still return 'Connect this app with OAuth to use this action' in a second Codex task: the owner must connect that exact Source to the intended account in that task before one new read-only check-in; refreshing tools or issuing an invitation cannot authorize it. If OAuth rejects a client as not authorized for this tunnel resource, that Source is mismatched; use an already-authorized Source for this exact tunnel instead of repeating sign-in or treating the pairing as expired. Keep the exact failure diagnostic: MCP 404 does not establish pairing expiry, while 429 requires bounded backoff instead of rapid retries. If multiple tasks get the same 404 while the local tunnel is Ready, inspect the shared remote Source/tunnel association before repeating per-task setup. Resume this same task after one successful authenticated setup call. Use the Codex chat title only to help the owner recognize it; the authenticated task ID and Helix chat ID remain the pairing authority.",
  steps: [
    { id: "profile", label: "Select and sign in to the CasimirBot profile", actor: "owner", route: "personal_mcp", evidence: "Agent Access shows the selected signed-in profile as current.", next: "Complete the missing sign-in in Account & Sessions, then recheck." },
    { id: "authorization", label: "Authorize the selected MCP client", actor: "owner", route: "personal_mcp", evidence: "The matching Source's authorization is active in this exact AI task.", next: "Connect or recover OAuth for this task's matching CasimirBot Source and intended account. A separate task's successful call does not authorize this one. Do not repeat MFA unless that flow requests it." },
    { id: "transport", label: "Start required local transport", actor: "owner", route: "personal_mcp", evidence: "When this connection uses the installed local tunnel, native Agent Access reports its finite lease Ready.", next: "Start or inspect the tunnel in the installed app. Local Ready alone does not prove the AI task can call MCP." },
    { id: "catalog", label: "Connect the matching MCP server in this task", actor: "owner", route: "personal_mcp", evidence: "This same task lists the matching CasimirBot tools and the catalog is current.", next: "Reconnect or refresh this server in the AI app. A separate Device Check connector does not qualify." },
    { id: "first_read_only_call", label: "Make the first read-only MCP call", actor: "agent", route: "personal_mcp", evidence: "A current authenticated MCP tool call or presence receipt is observed for this exact task.", next: "Call the named read-only setup/check-in tool once and report its result. Do not register a pairing or perform an environment action." },
    { id: "registration", label: "Register this exact task for Message Codex", actor: "agent", route: "task_pairing", evidence: "A finite registration receipt identifies this authenticated task and deadline.", next: "Prefer helix_agent_setup_resume_exact_task for this chat; it combines check-in and finite registration. The manual fallback is helix_reasoning_destination_register after authenticated presence, with the same request ID on retries." },
    { id: "review", label: "Review and approve the exact-task invitation", actor: "owner", route: "task_pairing", evidence: "Agent Access identifies the exact task/chat and shows the invitation awaiting owner review.", next: "Approve the intended duration and private MCP acceptance in Agent Access. The agent must wait here." },
    { id: "accept", label: "Accept the owner-approved private pairing", actor: "agent", route: "task_pairing", evidence: "Private acceptance returns the accepted pairing for this authenticated task and exact Helix chat.", next: "Call helix_agent_setup_resume_exact_task again after owner approval; it accepts only a unique owner-approved private invitation. On R66 or later, the older-tool fallback is helix_reasoning_pairing_accept_private with id helix-chat:<exact Helix chat ID>; use a public pairing ID only if that selector is unsupported. Never request or expose the invitation secret." },
    { id: "binding", label: "Verify the runtime binding", actor: "agent", route: "task_pairing", evidence: "The acceptance result reports runtime_binding_active for the same accepted pairing, and Agent Access independently checks that binding.", next: "Recover the same accepted pairing through helix_agent_setup_resume_exact_task or, if unavailable, helix_reasoning_pairing_recover_current. Do not create a replacement invitation just to refresh a binding." },
    { id: "environment", label: "Prepare an optional environment action", actor: "owner", route: "environment_action", evidence: "The requested environment, source, player/world and exact bounded action grant are current.", next: "Select the environment and approve only the requested bounded effect. MCP access and pairing do not grant game actions." },
  ] satisfies readonly HelixAgentSetupStep[],
  completion: "A current authenticated read-only MCP call completes personal MCP startup. Message Codex pairing and environment actions are separate optional routes with separate owner approvals.",
} as const;

export type HelixAgentSetupNextAction = Readonly<{
  checkpoint: string;
  actor: HelixAgentSetupActor | null;
  title: string;
  instruction: string;
  state: "action_required" | "verified" | "unknown";
}>;

export const projectHelixAgentMcpSetupProgress = (input: Readonly<{
  procedureToolCallSucceeded: boolean;
  exactTaskPresence: "active" | "missing" | "unknown";
}>): HelixAgentSetupNextAction => {
  if (input.procedureToolCallSucceeded && input.exactTaskPresence === "active") {
    return { checkpoint: "first_read_only_call", actor: null, title: "Read-only MCP startup verified", instruction: "This exact task has a current authenticated MCP presence receipt. Pairing and environment actions remain optional.", state: "verified" };
  }
  if (!input.procedureToolCallSucceeded || input.exactTaskPresence === "unknown") {
    return { checkpoint: "first_read_only_call", actor: "agent", title: "Verify the exact task's MCP call", instruction: "Call helix_local_supervisor_presence_update for this exact task, then check Agent Access for a fresh authenticated receipt.", state: "unknown" };
  }
  return { checkpoint: "first_read_only_call", actor: "agent", title: "Check in this exact task", instruction: "Call helix_local_supervisor_presence_update for this exact task once. This read-only check-in does not register or accept a pairing.", state: "action_required" };
};

export type HelixAgentSetupProgressInput = Readonly<{
  profileSelected: boolean;
  statusFresh: boolean;
  readiness?: HelixAgentClientReadiness | null;
  authenticatedMcpCallObserved?: boolean;
  transport?: "ready" | "not_ready" | "unknown" | "not_required";
}>;

/** A prompt for the owner to start the personal-MCP canary in the exact task. */
export const PERSONAL_MCP_STARTUP_REQUEST =
  "Read helix_agent_setup_procedure through this task's CasimirBot MCP connection. For personal MCP startup, call helix_local_supervisor_presence_update once for this exact task and report whether it succeeded. Stop after the read-only call. Do not register or accept a pairing, perform an environment action, or copy any credentials.";

/** Pure projection: only current server readiness evidence advances a step. */
export const deriveHelixAgentSetupNextAction = (
  input: HelixAgentSetupProgressInput,
): HelixAgentSetupNextAction => {
  if (!input.profileSelected) {
    return { checkpoint: "profile", actor: "owner", title: "Choose your AI app", instruction: "Select the client you will connect, then sign in to the intended CasimirBot profile.", state: "action_required" };
  }
  if (!input.statusFresh || !input.readiness) {
    return { checkpoint: "status", actor: "owner", title: "Check the current connection", instruction: "Recheck Agent Access. A saved step or previous task is not current evidence.", state: "unknown" };
  }

  const readiness = input.readiness;
  if (readiness.client_authorization !== "active") {
    return { checkpoint: "authorization", actor: "owner", title: "Authorize the matching MCP connection", instruction: "Reconnect or complete OAuth for the selected CasimirBot server in the AI app.", state: "action_required" };
  }
  if (readiness.provider_application !== "available") {
    return { checkpoint: "catalog", actor: "owner", title: "Check the same AI task", instruction: "If the selected AI app is closed, open it. In that same task, recheck its matching CasimirBot MCP connection and make a read-only check-in. Keep any accepted pairing; this status alone does not revoke it.", state: "action_required" };
  }
  if (readiness.catalog_sync !== "current") {
    return { checkpoint: "catalog", actor: "owner", title: "Refresh the matching MCP tools", instruction: "Refresh or reconnect this CasimirBot server in the same AI task. Do not switch to a separate Device Check connector.", state: "action_required" };
  }
  if (readiness.thread_attachment === "stale") {
    return { checkpoint: "catalog", actor: "owner", title: "Reopen the same AI task", instruction: "Recheck this task's attachment and MCP catalog. Do not create a replacement task to repair stale evidence.", state: "action_required" };
  }
  if (input.authenticatedMcpCallObserved) {
    return { checkpoint: "first_read_only_call", actor: null, title: "Read-only MCP startup verified", instruction: "A current authenticated MCP call is verified. Message Codex pairing and environment actions remain optional.", state: "verified" };
  }
  if (input.transport === "not_ready" || input.transport === "unknown") {
    return { checkpoint: "transport", actor: "owner", title: "Inspect the installed local transport", instruction: input.transport === "not_ready"
      ? "The native transport is not Ready. Start or recover its finite lease in Device Check, then recheck this exact task."
      : "The installed transport state has not been verified. Inspect it in the native app before requesting a task check-in.", state: input.transport === "not_ready" ? "action_required" : "unknown" };
  }
  return { checkpoint: "first_read_only_call", actor: "owner", title: "Ask this exact task to make one read-only MCP call", instruction: "In the Codex task you want to use, ask it to call helix_local_supervisor_presence_update once and report the receipt. Wait for fresh Agent Access evidence before continuing.", state: "action_required" };
};
