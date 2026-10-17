import { z } from "zod";
import { helixSharedLiveRoomIdSchema } from "./contracts/helix-shared-live-room-agent.v1";

const hash = z.string().regex(/^[a-f0-9]{64}$/u);
const ref = z.string().min(3).max(320);
export const hostedRoomInterpreterResultAuthorizationSchema = z.object({
  schema: z.literal("helix.room_owner_interpreter_result_authorization.v1"),
  room_id: helixSharedLiveRoomIdSchema,
  turn_request_id: z.string().regex(/^room_interpreter_turn:[0-9a-f-]{36}$/iu),
  context_sha256: hash, source_result_sha256: hash,
  attachment_revision: z.number().int().positive(),
  node_public_key: z.string().regex(/^[A-Za-z0-9_-]{59}$/u),
  request_id: z.string().regex(/^[A-Za-z0-9:._-]{8,128}$/u),
  issued_at_ms: z.number().int().positive(),
}).strict();
export const hostedRoomInterpreterResultReportSchema = z.object({
  task_status: z.enum(["completed", "unable"]),
  result_text: z.string().trim().min(1).max(12_000), result_sha256: hash,
  share_with_room: z.literal(true),
}).strict();
export const hostedRoomInterpreterResultDisclosureRequestSchema = z.object({
  authorization: hostedRoomInterpreterResultAuthorizationSchema,
  report: hostedRoomInterpreterResultReportSchema,
  signature: z.string().regex(/^[A-Za-z0-9_-]{86}$/u),
}).strict();
export const hostedRoomInterpreterResultDisclosureReceiptSchema = z.object({
  schema: z.literal("helix.shared_live_room.interpreter_result_disclosure.v1"),
  api_version: z.literal("v1"), ok: z.literal(true),
  operation: z.literal("room.owner_node.interpreter_result_disclose"),
  room: z.object({ room_id: helixSharedLiveRoomIdSchema }).strict(),
  source: z.object({ turn_request_id: ref, context_sha256: hash,
    source_result_sha256: hash }).strict(),
  disclosure: z.object({ disclosure_ref: z.string().regex(/^room_ai_task_disclosure:[a-f0-9]{32}$/u),
    task_status: z.enum(["completed", "unable"]), result_sha256: hash,
    created_at: z.string().datetime(),
    content_role: z.literal("untrusted_external_task_observation") }).strict(),
  room_disclosure_recorded: z.literal(true), room_presentation_confirmed: z.literal(false),
  reentry_required: z.literal(true), answer_authority: z.literal(false),
  assistant_answer: z.literal(false), terminal_eligible: z.literal(false),
  raw_content_included: z.literal(false),
}).strict();
