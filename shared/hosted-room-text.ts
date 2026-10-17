import { z } from "zod";
import { ROOM_INTERPRETER_ROOM_ID_PATTERN } from "./room-interpreter-mcp";

const roomId = z.string().regex(ROOM_INTERPRETER_ROOM_ID_PATTERN);
export const hostedRoomTextSendRequestSchema = z.object({
  client_message_id: z.string().regex(/^room-text:[0-9a-f-]{36}$/iu),
  text: z.string().min(1).max(2000),
}).strict();

export const hostedRoomTextMessageSchema = z.object({
  message_id: z.string().regex(/^room_message:[0-9a-f-]{36}$/iu),
  room_id: roomId,
  author_participant_id: z.string().min(1).max(256),
  text: z.string().min(1).max(2000),
  created_at: z.string().datetime(),
  content_role: z.literal("room_member_text"),
  answer_authority: z.literal(false), assistant_answer: z.literal(false),
  terminal_eligible: z.literal(false),
}).strict();

const common = {
  api_version: z.literal("v1"), ok: z.literal(true),
  room: z.object({ room_id: roomId }).strict(),
  model_input: z.literal(false), task_handoff: z.literal(false),
  reentry_required: z.literal(true), answer_authority: z.literal(false),
  assistant_answer: z.literal(false), terminal_eligible: z.literal(false),
  raw_content_included: z.literal(true),
};

export const hostedRoomTextListSchema = z.object({
  ...common, schema: z.literal("helix.shared_live_room.text_list.v1"),
  operation: z.literal("room.text.list"),
  messages: z.array(hostedRoomTextMessageSchema).max(100),
}).strict();
export const hostedRoomTextSendSchema = z.object({
  ...common, schema: z.literal("helix.shared_live_room.text_send.v1"),
  operation: z.literal("room.text.send"),
  message: hostedRoomTextMessageSchema,
}).strict();

export type HostedRoomTextMessage = z.infer<typeof hostedRoomTextMessageSchema>;
