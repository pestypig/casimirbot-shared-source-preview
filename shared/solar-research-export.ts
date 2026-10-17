import { SolarPrimaryComparisonRecordSchema } from './solar-research-comparison';
import { z } from 'zod';

async function sha256(text: string) {
  const bytes=new TextEncoder().encode(text);
  const digest=await globalThis.crypto.subtle.digest('SHA-256',bytes);
  return Array.from(new Uint8Array(digest),byte=>byte.toString(16).padStart(2,'0')).join('');
}

/** Prepare local artifacts; no download, filesystem write or source authentication. */
export async function prepareSolarResearchExport(input: unknown) {
  const record=SolarPrimaryComparisonRecordSchema.parse(input);
  // Schema parsing fixes property order and excludes unrecognised fields.
  const recordJson=JSON.stringify(record);
  if (new TextEncoder().encode(recordJson).length>64_000) throw new Error('Research record exceeds 64 KB');
  const recordSha256=await sha256(recordJson);
  const recordId=`solar-primary:${recordSha256}`;
  const header='record_sha256,author_row,second_quartile_r_over_bp04_R,observed_delta_c2_over_c2,quoted_solution_error,primary_prediction,observed_minus_primary_term,fixture_only';
  const tableCsv=[header,...record.rows.map(row=>[
    recordSha256,row.authorRow,row.secondQuartileRadius,row.observed,row.quotedSolutionError,
    row.primaryPrediction??'',row.residual??'',record.fixtureOnly,
  ].join(','))].join('\n')+'\n';
  const manifest={schemaVersion:'solar-research-export/1',recordId,recordSha256,
    tableSha256:await sha256(tableCsv),observation:record.observation,kernels:record.kernels,
    modelDifference:record.modelDifference,operator:record.operator,operatorSha256:record.operatorSha256,
    uncertainty:record.uncertainty,fixtureOnly:record.fixtureOnly,
    sourceIdentityAuthenticated:false,admissionAllowed:false,scienceRunAllowed:false,
    limitations:['primary term only','reference profile unbound','cross terms omitted',
      'quoted errors only; no covariance or systematics','record creation is not acquisition time'],
  };
  return {recordId,recordJson,tableCsv,manifestJson:JSON.stringify(manifest,null,2)};
}

const ExportBundleSchema=z.object({
  recordId:z.string().regex(/^solar-primary:[a-f0-9]{64}$/),
  recordJson:z.string().max(64_000),
  tableCsv:z.string().max(64_000),
  manifestJson:z.string().max(64_000),
}).strict();

/** Verify the exact versioned export recipe; integrity is not source authentication. */
export async function verifySolarResearchExport(input: unknown) {
  const bundle=ExportBundleSchema.parse(input);
  for (const text of [bundle.recordJson,bundle.tableCsv,bundle.manifestJson]) {
    if (new TextEncoder().encode(text).length>64_000) throw new Error('Research artifact exceeds 64 KB');
  }
  const record=SolarPrimaryComparisonRecordSchema.parse(JSON.parse(bundle.recordJson));
  const expected=await prepareSolarResearchExport(record);
  if (bundle.recordId!==expected.recordId || bundle.recordJson!==expected.recordJson ||
      bundle.tableCsv!==expected.tableCsv || bundle.manifestJson!==expected.manifestJson)
    throw new Error('Research export integrity or recipe mismatch');
  return {record,recordId:expected.recordId,artifactIntegrityVerified:true as const,
    sourceIdentityAuthenticated:false as const,admissionAllowed:false as const};
}
