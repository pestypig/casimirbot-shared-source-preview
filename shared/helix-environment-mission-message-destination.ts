import { z } from "zod";
import { hostedRoomTextMessageSchema } from "./hosted-room-text";
import { roomMissionOwnerSelectionSchema } from "./helix-room-mission-owner";

export const HELIX_ENVIRONMENT_MISSION_MESSAGE_CHOICE_SCHEMA =
  "helix.environment_mission_message_choice.v1" as const;
export const HELIX_ENVIRONMENT_MISSION_MESSAGE_PREFLIGHT_SCHEMA =
  "helix.environment_mission_message_preflight.v1" as const;

const ref = z.string().trim().min(1).max(320);

/** An explicit UI choice, never inferred from words in the room message. */
export const helixEnvironmentMissionMessageChoiceSchema = z.object({
  schema: z.literal(HELIX_ENVIRONMENT_MISSION_MESSAGE_CHOICE_SCHEMA),
  destination: z.enum(["room_discussion", "request_mission_steering"]),
  room_id: ref,
  message_id: ref,
  selected_by_participant_id: ref,
  selected_at: z.string().datetime({ offset: true }),
  expected_mission_id: ref.nullable(),
  expected_mission_revision: z.number().int().positive().nullable(),
  expected_reasoning_binding_id: ref.nullable(),
  expected_binding_epoch: z.number().int().positive().nullable(),
  raw_content_included: z.literal(false),
  dispatch_authority: z.literal(false),
}).strict().superRefine((choice, context) => {
  const expected = [choice.expected_mission_id, choice.expected_mission_revision,
    choice.expected_reasoning_binding_id, choice.expected_binding_epoch];
  if (expected.some(item => item === null) && expected.some(item => item !== null)) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["expected_mission_id"],
      message: "Expected mission and binding identity must be all present or all absent." });
  }
});

export const helixEnvironmentMissionMessagePreflightSchema = z.object({
  schema: z.literal(HELIX_ENVIRONMENT_MISSION_MESSAGE_PREFLIGHT_SCHEMA),
  status: z.enum(["discussion_only", "review_required", "rejected"]),
  reason: z.enum([
    "ordinary_room_discussion", "explicit_selection_requires_existing_handoff",
    "invalid_choice_or_message", "wrong_room_or_message", "wrong_participant",
    "stale_selection", "mission_unavailable", "mission_changed",
  ]),
  room_id: ref.nullable(),
  message_id: ref.nullable(),
  mission_id: ref.nullable(),
  mission_revision: z.number().int().positive().nullable(),
  reasoning_binding_id: ref.nullable(),
  binding_epoch: z.number().int().positive().nullable(),
  content_role: z.literal("room_message_routing_preflight_not_task_handoff"),
  raw_content_included: z.literal(false),
  task_handoff: z.literal(false),
  dispatch_authority: z.literal(false),
  action_authority_granted: z.literal(false),
  answer_authority: z.literal(false),
  assistant_answer: z.literal(false),
  terminal_eligible: z.literal(false),
}).strict();
export type HelixEnvironmentMissionMessagePreflight = z.infer<
  typeof helixEnvironmentMissionMessagePreflightSchema
>;

/**
 * Presentation/preflight only. The real room service must re-read membership,
 * consent, current mission and exact task before its existing handoff dispatch.
 */
export function preflightHelixEnvironmentMissionMessage(input: {
  choice: unknown;
  message: unknown;
  currentMission: unknown;
  authenticatedParticipantId: string;
  nowMs: number;
}): HelixEnvironmentMissionMessagePreflight {
  const result = (status: HelixEnvironmentMissionMessagePreflight["status"],
    reason: HelixEnvironmentMissionMessagePreflight["reason"],
    refs: Partial<Pick<HelixEnvironmentMissionMessagePreflight,
      "room_id" | "message_id" | "mission_id" | "mission_revision" |
      "reasoning_binding_id" | "binding_epoch">> = {}) =>
    helixEnvironmentMissionMessagePreflightSchema.parse({
      schema: HELIX_ENVIRONMENT_MISSION_MESSAGE_PREFLIGHT_SCHEMA,
      status, reason,
      room_id: refs.room_id ?? null, message_id: refs.message_id ?? null,
      mission_id: refs.mission_id ?? null, mission_revision: refs.mission_revision ?? null,
      reasoning_binding_id: refs.reasoning_binding_id ?? null,
      binding_epoch: refs.binding_epoch ?? null,
      content_role: "room_message_routing_preflight_not_task_handoff",
      raw_content_included: false, task_handoff: false, dispatch_authority: false,
      action_authority_granted: false, answer_authority: false,
      assistant_answer: false, terminal_eligible: false,
    });

  const choice = helixEnvironmentMissionMessageChoiceSchema.safeParse(input.choice);
  const message = hostedRoomTextMessageSchema.safeParse(input.message);
  if (!choice.success || !message.success || !Number.isFinite(input.nowMs)) {
    return result("rejected", "invalid_choice_or_message");
  }
  const selected = choice.data;
  const captured = message.data;
  if (selected.room_id !== captured.room_id || selected.message_id !== captured.message_id) {
    return result("rejected", "wrong_room_or_message");
  }
  if (selected.selected_by_participant_id !== input.authenticatedParticipantId) {
    return result("rejected", "wrong_participant");
  }
  const selectedAt = Date.parse(selected.selected_at);
  const createdAt = Date.parse(captured.created_at);
  if (selectedAt < createdAt || selectedAt - createdAt > 300_000 ||
      selectedAt > input.nowMs + 5_000 ||
      input.nowMs - selectedAt > 300_000) {
    return result("rejected", "stale_selection");
  }
  if (selected.destination === "room_discussion") {
    return result("discussion_only", "ordinary_room_discussion", {
      room_id: selected.room_id, message_id: selected.message_id,
    });
  }
  const mission = roomMissionOwnerSelectionSchema.safeParse(input.currentMission);
  if (!mission.success || mission.data.status !== "active" ||
      mission.data.room_id !== selected.room_id) {
    return result("rejected", "mission_unavailable");
  }
  const current = mission.data;
  if (selected.expected_mission_id !== current.mission_id ||
      selected.expected_mission_revision !== current.mission_revision ||
      selected.expected_reasoning_binding_id !== current.reasoning_binding_id ||
      selected.expected_binding_epoch !== current.binding_epoch) {
    return result("rejected", "mission_changed");
  }
  return result("review_required", "explicit_selection_requires_existing_handoff", {
    room_id: selected.room_id, message_id: selected.message_id,
    mission_id: current.mission_id, mission_revision: current.mission_revision,
    reasoning_binding_id: current.reasoning_binding_id,
    binding_epoch: current.binding_epoch,
  });
}
