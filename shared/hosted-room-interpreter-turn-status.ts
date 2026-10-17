import { z } from "zod";
import { ROOM_INTERPRETER_ROOM_ID_PATTERN } from "./room-interpreter-mcp";

export const hostedRoomInterpreterTurnStatusSchema = z.object({
  schema: z.literal("helix.room_interpreter_turn_status.v1"),
  request_id: z.string().regex(/^room_interpreter_turn:[0-9a-f-]{36}$/iu),
  room_id: z.string().regex(ROOM_INTERPRETER_ROOM_ID_PATTERN),
  interpreter_session_id: z.string().regex(/^room_interpreter:[0-9a-f-]{36}$/iu),
  generation: z.number().int().positive(),
  trigger_message_id: z.string().regex(/^room_message:[0-9a-f-]{36}$/iu),
  state: z.enum(["queued", "claimed", "cancelled", "completed", "failed"]),
  // Older hosted deployments omit this field. Their replies remain visible,
  // but cannot be interleaved with room text until the server supplies it.
  finished_at: z.string().datetime().nullable().optional(),
  reply: z.object({ content_role: z.literal("room_interpreter_reply"),
    text: z.string().min(1).max(8_000),
    result_sha256: z.string().regex(/^[a-f0-9]{64}$/u) }).strict().nullable(),
  failure_code: z.string().nullable(),
  mission_authority: z.literal(false), program_action: z.literal(false),
}).strict().superRefine((turn, ctx) => {
  if (turn.state === "completed" && (!turn.reply || turn.failure_code !== null))
    ctx.addIssue({ code: "custom", message: "A completed turn needs one reply." });
  if (turn.state === "failed" && (turn.reply !== null || !turn.failure_code))
    ctx.addIssue({ code: "custom", message: "A failed turn needs one failure code." });
  if (!["completed", "failed"].includes(turn.state) && (turn.reply !== null || turn.failure_code !== null))
    ctx.addIssue({ code: "custom", message: "A pending turn cannot have an outcome." });
});

export const hostedRoomInterpreterTurnListSchema = z.object({
  schema: z.literal("helix.shared_live_room.interpreter_turn_list.v1"),
  api_version: z.literal("v1"), ok: z.literal(true),
  operation: z.literal("room.interpreter.turn_list"),
  room: z.object({ room_id: z.string().regex(ROOM_INTERPRETER_ROOM_ID_PATTERN) }).strict(),
  turns: z.array(hostedRoomInterpreterTurnStatusSchema).max(20),
  model_input: z.literal(false), provider_calls: z.literal(0),
  task_handoff: z.literal(false), reentry_required: z.literal(true),
  answer_authority: z.literal(false), assistant_answer: z.literal(false),
  terminal_eligible: z.literal(false), raw_content_included: z.boolean(),
}).strict().superRefine((receipt, ctx) => {
  if (receipt.raw_content_included !== receipt.turns.some(turn => Boolean(turn.reply)))
    ctx.addIssue({ code: "custom", message: "The raw-content flag must match the turns." });
});
