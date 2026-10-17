import { z } from "zod";
import { privateInstallPolicySchema } from "./environment-private-install";
import { HELIX_SYSTEM_CLOCK_READ_CAPABILITY } from "./helix-environment-connector";

// Private first-party server/native admission, not an external adapter contract.
export const PRIVATE_CLOCK_RUNTIME_POLICY_PATH = "/api/agi/environment-connectors/private/clock-runtime-policy";
export const PRIVATE_CLOCK_RUNTIME_REVISION = "g16a-private-clock-runtime-2026-09-26.1";
export const PRIVATE_CLOCK_RUNTIME_PROFILE = "casimirbot.clock.windows-lpac.v1";
export const PRIVATE_CLOCK_RUNTIME_POLICY_TTL_MS = 30000;
export const privateClockRuntimePolicySchema = privateInstallPolicySchema.omit({
  schema: true, policy_revision: true, install_allowed: true, runtime_allowed: true,
}).extend({
  schema: z.literal("casimirbot.private_clock_runtime_policy.v1"),
  policy_revision: z.literal(PRIVATE_CLOCK_RUNTIME_REVISION),
  issued_at: z.string().datetime(),
  runtime_profile: z.literal(PRIVATE_CLOCK_RUNTIME_PROFILE),
  capability_id: z.literal(HELIX_SYSTEM_CLOCK_READ_CAPABILITY),
  runtime_allowed: z.literal(true), hosted_required: z.literal(false), model_invoked: z.literal(false),
}).strict();
export type PrivateClockRuntimePolicy = z.infer<typeof privateClockRuntimePolicySchema>;
