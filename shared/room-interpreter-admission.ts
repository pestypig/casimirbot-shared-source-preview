import { z } from "zod";
import { ROOM_INTERPRETER_ROOM_ID_PATTERN } from "./room-interpreter-mcp";

// The server must construct this from a configured generation and releases
// rechecked at dispatch. Parsing this shape alone does not grant admission.
export const roomInterpreterAdmittedTurnSchema = z.object({
  schema: z.literal("helix.room_interpreter_admitted_turn.v1"),
  room_id: z.string().regex(ROOM_INTERPRETER_ROOM_ID_PATTERN),
  interpreter_session_id: z.string().regex(/^room_interpreter:[0-9a-f-]{36}$/iu),
  generation: z.number().int().positive(),
  provider: z.literal("openai_agents_api"),
  credential_source: z.literal("host_native_profile"),
  expected_payer: z.literal("host_openai_project"),
  usage_ceiling_turns: z.literal(1),
  model_input: z.literal(true),
  trigger_message_id: z.string().regex(/^room_message:[0-9a-f-]{36}$/iu),
  messages: z.array(z.object({
    message_id: z.string().regex(/^room_message:[0-9a-f-]{36}$/iu),
    author_participant_id: z.string().regex(/^shared_realtime_participant:[0-9a-f-]{36}$/iu),
    author_role: z.enum(["owner", "participant"]).optional(),
    release_id: z.string().regex(/^room_text_release:[0-9a-f-]{36}$/iu),
    consent_revision: z.number().int().positive(),
    text: z.string().min(1).max(2000).refine(value => value.trim().length > 0),
  }).strict()).min(1).max(10),
}).strict();

export type RoomInterpreterAdmittedTurn = z.infer<typeof roomInterpreterAdmittedTurnSchema>;

const evaluationBase = roomInterpreterAdmittedTurnSchema.extend({
  schema: z.literal("helix.room_interpreter_admitted_turn.v2"),
  usage_ceiling_turns: z.literal(2),
});
export const roomInterpreterEvaluationTurnSchema = z.discriminatedUnion("turn_ordinal", [
  evaluationBase.extend({ turn_ordinal: z.literal(1), prior_reply: z.null() }),
  evaluationBase.extend({ turn_ordinal: z.literal(2), prior_reply: z.object({
    request_id: z.string().regex(/^room_interpreter_turn:[0-9a-f-]{36}$/iu),
    provider_session_id: z.string().regex(/^[A-Za-z0-9_-]{1,160}$/u),
    result_sha256: z.string().regex(/^[0-9a-f]{64}$/u),
  }).strict() }),
]);
export type RoomInterpreterEvaluationTurn = z.infer<typeof roomInterpreterEvaluationTurnSchema>;
