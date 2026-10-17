import {z} from 'zod';
import {EXTERNAL_ARC_CLIP} from './ferrofluid-external-arc-response';

const hash=z.string().regex(/^[A-F0-9]{64}$/);
const finite=z.number().finite();
const vector=z.object({x:finite,y:finite,z:finite}).strict();
const timedPose=z.object({timeS:finite.nonnegative(),positionMm:vector,axis:vector}).strict();
const timedField=z.object({timeS:finite.nonnegative(),atMm:vector,fieldMicrotesla:vector}).strict();

/** A run-local evidence join. Null means unmeasured, not zero or an inferred value. */
export const externalArcEvidenceJoinSchema=z.object({
  schemaVersion:z.literal('ferrofluid-external-evidence-join/1'),
  runId:z.string().trim().min(1),
  videoSha256:hash,
  fieldRecordingSha256:hash.nullable(),
  samePhysicalRun:z.boolean().nullable(),
  clockAlignment:z.object({method:z.string().trim().min(1),maxErrorS:finite.nonnegative()}).strict().nullable(),
  fieldUnitsVerifiedMicrotesla:z.boolean(),
  fieldSensorCalibrated:z.boolean(),
  fieldTransferredToCrownByCalibratedMap:z.boolean(),
  spatialGradientCalibrated:z.boolean(),
  fieldSamples:z.array(timedField),
  handheldMagnetGeometryMeasured:z.boolean(),
  handheldMagnetPose:z.array(timedPose),
  suspendedRingPose:z.array(timedPose),
  crownSurfaceTracked:z.boolean(),
  fluidPropertiesMeasured:z.boolean(),
  independentHoldoutRunSha256:hash.nullable(),
}).strict();
export type ExternalArcEvidenceJoin=z.infer<typeof externalArcEvidenceJoinSchema>;

const LEGACY_PHONE_SHA='F546B54109D6EB49BF637EFC1777103AAD3F0E0EDF0705D4F73209E047B4062C';

/** Honest inventory of the present files, never a field/force input to IMG_8196. */
export const CURRENT_EXTERNAL_ARC_EVIDENCE_JOIN:ExternalArcEvidenceJoin={
  schemaVersion:'ferrofluid-external-evidence-join/1',
  runId:'owner-IMG_8196-external-approach',
  videoSha256:EXTERNAL_ARC_CLIP.sourceSha256,
  fieldRecordingSha256:LEGACY_PHONE_SHA,
  samePhysicalRun:false,
  clockAlignment:null,
  fieldUnitsVerifiedMicrotesla:false,
  fieldSensorCalibrated:false,
  fieldTransferredToCrownByCalibratedMap:false,
  spatialGradientCalibrated:false,
  fieldSamples:[],
  handheldMagnetGeometryMeasured:false,
  handheldMagnetPose:[],
  suspendedRingPose:[],
  crownSurfaceTracked:false,
  fluidPropertiesMeasured:false,
  independentHoldoutRunSha256:null,
};

function increasingInClip<T extends {timeS:number}>(samples:T[]){
  return samples.length>=3&&samples.every((item,index)=>
    item.timeS>=0&&item.timeS<=EXTERNAL_ARC_CLIP.durationS&&
    (index===0||item.timeS>samples[index-1].timeS));
}
function axisValid(samples:{axis:{x:number;y:number;z:number}}[]){
  return samples.every(({axis})=>{
    const length=Math.hypot(axis.x,axis.y,axis.z);
    return length>=0.99&&length<=1.01;
  });
}

/** Measurement admission, not a claim that any accepted data uniquely identify the physics. */
export function auditExternalArcEvidenceJoin(raw:unknown){
  const run=externalArcEvidenceJoinSchema.parse(raw);
  const missing:string[]=[];
  if(!run.fieldRecordingSha256)missing.push('No field-recording source hash.');
  if(run.fieldRecordingSha256===run.videoSha256)missing.push('Video and field recordings cannot have identical source bytes.');
  if(run.samePhysicalRun!==true)missing.push('Video and field recordings are not verified as the same physical run.');
  if(!run.clockAlignment||run.clockAlignment.maxErrorS>0.1)
    missing.push('No documented common clock alignment to 0.1 s or better.');
  if(!run.fieldUnitsVerifiedMicrotesla)missing.push('Field units are not verified as microtesla.');
  if(!run.fieldSensorCalibrated)missing.push('Field sensor calibration is not documented.');
  if(!run.fieldTransferredToCrownByCalibratedMap)missing.push('No calibrated transfer from sensor position to the crown region.');
  if(!run.spatialGradientCalibrated)missing.push('The local spatial field gradient needed for a force estimate is not calibrated.');
  if(!increasingInClip(run.fieldSamples))missing.push('At least three time-ordered vector-field samples within the video interval are required.');
  if(!run.handheldMagnetGeometryMeasured)missing.push('Handheld magnet geometry and moment/pole calibration are unmeasured.');
  if(!increasingInClip(run.handheldMagnetPose)||!axisValid(run.handheldMagnetPose))
    missing.push('At least three time-ordered 3-D handheld magnet poses with unit axes are required.');
  if(!increasingInClip(run.suspendedRingPose)||!axisValid(run.suspendedRingPose))
    missing.push('At least three time-ordered 3-D suspended-ring poses with unit axes are required.');
  const forcingInputAdmitted=missing.length===0;
  const physicalMissing:string[]=[];
  if(!run.crownSurfaceTracked)physicalMissing.push('Crown interface/material motion is not tracked independently of a dark image feature.');
  if(!run.fluidPropertiesMeasured)physicalMissing.push('Run-specific ferrofluid and carrier-fluid properties are not measured.');
  if(!run.independentHoldoutRunSha256||run.independentHoldoutRunSha256===run.videoSha256||
     run.independentHoldoutRunSha256===run.fieldRecordingSha256)
    physicalMissing.push('No distinct independent holdout video source is identified.');
  return {
    schemaVersion:'ferrofluid-external-evidence-audit/1' as const,
    forcingInputAdmitted,
    reportedInputsReadyForPhysicalSolve:forcingInputAdmitted&&physicalMissing.length===0,
    missing,
    physicalMissing,
    sourceBytesVerified:false as const,
    sensorCalibrationIndependentlyVerified:false as const,
    physicalSolvePerformed:false as const,
    provesSolarReconnection:false as const,
  };
}
