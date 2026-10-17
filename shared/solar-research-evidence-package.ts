import {z} from 'zod';
import {verifySolarResearchExport,prepareSolarResearchExport} from './solar-research-export';
import {serializeObservationSnapshot,validateObservationReplay} from './solar-observation-replay';
import {prepareSolarResearchEvidenceIndex,verifySolarResearchEvidenceIndex} from './solar-research-evidence-index';
import {prepareSolarResearchLiterature} from './solar-research-literature';
import {verifySolarBenchmarkReplay,SolarBenchmarkSelectionSchema} from './solar-research-benchmark';

export const SOLAR_EVIDENCE_PACKAGE_MAX_BYTES=9_000_000;
const PackageSchema=z.object({schemaVersion:z.literal('solar-research-evidence-package/1'),
  comparison:z.unknown(),observationArchive:z.unknown().nullable(),literature:z.unknown().nullable(),
  benchmark:z.unknown().nullable(),index:z.unknown()}).strict();

/** Portable local replay inputs, not a scientific comparison or original FITS archive. */
export async function prepareSolarResearchEvidencePackage(bundle:unknown,archive?:unknown,
  context:{literature?:unknown;benchmark?:unknown}={}) {
  const verified=await verifySolarResearchExport(bundle);
  const comparison=await prepareSolarResearchExport(verified.record);
  const observationArchive=archive===undefined?null:JSON.parse(await serializeObservationSnapshot(archive));
  const index=await prepareSolarResearchEvidenceIndex(comparison,observationArchive??undefined,context);
  const payload={schemaVersion:'solar-research-evidence-package/1',comparison,observationArchive,
    literature:context.literature??null,benchmark:context.benchmark??null,index};
  const packageJson=JSON.stringify(payload);
  if(new TextEncoder().encode(packageJson).length>SOLAR_EVIDENCE_PACKAGE_MAX_BYTES)
    throw new Error('Evidence package exceeds 9 MB');
  return {indexId:index.indexId,packageJson};
}

/** Size check precedes JSON parsing; every nested identity/recipe is verified. */
export async function verifySolarResearchEvidencePackage(packageJson:string) {
  if(new TextEncoder().encode(packageJson).length>SOLAR_EVIDENCE_PACKAGE_MAX_BYTES)
    throw new Error('Evidence package exceeds 9 MB');
  const payload=PackageSchema.parse(JSON.parse(packageJson));
  if(['comparison','observationArchive','literature','benchmark','index'].some(key=>!Object.prototype.hasOwnProperty.call(payload,key)))
    throw new Error('Evidence package requires explicit replay inputs or null');
  const context={literature:payload.literature??undefined,benchmark:payload.benchmark??undefined};
  const verified=await verifySolarResearchEvidenceIndex(payload.comparison,
    payload.observationArchive??undefined,context,payload.index);
  const comparison=await verifySolarResearchExport(payload.comparison);
  const index=await prepareSolarResearchEvidenceIndex(payload.comparison,payload.observationArchive??undefined,context);
  const archiveReplay=payload.observationArchive===null?null:await validateObservationReplay(payload.observationArchive);
  const literatureReplay=payload.literature===null?null:await prepareSolarResearchLiterature(payload.comparison);
  const benchmarkReplay=payload.benchmark===null?null:(await verifySolarBenchmarkReplay(payload.comparison,payload.benchmark)).replay;
  return {...verified,comparison:payload.comparison,observationArchive:payload.observationArchive,
    literature:payload.literature,benchmark:payload.benchmark,originalFitsIncluded:false as const,
    record:comparison.record,manifest:JSON.parse(index.manifestJson),archiveReplay,
    literatureReplay:literatureReplay?{...literatureReplay,context:JSON.parse(literatureReplay.manifestJson)}:null,
    benchmarkReplay:benchmarkReplay?{...benchmarkReplay,selection:SolarBenchmarkSelectionSchema.parse(JSON.parse(benchmarkReplay.planJson))}:null};
}
