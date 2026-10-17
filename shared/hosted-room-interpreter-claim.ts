import { z } from "zod";
import { ROOM_INTERPRETER_ROOM_ID_PATTERN } from "./room-interpreter-mcp";
import { roomInterpreterAdmittedTurnSchema } from "./room-interpreter-admission";

export const hostedRoomInterpreterClaimReceiptSchema = z.object({
  schema: z.literal("helix.shared_live_room.interpreter_turn_claim.v1"),
  api_version: z.literal("v1"), ok: z.literal(true),
  operation: z.literal("room.interpreter.turn_claim"),
  room: z.object({ room_id: z.string().regex(ROOM_INTERPRETER_ROOM_ID_PATTERN) }).strict(),
  claim: z.object({
    schema: z.literal("helix.hosted_room_interpreter_claimed_turn.v1"),
    request_id: z.string().regex(/^room_interpreter_turn:[0-9a-f-]{36}$/iu),
    lease_id: z.string().regex(/^room_interpreter_mcp_lease:[0-9a-f-]{36}$/iu),
    claim_expires_at: z.string().datetime(),
    turn: roomInterpreterAdmittedTurnSchema,
    provider_calls: z.literal(0),
  }).strict(),
  model_input: z.literal(false), provider_calls: z.literal(0),
  shared_ai_active: z.literal(false), task_handoff: z.literal(false),
  reentry_required: z.literal(true), answer_authority: z.literal(false),
  assistant_answer: z.literal(false), terminal_eligible: z.literal(false),
  raw_content_included: z.literal(true),
}).strict();
