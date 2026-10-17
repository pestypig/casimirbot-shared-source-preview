import { z } from "zod";
import { helixSharedLiveRoomIdSchema } from "./contracts/helix-shared-live-room-agent.v1";
import { hostedRoomHandoffEvidenceSchema } from "./helix-hosted-room-handoff";
import { nativeHostedRoomAttachmentSchema } from "./helix-native-hosted-room-mission";

export const REVIEWED_ROOM_INSTRUCTION_TTL_MS = 10 * 60_000;

export const reviewedRoomInstructionRequestSchema = z.object({
  room_id: helixSharedLiveRoomIdSchema,
  attachment: nativeHostedRoomAttachmentSchema,
  capture: hostedRoomHandoffEvidenceSchema,
  instruction_text: z.string().min(1).max(4000),
  approve_transfer: z.literal(true),
}).strict();
const observation = {
  api_version: z.literal("v1"), ok: z.literal(true),
  room: z.object({ room_id: helixSharedLiveRoomIdSchema }).strict(),
  attachment: nativeHostedRoomAttachmentSchema,
  capture: hostedRoomHandoffEvidenceSchema,
  transfer_ref: z.string().uuid(), expires_at: z.string().datetime(),
  reentry_required: z.literal(true), answer_authority: z.literal(false),
  assistant_answer: z.literal(false), terminal_eligible: z.literal(false), dispatch_authority: z.literal(false),
};
export const reviewedRoomInstructionReceiptSchema = z.object({ ...observation,
  schema: z.literal("helix.shared_live_room.instruction_transfer.v1"),
  operation: z.literal("room.instruction.approve"), raw_content_included: z.literal(false),
}).strict();
export const reviewedRoomInstructionObservationSchema = z.object({ ...observation,
  schema: z.literal("helix.shared_live_room.instruction_observation.v1"),
  operation: z.literal("room.instruction.read"), raw_content_included: z.literal(true),
  instruction_text: z.string().min(1).max(4000),
}).strict();
export const reviewedRoomInstructionOptionsSchema = z.object({
  room_id: helixSharedLiveRoomIdSchema, attachment: nativeHostedRoomAttachmentSchema,
  captures: z.array(hostedRoomHandoffEvidenceSchema).max(20),
  raw_content_included: z.literal(false), dispatch_authority: z.literal(false),
}).strict();
export const nativeRoomInstructionCatalogSchema = z.object({
  room_id: helixSharedLiveRoomIdSchema, authority: z.string().url(),
  selection_ref: z.string().min(3).max(320), selection_revision: z.number().int().positive(),
  task_label: z.string().min(1).max(320),
  captures: z.array(hostedRoomHandoffEvidenceSchema).max(20),
  raw_content_included: z.literal(false), dispatch_authority: z.literal(false),
}).strict();
