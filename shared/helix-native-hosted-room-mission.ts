import { z } from "zod";
import { roomMissionTargetSchema } from "./helix-room-mission-owner";
import { helixSharedLiveRoomIdSchema } from "./contracts/helix-shared-live-room-agent.v1";

export const nativeHostedRoomSelectionSchema = z.object({
  room_id: helixSharedLiveRoomIdSchema,
  target: roomMissionTargetSchema,
  request_id: z.string().regex(/^[A-Za-z0-9:._-]{8,128}$/u),
  expected_local_revision: z.number().int().positive().nullable(),
  expected_remote_revision: z.number().int().positive().nullable(),
}).strict();
export type NativeHostedRoomSelection = z.infer<typeof nativeHostedRoomSelectionSchema>;

export const nativeHostedRoomAttachmentSchema = z.object({
  attachment_ref: z.string().regex(/^room_owner_attachment:[0-9a-f-]{36}$/u),
  revision: z.number().int().positive(),
  node_ref: z.string().regex(/^room_node:sha256:[a-f0-9]{64}$/u),
  status: z.literal("reserved"),
  expires_at: z.string().datetime(),
  local_task_verified: z.literal(false),
  dispatch_authority: z.literal(false),
}).strict();

export const nativeHostedRoomObservedAttachmentSchema = nativeHostedRoomAttachmentSchema.extend({
  status: z.enum(["reserved", "revoked"]),
});

export const nativeHostedRoomOptionsSchema = z.object({
  schema: z.literal("helix.native_hosted_room_options.v1"),
  room_id: helixSharedLiveRoomIdSchema,
  authority: z.string().url(),
  local_revision: z.number().int().positive().nullable(),
  local_status: z.enum(["pending", "selected"]).nullable(),
  attachment: nativeHostedRoomObservedAttachmentSchema.nullable(),
  candidate: roomMissionTargetSchema.nullable(),
  dispatch_authority: z.literal(false), answer_authority: z.literal(false),
  raw_content_included: z.literal(false),
}).strict();
export type NativeHostedRoomOptions = z.infer<typeof nativeHostedRoomOptionsSchema>;

// Private encrypted steering metadata, never a room or model projection.
export const nativeHostedSteeringAuthoritySchema = z.object({
  authority: z.string().url(),
  local_account_session_id: z.string().min(3).max(320),
  connection_ref: z.string().min(3).max(320),
  device_ref: z.string().regex(/^installation:[a-f0-9]{64}$/u),
  device_trust_revision: z.number().int().nonnegative(),
  attachment: nativeHostedRoomAttachmentSchema,
  transcript_text_char_count: z.number().int().min(1).max(4000),
}).strict();

export const NATIVE_HOSTED_ROOM_BASE_PATH = "/api/account/session/agent-connections/room-missions/hosted";
