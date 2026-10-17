import {z} from 'zod';
const id=(prefix:string)=>z.string().regex(new RegExp(`^${prefix}:[a-f0-9]{64}$`));
export const solarPackageCatalogQuerySchema=z.object({offset:z.number().int().min(0).max(99).default(0),
  limit:z.number().int().min(1).max(20).default(10)}).strict();
export const solarPackageCatalogSchema=z.object({schemaVersion:z.literal('solar-package-catalog/1'),
  totalPackages:z.number().int().min(0).max(100),offset:z.number().int().min(0).max(99),
  packages:z.array(z.object({packageId:id('solar-package'),indexId:id('solar-evidence-index'),
    totalBytes:z.number().int().positive().max(9000000),comparisonRecordId:id('solar-primary'),comparisonRows:z.number().int().min(1).max(76),
    archiveId:id('solar-observation').nullable(),literatureId:id('solar-literature').nullable(),benchmarkId:id('solar-benchmark').nullable(),
    artifactIntegrityVerified:z.literal(true),sourceIdentityAuthenticated:z.literal(false),scientificAdmission:z.literal(false),scienceRunAllowed:z.literal(false),
  }).strict()).max(20),nextOffset:z.number().int().min(1).max(99).nullable(),order:z.literal('package_id_lexicographic'),
  scientificAdmission:z.literal(false),scienceRunAllowed:z.literal(false)}).strict();
export type SolarPackageCatalog=z.infer<typeof solarPackageCatalogSchema>;
