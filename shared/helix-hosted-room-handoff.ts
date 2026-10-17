import { z } from "zod";

export const hostedRoomHandoffClaimSchema = z.object({
  claim_ref: z.string().regex(/^room_handoff_claim:[0-9a-f-]{36}$/u),
  handoff_id: z.string().min(3).max(320),
  attachment_ref: z.string().regex(/^room_owner_attachment:[0-9a-f-]{36}$/u),
  attachment_revision: z.number().int().positive(),
  node_ref: z.string().regex(/^room_node:sha256:[a-f0-9]{64}$/u),
  transcript_text_hash: z.string().regex(/^sha256:[a-f0-9]{64}$/u),
  dispatch_digest: z.string().regex(/^[a-f0-9]{64}$/u),
  status: z.literal("claimed"),
  dispatch_authority: z.literal(false),
}).strict();
export type HostedRoomHandoffClaim = z.infer<typeof hostedRoomHandoffClaimSchema>;

const ref = z.string().min(3).max(320);
// Metadata from an admitted server capture, never model-authored attribution.
export const hostedRoomHandoffEvidenceSchema = z.object({
  handoff_id: ref,
  realtime_session_id: ref,
  runtime_id: ref,
  speaker_participant_id: ref,
  captured_at_ms: z.number().int().positive(),
  consent_version: z.number().int().positive(),
  consent_receipt_ref: ref,
  transcript_text_hash: z.string().regex(/^sha256:[a-f0-9]{64}$/u),
  transcript_text_char_count: z.number().int().min(1).max(4000),
}).strict();
export type HostedRoomHandoffEvidence = z.infer<typeof hostedRoomHandoffEvidenceSchema>;
