import { z } from "zod";
import { ROOM_INTERPRETER_ROOM_ID_PATTERN } from "./room-interpreter-mcp";

export const hostedRoomInterpreterPreparationSchema = z.object({
  schema: z.literal("helix.shared_room_interpreter_preparation.v1"),
  interpreter_session_id: z.string().regex(/^room_interpreter:[0-9a-f-]{36}$/iu),
  room_id: z.string().regex(ROOM_INTERPRETER_ROOM_ID_PATTERN),
  generation: z.number().int().positive(),
  state: z.enum(["configuration_pending", "configured", "removed"]),
  provider: z.literal("openai_agents_api"),
  credential_source: z.enum(["unconfigured", "host_native_profile"]),
  expected_payer: z.enum(["host_openai_project_if_configured", "host_openai_project"]),
  usage_ceiling_turns: z.union([z.literal(0), z.literal(1), z.literal(2)]),
  evaluation_profile: z.literal("ar2_two_turn_text").optional(),
  shared_ai_active: z.literal(false), model_input: z.literal(false),
  provider_calls: z.literal(0), task_handoff: z.literal(false),
  created_at: z.string().datetime(), configured_at: z.string().datetime().nullable(),
  removed_at: z.string().datetime().nullable(),
}).strict();

export const hostedRoomInterpreterStatusSchema = z.object({
  schema: z.literal("helix.shared_live_room.interpreter_status.v1"),
  api_version: z.literal("v1"), ok: z.literal(true),
  operation: z.literal("room.interpreter.status"),
  room: z.object({ room_id: z.string().regex(ROOM_INTERPRETER_ROOM_ID_PATTERN) }).strict(),
  session: hostedRoomInterpreterPreparationSchema.nullable(),
  reentry_required: z.literal(true), answer_authority: z.literal(false),
  assistant_answer: z.literal(false), terminal_eligible: z.literal(false),
  raw_content_included: z.literal(false),
}).strict();

export type HostedRoomInterpreterStatus = z.infer<typeof hostedRoomInterpreterStatusSchema>;
