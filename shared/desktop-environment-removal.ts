import { z } from "zod";
const selection = z.object({ packageId: z.literal("com.casimirbot.system.clock"), version: z.string().min(1).max(80),
  artifactSha256: z.string().regex(/^[a-f0-9]{64}$/), installationRef: z.string().regex(/^environment_installation:[a-f0-9-]{36}$/) }).strict();
export const privateRemovalResultSchema = z.discriminatedUnion("status", [
  z.object({ status: z.literal("selected"), selection }).strict(),
  z.object({ status: z.literal("not_installed") }).strict(),
  z.object({ status: z.literal("cancelled") }).strict(),
  z.object({ status: z.literal("unavailable"), error: z.string().min(1).max(160) }).strict(),
  z.object({ status: z.literal("removed"), receipt: selection.omit({ version: true }).extend({
    schema: z.literal("casimirbot.environment_package_removal.v1"), selected: z.literal(false),
    codeFilesRemoved: z.boolean(), removedFileCount: z.number().int().nonnegative(),
    userDataPreserved: z.literal(true), observationHistoryPreserved: z.literal(true),
    cleanupError: z.literal("package_removal_cleanup_incomplete").optional(),
  }).strict() }).strict(),
]);
export type PrivateRemovalResult = z.infer<typeof privateRemovalResultSchema>;
