import { z } from "zod";

export const privateClockPermissionStateSchema = z.object({
  schema: z.literal("casimirbot.private_clock_mcp_permission.v1"),
  allowed: z.boolean(), transportReady: z.boolean(),
  installationRef: z.string().nullable(), clientRef: z.string().nullable(), expiresAt: z.string().datetime().nullable(),
}).strict();
export type PrivateClockPermissionState = z.infer<typeof privateClockPermissionStateSchema>;
