import { z } from "zod";

export const discordVoiceRenewalRequestSchema = z.object({
  request_id: z.string().regex(/^discord_voice_renewal:[0-9a-f-]{36}$/u),
  invitation_id: z.string().regex(/^discord_voice:[0-9a-f-]{36}$/u),
  requested_at: z.string().datetime(),
  expires_at: z.string().datetime(),
}).strict();

export const discordVoiceRenewalReceiptSchema = z.object({
  schema: z.literal("helix.discord_voice_renewal.v1"),
  operation: z.literal("room.discord_voice.renewal_inspect"),
  room: z.object({ room_id: z.string() }),
  request: discordVoiceRenewalRequestSchema.nullable(),
});

export const discordVoiceRenewalAckReceiptSchema = z.object({
  schema: z.literal("helix.discord_voice_renewal_ack.v1"),
  operation: z.literal("room.discord_voice.renewal_ack"),
  room: z.object({ room_id: z.string() }),
  request_id: discordVoiceRenewalRequestSchema.shape.request_id,
  acknowledged: z.boolean(),
});

export type DiscordVoiceRenewalRequest = z.infer<typeof discordVoiceRenewalRequestSchema>;
