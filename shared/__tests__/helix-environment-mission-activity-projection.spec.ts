import { describe, expect, it } from "vitest";
import {
  HELIX_OPERATOR_ACTIVITY_EVENT_SCHEMA,
  type HelixOperatorActivityEvent,
} from "../helix-operator-activity";
import {
  DEFAULT_HELIX_ENVIRONMENT_MISSION_ACTIVITY_POLICY,
  HELIX_ENVIRONMENT_MISSION_ACTIVITY_SCOPE_SCHEMA,
  helixEnvironmentMissionActivityPolicySchema,
  projectHelixEnvironmentMissionActivity,
  type HelixEnvironmentMissionActivityScope,
} from "../helix-environment-mission-activity-projection";

const nowMs = Date.parse("2026-09-30T15:00:02.000Z");
const scope: HelixEnvironmentMissionActivityScope = {
  schema: HELIX_ENVIRONMENT_MISSION_ACTIVITY_SCOPE_SCHEMA,
  profile_ref: "profile:owner",
  node_ref: "node:installed",
  run_id: "run:minecraft",
  room_ref: "room:party",
  environment_binding_ref: "environment:minecraft",
  source_ref: "source:fabric",
  world_ref: "world:arena",
};
const event = (overrides: Partial<HelixOperatorActivityEvent> = {}): HelixOperatorActivityEvent => ({
  schema: HELIX_OPERATOR_ACTIVITY_EVENT_SCHEMA,
  activity_event_id: "activity:checkpoint-3",
  projection_sequence: 3,
  source_kind: "environment_event",
  source_schema: "helix.environment.event.v1",
  source_event_ref: "environment_event:checkpoint-3",
  profile_ref: scope.profile_ref,
  node_ref: scope.node_ref,
  oauth_client_ref: null,
  client_session_ref: null,
  provider_thread_ref: null,
  provider_thread_epoch: null,
  run_id: scope.run_id,
  turn_id: null,
  capability_call_ref: null,
  environment_binding_ref: scope.environment_binding_ref,
  room_ref: scope.room_ref,
  source_ref: scope.source_ref,
  world_ref: scope.world_ref,
  workflow_ref: null,
  effect_lease_ref: null,
  terminal_product_ref: null,
  event_kind: "checkpoint",
  lifecycle_stage: "checkpoint_published",
  outcome: "succeeded",
  summary: "Reached the next admitted waypoint.",
  evidence_refs: ["observation:checkpoint-3"],
  occurred_at: "2026-09-30T15:00:00.000Z",
  observed_at: "2026-09-30T15:00:01.000Z",
  provenance: "measured",
  redaction_state: "sanitized",
  visibility: "profile",
  content_role: "operator_activity_not_assistant_answer",
  answer_authority: false,
  assistant_answer: false,
  terminal_eligible: false,
  raw_content_included: false,
  ...overrides,
});

const project = (overrides: Partial<Parameters<typeof projectHelixEnvironmentMissionActivity>[0]> = {}) =>
  projectHelixEnvironmentMissionActivity({
    event: event(), scope, policy: DEFAULT_HELIX_ENVIRONMENT_MISSION_ACTIVITY_POLICY,
    surface: "overlay", nowMs, ...overrides,
  });

describe("environment mission public activity projection", () => {
  it("reuses one canonical event and projects only a non-answer milestone", () => {
    expect(project()).toMatchObject({
      activity_event_id: "activity:checkpoint-3", projection_sequence: 3,
      surface: "overlay", label: "Checkpoint", summary: "Reached the next admitted waypoint.",
      provenance: "measured", answer_authority: false, assistant_answer: false,
      terminal_eligible: false, raw_content_included: false,
      private_reasoning_included: false, action_authority_granted: false,
    });
    expect(project({ event: event({ event_kind: "observation" }) })).toBeNull();
    expect(project({ policy: { ...DEFAULT_HELIX_ENVIRONMENT_MISSION_ACTIVITY_POLICY, overlay: "activity" },
      event: event({ event_kind: "observation" }) })).toMatchObject({ label: "Observation" });
  });

  it.each([
    ["profile", { profile_ref: "profile:other" }],
    ["node", { node_ref: "node:other" }],
    ["run", { run_id: "run:other" }],
    ["room", { room_ref: "room:other" }],
    ["environment", { environment_binding_ref: "environment:other" }],
    ["source", { source_ref: "source:other" }],
    ["world", { world_ref: "world:other" }],
  ])("rejects a %s identity mismatch", (_label, mismatch) => {
    expect(project({ event: event(mismatch) })).toBeNull();
  });

  it("fails closed on missing exact scope, stale/future or withheld evidence", () => {
    expect(project({ event: event({ world_ref: null }) })).toBeNull();
    expect(project({ event: event({ redaction_state: "withheld" }) })).toBeNull();
    expect(project({ event: event({ redaction_state: "redacted" }) })).toBeNull();
    expect(project({ nowMs: nowMs + 61_000 })).toBeNull();
    expect(project({ nowMs: nowMs - 7_000 })).toBeNull();
    expect(project({ event: { ...event(), credential: "not allowed" } })).toBeNull();
  });

  it("does not publish profile-only activity into a room or Minecraft chat", () => {
    expect(project({ surface: "room" })).toBeNull();
    expect(project({ surface: "environment_chat" })).toBeNull();
    expect(project({ surface: "room", event: event({ visibility: "room_grant" }) })).toBeNull();
    expect(project({ surface: "room", event: event({ visibility: "room_grant", outcome: "blocked" }) }))
      .toMatchObject({ surface: "room", label: "Needs attention" });
    expect(project({ surface: "room", scope: { ...scope, room_ref: null },
      event: event({ room_ref: null, visibility: "room_grant", outcome: "blocked" }) })).toBeNull();
  });

  it("requires an explicit publication level for routine room and game-chat milestones", () => {
    const roomEvent = event({ visibility: "room_grant" });
    const policy = { ...DEFAULT_HELIX_ENVIRONMENT_MISSION_ACTIVITY_POLICY,
      room: "milestones" as const, environment_chat: "milestones" as const };
    expect(project({ surface: "room", event: roomEvent, policy })).toMatchObject({ surface: "room" });
    expect(project({ surface: "environment_chat", event: roomEvent, policy }))
      .toMatchObject({ surface: "environment_chat" });
    expect(project({ surface: "room", event: event({ ...roomEvent, event_kind: "observation" }), policy })).toBeNull();
  });

  it("rejects any policy that claims reasoning visibility or steering/action authority", () => {
    for (const injection of [
      { private_reasoning_visible: true },
      { steering_authority_granted: true },
      { action_authority_granted: true },
      { raw_provider_transcript: "secret" },
    ]) {
      const unsafe = { ...DEFAULT_HELIX_ENVIRONMENT_MISSION_ACTIVITY_POLICY, ...injection };
      expect(helixEnvironmentMissionActivityPolicySchema.safeParse(unsafe).success).toBe(false);
      expect(project({ policy: unsafe })).toBeNull();
    }
  });

  it("compacts presentation text without turning source content into task instructions", () => {
    const result = project({ event: event({ summary: `Observed: ${"x".repeat(300)}\n` }) });
    expect(result?.summary.length).toBe(241);
    expect(result?.summary).not.toContain("\n");
    expect(result?.truncated).toBe(true);
    expect(result?.content_role).toBe("mission_activity_not_assistant_answer");
  });
});
