import { z } from "zod";
import { ROOM_INTERPRETER_ROOM_ID_PATTERN } from "./room-interpreter-mcp";

const roomId = z.string().regex(ROOM_INTERPRETER_ROOM_ID_PATTERN);
const messageId = z.string().regex(/^room_message:[0-9a-f-]{36}$/iu);
const sessionId = z.string().regex(/^room_interpreter:[0-9a-f-]{36}$/iu);

export const hostedRoomTextReleaseRequestSchema = z.object({
  message_id: messageId,
  interpreter_session_id: sessionId,
  generation: z.number().int().positive(),
  action: z.enum(["release", "revoke"]),
}).strict();

export const hostedRoomTextReleaseSchema = z.object({
  schema: z.literal("helix.shared_room_text_release.v1"),
  release_id: z.string().regex(/^room_text_release:[0-9a-f-]{36}$/iu),
  room_id: roomId, message_id: messageId,
  author_participant_id: z.string().min(1).max(256),
  interpreter_session_id: sessionId,
  interpreter_generation: z.number().int().positive(),
  consent_revision: z.number().int().positive(),
  state: z.enum(["released", "revoked"]),
  released_at: z.string().datetime(), revoked_at: z.string().datetime().nullable(),
  model_input: z.literal(false), provider_calls: z.literal(0),
}).strict();

const common = {
  api_version: z.literal("v1"), ok: z.literal(true),
  room: z.object({ room_id: roomId }).strict(),
  model_input: z.literal(false), provider_calls: z.literal(0),
  task_handoff: z.literal(false), reentry_required: z.literal(true),
  answer_authority: z.literal(false), assistant_answer: z.literal(false),
  terminal_eligible: z.literal(false), raw_content_included: z.literal(false),
};
export const hostedRoomTextReleaseListSchema = z.object({
  ...common, schema: z.literal("helix.shared_live_room.text_release_list.v1"),
  operation: z.literal("room.text_release.list"),
  releases: z.array(hostedRoomTextReleaseSchema).max(100),
}).strict();
export const hostedRoomTextReleaseChangeSchema = z.object({
  ...common, schema: z.literal("helix.shared_live_room.text_release_change.v1"),
  operation: z.literal("room.text_release.change"),
  release: hostedRoomTextReleaseSchema,
}).strict();

export type HostedRoomTextRelease = z.infer<typeof hostedRoomTextReleaseSchema>;
