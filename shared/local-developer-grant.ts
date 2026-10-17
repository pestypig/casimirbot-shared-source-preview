import { z } from "zod";

// Portable documents contain only public keys, signed grants and revocations.
// They are not account credentials and are never accepted by the public site.
const ref = z.string().min(1).max(320).regex(/^[^\x00-\x1f\x7f]+$/);
const key = z.string().regex(/^[A-Za-z0-9_-]+$/).max(256);
const signature = z.string().regex(/^[A-Za-z0-9_-]{86}$/);
const time = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
export const LOCAL_DEVELOPER_MAX_LIFETIME_MS = 24 * 60 * 60 * 1000;
export const localDeveloperRequestPayloadSchema = z.object({
  schema: z.literal("casimir.local_developer_request.v1"),
  profileId: ref, deviceId: ref, publicKey: key,
  requestId: z.string().uuid(), issuedAt: time,
}).strict();
export const localDeveloperRequestSchema = z.object({
  payload: localDeveloperRequestPayloadSchema, signature,
}).strict();
export const localDeveloperGrantPayloadSchema = z.object({
  schema: z.literal("casimir.local_developer_grant.v1"),
  audience: z.literal("casimir.installed_local_developer"),
  scope: z.literal("local_developer"),
  grantId: z.string().uuid(), issuerId: z.string().regex(/^[a-f0-9]{64}$/),
  profileId: ref, deviceId: ref, publicKey: key,
  issuedAt: time, expiresAt: time,
}).strict();
export const localDeveloperGrantSchema = z.object({
  payload: localDeveloperGrantPayloadSchema, signature,
}).strict();
export const localDeveloperRevocationPayloadSchema = z.object({
  schema: z.literal("casimir.local_developer_revocations.v1"),
  issuerId: z.string().regex(/^[a-f0-9]{64}$/), epoch: time,
  issuedAt: time, expiresAt: time,
  revoked: z.array(z.string().uuid()).max(500),
}).strict();
export const localDeveloperBundleSchema = z.object({
  schema: z.literal("casimir.local_developer_usb.v1"),
  issuerPublicKey: key,
  grants: z.array(localDeveloperGrantSchema).min(1).max(100),
  revocations: z.object({ payload: localDeveloperRevocationPayloadSchema, signature }).strict(),
}).strict();
export type LocalDeveloperRequest = z.infer<typeof localDeveloperRequestSchema>;
export type LocalDeveloperGrant = z.infer<typeof localDeveloperGrantSchema>;
export type LocalDeveloperBundle = z.infer<typeof localDeveloperBundleSchema>;
export const localDeveloperLeasePayloadSchema = z.object({
  schema: z.literal("casimir.local_developer_native_lease.v1"),
  action: z.enum(["activate", "clear"]),
  sessionId: ref, profileId: ref, deviceId: ref,
  grantId: z.string().uuid(), issuedAt: time, expiresAt: time,
  nonce: z.string().uuid(),
}).strict();
export const localDeveloperLeaseSchema = z.object({
  payload: localDeveloperLeasePayloadSchema, signature,
}).strict();
export type LocalDeveloperLease = z.infer<typeof localDeveloperLeaseSchema>;
