import { z } from "zod";
import { ROOM_INTERPRETER_ROOM_ID_PATTERN } from "./room-interpreter-mcp";
import { roomInterpreterEvaluationTurnSchema } from "./room-interpreter-admission";
import { hostedRoomInterpreterPreparationSchema } from "./room-interpreter-hosted-status";

const roomId = z.string().regex(ROOM_INTERPRETER_ROOM_ID_PATTERN);
const requestId = z.string().regex(/^room_interpreter_turn:[0-9a-f-]{36}$/iu);
const leaseId = z.string().regex(/^room_interpreter_mcp_lease:[0-9a-f-]{36}$/iu);
const sessionId = z.string().regex(/^room_interpreter:[0-9a-f-]{36}$/iu);
const participantId = z.string().regex(/^shared_realtime_participant:[0-9a-f-]{36}$/iu);
const messageId = z.string().regex(/^room_message:[0-9a-f-]{36}$/iu);
const providerId = z.string().regex(/^[A-Za-z0-9_-]{1,160}$/u);
const resultHash = z.string().regex(/^[0-9a-f]{64}$/u);
const ordinal = z.union([z.literal(1), z.literal(2)]);
const room = z.object({ room_id: roomId }).strict();
const common = {
  api_version: z.literal("v1"), ok: z.literal(true), room,
  model_input: z.literal(false), provider_calls: z.literal(0),
  task_handoff: z.literal(false), reentry_required: z.literal(true),
  answer_authority: z.literal(false), assistant_answer: z.literal(false),
  terminal_eligible: z.literal(false),
};

const reservationBase = {
  interpreter_session_id: sessionId, generation: z.number().int().positive(),
  trigger_message_id: messageId,
  client_request_id: z.string().regex(/^room-ai-turn:[0-9a-f-]{36}$/iu),
};
export const hostedRoomInterpreterEvaluationRequestSchema = z.discriminatedUnion("turn_ordinal", [
  z.object({ ...reservationBase, turn_ordinal: z.literal(1) }).strict(),
  z.object({ ...reservationBase, turn_ordinal: z.literal(2),
    first_request_id: requestId }).strict(),
]);
export const hostedRoomInterpreterEvaluationQueuedReceiptSchema = z.object({
  ...common,
  schema: z.literal("helix.shared_live_room.interpreter_evaluation_request.v1"),
  operation: z.literal("room.interpreter.evaluation_request"),
  turn: z.object({
    schema: z.literal("helix.room_interpreter_evaluation_request.v1"),
    request_id: requestId, first_request_id: requestId.nullable(),
    room_id: roomId, interpreter_session_id: sessionId,
    generation: z.number().int().positive(), turn_ordinal: ordinal,
    requested_by_participant_id: participantId, trigger_message_id: messageId,
    state: z.literal("queued"), created_at: z.string().datetime(),
    model_input: z.literal(false), provider_calls: z.literal(0),
  }).strict(),
  shared_ai_active: z.literal(false), raw_content_included: z.literal(false),
}).strict().superRefine((receipt, ctx) => {
  if (receipt.turn.room_id !== receipt.room.room_id ||
      (receipt.turn.turn_ordinal === 1) !== (receipt.turn.first_request_id === null))
    ctx.addIssue({ code: "custom", message: "Queued evaluation turn must match room and ordinal." });
});

export const hostedRoomInterpreterEvaluationActivationReceiptSchema = z.object({
  ...common,
  schema: z.literal("helix.shared_live_room.interpreter_evaluation_activation.v1"),
  operation: z.literal("room.interpreter.evaluation_activate"),
  session: hostedRoomInterpreterPreparationSchema.extend({
    state: z.literal("configured"), usage_ceiling_turns: z.literal(2),
    evaluation_profile: z.literal("ar2_two_turn_text"),
  }),
  shared_ai_active: z.literal(false), raw_content_included: z.literal(false),
}).strict().superRefine((receipt, ctx) => {
  if (receipt.session.room_id !== receipt.room.room_id)
    ctx.addIssue({ code: "custom", message: "Activated session must belong to the room." });
});

export const hostedRoomInterpreterEvaluationClaimSchema = z.object({
  schema: z.literal("helix.hosted_room_interpreter_evaluation_claim.v1"),
  request_id: requestId, turn_ordinal: ordinal, lease_id: leaseId,
  claim_expires_at: z.string().datetime(),
  turn: roomInterpreterEvaluationTurnSchema, provider_calls: z.literal(0),
}).strict();

export const hostedRoomInterpreterEvaluationClaimReceiptSchema = z.object({
  ...common,
  schema: z.literal("helix.shared_live_room.interpreter_evaluation_claim.v1"),
  operation: z.literal("room.interpreter.evaluation_claim"),
  claim: hostedRoomInterpreterEvaluationClaimSchema,
  shared_ai_active: z.literal(false), raw_content_included: z.literal(true),
}).strict().superRefine((receipt, ctx) => {
  if (receipt.claim.turn_ordinal !== receipt.claim.turn.turn_ordinal ||
      receipt.claim.turn.room_id !== receipt.room.room_id)
    ctx.addIssue({ code: "custom", message: "Claim and admitted turn must match." });
});

export const hostedRoomInterpreterEvaluationPreflightSchema = z.object({
  schema: z.literal("helix.hosted_room_interpreter_evaluation_preflight.v1"),
  room_id: roomId, request_id: requestId, turn_ordinal: ordinal,
  lease_id: leaseId, claim_expires_at: z.string().datetime(),
  context_current: z.literal(true), model_input: z.literal(false),
  provider_calls: z.literal(0),
}).strict();

export const hostedRoomInterpreterEvaluationPreflightReceiptSchema = z.object({
  ...common,
  schema: z.literal("helix.shared_live_room.interpreter_evaluation_preflight.v1"),
  operation: z.literal("room.interpreter.evaluation_preflight"),
  preflight: hostedRoomInterpreterEvaluationPreflightSchema,
  shared_ai_active: z.literal(false), raw_content_included: z.literal(false),
}).strict();

const statusBase = {
  schema: z.literal("helix.room_interpreter_evaluation_status.v1"),
  request_id: requestId, first_request_id: requestId.nullable(),
  room_id: roomId, interpreter_session_id: sessionId,
  generation: z.number().int().positive(), turn_ordinal: ordinal,
  requested_by_participant_id: participantId, trigger_message_id: messageId,
  state: z.enum(["queued", "claimed", "cancelled", "completed", "failed"]),
  finished_at: z.string().datetime().nullable(),
  failure_code: z.string().nullable(),
  mission_authority: z.literal(false), program_action: z.literal(false),
};
const statusConsistency = (turn: { turn_ordinal: 1 | 2; first_request_id: string | null;
  state: string; reply: unknown; failure_code: string | null },
ctx: z.RefinementCtx) => {
  if ((turn.turn_ordinal === 1) !== (turn.first_request_id === null))
    ctx.addIssue({ code: "custom", message: "First-request linkage must match ordinal." });
  if (turn.state === "completed" && (!turn.reply || turn.failure_code !== null))
    ctx.addIssue({ code: "custom", message: "A completed turn needs one reply." });
  if (turn.state === "failed" && (turn.reply !== null || !turn.failure_code))
    ctx.addIssue({ code: "custom", message: "A failed turn needs one typed failure." });
  if (!["completed", "failed"].includes(turn.state) &&
      (turn.reply !== null || turn.failure_code !== null))
    ctx.addIssue({ code: "custom", message: "A pending turn cannot have an outcome." });
};

const ownerStatus = z.object({ ...statusBase,
  reply: z.object({ content_role: z.literal("room_interpreter_reply"),
    text: z.string().min(1).max(8_000), provider_session_id: providerId,
    result_sha256: resultHash }).strict().nullable(),
}).strict().superRefine(statusConsistency);
export const hostedRoomInterpreterEvaluationOwnerStatusSchema = ownerStatus;
const memberStatus = z.object({ ...statusBase,
  reply: z.object({ content_role: z.literal("room_interpreter_reply"),
    text: z.string().min(1).max(8_000), result_sha256: resultHash }).strict().nullable(),
}).strict().superRefine(statusConsistency);

export const hostedRoomInterpreterEvaluationOutcomeReceiptSchema = z.object({
  ...common,
  schema: z.literal("helix.shared_live_room.interpreter_evaluation_outcome.v1"),
  operation: z.literal("room.interpreter.evaluation_outcome"),
  turn: ownerStatus, shared_ai_active: z.literal(false),
  raw_content_included: z.boolean(),
}).strict().superRefine((receipt, ctx) => {
  if (receipt.turn.room_id !== receipt.room.room_id ||
      receipt.raw_content_included !== Boolean(receipt.turn.reply))
    ctx.addIssue({ code: "custom", message: "Outcome and room receipt must match." });
});

export const hostedRoomInterpreterEvaluationListReceiptSchema = z.object({
  ...common,
  schema: z.literal("helix.shared_live_room.interpreter_evaluation_list.v1"),
  operation: z.literal("room.interpreter.evaluation_list"),
  turns: z.array(memberStatus).max(40), raw_content_included: z.boolean(),
}).strict().superRefine((receipt, ctx) => {
  if (receipt.turns.some(turn => turn.room_id !== receipt.room.room_id) ||
      receipt.raw_content_included !== receipt.turns.some(turn => Boolean(turn.reply)))
    ctx.addIssue({ code: "custom", message: "Member history and room receipt must match." });
});
