import { z } from "zod";
import { ROOM_INTERPRETER_ROOM_ID_PATTERN } from "./room-interpreter-mcp";

export const hostedRoomInterpreterTurnRequestSchema = z.object({
  interpreter_session_id: z.string().regex(/^room_interpreter:[0-9a-f-]{36}$/iu),
  generation: z.number().int().positive(),
  trigger_message_id: z.string().regex(/^room_message:[0-9a-f-]{36}$/iu),
  client_request_id: z.string().regex(/^room-ai-turn:[0-9a-f-]{36}$/iu),
}).strict();

export const hostedRoomInterpreterTurnQueuedSchema = z.object({
  schema: z.literal("helix.shared_live_room.interpreter_turn_request.v1"),
  api_version: z.literal("v1"), ok: z.literal(true),
  operation: z.literal("room.interpreter.turn_request"),
  room: z.object({ room_id: z.string().regex(ROOM_INTERPRETER_ROOM_ID_PATTERN) }).strict(),
  turn: z.object({
    schema: z.literal("helix.room_interpreter_turn_request.v1"),
    request_id: z.string().regex(/^room_interpreter_turn:[0-9a-f-]{36}$/iu),
    room_id: z.string().regex(ROOM_INTERPRETER_ROOM_ID_PATTERN),
    interpreter_session_id: z.string().regex(/^room_interpreter:[0-9a-f-]{36}$/iu),
    generation: z.number().int().positive(),
    requested_by_participant_id: z.string().regex(/^shared_realtime_participant:[0-9a-f-]{36}$/iu),
    trigger_message_id: z.string().regex(/^room_message:[0-9a-f-]{36}$/iu),
    state: z.literal("queued"), created_at: z.string().datetime(),
    model_input: z.literal(false), provider_calls: z.literal(0),
  }).strict(),
  model_input: z.literal(false), provider_calls: z.literal(0),
  shared_ai_active: z.literal(false), reentry_required: z.literal(true),
  answer_authority: z.literal(false), assistant_answer: z.literal(false),
  terminal_eligible: z.literal(false), raw_content_included: z.literal(false),
}).strict();
