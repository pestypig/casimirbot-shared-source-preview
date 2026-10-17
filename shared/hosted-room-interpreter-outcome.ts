import { z } from "zod";
import { ROOM_INTERPRETER_ROOM_ID_PATTERN } from "./room-interpreter-mcp";

const turnStatus = z.object({
  schema: z.literal("helix.room_interpreter_turn_status.v1"),
  request_id: z.string().regex(/^room_interpreter_turn:[0-9a-f-]{36}$/iu),
  room_id: z.string().regex(ROOM_INTERPRETER_ROOM_ID_PATTERN),
  interpreter_session_id: z.string().regex(/^room_interpreter:[0-9a-f-]{36}$/iu),
  generation: z.number().int().positive(),
  trigger_message_id: z.string().regex(/^room_message:[0-9a-f-]{36}$/iu),
  state: z.enum(["completed", "failed"]),
  finished_at: z.string().datetime().nullable().optional(),
  reply: z.object({ content_role: z.literal("room_interpreter_reply"),
    text: z.string().min(1).max(8_000),
    provider_session_id: z.string().regex(/^[A-Za-z0-9_-]{1,160}$/u),
    result_sha256: z.string().regex(/^[a-f0-9]{64}$/u) }).strict().nullable(),
  failure_code: z.string().nullable(),
  mission_authority: z.literal(false), program_action: z.literal(false),
}).strict();

export const hostedRoomInterpreterOutcomeReceiptSchema = z.object({
  schema: z.literal("helix.shared_live_room.interpreter_turn_outcome.v1"),
  api_version: z.literal("v1"), ok: z.literal(true),
  operation: z.literal("room.interpreter.turn_outcome"),
  room: z.object({ room_id: z.string().regex(ROOM_INTERPRETER_ROOM_ID_PATTERN) }).strict(),
  turn: turnStatus,
  model_input: z.literal(false), provider_calls: z.literal(0),
  shared_ai_active: z.literal(false), task_handoff: z.literal(false),
  reentry_required: z.literal(true), answer_authority: z.literal(false),
  assistant_answer: z.literal(false), terminal_eligible: z.literal(false),
  raw_content_included: z.boolean(),
}).strict().superRefine((receipt, ctx) => {
  if (receipt.turn.state === "completed" && (!receipt.turn.reply || receipt.turn.failure_code !== null))
    ctx.addIssue({ code: "custom", message: "A completed turn needs one conversational reply." });
  if (receipt.turn.state === "failed" && (receipt.turn.reply !== null || !receipt.turn.failure_code))
    ctx.addIssue({ code: "custom", message: "A failed turn needs one typed failure." });
  if (receipt.raw_content_included !== Boolean(receipt.turn.reply))
    ctx.addIssue({ code: "custom", message: "The raw-content flag must match the reply." });
});
