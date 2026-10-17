import { z } from "zod";
import {
  HELIX_OPERATOR_ACTIVITY_EVENT_KINDS,
  HELIX_OPERATOR_ACTIVITY_OUTCOMES,
  helixOperatorActivityEventSchema,
  type HelixOperatorActivityEvent,
} from "./helix-operator-activity";

export const HELIX_ENVIRONMENT_MISSION_ACTIVITY_POLICY_SCHEMA =
  "helix.environment_mission_activity_policy.v1" as const;
export const HELIX_ENVIRONMENT_MISSION_ACTIVITY_SCOPE_SCHEMA =
  "helix.environment_mission_activity_scope.v1" as const;
export const HELIX_ENVIRONMENT_MISSION_ACTIVITY_PROJECTION_SCHEMA =
  "helix.environment_mission_activity_projection.v1" as const;

const ref = z.string().trim().min(1).max(512);
const timestamp = z.string().datetime({ offset: true });

/** Presentation choices only. These cannot route speech or admit an effect. */
export const helixEnvironmentMissionActivityPolicySchema = z.object({
  schema: z.literal(HELIX_ENVIRONMENT_MISSION_ACTIVITY_POLICY_SCHEMA),
  overlay: z.enum(["off", "milestones", "activity"]),
  room: z.enum(["off", "escalations", "milestones"]),
  environment_chat: z.enum(["off", "escalations", "milestones"]),
  private_reasoning_visible: z.literal(false),
  steering_authority_granted: z.literal(false),
  action_authority_granted: z.literal(false),
}).strict();
export type HelixEnvironmentMissionActivityPolicy = z.infer<
  typeof helixEnvironmentMissionActivityPolicySchema
>;

export const DEFAULT_HELIX_ENVIRONMENT_MISSION_ACTIVITY_POLICY: HelixEnvironmentMissionActivityPolicy = {
  schema: HELIX_ENVIRONMENT_MISSION_ACTIVITY_POLICY_SCHEMA,
  overlay: "milestones",
  room: "escalations",
  environment_chat: "off",
  private_reasoning_visible: false,
  steering_authority_granted: false,
  action_authority_granted: false,
};

/** Exact selected mission. A profile-wide feed must not become a game HUD. */
export const helixEnvironmentMissionActivityScopeSchema = z.object({
  schema: z.literal(HELIX_ENVIRONMENT_MISSION_ACTIVITY_SCOPE_SCHEMA),
  profile_ref: ref,
  node_ref: ref,
  run_id: ref,
  room_ref: ref.nullable(),
  environment_binding_ref: ref,
  source_ref: ref,
  world_ref: ref,
}).strict();
export type HelixEnvironmentMissionActivityScope = z.infer<
  typeof helixEnvironmentMissionActivityScopeSchema
>;

export const helixEnvironmentMissionActivityProjectionSchema = z.object({
  schema: z.literal(HELIX_ENVIRONMENT_MISSION_ACTIVITY_PROJECTION_SCHEMA),
  surface: z.enum(["overlay", "room", "environment_chat"]),
  activity_event_id: ref,
  projection_sequence: z.number().int().nonnegative(),
  run_id: ref,
  event_kind: z.enum(HELIX_OPERATOR_ACTIVITY_EVENT_KINDS),
  outcome: z.enum(HELIX_OPERATOR_ACTIVITY_OUTCOMES),
  label: z.string().min(1).max(80),
  summary: z.string().min(1).max(241),
  truncated: z.boolean(),
  observed_at: timestamp,
  provenance: z.enum(["measured", "reported", "derived"]),
  content_role: z.literal("mission_activity_not_assistant_answer"),
  answer_authority: z.literal(false),
  assistant_answer: z.literal(false),
  terminal_eligible: z.literal(false),
  raw_content_included: z.literal(false),
  private_reasoning_included: z.literal(false),
  action_authority_granted: z.literal(false),
}).strict();
export type HelixEnvironmentMissionActivityProjection = z.infer<
  typeof helixEnvironmentMissionActivityProjectionSchema
>;

const ESCALATION_KINDS = new Set<HelixOperatorActivityEvent["event_kind"]>([
  "failure", "cancellation",
]);
const MILESTONE_KINDS = new Set<HelixOperatorActivityEvent["event_kind"]>([
  "checkpoint", "failure", "cancellation", "completion",
]);
const ESCALATION_OUTCOMES = new Set<HelixOperatorActivityEvent["outcome"]>([
  "blocked", "failed", "canceled", "unavailable", "stale",
]);

const eventAllowedByLevel = (
  event: HelixOperatorActivityEvent,
  level: "off" | "activity" | "milestones" | "escalations",
): boolean => {
  if (level === "off") return false;
  if (level === "activity") return true;
  if (level === "milestones") return MILESTONE_KINDS.has(event.event_kind) ||
    ESCALATION_OUTCOMES.has(event.outcome);
  return ESCALATION_KINDS.has(event.event_kind) ||
    ESCALATION_OUTCOMES.has(event.outcome);
};

const eventLabel = (event: HelixOperatorActivityEvent): string => {
  if (ESCALATION_OUTCOMES.has(event.outcome)) return "Needs attention";
  switch (event.event_kind) {
    case "checkpoint": return "Checkpoint";
    case "observation": return "Observation";
    case "completion": return "Activity completed";
    case "cancellation": return "Activity canceled";
    case "failure": return "Activity failed";
    default: return "Activity";
  }
};

/**
 * Read-only projection of the existing canonical operator activity event.
 * No new ledger, room message, assistant answer, task steering or action is made.
 */
export function projectHelixEnvironmentMissionActivity(input: {
  event: unknown;
  scope: unknown;
  policy: unknown;
  surface: "overlay" | "room" | "environment_chat";
  nowMs: number;
}): HelixEnvironmentMissionActivityProjection | null {
  const eventResult = helixOperatorActivityEventSchema.safeParse(input.event);
  const scopeResult = helixEnvironmentMissionActivityScopeSchema.safeParse(input.scope);
  const policyResult = helixEnvironmentMissionActivityPolicySchema.safeParse(input.policy);
  if (!eventResult.success || !scopeResult.success || !policyResult.success ||
      !Number.isFinite(input.nowMs)) return null;
  const event = eventResult.data;
  const scope = scopeResult.data;
  const policy = policyResult.data;
  if (event.profile_ref !== scope.profile_ref || event.node_ref !== scope.node_ref ||
      event.run_id !== scope.run_id || event.room_ref !== scope.room_ref ||
      event.environment_binding_ref !== scope.environment_binding_ref ||
      event.source_ref !== scope.source_ref || event.world_ref !== scope.world_ref ||
      event.redaction_state !== "sanitized") return null;
  const ageMs = input.nowMs - Date.parse(event.observed_at);
  const maxAgeMs = input.surface === "overlay" ? 60_000 : 300_000;
  if (ageMs < -5_000 || ageMs > maxAgeMs) return null;
  if (input.surface !== "overlay" &&
      (scope.room_ref === null || event.visibility !== "room_grant")) return null;
  if (!eventAllowedByLevel(event, policy[input.surface])) return null;

  const normalizedSummary = event.summary.replace(/[\u0000-\u001f\u007f]/gu, " ").trim();
  if (!normalizedSummary) return null;
  const truncated = normalizedSummary.length > 240;
  return helixEnvironmentMissionActivityProjectionSchema.parse({
    schema: HELIX_ENVIRONMENT_MISSION_ACTIVITY_PROJECTION_SCHEMA,
    surface: input.surface,
    activity_event_id: event.activity_event_id,
    projection_sequence: event.projection_sequence,
    run_id: scope.run_id,
    event_kind: event.event_kind,
    outcome: event.outcome,
    label: eventLabel(event),
    summary: truncated ? `${normalizedSummary.slice(0, 240)}…` : normalizedSummary,
    truncated,
    observed_at: event.observed_at,
    provenance: event.provenance,
    content_role: "mission_activity_not_assistant_answer",
    answer_authority: false,
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
    private_reasoning_included: false,
    action_authority_granted: false,
  });
}
