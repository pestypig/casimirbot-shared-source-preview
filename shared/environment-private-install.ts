import { z } from "zod";
import reviewedClock from "../apps/desktop/environment-packages/system-clock/reviewed-private.json";

// Private native/server build input, not an external connector contract or a
// renderer-supplied manifest. Changing these bytes requires a new review.
export const PRIVATE_CLOCK_INSTALL_REVIEW = reviewedClock;
export const PRIVATE_INSTALL_DIRECTORY_REVISION = "g16a-private-clock-2026-09-26.3";
export const PRIVATE_INSTALL_POLICY_PATH = "/api/agi/environment-connectors/private/install-policy";
export const PRIVATE_ENVIRONMENT_IDENTITY_PATH = "/api/account/session/private-environment-identity";
export const privateInstallPolicySchema = z.object({
  schema: z.literal("casimirbot.private_environment_install_policy.v1"),
  profile_id: z.string().min(1).max(320),
  device_id: z.string().regex(/^desktop_device_[A-Za-z0-9_-]{22}$/),
  session_ref: z.string().regex(/^[a-f0-9]{64}$/),
  policy_revision: z.string().min(1).max(160),
  expires_at: z.string().datetime(),
  artifact_sha256: z.literal(reviewedClock.archiveSha256),
  review_revision: z.literal(reviewedClock.policyRevision),
  install_allowed: z.literal(true), runtime_allowed: z.literal(false),
  credential_included: z.literal(false), public_release: z.literal(false),
}).strict();
export type PrivateInstallPolicy = z.infer<typeof privateInstallPolicySchema>;
