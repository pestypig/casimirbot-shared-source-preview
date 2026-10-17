import {z} from 'zod';
import {verifySolarResearchExport} from './solar-research-export';

const rows=z.array(z.number().int().min(1).max(76)).max(76);
export const SolarBenchmarkSelectionSchema=z.object({
  schemaVersion:z.literal('solar-benchmark-selection/1'),recordId:z.string().regex(/^solar-primary:[a-f0-9]{64}$/),
  question:z.string().trim().min(1).max(1000),frozenAt:z.string().datetime(),informationCutoff:z.string().datetime(),
  observationAvailableAt:z.string().datetime(),kernelsAvailableAt:z.string().datetime(),modelAvailableAt:z.string().datetime().nullable(),
  calibrationRows:rows,evaluationRows:rows.min(1),
  excludedRows:z.array(z.object({authorRow:z.number().int().min(1).max(76),reason:z.string().trim().min(1).max(500)}).strict()).max(76),
  availabilityProvenance:z.literal('operator_declared_not_authenticated'),
  freezeAuthority:z.literal('content_identity_only_not_authenticated_preregistration'),
}).strict();

/** Frozen selection replay, not a statistical-validation or model acceptance gate. */
export async function prepareSolarBenchmarkSelection(bundle:unknown,input:unknown) {
  const plan=SolarBenchmarkSelectionSchema.parse(input);
  const verified=await verifySolarResearchExport(bundle);
  if(plan.recordId!==verified.recordId)throw new Error('Benchmark record identity mismatch');
  const record=verified.record;
  const cutoff=Date.parse(plan.informationCutoff),frozen=Date.parse(plan.frozenAt);
  if(cutoff>frozen || Date.parse(record.createdAt)>frozen)throw new Error('Benchmark freeze precedes declared inputs');
  if([plan.observationAvailableAt,plan.kernelsAvailableAt,plan.modelAvailableAt].filter(value=>value!==null)
    .some(value=>Date.parse(value!)>cutoff))throw new Error('Benchmark future-data leakage');
  if(Boolean(record.modelDifference)!==Boolean(plan.modelAvailableAt))throw new Error('Benchmark model availability mismatch');
  const assignment=new Map<number,{partition:string;reason:string}>();
  for(const [partition,selected] of [['calibration',plan.calibrationRows],['evaluation',plan.evaluationRows]] as const)
    for(const authorRow of selected) {
      if(assignment.has(authorRow))throw new Error('Benchmark partition overlap or duplicate');
      assignment.set(authorRow,{partition,reason:''});
    }
  for(const excluded of plan.excludedRows) {
    if(assignment.has(excluded.authorRow))throw new Error('Benchmark partition overlap or duplicate');
    assignment.set(excluded.authorRow,{partition:'excluded',reason:excluded.reason});
  }
  const actualRows=new Set(record.rows.map(row=>row.authorRow));
  if(assignment.size!==actualRows.size || [...assignment.keys()].some(row=>!actualRows.has(row)))
    throw new Error('Benchmark selection must account for every retained row');
  const planJson=JSON.stringify(plan);
  const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(planJson))),
    value=>value.toString(16).padStart(2,'0')).join('');
  const planId=`solar-benchmark:${digest}`;
  const quote=(text:string)=>`"${(/^[\s]*[=+\-@]/.test(text)?`'${text}`:text).replace(/"/g,'""')}"`;
  const tableCsv=['plan_id,record_id,author_row,declared_partition,exclusion_reason,observed,quoted_error,primary_prediction,residual,fixture_only',
    ...record.rows.map(row=>{const selected=assignment.get(row.authorRow)!;return [planId,verified.recordId,row.authorRow,selected.partition,
      quote(selected.reason),row.observed,row.quotedSolutionError,row.primaryPrediction??'',row.residual??'',record.fixtureOnly].join(',');})].join('\n')+'\n';
  return {schemaVersion:'solar-benchmark-replay/1',planId,planJson,recordId:verified.recordId,tableCsv,
    fixtureOnly:record.fixtureOnly,performanceScore:null,independentValidation:false,scientificAdmission:false,
    limitations:['Availability and freeze times are operator declarations, not authenticated preregistration.',
      'Row partitions do not establish independence: averaging kernels overlap and covariance is unavailable.',
      'Primary term only; reference profile unbound; cross terms and systematics omitted.',
      ...(record.modelDifference?[]:['No model difference: predictions, residuals and performance unavailable.'])]};
}

const ReplaySchema=z.object({schemaVersion:z.literal('solar-benchmark-replay/1'),planId:z.string().regex(/^solar-benchmark:[a-f0-9]{64}$/),
  planJson:z.string().max(64_000),recordId:z.string().regex(/^solar-primary:[a-f0-9]{64}$/),tableCsv:z.string().max(64_000),
  fixtureOnly:z.boolean(),performanceScore:z.null(),independentValidation:z.literal(false),scientificAdmission:z.literal(false),
  limitations:z.array(z.string().max(500)).max(8)}).strict();
export async function verifySolarBenchmarkReplay(recordBundle:unknown,input:unknown) {
  const replay=ReplaySchema.parse(input);
  const expected=await prepareSolarBenchmarkSelection(recordBundle,JSON.parse(replay.planJson));
  if(JSON.stringify(replay)!==JSON.stringify(expected))throw new Error('Benchmark replay identity or recipe mismatch');
  return {replay:expected,artifactIntegrityVerified:true as const,scientificAdmission:false as const};
}
