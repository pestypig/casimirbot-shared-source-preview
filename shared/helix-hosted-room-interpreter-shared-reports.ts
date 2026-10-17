import { z } from "zod";
import { helixSharedLiveRoomIdSchema } from "./contracts/helix-shared-live-room-agent.v1";

const hash = z.string().regex(/^[a-f0-9]{64}$/u);
const disclosureRef = z.string().regex(/^room_ai_task_disclosure:[a-f0-9]{32}$/u);
export const sharedInterpreterReportListRequestSchema = z.object({
  room_id: helixSharedLiveRoomIdSchema,
}).strict();
export const sharedInterpreterReportReadRequestSchema =
  sharedInterpreterReportListRequestSchema.extend({
    disclosure_ref: disclosureRef, result_sha256: hash,
  }).strict();
export const sharedInterpreterReportSummarySchema = z.object({
  disclosure_ref: disclosureRef,
  source_turn_request_id: z.string().regex(/^room_interpreter_turn:[0-9a-f-]{36}$/iu),
  result_sha256: hash, task_status: z.enum(["completed", "unable"]),
  created_at: z.string().datetime(),
  content_role: z.literal("untrusted_external_task_observation"),
}).strict();
const common = { api_version: z.literal("v1"), ok: z.literal(true),
  room: z.object({ room_id: helixSharedLiveRoomIdSchema }).strict(),
  reentry_required: z.literal(true), answer_authority: z.literal(false),
  assistant_answer: z.literal(false), terminal_eligible: z.literal(false) };
export const sharedInterpreterReportCatalogSchema = z.object({
  schema: z.literal("helix.shared_live_room.interpreter_report_catalog.v1"),
  operation: z.literal("room.interpreter_report.list"), ...common,
  reports: z.array(sharedInterpreterReportSummarySchema).max(20),
  has_more: z.boolean(), raw_content_included: z.literal(false),
}).strict();
export const sharedInterpreterReportObservationSchema = z.object({
  schema: z.literal("helix.shared_live_room.interpreter_report_observation.v1"),
  operation: z.literal("room.interpreter_report.read"), ...common,
  report: sharedInterpreterReportSummarySchema,
  result_text: z.string().trim().min(1).max(12_000),
  raw_content_included: z.literal(true),
}).strict();
export const nativeSharedInterpreterReportCatalogSchema = z.object({
  schema: z.literal("helix.native_shared_interpreter_report_catalog.v1"),
  authority: z.string().url(), receipt: sharedInterpreterReportCatalogSchema,
}).strict();
export const nativeSharedInterpreterReportObservationSchema = z.object({
  schema: z.literal("helix.native_shared_interpreter_report_observation.v1"),
  authority: z.string().url(), receipt: sharedInterpreterReportObservationSchema,
}).strict();
