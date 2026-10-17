import {z} from 'zod';
const input=z.object({role:z.enum(['author_solution','author_averaging_kernels','published_row_mapping',
  'primary_operator','installed_runtime_declaration','parser_fixture_not_candidate','saved_context_archive']),
  file:z.string().min(1).max(500),bytes:z.number().int().nonnegative().max(100_000_000),
  sha256:z.string().regex(/^[a-f0-9]{64}$/)}).strict();
/** Imported audit declarations only: this neither reads files nor authenticates hashes. */
export const SolarComparisonInputInventory=z.object({schemaVersion:z.literal('solar-comparison-input-inventory/1'),
  inspectedAt:z.string().datetime(),inputs:z.array(input).length(7).refine(rows=>new Set(rows.map(row=>row.role)).size===7,'Duplicate input roles'),
  scope:z.string().min(1).max(1000),
  candidateBinding:z.null(),referenceBinding:z.null(),predictions:z.null(),residuals:z.null(),
  sourceIdentityAuthenticated:z.literal(false),scienceRunAllowed:z.literal(false),g1AdmissionAllowed:z.literal(false),
}).strip();
export type SolarComparisonInputInventoryView=z.infer<typeof SolarComparisonInputInventory>;
