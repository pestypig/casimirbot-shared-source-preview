import { z } from "zod";
import { helixSharedLiveRoomIdSchema } from "./contracts/helix-shared-live-room-agent.v1";
import { hostedRoomResultDisclosureReceiptSchema } from "./helix-hosted-room-result-disclosure";

const ref = z.string().trim().min(3).max(320).refine(value => !/[\r\n\t]/u.test(value));
const hash = z.string().regex(/^[a-f0-9]{64}$/u);
export const nativeHostedResultCatalogRequestSchema = z.object({ room_id: helixSharedLiveRoomIdSchema }).strict();
export const nativeHostedResultReviewRequestSchema = nativeHostedResultCatalogRequestSchema.extend({
  selection_ref: ref, selection_revision: z.number().int().positive(),
  steering_event_ref: ref, result_ref: ref, result_sha256: hash,
}).strict();
export const nativeHostedResultShareRequestSchema = nativeHostedResultReviewRequestSchema.extend({ share_with_room: z.literal(true) }).strict();
export const nativeHostedResultSummarySchema = z.object({
  result_ref: ref, steering_event_ref: ref, task_status: z.enum(["completed", "unable"]),
  result_sha256: hash, created_at: z.string().datetime(),
}).strict();
const context = {
  authority: z.string().url(), room_id: helixSharedLiveRoomIdSchema,
  selection_ref: ref, selection_revision: z.number().int().positive(),
  room_publication_attempted: z.literal(false), answer_authority: z.literal(false), terminal_eligible: z.literal(false),
};
export const nativeHostedResultCatalogSchema = z.object({
  schema: z.literal("helix.native_hosted_room_result_catalog.v1"), ...context,
  results: z.array(nativeHostedResultSummarySchema).max(20), has_more: z.boolean(), raw_content_included: z.literal(false),
}).strict().superRefine((value, ctx) => {
  if (new Set(value.results.map(row => row.result_ref)).size !== value.results.length ||
      new Set(value.results.map(row => row.steering_event_ref)).size !== value.results.length) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Duplicate result identity" });
  }
});
export const nativeHostedResultPreviewSchema = z.object({
  schema: z.literal("helix.native_hosted_room_result_preview.v1"), ...context,
  result: nativeHostedResultSummarySchema,
  result_text: z.string().trim().min(1).max(12000),
  content_role: z.literal("untrusted_external_task_observation"),
  private_owner_review: z.literal(true), raw_content_included: z.literal(true),
}).strict();
export type NativeHostedResultCatalog = z.infer<typeof nativeHostedResultCatalogSchema>;
export type NativeHostedResultPreview = z.infer<typeof nativeHostedResultPreviewSchema>;
export const nativeHostedResultShareReceiptSchema = z.object({
  schema: z.literal("helix.native_hosted_room_result_share.v1"), ...context,
  room_publication_attempted: z.literal(true), result: nativeHostedResultSummarySchema,
  disclosure: hostedRoomResultDisclosureReceiptSchema.shape.disclosure,
  room_disclosure_recorded: z.literal(true), room_presentation_confirmed: z.literal(false),
  reentry_required: z.literal(true), assistant_answer: z.literal(false), raw_content_included: z.literal(false),
}).strict();
