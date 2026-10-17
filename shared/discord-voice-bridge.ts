import { z } from "zod";

// The worker validates the signed ticket against its own clock. The desktop
// only checks that the returned expiry is plausible; workstation clocks can
// differ from the site and worker by more than a few seconds.
export const DISCORD_VOICE_BRIDGE_TICKET_TTL_MS = 30_000;
export const DISCORD_VOICE_BRIDGE_CLOCK_SKEW_MS = 60_000;

export function plausibleDiscordVoiceBridgeTicketExpiry(expiresAt: string, now = Date.now()): boolean {
  const remaining = Date.parse(expiresAt) - now;
  return Number.isFinite(remaining) && remaining > -DISCORD_VOICE_BRIDGE_CLOCK_SKEW_MS &&
    remaining <= DISCORD_VOICE_BRIDGE_TICKET_TTL_MS + DISCORD_VOICE_BRIDGE_CLOCK_SKEW_MS;
}

export const discordVoiceBridgeTicketReceiptSchema = z.object({
  schema: z.literal("helix.discord_voice_bridge_ticket.v1"),
  api_version: z.literal("v1"),
  ok: z.literal(true),
  operation: z.literal("room.discord_voice.bridge_ticket"),
  room: z.object({ room_id: z.string().regex(/^shared_realtime_room:[0-9a-f-]{36}$/iu) }),
  reentry_required: z.literal(true),
  answer_authority: z.literal(false),
  assistant_answer: z.literal(false),
  terminal_eligible: z.literal(false),
  audio_connected: z.literal(false),
  model_input: z.literal(false),
  raw_content_included: z.literal(false),
  invitation_id: z.string().regex(/^discord_voice:[0-9a-f-]{36}$/iu),
  websocket_url: z.string().url().regex(/^wss:\/\//u),
  ticket: z.string().regex(/^[A-Za-z0-9_-]{120,1400}\.[A-Za-z0-9_-]{43}$/u),
  expires_at: z.string().datetime(),
}).strict();

export type DiscordVoiceBridgeTicketReceipt = z.infer<typeof discordVoiceBridgeTicketReceiptSchema>;
