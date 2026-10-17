import { z } from 'zod';

const finite = z.number().finite();
const evidence = z.object({
  id: z.string().min(1).max(160),
  sha256: z.string().regex(/^[a-f0-9]{64}$/),
  kind: z.enum(['author_data', 'model_artifact', 'fixture']),
  provenance: z.literal('declared_source_identity'),
}).strict();

/** Replay contract for the existing BiSON primary-term diagnostic, not a fit gate. */
export const SolarPrimaryComparisonRecordSchema = z.object({
  schemaVersion: z.literal('solar-primary-comparison-record/1'),
  createdAt: z.string().datetime(),
  operator: z.literal('g1-bison13-sound-speed-primary-operator/1'),
  operatorSha256: z.string().regex(/^[a-f0-9]{64}$/),
  observation: evidence,
  kernels: evidence,
  modelDifference: evidence.nullable(),
  fixtureOnly: z.boolean(),
  quantity: z.literal('delta_c_squared_over_bp04_c_squared'),
  units: z.literal('dimensionless'),
  referenceRadiusM: z.literal(695980000),
  coordinate: z.literal('r_over_historical_bp04_radius'),
  fullKernelSupport: z.tuple([finite.nonnegative(), finite.positive()]),
  uncertainty: z.literal('quoted_solution_error_only_no_covariance_or_systematics'),
  residualConvention: z.literal('observed_minus_primary_term'),
  crossTermIncluded: z.literal(false),
  referenceProfileBound: z.literal(false),
  admissionAllowed: z.literal(false),
  scienceRunAllowed: z.literal(false),
  rows: z.array(z.object({
    authorRow: z.number().int().min(1).max(76),
    secondQuartileRadius: finite.nonnegative(),
    observed: finite,
    quotedSolutionError: finite.positive(),
    primaryPrediction: finite.nullable(),
    residual: finite.nullable(),
  }).strict()).min(1).max(76),
}).strict().superRefine((record, ctx) => {
  const fail = (message: string) => ctx.addIssue({ code: z.ZodIssueCode.custom, message });
  const [low, high] = record.fullKernelSupport;
  if (low >= high) fail('Kernel support must be ordered');
  const sources = [record.observation, record.kernels, record.modelDifference].filter(Boolean);
  if (record.fixtureOnly !== sources.some(source => source!.kind === 'fixture'))
    fail('Fixture status must match all input roles');
  if (new Set(sources.map(source => source!.id)).size !== sources.length)
    fail('Evidence identities must be distinct');
  if (record.observation.kind === 'model_artifact' || record.kernels.kind === 'model_artifact' ||
      record.modelDifference?.kind === 'author_data') fail('Evidence role mismatch');
  const seen = new Set<number>();
  for (const row of record.rows) {
    if (seen.has(row.authorRow)) fail('Duplicate author row');
    seen.add(row.authorRow);
    if (row.secondQuartileRadius < low || row.secondQuartileRadius > high)
      fail('Localization outside kernel support');
    if (!record.modelDifference) {
      if (row.primaryPrediction !== null || row.residual !== null)
        fail('Absent model cannot have predictions or residuals');
    } else {
      if (row.primaryPrediction === null || row.residual === null) {
        fail('Model comparison requires prediction and residual');
      } else {
        const expected = row.observed - row.primaryPrediction;
        // Scale roundoff to the actual operands, not an arbitrary unit-sized floor.
        // A fixed 1e-12 tolerance could silently erase a small nonzero diagnostic.
        const scale = Math.max(Math.abs(row.observed), Math.abs(row.primaryPrediction),
          Math.abs(expected), Math.abs(row.residual));
        const tolerance = 8 * Number.EPSILON * scale;
        if (!Number.isFinite(expected) || Math.abs(expected - row.residual) >
            tolerance) fail('Inconsistent or overflowing residual');
      }
    }
  }
});

export type SolarPrimaryComparisonRecord = z.infer<typeof SolarPrimaryComparisonRecordSchema>;
