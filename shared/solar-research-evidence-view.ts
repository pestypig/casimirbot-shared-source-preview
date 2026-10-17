import { z } from 'zod';
import { verifySolarResearchExport } from './solar-research-export';
import { SolarPrimaryComparisonRecordSchema } from './solar-research-comparison';

const recordShape=SolarPrimaryComparisonRecordSchema.innerType().shape;
export const solarResearchEvidenceViewSchema=z.object({
  schemaVersion:z.literal('solar-research-evidence-view/1'),recordId:z.string().regex(/^solar-primary:[a-f0-9]{64}$/),
  assistant_answer:z.literal(false),terminal_eligible:z.literal(false),content_role:z.literal('evidence_not_assistant_answer'),
  artifactIntegrityVerified:z.literal(true),sourceIdentityAuthenticated:z.literal(false),fixtureOnly:z.boolean(),
  operator:recordShape.operator,operatorSha256:recordShape.operatorSha256,
  observation:recordShape.observation,kernels:recordShape.kernels,modelDifference:recordShape.modelDifference,
  units:recordShape.units,coordinate:recordShape.coordinate,referenceRadiusM:recordShape.referenceRadiusM,
  quantity:recordShape.quantity,recordCreatedAt:recordShape.createdAt,
  acquisitionTime:z.null(),acquisitionTimeStatus:z.literal('not_bound_by_this_record'),
  fullKernelSupport:recordShape.fullKernelSupport,crossTermIncluded:z.literal(false),referenceProfileBound:z.literal(false),
  uncertainty:recordShape.uncertainty,residualConvention:recordShape.residualConvention,
  missingRequirements:z.array(z.string().min(1).max(1000)).max(32),
  totalRows:z.number().int().min(1).max(76),offset:z.number().int().min(0).max(75),
  rows:recordShape.rows.max(20),nextOffset:z.number().int().min(1).max(75).nullable(),
  admissionAllowed:z.literal(false),scienceRunAllowed:z.literal(false),
}).strict();

const QuerySchema=z.object({offset:z.number().int().min(0).max(75).default(0),
  limit:z.number().int().min(1).max(20).default(10),
  recordId:z.string().regex(/^solar-primary:[a-f0-9]{64}$/).optional()}).strict();

/** Evidence normalization only; transport/account admission belongs to existing MCP policy. */
export async function readSolarResearchEvidenceSlice(bundle:unknown,query:unknown={}) {
  const {offset,limit,recordId}=QuerySchema.parse(query);
  const verified=await verifySolarResearchExport(bundle);
  if (recordId && recordId!==verified.recordId) throw new Error('Solar evidence record identity mismatch');
  const record=verified.record;
  if (offset>=record.rows.length) throw new Error('Solar evidence offset outside record');
  const rows=record.rows.slice(offset,offset+limit);
  return solarResearchEvidenceViewSchema.parse({schemaVersion:'solar-research-evidence-view/1',recordId:verified.recordId,
    assistant_answer:false,terminal_eligible:false,content_role:'evidence_not_assistant_answer',
    artifactIntegrityVerified:true,sourceIdentityAuthenticated:false,fixtureOnly:record.fixtureOnly,
    operator:record.operator,operatorSha256:record.operatorSha256,
    observation:record.observation,kernels:record.kernels,modelDifference:record.modelDifference,
    units:record.units,coordinate:record.coordinate,referenceRadiusM:record.referenceRadiusM,
    quantity:record.quantity,recordCreatedAt:record.createdAt,
    acquisitionTime:null,acquisitionTimeStatus:'not_bound_by_this_record',
    fullKernelSupport:record.fullKernelSupport,crossTermIncluded:record.crossTermIncluded,
    referenceProfileBound:record.referenceProfileBound,
    uncertainty:record.uncertainty,residualConvention:record.residualConvention,
    missingRequirements:['cross-term response','bound BP04 reference profile','covariance and systematics',
      ...(!record.modelDifference?['supported model/reference difference']:[])],
    totalRows:record.rows.length,offset,rows,
    nextOffset:offset+rows.length<record.rows.length?offset+rows.length:null,
    admissionAllowed:false,scienceRunAllowed:false});
}
