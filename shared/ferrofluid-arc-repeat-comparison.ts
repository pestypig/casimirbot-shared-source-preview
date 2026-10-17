import {z} from 'zod';
import {FERROFLUID_ARC_EVIDENCE} from './ferrofluid-arc-evidence-model';
import {sha256} from '@noble/hashes/sha256';
import {bytesToHex} from '@noble/hashes/utils';

const measured=z.object({value:z.number().finite(),uncertainty:z.number().finite().nonnegative()}).strict();
const positiveMeasured=measured.refine(item=>item.value>0,'value must be positive');
const hash=z.string().regex(/^[A-F0-9]{64}$/);

export const ferrofluidArcRepeatTrialSchema=z.object({
  schemaVersion:z.literal('ferrofluid-arc-repeat-trial/1'),
  runId:z.string().trim().min(1).max(100),
  independentNewRun:z.boolean(),
  magnetometerSha256:hash.nullable(),
  videoSha256:hash.nullable(),
  maxClockAlignmentErrorS:z.number().finite().nonnegative().nullable(),
  plateToRingHeightMm:positiveMeasured.nullable(),
  signedOffsetMm:measured.nullable(),
  freeLineSpanMm:positiveMeasured.nullable(),
  lineTensionN:positiveMeasured.nullable(),
  phoneDominantHz:positiveMeasured.nullable(),
  actualRotorHz:positiveMeasured.nullable(),
  observationWindowS:z.object({start:z.number().finite().nonnegative(),end:z.number().finite().positive()}).strict().nullable(),
  dialChangedDuringObservation:z.boolean().nullable(),
  arcObserved:z.boolean().nullable(),
  arcOnsetRelativeToRecordingS:z.number().finite().nonnegative().nullable(),
}).strict();
export type FerrofluidArcRepeatTrial=z.infer<typeof ferrofluidArcRepeatTrialSchema>;

export const ferrofluidArcRepeatPairSchema=z.object({
  schemaVersion:z.literal('ferrofluid-arc-repeat-pair/2'),
  plannedContrast:z.enum(['offset','line-span','drive']),
  declaredPreregisteredBeforeBothCaptures:z.boolean(),
  matchedControlTolerance:z.object({
    plateToRingHeightMm:z.number().finite().nonnegative().nullable(),
    signedOffsetMm:z.number().finite().nonnegative().nullable(),
    freeLineSpanMm:z.number().finite().nonnegative().nullable(),
    lineTensionN:z.number().finite().nonnegative().nullable(),
    phoneDominantHz:z.number().finite().nonnegative().nullable(),
    actualRotorHz:z.number().finite().nonnegative().nullable(),
  }).strict(),
  assumptions:z.object({
    phoneFrequencyTracksRotor:z.boolean(),
    lineTensionUnchanged:z.boolean(),
  }).strict(),
  predictedArcContrast:z.enum(['candidate-only-arc','control-only-arc','both-arc','neither-arc']).nullable(),
  control:ferrofluidArcRepeatTrialSchema,
  candidate:ferrofluidArcRepeatTrialSchema,
}).strict();
export type FerrofluidArcRepeatPair=z.infer<typeof ferrofluidArcRepeatPairSchema>;

/** Incremental digest for large local recordings; no network or whole-file buffer. */
export async function hashFerrofluidArcSourceBlob(source:Blob){
  const hasher=sha256.create();
  const reader=source.stream().getReader();
  for(;;){
    const {done,value}=await reader.read();
    if(done)break;
    hasher.update(value);
  }
  return bytesToHex(hasher.digest()).toUpperCase();
}

/** Match locally hashed bytes to declarations; does not validate file content or preregistration. */
export function auditFerrofluidArcRepeatSourceHashes(rawPair:unknown,rawHashes:readonly string[]){
  const pair=ferrofluidArcRepeatPairSchema.parse(rawPair);
  const supplied=new Set(rawHashes.map(value=>hash.parse(value.toUpperCase())));
  const declared=[
    {slot:'control magnetometer',sha256:pair.control.magnetometerSha256},
    {slot:'control video',sha256:pair.control.videoSha256},
    {slot:'candidate magnetometer',sha256:pair.candidate.magnetometerSha256},
    {slot:'candidate video',sha256:pair.candidate.videoSha256},
  ];
  const matched=declared.map(item=>({...item,matched:item.sha256!==null&&supplied.has(item.sha256)}));
  return {
    declared:matched,
    matchedCount:matched.filter(item=>item.matched).length,
    allFourDeclaredFilesMatched:matched.every(item=>item.matched)&&
      new Set(matched.map(item=>item.sha256)).size===4,
    contentTypeVerified:false as const,
    preregistrationTimestampVerified:false as const,
  };
}

/** Blank fields are intentional: no owner measurements or source identities are invented. */
export const FERROFLUID_ARC_REPEAT_PAIR_TEMPLATE:FerrofluidArcRepeatPair={
  schemaVersion:'ferrofluid-arc-repeat-pair/2',
  plannedContrast:'offset',
  declaredPreregisteredBeforeBothCaptures:false,
  matchedControlTolerance:{plateToRingHeightMm:null,signedOffsetMm:null,freeLineSpanMm:null,
    lineTensionN:null,phoneDominantHz:null,actualRotorHz:null},
  assumptions:{phoneFrequencyTracksRotor:false,lineTensionUnchanged:false},
  predictedArcContrast:null,
  control:{
    schemaVersion:'ferrofluid-arc-repeat-trial/1',runId:'control-replace-me',
    independentNewRun:false,magnetometerSha256:null,videoSha256:null,
    maxClockAlignmentErrorS:null,plateToRingHeightMm:null,signedOffsetMm:null,
    freeLineSpanMm:null,lineTensionN:null,phoneDominantHz:null,actualRotorHz:null,
    observationWindowS:null,
    dialChangedDuringObservation:null,arcObserved:null,arcOnsetRelativeToRecordingS:null,
  },
  candidate:{
    schemaVersion:'ferrofluid-arc-repeat-trial/1',runId:'candidate-replace-me',
    independentNewRun:false,magnetometerSha256:null,videoSha256:null,
    maxClockAlignmentErrorS:null,plateToRingHeightMm:null,signedOffsetMm:null,
    freeLineSpanMm:null,lineTensionN:null,phoneDominantHz:null,actualRotorHz:null,
    observationWindowS:null,
    dialChangedDuringObservation:null,arcObserved:null,arcOnsetRelativeToRecordingS:null,
  },
};

type Measurement=z.infer<typeof measured>;
function distinguishable(a:Measurement,b:Measurement){
  return Math.abs(a.value-b.value)>a.uncertainty+b.uncertainty;
}
/** Conservative interval equivalence, not a statistical confidence test. */
function withinDeclaredTolerance(a:Measurement,b:Measurement,tolerance:number){
  return Math.abs(a.value-b.value)+a.uncertainty+b.uncertainty<=tolerance;
}
function measuredPair(a:Measurement|null,b:Measurement|null):[Measurement,Measurement]|null{
  return a!==null&&b!==null?[a,b]:null;
}

/** Evidence-readiness check, not a causal classifier or independent file audit. */
export function compareFerrofluidArcRepeatPair(raw:unknown){
  const pair=ferrofluidArcRepeatPairSchema.parse(raw);
  const {control,candidate}=pair;
  const limitations:string[]=[];
  const caveats:string[]=[];
  if(!pair.declaredPreregisteredBeforeBothCaptures)limitations.push('Pair was not declared preregistered before both captures.');
  if(pair.predictedArcContrast===null)limitations.push('A specific arc-label prediction must be recorded before both captures.');
  if(!control.independentNewRun||!candidate.independentNewRun||control.runId===candidate.runId){
    limitations.push('Two distinct, newly recorded run IDs are required.');
  }
  if(!control.magnetometerSha256||!candidate.magnetometerSha256||control.magnetometerSha256===candidate.magnetometerSha256){
    limitations.push('Distinct magnetometer source hashes are required.');
  }
  if(!control.videoSha256||!candidate.videoSha256||control.videoSha256===candidate.videoSha256){
    limitations.push('Distinct video source hashes, including negative trials, are required.');
  }
  if([control,candidate].some(trial=>trial.magnetometerSha256===FERROFLUID_ARC_EVIDENCE.magnetometer.sha256||
    trial.videoSha256===FERROFLUID_ARC_EVIDENCE.arcClip.sha256)){
    limitations.push('An original source file cannot be relabeled as an independent new run.');
  }
  if(control.maxClockAlignmentErrorS===null||candidate.maxClockAlignmentErrorS===null||
     control.maxClockAlignmentErrorS>1||candidate.maxClockAlignmentErrorS>1){
    limitations.push('Each run needs a stated video/field-clock alignment error of at most 1 s for coarse event timing.');
  }
  if(control.dialChangedDuringObservation!==false||candidate.dialChangedDuringObservation!==false){
    limitations.push('Each observation interval needs a held dial setting; record search/ramp intervals separately.');
  }
  if(control.arcObserved===null||candidate.arcObserved===null){
    limitations.push('Both video intervals need an observed arc yes/no label.');
  }
  for(const [name,trial] of [['control',control],['candidate',candidate]] as const){
    const window=trial.observationWindowS;
    if(!window||window.end<=window.start){
      limitations.push(`${name} needs a positive-length observation window on the aligned recording clock.`);
    }else if(trial.arcObserved===true&&trial.arcOnsetRelativeToRecordingS!==null&&
      (trial.arcOnsetRelativeToRecordingS<window.start||trial.arcOnsetRelativeToRecordingS>window.end)){
      limitations.push(`${name} arc onset must fall inside its observation window.`);
    }
  }
  if((control.arcObserved===true&&control.arcOnsetRelativeToRecordingS===null)||
     (candidate.arcObserved===true&&candidate.arcOnsetRelativeToRecordingS===null)){
    limitations.push('Each positive arc label needs an onset time on the aligned recording clock.');
  }
  if((control.arcObserved===false&&control.arcOnsetRelativeToRecordingS!==null)||
     (candidate.arcObserved===false&&candidate.arcOnsetRelativeToRecordingS!==null)){
    limitations.push('A negative arc label must not carry an arc-onset time.');
  }
  const heights=measuredPair(control.plateToRingHeightMm,candidate.plateToRingHeightMm);
  if(!heights||pair.matchedControlTolerance.plateToRingHeightMm===null||
    !withinDeclaredTolerance(...heights,pair.matchedControlTolerance.plateToRingHeightMm)){
    limitations.push('Plate-to-ring heights need measured values whose full uncertainty-bounded difference fits the predeclared height tolerance.');
  }
  const variables=[
    {name:'offset',control:control.signedOffsetMm,candidate:candidate.signedOffsetMm,tolerance:pair.matchedControlTolerance.signedOffsetMm},
    {name:'line-span',control:control.freeLineSpanMm,candidate:candidate.freeLineSpanMm,tolerance:pair.matchedControlTolerance.freeLineSpanMm},
    {name:'drive',control:control.phoneDominantHz,candidate:candidate.phoneDominantHz,tolerance:pair.matchedControlTolerance.phoneDominantHz},
  ] as const;
  for(const variable of variables){
    const values=measuredPair(variable.control,variable.candidate);
    if(!values){
      limitations.push(`${variable.name} needs measured values and measurement uncertainties in both runs.`);
    }else if(variable.name===pair.plannedContrast&&!distinguishable(...values)){
      limitations.push(`The intended ${variable.name} contrast is not resolved beyond its stated measurement uncertainty.`);
    }else if(variable.name!==pair.plannedContrast&&
      (variable.tolerance===null||!withinDeclaredTolerance(...values,variable.tolerance))){
      limitations.push(`${variable.name} did not fit a predeclared matching tolerance after both measurement uncertainties; the pair is confounded or insufficiently resolved.`);
    }
  }
  const tensions=measuredPair(control.lineTensionN,candidate.lineTensionN);
  if(tensions){
    const tolerance=pair.matchedControlTolerance.lineTensionN;
    if(tolerance===null||!withinDeclaredTolerance(...tensions,tolerance))
      limitations.push('Line tension did not fit a predeclared matching tolerance after both measurement uncertainties.');
  }else if(pair.plannedContrast==='line-span'||!pair.assumptions.lineTensionUnchanged){
    limitations.push('Line tension must be measured and matched, or explicitly assumed stable for a non-line-span contrast.');
  }else{
    caveats.push('Line tension is unmeasured; its stability is an operator assumption, not a controlled observation.');
  }
  const rotorRates=measuredPair(control.actualRotorHz,candidate.actualRotorHz);
  if(rotorRates){
    if(pair.plannedContrast==='drive'?!distinguishable(...rotorRates):
      (pair.matchedControlTolerance.actualRotorHz===null||
        !withinDeclaredTolerance(...rotorRates,pair.matchedControlTolerance.actualRotorHz))){
      limitations.push(pair.plannedContrast==='drive'
        ?'Actual rotor frequency did not resolve the intended drive contrast.'
        :'Actual rotor frequency did not fit a predeclared matching tolerance after both measurement uncertainties.');
    }
  }else if(!pair.assumptions.phoneFrequencyTracksRotor){
    limitations.push('Actual rotor frequency is missing; a phone-only comparison needs the explicit, unverified phone-tracks-rotor assumption.');
  }else{
    caveats.push('Actual rotor frequency is unmeasured; phone periodicity is assumed to track it despite unknown pole count and aliasing.');
  }
  const readyForDescriptiveContrast=limitations.length===0;
  const evidenceTier=readyForDescriptiveContrast
    ?(caveats.length?'assumption-dependent-descriptive':'reported-measurements-descriptive')
    :'not-comparable';
  const arcContrast=readyForDescriptiveContrast
    ?(control.arcObserved===candidate.arcObserved
      ?(control.arcObserved?'both-arc':'neither-arc')
      :(candidate.arcObserved?'candidate-only-arc':'control-only-arc'))
    :null;
  const predictionMatched=arcContrast&&pair.predictedArcContrast
    ?arcContrast===pair.predictedArcContrast
    :null;
  return {
    schemaVersion:'ferrofluid-arc-repeat-comparison/2' as const,
    plannedContrast:pair.plannedContrast,
    readyForDescriptiveContrast,
    evidenceTier,
    arcContrast,
    predictedArcContrast:pair.predictedArcContrast,
    predictionMatched,
    limitations,
    caveats,
    sourceBytesVerified:false as const,
    preregistrationTimestampVerified:false as const,
    provesCausality:false as const,
    provesSolarReconnection:false as const,
  };
}
