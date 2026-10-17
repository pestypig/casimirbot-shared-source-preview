import { z } from "zod";
import { helixSharedLiveRoomIdSchema } from "./contracts/helix-shared-live-room-agent.v1";
import { hostedRoomResultDisclosureReceiptSchema } from "./helix-hosted-room-result-disclosure";

export const sharedRoomReportSummarySchema = hostedRoomResultDisclosureReceiptSchema.shape.disclosure;
export const sharedRoomReportListRequestSchema = z.object({ room_id: helixSharedLiveRoomIdSchema }).strict();
export const sharedRoomReportReadRequestSchema = sharedRoomReportListRequestSchema.extend({
  disclosure_ref: sharedRoomReportSummarySchema.shape.disclosure_ref,
  result_sha256: sharedRoomReportSummarySchema.shape.result_sha256,
}).strict();
export const sharedRoomReportExplanationSelectionSchema = sharedRoomReportReadRequestSchema.extend({
  source: z.literal("hosted_approved_report"),
  request_id: z.string().trim().min(3).max(320).refine(value => !/[\r\n\t]/u.test(value)),
  share_with_room: z.literal(true),
}).strict();
const common = {
  api_version: z.literal("v1"), ok: z.literal(true), room: z.object({ room_id: helixSharedLiveRoomIdSchema }).strict(),
  reentry_required: z.literal(true), answer_authority: z.literal(false), assistant_answer: z.literal(false), terminal_eligible: z.literal(false),
};
export const sharedRoomReportCatalogSchema = z.object({
  schema: z.literal("helix.shared_live_room.report_catalog.v1"), operation: z.literal("room.report.list"), ...common,
  reports: z.array(sharedRoomReportSummarySchema).max(20), has_more: z.boolean(), raw_content_included: z.literal(false),
}).strict().superRefine((value, ctx) => {
  if (new Set(value.reports.map(row => row.disclosure_ref)).size !== value.reports.length) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Duplicate report identity" });
  }
});
export const sharedRoomReportObservationSchema = z.object({
  schema: z.literal("helix.shared_live_room.report_observation.v1"), operation: z.literal("room.report.read"), ...common,
  report: sharedRoomReportSummarySchema, result_text: z.string().trim().min(1).max(12000), raw_content_included: z.literal(true),
}).strict();

export const nativeSharedRoomReportCatalogSchema = z.object({
  schema: z.literal("helix.native_shared_room_report_catalog.v1"), authority: z.string().url(),
  receipt: sharedRoomReportCatalogSchema,
}).strict();
export const nativeSharedRoomReportObservationSchema = z.object({
  schema: z.literal("helix.native_shared_room_report_observation.v1"), authority: z.string().url(),
  receipt: sharedRoomReportObservationSchema,
}).strict();
