import { z } from 'zod';

export const solarMagneticArchiveDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
export const solarMagneticArchiveQuerySchema = z.object({ dateUtc: solarMagneticArchiveDateSchema }).strict();

const provider = z.enum(['nso_gong', 'lmsal_sdo']);
const status = z.enum(['available', 'no_product_at_path', 'unavailable']);
export const solarMagneticArchiveSearchSchema = z.object({
  schemaVersion: z.literal('solar-magnetic-archive-search/1'),
  dateUtc: solarMagneticArchiveDateSchema,
  checkedAtUtc: z.string().datetime(),
  providers: z.array(z.object({
    provider, status,
    catalogUrl: z.string().url(),
    providerInformationUrl: z.string().url(),
    rightsStatus: z.literal('provider_terms_not_evaluated'),
    reason: z.enum(['none', 'http_not_found', 'http_error', 'transport_error', 'malformed_catalog']),
  }).strict()).length(2),
  products: z.array(z.object({
    provider,
    providerRecordKey: z.string().min(1).max(120),
    kind: z.enum(['derived_global_radial_map', 'measured_visible_disk_los']),
    sourceUrl: z.string().url(),
    filename: z.string().min(1).max(120),
    filenameTimeHintUtc: z.string().datetime().nullable(),
    observedAtUtc: z.null(),
    upstreamModifiedAt: z.string().nullable(),
    byteSize: z.number().int().nonnegative().nullable(),
    contentSha256: z.null(),
    qualityStatus: z.literal('not_inspected'),
    acquisitionState: z.literal('not_downloaded'),
  }).strict()).max(25),
  truncated: z.boolean(),
  sourceIdentityAuthenticated: z.literal(false),
  scientificAdmission: z.literal(false),
  claimCeiling: z.literal('catalog_discovery_only_not_measured_global_field_or_validated_model'),
}).strict();

export type SolarMagneticArchiveSearch = z.infer<typeof solarMagneticArchiveSearchSchema>;

export const solarMagneticArchiveAcquisitionQuerySchema=z.object({
  dateUtc:solarMagneticArchiveDateSchema,
  provider,
  providerRecordKey:z.string().min(1).max(120),
}).strict();

export const solarMagneticArchiveAcquisitionReceiptSchema=z.object({
  schemaVersion:z.literal('solar-magnetic-archive-acquisition/1'),
  acquisitionId:z.string().regex(/^magnetic-acquisition:[a-f0-9]{64}$/),
  dateUtc:solarMagneticArchiveDateSchema,provider,providerRecordKey:z.string().min(1).max(120),
  kind:z.enum(['derived_global_radial_map','measured_visible_disk_los']),
  sourceUrl:z.string().url(),retrievedAtUtc:z.string().datetime(),
  sha256:z.string().regex(/^[a-f0-9]{64}$/),bytes:z.number().int().positive(),
  upstreamModifiedAt:z.string().nullable(),
  observedAtUtc:z.string().datetime().nullable(),
  qualityStatus:z.enum(['not_inspected','header_quality_zero','header_quality_nonzero']),
  hmiHeader:z.object({hduIndex:z.literal(1),extensionType:z.literal('compressed_binary_table_image'),
    observedAtUtc:z.string().datetime(),qualityFlag:z.number().int().nonnegative(),
    drmsId:z.string().min(1).max(240).nullable().optional(),
    qualityInterpretation:z.literal('numeric_flag_only_not_science_admission')}).strict().optional(),
  rightsStatus:z.literal('provider_terms_not_evaluated'),
  scientificAdmission:z.literal(false),
  claimCeiling:z.enum(['downloaded_bytes_only_not_inspected_fits_or_validated_field',
    'downloaded_bytes_and_header_flag_only_not_validated_field']),
}).strict();
export type SolarMagneticArchiveAcquisitionReceipt=z.infer<typeof solarMagneticArchiveAcquisitionReceiptSchema>;
export const solarMagneticArchiveAcquisitionListSchema=z.object({
  schemaVersion:z.literal('solar-magnetic-archive-acquisition-list/1'),
  acquisitions:z.array(solarMagneticArchiveAcquisitionReceiptSchema).max(100),
  truncated:z.boolean(),
  integrityStatus:z.literal('listed_receipts_not_reverified'),
  scientificAdmission:z.literal(false),
}).strict();
export type SolarMagneticArchiveAcquisitionList=z.infer<typeof solarMagneticArchiveAcquisitionListSchema>;
export const solarMagneticArchiveAcquisitionReadQuerySchema=z.object({
  acquisitionId:z.string().regex(/^magnetic-acquisition:[a-f0-9]{64}$/),
}).strict();
