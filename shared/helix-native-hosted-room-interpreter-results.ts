import { z } from "zod";
import { helixSharedLiveRoomIdSchema } from "./contracts/helix-shared-live-room-agent.v1";
import { nativeHostedResultSummarySchema } from "./helix-native-hosted-room-results";
import { hostedRoomInterpreterResultDisclosureReceiptSchema } from
  "./helix-hosted-room-interpreter-result-disclosure";

const ref = z.string().trim().min(3).max(320);
const hash = z.string().regex(/^[a-f0-9]{64}$/u);
export const nativeHostedInterpreterResultCatalogRequestSchema = z.object({
  room_id: helixSharedLiveRoomIdSchema,
}).strict();
export const nativeHostedInterpreterResultReviewRequestSchema =
  nativeHostedInterpreterResultCatalogRequestSchema.extend({
    selection_ref: ref, selection_revision: z.number().int().positive(),
    steering_event_ref: ref, result_ref: ref, result_sha256: hash,
  }).strict();
export const nativeHostedInterpreterResultShareRequestSchema =
  nativeHostedInterpreterResultReviewRequestSchema.extend({
    share_with_room: z.literal(true),
  }).strict();
const context = {
  authority: z.string().url(), room_id: helixSharedLiveRoomIdSchema,
  selection_ref: ref, selection_revision: z.number().int().positive(),
  room_publication_attempted: z.literal(false), answer_authority: z.literal(false),
  terminal_eligible: z.literal(false),
};
export const nativeHostedInterpreterResultCatalogSchema = z.object({
  schema: z.literal("helix.native_hosted_room_interpreter_result_catalog.v1"),
  ...context, results: z.array(nativeHostedResultSummarySchema).max(20),
  has_more: z.boolean(), raw_content_included: z.literal(false),
}).strict().superRefine((value, ctx) => {
  if (new Set(value.results.map(row => row.result_ref)).size !== value.results.length ||
      new Set(value.results.map(row => row.steering_event_ref)).size !== value.results.length)
    ctx.addIssue({ code: "custom", message: "Duplicate interpreter task result" });
});
export const nativeHostedInterpreterResultPreviewSchema = z.object({
  schema: z.literal("helix.native_hosted_room_interpreter_result_preview.v1"),
  ...context, result: nativeHostedResultSummarySchema,
  source_turn_request_id: ref,
  result_text: z.string().trim().min(1).max(12_000),
  content_role: z.literal("untrusted_external_task_observation"),
  private_owner_review: z.literal(true), raw_content_included: z.literal(true),
}).strict();
export const nativeHostedInterpreterResultShareReceiptSchema = z.object({
  schema: z.literal("helix.native_hosted_room_interpreter_result_share.v1"),
  ...context, room_publication_attempted: z.literal(true),
  result: nativeHostedResultSummarySchema,
  disclosure: hostedRoomInterpreterResultDisclosureReceiptSchema.shape.disclosure,
  room_disclosure_recorded: z.literal(true),
  room_presentation_confirmed: z.literal(false),
  reentry_required: z.literal(true), assistant_answer: z.literal(false),
  raw_content_included: z.literal(false),
}).strict();
