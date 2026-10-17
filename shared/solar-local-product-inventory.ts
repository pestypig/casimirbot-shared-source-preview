import { z } from 'zod';

export const solarLocalProductInventorySchema = z.object({
  schemaVersion: z.literal('solar-local-product-inventory/1'),
  products: z.array(z.object({
    id: z.enum(['g1.author.cdif', 'g1.author.avker.bp04', 'mesa.solar_reference.parser_fixture', 'starsim.solar_product_registry']),
    relativePath: z.string().min(1).max(180).regex(/^(?:artifacts\/research|ops\/mesa|data\/starsim)\/[A-Za-z0-9_./-]+$/),
    role: z.enum(['observed_inversion_input', 'operator_kernel_input', 'parser_fixture', 'product_type_registry']),
    maturity: z.enum(['source_input', 'test_fixture', 'schema_only']),
    frozenSha256: z.string().regex(/^[a-f0-9]{64}$/).nullable(),
    bytes: z.number().int().min(0).max(8_000_000).nullable(),
    sha256: z.string().regex(/^[a-f0-9]{64}$/).nullable(),
    state: z.enum(['frozen_hash_matched', 'frozen_hash_mismatch', 'present_unfrozen', 'missing', 'unreadable']),
    comparisonUse: z.string().min(1).max(180),
    scientificAdmission: z.literal(false),
    scienceRunAllowed: z.literal(false),
  }).strict().superRefine((product, ctx) => {
    const matched = product.state === 'frozen_hash_matched';
    const mismatched = product.state === 'frozen_hash_mismatch';
    const unfrozen = product.state === 'present_unfrozen';
    const valid = matched ? product.frozenSha256 !== null && product.sha256 === product.frozenSha256 && product.bytes !== null :
      mismatched ? product.frozenSha256 !== null && product.sha256 !== null && product.sha256 !== product.frozenSha256 && product.bytes !== null :
      unfrozen ? product.frozenSha256 === null && product.sha256 !== null && product.bytes !== null :
      product.sha256 === null && product.bytes === null;
    if (!valid) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Local file state and hash disagree' });
  })).length(4),
  workspaceRootLocated: z.boolean(),
  localFilesOnly: z.literal(true),
  scientificAdmission: z.literal(false),
  scienceRunAllowed: z.literal(false),
}).strict();

export type SolarLocalProductInventory = z.infer<typeof solarLocalProductInventorySchema>;
