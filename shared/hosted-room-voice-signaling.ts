import { z } from "zod";

const base = z.object({
  api_version: z.literal("v1"), ok: z.literal(true),
  room: z.object({ room_id: z.string().min(1) }),
  reentry_required: z.literal(true), answer_authority: z.literal(false),
  assistant_answer: z.literal(false), terminal_eligible: z.literal(false),
  audio_connected: z.literal(false), model_input: z.literal(false),
});

export const hostedRoomVoiceSignalRequestSchema = z.object({
  call_id: z.string().min(1).max(100),
  client_signal_id: z.string().uuid().optional(),
  target_participant_id: z.string().min(1).max(160),
  negotiation_id: z.string().min(1).max(160),
  kind: z.enum(["offer", "answer", "ice_candidate", "hangup"]),
  description: z.object({ type: z.enum(["offer", "answer"]),
    sdp: z.string().min(1).max(96_000) }).nullable().optional(),
  candidate: z.object({ candidate: z.string().min(1).max(8_000),
    sdpMid: z.string().nullable().optional(), sdpMLineIndex: z.number().int().nullable().optional(),
    usernameFragment: z.string().optional() }).nullable().optional(),
}).strict();

export const hostedRoomVoiceConsentSchema = base.extend({
  schema: z.literal("helix.hosted_room_voice_consent.v1"),
  operation: z.literal("room.voice.consent"),
  raw_content_included: z.literal(false),
  microphone_to_room: z.boolean(),
  consent_version: z.number().int().nonnegative(),
});

export const hostedRoomVoiceStateSchema = base.extend({
  schema: z.literal("helix.hosted_room_voice_signaling.v1"),
  operation: z.enum(["room.voice.inspect", "room.voice.admit", "room.voice.leave"]),
  raw_content_included: z.literal(false),
  call_id: z.string().nullable(),
  admissions: z.array(z.object({ participant_id: z.string(),
    admitted_at: z.string(), expires_at: z.string(),
    consent_version: z.number().int().nonnegative() })).max(3),
});

export const hostedRoomVoiceSignalReceiptSchema = base.extend({
  schema: z.literal("helix.hosted_room_voice_signal_receipt.v1"),
  operation: z.literal("room.voice.signal_publish"),
  raw_content_included: z.literal(false),
  call_id: z.string(), signal_id: z.string(),
});

export const hostedRoomVoiceSignalsSchema = base.extend({
  schema: z.literal("helix.hosted_room_voice_signals.v1"),
  operation: z.literal("room.voice.signals"),
  raw_content_included: z.literal(true),
  call_id: z.string(),
  signals: z.array(z.object({
    signal_id: z.string(), call_id: z.string(),
    sender_participant_id: z.string(), target_participant_id: z.string(),
    negotiation_id: z.string(), kind: z.enum(["offer", "answer", "ice_candidate", "hangup"]),
    description: z.object({ type: z.enum(["offer", "answer"]),
      sdp: z.string().min(1).max(96_000) }).nullable(),
    candidate: z.object({ candidate: z.string().min(1).max(8_000),
      sdpMid: z.string().nullable().optional(), sdpMLineIndex: z.number().int().nullable().optional(),
      usernameFragment: z.string().optional() }).nullable(),
    created_at: z.string(), expires_at: z.string(),
  })).max(128),
});
