import { z } from "zod";

export const ENVIRONMENT_HOME_PANEL_ID = "environment-home";
export const privateEnvironmentStateSchema = z.object({
  schema: z.literal("casimirbot.private_environment_state.v1"),
  packageId: z.string().min(1).max(160), version: z.string().min(1).max(80),
  artifactSha256: z.string().regex(/^[a-f0-9]{64}$/),
  status: z.enum(["not_installed", "installed_stopped", "unavailable"]),
  installAvailable: z.boolean(), runtimeAvailable: z.literal(false),
  connected: z.literal(false), granted: z.literal(false),
  error: z.string().max(160).optional(), installationRef: z.string().max(160).optional(),
  cancelled: z.literal(true).optional(),
}).strict();
export type PrivateEnvironmentState = z.infer<typeof privateEnvironmentStateSchema>;

const safeLabel = z.string().min(1).max(320);
export const environmentHomePackageSchema = z.object({
  package_version_id: safeLabel, package_id: safeLabel, package_version: safeLabel,
  publisher_id: safeLabel, content_hash: safeLabel, lifecycle_status: safeLabel,
  installation_artifact: z.object({ version: safeLabel, archive_sha256: z.string().regex(/^[a-f0-9]{64}$/), review_revision: safeLabel }),
  install_available: z.boolean(), runtime_available: z.literal(false),
  provider_required: z.literal(false), subscription_required: z.literal(false),
  host_compatibility: z.array(z.string().max(160)).max(32),
  trust: z.object({ package_provenance: safeLabel, security_review: safeLabel }),
});
export const environmentHomeDirectorySchema = z.object({
  schema: z.literal("helix.environment_connector.private_directory.v1"),
  policy_revision: safeLabel, policy_expires_at: z.string().datetime(),
  packages: z.array(environmentHomePackageSchema).max(64), public_release: z.literal(false),
});
export type EnvironmentHomePackage = z.infer<typeof environmentHomePackageSchema>;

export function matchesEnvironmentHomeInstallation(record: EnvironmentHomePackage, state: PrivateEnvironmentState | null): boolean {
  return Boolean(state && record.package_id === state.packageId &&
    record.installation_artifact.version === state.version &&
    record.installation_artifact.archive_sha256 === state.artifactSha256);
}
