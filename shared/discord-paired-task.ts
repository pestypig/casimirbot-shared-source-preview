import { z } from "zod";

export const discordPairedTaskIdSchema = z.string().regex(/^discord_task:[0-9a-f-]{36}$/i);
export const discordPairedTaskPromptSchema = z.string().trim().min(1).max(500);
export const discordPairedTaskAnswerSchema = z.string().trim().min(1).max(1000);

export const discordPairedTaskRequestSchema = z.object({
  request_id: discordPairedTaskIdSchema,
  room_id: z.string().regex(/^shared_realtime_room:[0-9a-f-]{36}$/i),
  prompt: discordPairedTaskPromptSchema,
  created_at: z.string().datetime(),
  expires_at: z.string().datetime(),
  status: z.enum(["queued", "claimed", "delivered", "failed", "expired"]),
  guild_id: z.string().regex(/^\d{15,22}$/),
  channel_id: z.string().regex(/^\d{15,22}$/),
  discord_user_id: z.string().regex(/^\d{15,22}$/),
}).strict();

export const discordPairedTaskListReceiptSchema = z.object({
  schema: z.literal("helix.discord_paired_task.list.v1"),
  api_version: z.literal("v1"),
  ok: z.literal(true),
  operation: z.literal("room.discord_task.list"),
  room: z.object({ room_id: z.string() }).strict(),
  requests: z.array(discordPairedTaskRequestSchema).max(20),
  reentry_required: z.literal(true),
  answer_authority: z.literal(false),
  assistant_answer: z.literal(false),
  terminal_eligible: z.literal(false),
  raw_content_included: z.literal(true),
}).strict();

export const discordPairedTaskSubmitRequestSchema = z.object({
  request_id: discordPairedTaskIdSchema,
  answer: discordPairedTaskAnswerSchema,
  node_proof: z.object({
    operation: z.literal("inspect"),
    room_id: z.string().regex(/^shared_realtime_room:[0-9a-f-]{36}$/i),
    expected_revision: z.number().int().positive(),
    request_id: z.string().regex(/^discord-answer:[a-f0-9]{64}$/),
    node_public_key: z.string().regex(/^[A-Za-z0-9_-]{59}$/),
    issued_at_ms: z.number().int().positive(),
    signature: z.string().regex(/^[A-Za-z0-9_-]{86}$/),
  }).strict(),
}).strict();

export const discordPairedTaskSubmitReceiptSchema = z.object({
  schema: z.literal("helix.discord_paired_task.submit.v1"),
  api_version: z.literal("v1"),
  ok: z.literal(true),
  operation: z.literal("room.discord_task.submit"),
  room: z.object({ room_id: z.string() }).strict(),
  request_id: discordPairedTaskIdSchema,
  delivery_status: z.enum(["delivered", "failed", "uncertain"]),
  discord_message_id: z.string().regex(/^\d{15,22}$/).nullable(),
  reentry_required: z.literal(true),
  answer_authority: z.literal(false),
  assistant_answer: z.literal(false),
  terminal_eligible: z.literal(false),
  raw_content_included: z.literal(false),
}).strict();
