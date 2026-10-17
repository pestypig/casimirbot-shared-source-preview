import { z } from "zod";
import { ROOM_INTERPRETER_ROOM_ID_PATTERN } from "./room-interpreter-mcp";

/** A current source for owner review, never an instruction or dispatch receipt. */
export const hostedRoomInterpreterProposalSourceSchema = z.object({
  schema: z.literal("helix.shared_live_room.interpreter_proposal_source.v1"),
  api_version: z.literal("v1"), ok: z.literal(true),
  operation: z.literal("room.interpreter.proposal_source"),
  room: z.object({ room_id: z.string().regex(ROOM_INTERPRETER_ROOM_ID_PATTERN) }).strict(),
  source: z.object({
    request_id: z.string().regex(/^room_interpreter_turn:[0-9a-f-]{36}$/iu),
    interpreter_session_id: z.string().regex(/^room_interpreter:[0-9a-f-]{36}$/iu),
    generation: z.number().int().positive(),
    context_sha256: z.string().regex(/^[a-f0-9]{64}$/u),
    trigger_message_id: z.string().regex(/^room_message:[0-9a-f-]{36}$/iu),
    trigger_author_participant_id: z.string().min(1).max(256),
    trigger_text: z.string().min(1).max(2000),
    reply_text: z.string().min(1).max(8000),
    result_sha256: z.string().regex(/^[a-f0-9]{64}$/u),
  }).strict(),
  source_current: z.literal(true), proposal_queued: z.literal(false),
  model_input: z.literal(false), provider_calls: z.literal(0),
  task_handoff: z.literal(false), reentry_required: z.literal(true),
  answer_authority: z.literal(false), assistant_answer: z.literal(false),
  terminal_eligible: z.literal(false), raw_content_included: z.literal(true),
}).strict();

/** Local owner review binds that source to one selected external task. */
export const nativeHostedRoomInterpreterProposalPreviewSchema = z.object({
  schema: z.literal("helix.native_hosted_room_interpreter_proposal_preview.v1"),
  room_id: z.string().regex(ROOM_INTERPRETER_ROOM_ID_PATTERN),
  authority: z.string().url(),
  selection_ref: z.string().min(3).max(320),
  selection_revision: z.number().int().positive(),
  task_label: z.string().min(1).max(320),
  source: hostedRoomInterpreterProposalSourceSchema,
  proposal_queued: z.literal(false), dispatch_authority: z.literal(false),
  answer_authority: z.literal(false), terminal_eligible: z.literal(false),
  raw_content_included: z.literal(true),
}).strict().superRefine((value, ctx) => {
  if (value.source.room.room_id !== value.room_id)
    ctx.addIssue({ code: "custom", message: "proposal_source_room_mismatch" });
});

export const nativeHostedRoomInterpreterProposalDispatchRequestSchema = z.object({
  room_id: z.string().regex(ROOM_INTERPRETER_ROOM_ID_PATTERN),
  selection_ref: z.string().min(3).max(320),
  selection_revision: z.number().int().positive(),
  turn_request_id: z.string().regex(/^room_interpreter_turn:[0-9a-f-]{36}$/iu),
  context_sha256: z.string().regex(/^[a-f0-9]{64}$/u),
  result_sha256: z.string().regex(/^[a-f0-9]{64}$/u),
  instruction_text: z.string().trim().min(1).max(4000),
  approve_task_handoff: z.literal(true),
}).strict();

export const nativeHostedRoomInterpreterProposalDispatchReceiptSchema = z.object({
  schema: z.literal("helix.native_hosted_room_interpreter_proposal_dispatch.v1"),
  ok: z.literal(true), dispatch_ref: z.string().min(3).max(320),
  steering_event_ref: z.string().min(3).max(320),
  status: z.literal("queued"), instruction_queued: z.literal(true),
  task_pickup_confirmed: z.literal(false), execution_authority: z.literal(false),
  answer_authority: z.literal(false), terminal_eligible: z.literal(false),
  raw_content_included: z.literal(false),
}).strict();
