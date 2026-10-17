import { z } from "zod";
import { HELIX_SYSTEM_CLOCK_READ_CAPABILITY, helixEnvironmentConnectorProbeRequestSchema,
  helixEnvironmentConnectorProbeResultSchema, type HelixEnvironmentConnectorProbeRequest } from "./helix-environment-connector";

export const privateClockReceiptSchema = z.object({ executionRef: z.string().regex(/^environment_execution:[a-f0-9-]{36}$/),
  epoch: z.number().int().nonnegative(), installationRef: z.string(), result: helixEnvironmentConnectorProbeResultSchema }).strict();
export const privateClockHistorySchema = z.discriminatedUnion("state", [
  z.object({ state: z.literal("accepted"), fresh: z.literal(false), receipt: privateClockReceiptSchema }).strict(),
  z.object({ state: z.literal("absent"), fresh: z.literal(false) }).strict(),
  z.object({ state: z.literal("uncertain"), fresh: z.literal(false) }).strict(),
]);
export const privateClockHistoryDiscoverySchema = z.discriminatedUnion("state", [
  z.object({ state: z.literal("empty"), fresh: z.literal(false), legacyRecords: z.number().int().min(0).max(1024) }).strict(),
  z.object({ state: z.literal("latest"), fresh: z.literal(false), legacyRecords: z.number().int().min(0).max(1024),
    request: helixEnvironmentConnectorProbeRequestSchema.extend({ capability_id: z.literal(HELIX_SYSTEM_CLOCK_READ_CAPABILITY),
      capability_version: z.literal(1), arguments: z.object({ clock: z.literal("monotonic") }).strict() }), history: privateClockHistorySchema }).strict(),
]);
export function checkPrivateClockReceipt(value: unknown, request: HelixEnvironmentConnectorProbeRequest, installationRef: string) {
  const receipt = privateClockReceiptSchema.parse(value), result = receipt.result;
  if (receipt.installationRef !== installationRef || result.probe_request_id !== request.probe_request_id ||
      result.capability_id !== HELIX_SYSTEM_CLOCK_READ_CAPABILITY || result.capability_version !== 1 ||
      result.outcome !== "succeeded" || !Number.isSafeInteger(result.result.uptime_ms) || Number(result.result.uptime_ms) < 0 ||
      Date.parse(result.created_at) < Date.parse(request.created_at) || Date.parse(result.created_at) > Date.parse(request.deadline_at))
    throw Error("clock_receipt_mismatch");
  return { uptimeMs: Number(result.result.uptime_ms), observedAt: result.created_at };
}
