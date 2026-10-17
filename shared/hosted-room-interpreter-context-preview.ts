import { z } from "zod";
import { ROOM_INTERPRETER_ROOM_ID_PATTERN } from "./room-interpreter-mcp";

const requestId = z.string().regex(/^room_interpreter_turn:[0-9a-f-]{36}$/iu);
const messageId = z.string().regex(/^room_message:[0-9a-f-]{36}$/iu);

/** Owner-only read of the frozen, currently released provider input. A later
 * claim and preflight still revalidate its hash; this receipt grants nothing. */
export const hostedRoomInterpreterContextPreviewSchema = z.object({
  schema: z.literal("helix.shared_live_room.interpreter_context_preview.v1"),
  api_version: z.literal("v1"), ok: z.literal(true),
  operation: z.literal("room.interpreter.context_preview"),
  room: z.object({ room_id: z.string().regex(ROOM_INTERPRETER_ROOM_ID_PATTERN) }).strict(),
  turn: z.object({
    request_id: requestId,
    interpreter_session_id: z.string().regex(/^room_interpreter:[0-9a-f-]{36}$/iu),
    generation: z.number().int().positive(),
    turn_ordinal: z.union([z.literal(1), z.literal(2)]).nullable(),
    usage_ceiling_turns: z.union([z.literal(1), z.literal(2)]),
    trigger_message_id: messageId,
    context_sha256: z.string().regex(/^[0-9a-f]{64}$/u),
    messages: z.array(z.object({ message_id: messageId,
      author_participant_id: z.string().regex(/^shared_realtime_participant:[0-9a-f-]{36}$/iu),
      author_role: z.enum(["owner", "participant"]).optional(),
      consent_revision: z.number().int().positive(),
      text: z.string().min(1).max(2000),
    }).strict()).min(1).max(10),
  }).strict(),
  context_current: z.literal(true), model_input: z.literal(false),
  provider_calls: z.literal(0), task_handoff: z.literal(false),
  reentry_required: z.literal(true), answer_authority: z.literal(false),
  assistant_answer: z.literal(false), terminal_eligible: z.literal(false),
  raw_content_included: z.literal(true),
}).strict().superRefine((value, ctx) => {
  if (!value.turn.messages.some(message => message.message_id === value.turn.trigger_message_id))
    ctx.addIssue({ code: "custom", message: "The trigger must appear in the preview." });
  if ((value.turn.turn_ordinal === null) !== (value.turn.usage_ceiling_turns === 1))
    ctx.addIssue({ code: "custom", message: "The preview profile must match its ceiling." });
});
