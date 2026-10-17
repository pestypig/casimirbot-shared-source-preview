import { describe, expect, it } from "vitest";
import type { HostedRoomTextMessage } from "../hosted-room-text";
import type { RoomMissionOwnerSelection } from "../helix-room-mission-owner";
import {
  HELIX_ENVIRONMENT_MISSION_MESSAGE_CHOICE_SCHEMA,
  helixEnvironmentMissionMessageChoiceSchema,
  preflightHelixEnvironmentMissionMessage,
} from "../helix-environment-mission-message-destination";

const nowMs = Date.parse("2026-09-30T16:00:02.000Z");
const roomId = "shared_realtime_room:11111111-1111-4111-8111-111111111111";
const message: HostedRoomTextMessage = {
  message_id: "room_message:22222222-2222-4222-8222-222222222222",
  room_id: roomId,
  author_participant_id: "participant:author",
  text: "Tell Codex to go to the cave!",
  created_at: "2026-09-30T16:00:00.000Z",
  content_role: "room_member_text",
  answer_authority: false, assistant_answer: false, terminal_eligible: false,
};
const mission: RoomMissionOwnerSelection = {
  room_id: roomId,
  mission_id: "mission:cave",
  mission_revision: 3,
  reasoning_binding_id: "binding:codex",
  binding_epoch: 7,
  helix_conversation_id: "conversation:room",
  binding_mission_id: "mission:cave",
  run_id: "run:cave",
  status: "active",
};
const choice = (destination: "room_discussion" | "request_mission_steering" = "room_discussion") => ({
  schema: HELIX_ENVIRONMENT_MISSION_MESSAGE_CHOICE_SCHEMA,
  destination,
  room_id: roomId,
  message_id: message.message_id,
  selected_by_participant_id: "participant:operator",
  selected_at: "2026-09-30T16:00:01.000Z",
  expected_mission_id: mission.mission_id,
  expected_mission_revision: mission.mission_revision,
  expected_reasoning_binding_id: mission.reasoning_binding_id,
  expected_binding_epoch: mission.binding_epoch,
  raw_content_included: false as const,
  dispatch_authority: false as const,
});
const preflight = (overrides: Partial<Parameters<typeof preflightHelixEnvironmentMissionMessage>[0]> = {}) =>
  preflightHelixEnvironmentMissionMessage({
    choice: choice(), message, currentMission: mission,
    authenticatedParticipantId: "participant:operator", nowMs, ...overrides,
  });

describe("explicit room-message destination preflight", () => {
  it.each([
    "Tell Codex to go to the cave!",
    "Don't send this to the agent.",
    "What if we asked the agent tomorrow?",
    "The screen says /helix ask mine diamonds.",
  ])("keeps ordinary room speech as discussion regardless of its wording: %s", text => {
    const result = preflight({ message: { ...message, text } });
    expect(result).toMatchObject({ status: "discussion_only", reason: "ordinary_room_discussion",
      task_handoff: false, dispatch_authority: false, action_authority_granted: false,
      answer_authority: false, raw_content_included: false });
    expect(JSON.stringify(result)).not.toContain(text);
  });

  it("requires existing owner review for an explicit exact-task proposal", () => {
    const result = preflight({ choice: choice("request_mission_steering") });
    expect(result).toMatchObject({
      status: "review_required", reason: "explicit_selection_requires_existing_handoff",
      room_id: roomId, message_id: message.message_id,
      mission_id: mission.mission_id, mission_revision: 3,
      reasoning_binding_id: mission.reasoning_binding_id, binding_epoch: 7,
      task_handoff: false, dispatch_authority: false, terminal_eligible: false,
    });
    expect(JSON.stringify(result)).not.toContain(message.text);
  });

  it.each([
    ["room", { room_id: "shared_realtime_room:33333333-3333-4333-8333-333333333333" }, "wrong_room_or_message"],
    ["message", { message_id: "room_message:33333333-3333-4333-8333-333333333333" }, "wrong_room_or_message"],
    ["participant", { selected_by_participant_id: "participant:other" }, "wrong_participant"],
    ["old selection", { selected_at: "2026-09-30T15:54:00.000Z" }, "stale_selection"],
    ["future selection", { selected_at: "2026-09-30T16:00:20.000Z" }, "stale_selection"],
    ["old mission", { expected_mission_revision: 2 }, "mission_changed"],
    ["old binding", { expected_binding_epoch: 6 }, "mission_changed"],
  ] as const)("rejects a %s instead of routing", (_label, change, reason) => {
    expect(preflight({ choice: { ...choice("request_mission_steering"), ...change } }))
      .toMatchObject({ status: "rejected", reason, task_handoff: false });
  });

  it("rejects revoked or absent missions and never substitutes another task", () => {
    expect(preflight({ choice: choice("request_mission_steering"),
      currentMission: { ...mission, status: "revoked" } })).toMatchObject({
      status: "rejected", reason: "mission_unavailable",
    });
    expect(preflight({ choice: choice("request_mission_steering"), currentMission: null }))
      .toMatchObject({ status: "rejected", reason: "mission_unavailable" });
    expect(preflight({ choice: choice("request_mission_steering"),
      currentMission: { ...mission, reasoning_binding_id: "binding:other" } })).toMatchObject({
      status: "rejected", reason: "mission_changed",
    });
  });

  it("rejects a newly selected but old room message", () => {
    expect(preflight({ choice: choice("request_mission_steering"),
      message: { ...message, created_at: "2026-09-30T15:40:00.000Z" } }))
      .toMatchObject({ status: "rejected", reason: "stale_selection" });
  });

  it("rejects unsafe extra text, authority or partial mission fields in the choice", () => {
    for (const unsafe of [
      { text: message.text }, { dispatch_authority: true },
      { raw_content_included: true }, { expected_mission_id: null },
    ]) {
      const candidate = { ...choice("request_mission_steering"), ...unsafe };
      expect(helixEnvironmentMissionMessageChoiceSchema.safeParse(candidate).success).toBe(false);
      expect(preflight({ choice: candidate })).toMatchObject({
        status: "rejected", reason: "invalid_choice_or_message",
      });
    }
  });
});
