import { z } from "zod";
import { helixSharedLiveRoomIdSchema } from "./contracts/helix-shared-live-room-agent.v1";
import { hostedRoomHandoffClaimSchema, hostedRoomHandoffEvidenceSchema } from "./helix-hosted-room-handoff";

export const hostedRoomResultDisclosureBodySchema = z.object({
  task_status: z.enum(["completed", "unable"]),
  result_text: z.string().trim().min(1).max(12000),
  result_sha256: z.string().regex(/^[a-f0-9]{64}$/u),
  share_with_room: z.literal(true),
}).strict();
export type HostedRoomResultDisclosureBody = z.infer<typeof hostedRoomResultDisclosureBodySchema>;

export const hostedRoomResultDisclosureReceiptSchema = z.object({
  schema: z.literal("helix.shared_live_room.result_disclosure.v1"), api_version: z.literal("v1"), ok: z.literal(true),
  operation: z.literal("room.owner_node.result_disclose"),
  room: z.object({ room_id: helixSharedLiveRoomIdSchema }).strict(),
  claim: hostedRoomHandoffClaimSchema, capture: hostedRoomHandoffEvidenceSchema,
  disclosure: z.object({
    disclosure_ref: z.string().regex(/^room_task_disclosure:[a-f0-9]{32}$/u),
    task_status: z.enum(["completed", "unable"]), result_sha256: z.string().regex(/^[a-f0-9]{64}$/u),
    created_at: z.string().datetime(), content_role: z.literal("untrusted_external_task_observation"),
  }).strict(),
  room_disclosure_recorded: z.literal(true), room_presentation_confirmed: z.literal(false),
  reentry_required: z.literal(true), answer_authority: z.literal(false), assistant_answer: z.literal(false),
  terminal_eligible: z.literal(false), raw_content_included: z.literal(false),
}).strict();
