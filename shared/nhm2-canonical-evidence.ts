import { z } from "zod";

export const nhm2CanonicalComponentSchema = z.object({
  id: z.string(),
  ref: z.string().nullable(),
  sha256: z.string().nullable(),
  contractVersion: z.string().nullable(),
  generatedAt: z.string().nullable(),
  status: z.enum(["present", "missing", "hash_mismatch", "not_provided"]),
}).strict();

export const nhm2CanonicalEvidenceSchema = z.object({
  schema: z.literal("nhm2_canonical_solve_evidence/v1"),
  status: z.enum(["available", "unavailable", "inconsistent"]),
  laneId: z.literal("nhm2_shift_lapse"),
  whitepaperRef: z.literal("docs/research/nhm2-current-status-whitepaper.md"),
  currentProgramRef: z.literal("docs/research/nhm2-spherical-boson-star-v2-work-program.md"),
  profile: z.object({
    id: z.string(),
    alphaCenterline: z.number(),
    clockingFormula: z.string(),
    generatedAt: z.string(),
  }).strict().nullable(),
  campaign: z.object({
    runId: z.string(),
    generatedAt: z.string(),
    campaignPass: z.boolean(),
    firstBlocker: z.string().nullable(),
    gates: z.record(z.string(), z.boolean()),
  }).strict().nullable(),
  components: z.array(nhm2CanonicalComponentSchema),
  claimLocks: z.object({
    physicalViabilityClaimAllowed: z.literal(false),
    transportClaimAllowed: z.literal(false),
    routeEtaClaimAllowed: z.literal(false),
    propulsionClaimAllowed: z.literal(false),
  }).strict(),
  limitations: z.array(z.string()),
  answerAuthority: z.literal(false),
}).strict();

export type Nhm2CanonicalEvidence = z.infer<typeof nhm2CanonicalEvidenceSchema>;

export const nhm2CanonicalComponentIdSchema = z.enum([
  "profile_frontier",
  "campaign",
  "profile_spec",
  "source_component_authority",
  "regional_full_tensor_residual",
  "observer_conditions",
  "qei_worldlines",
  "lean_campaign_certificate",
]);

export type Nhm2CanonicalComponentId = z.infer<typeof nhm2CanonicalComponentIdSchema>;

export const nhm2CanonicalMcpResponseSchema = nhm2CanonicalEvidenceSchema.extend({
  selectedComponent: z.object({
    id: nhm2CanonicalComponentIdSchema,
    ref: z.string(),
    sha256: z.string(),
    payload: z.record(z.string(), z.unknown()),
  }).strict().nullable(),
}).strict();
