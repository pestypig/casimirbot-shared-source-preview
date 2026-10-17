import {EXTERNAL_ARC_CLIP,externalMagnetProximityProxy} from './ferrofluid-external-arc-response';

type ForcingControl='tracked-approach'|'time-ramp'|'approach-early-2s'|'approach-late-2s';
const controls:ForcingControl[]=['tracked-approach','time-ramp','approach-early-2s','approach-late-2s'];
const trainingTimes=new Set([0,2,4,6,8,10]);
type CrownRow={timeS:number;bodyWidthPx:number;nominalSpanPx:number;methodSpanRangePx:readonly [number,number]};
const rows:readonly CrownRow[]=EXTERNAL_ARC_CLIP.crownLineCandidates;

/** Exact-source output of analyze_ferrofluid_external_clip.py, 13 frames at 0–10 s. */
export const EXTERNAL_ARC_COMMON_METHOD_WIDTHS={
  sourceSha256:EXTERNAL_ARC_CLIP.sourceSha256,
  method:'tools/analyze_ferrofluid_external_clip.py crownLineCandidates.widthsByKernelAndThreshold; body threshold 75',
  timesS:[0,1,2,3,4,5,6,7,8,8.5,9,9.5,10],
  widthsPx:{
    '21:18':[119,122,110,112,107,103,114,90,86,70,63,63,59],
    '21:22':[119,122,109,97,100,98,109,87,86,69,63,61,54],
    '21:26':[86,120,108,96,100,98,109,86,86,67,62,61,54],
    '25:18':[119,123,110,114,107,103,115,90,86,70,63,63,61],
    '25:22':[119,122,109,97,105,101,113,87,86,69,63,63,54],
    '25:26':[87,120,108,96,101,98,112,86,86,69,62,61,54],
    '29:18':[122,123,110,133,122,103,115,90,86,70,63,63,41],
    '29:22':[119,122,110,103,106,101,113,88,86,70,63,63,38],
    '29:26':[87,120,108,97,105,100,112,87,86,70,62,61,38],
  },
} as const;

function forcingAt(control:ForcingControl,timeS:number){
  if(control==='time-ramp')return Math.min(1,Math.max(0,(timeS-2)/6));
  if(control==='approach-early-2s')return externalMagnetProximityProxy(timeS+2);
  if(control==='approach-late-2s')return timeS<2?0:externalMagnetProximityProxy(timeS-2);
  return externalMagnetProximityProxy(timeS);
}

function responseAt(control:ForcingControl,tauS:number){
  const stepS=0.05;
  const count=Math.ceil(10/stepS);
  const values:number[]=[0];
  for(let index=1;index<=count;index++){
    const target=forcingAt(control,index*stepS);
    values.push(values[index-1]+(target-values[index-1])*(1-Math.exp(-stepS/tauS)));
  }
  return (timeS:number)=>values[Math.round(timeS/stepS)];
}

/** Extrema of paired absolute-error difference over one detector-method interval. */
function pairedErrorDifferenceBounds(predictedA:number,predictedB:number,low:number,high:number){
  const candidates=[low,high,predictedA,predictedB].filter(value=>value>=low&&value<=high);
  const differences=candidates.map(observed=>Math.abs(predictedA-observed)-Math.abs(predictedB-observed));
  return {minimum:Math.min(...differences),maximum:Math.max(...differences)};
}

function fitForcingControls(observedRows:readonly CrownRow[]){
  const controlResults=controls.map(control=>{
    let best:{baseline:number;amplitude:number;tauS:number;trainingMse:number}|null=null;
    for(const tauS of [0.25,0.5,1,1.5,2,3,4,6,8]){
      const response=responseAt(control,tauS);
      for(const baseline of [0.25,0.28,0.3,0.33])
      for(const amplitude of [0.4,0.6,0.8,1]){
        const train=observedRows.filter(row=>trainingTimes.has(row.timeS));
        const trainingMse=train.reduce((sum,row)=>{
          const predicted=baseline*(1-amplitude*response(row.timeS));
          return sum+(predicted-row.nominalSpanPx/row.bodyWidthPx)**2;
        },0)/train.length;
        if(!best||trainingMse<best.trainingMse)best={baseline,amplitude,tauS,trainingMse};
      }
    }
    if(!best)throw new Error('Empty forcing control grid');
    const response=responseAt(control,best.tauS);
    const validation=observedRows.filter(row=>!trainingTimes.has(row.timeS)).map(row=>{
      const observed=row.nominalSpanPx/row.bodyWidthPx;
      const predicted=best.baseline*(1-best.amplitude*response(row.timeS));
      return {timeS:row.timeS,observed,predicted,
        withinMethodRange:predicted>=row.methodSpanRangePx[0]/row.bodyWidthPx&&
          predicted<=row.methodSpanRangePx[1]/row.bodyWidthPx};
    });
    return {control,parameters:best,
      validationMae:validation.reduce((sum,row)=>sum+Math.abs(row.predicted-row.observed),0)/validation.length,
      validationWithinMethodRange:validation.filter(row=>row.withinMethodRange).length,
      validation};
  });
  return controlResults;
}

/** Post-hoc same-clip control analysis, not an independent causal experiment. */
export function compareExternalArcForcingControls(){
  const controlResults=fitForcingControls(rows);
  const tracked=controlResults.find(result=>result.control==='tracked-approach')!;
  const elapsed=controlResults.find(result=>result.control==='time-ramp')!;
  const pairedBounds=rows.filter(row=>!trainingTimes.has(row.timeS)).map(row=>{
    const trackedPrediction=tracked.validation.find(item=>item.timeS===row.timeS)!.predicted;
    const elapsedPrediction=elapsed.validation.find(item=>item.timeS===row.timeS)!.predicted;
    const low=row.methodSpanRangePx[0]/row.bodyWidthPx;
    const high=row.methodSpanRangePx[1]/row.bodyWidthPx;
    return pairedErrorDifferenceBounds(elapsedPrediction,trackedPrediction,low,high);
  });
  const pairedDifferenceBounds={
    meaning:'time-ramp MAE minus tracked-approach MAE; fitted parameters frozen at nominal detector settings',
    minimum:pairedBounds.reduce((sum,item)=>sum+item.minimum,0)/pairedBounds.length,
    maximum:pairedBounds.reduce((sum,item)=>sum+item.maximum,0)/pairedBounds.length,
    enforcesCommonDetectorSettingAcrossFrames:false as const,
    statisticalConfidenceInterval:false as const,
  };
  return {
    schemaVersion:'ferrofluid-external-forcing-controls/1' as const,
    trainTimesS:[...trainingTimes],
    validationTimesS:rows.filter(row=>!trainingTimes.has(row.timeS)).map(row=>row.timeS),
    controls:controlResults,
    pairedTimeMinusTrackedMethodEnvelope:pairedDifferenceBounds,
    forcingIsMeasuredMagneticField:false as const,
    preregisteredBeforeVideo:false as const,
    independentValidation:false as const,
    identifiesMagneticCausation:false as const,
  };
}

/** Refit both schedules for each fixed detector setting across all 13 source frames. */
export function compareExternalArcCommonMethodSettings(){
  const methods=Object.entries(EXTERNAL_ARC_COMMON_METHOD_WIDTHS.widthsPx).map(([setting,widths])=>{
    if(widths.length!==rows.length||rows.some((row,index)=>row.timeS!==EXTERNAL_ARC_COMMON_METHOD_WIDTHS.timesS[index]))
      throw new Error('Common-setting frame grid differs from frozen source times');
    const measured=rows.map((row,index):CrownRow=>({
      timeS:row.timeS,bodyWidthPx:row.bodyWidthPx,nominalSpanPx:widths[index],
      methodSpanRangePx:[widths[index],widths[index]],
    }));
    const fits=fitForcingControls(measured);
    const tracked=fits.find(result=>result.control==='tracked-approach')!;
    const elapsed=fits.find(result=>result.control==='time-ramp')!;
    return {setting,
      trackedValidationMae:tracked.validationMae,
      elapsedTimeValidationMae:elapsed.validationMae,
      elapsedMinusTrackedValidationMae:elapsed.validationMae-tracked.validationMae,
      trackedTrainingMse:tracked.parameters.trainingMse,
      elapsedTimeTrainingMse:elapsed.parameters.trainingMse,
    };
  });
  return {
    schemaVersion:'ferrofluid-external-common-method-controls/1' as const,
    sourceSha256:EXTERNAL_ARC_COMMON_METHOD_WIDTHS.sourceSha256,
    methodSource:EXTERNAL_ARC_COMMON_METHOD_WIDTHS.method,
    methods,
    elapsedTimeNominalWins:methods.filter(row=>row.elapsedMinusTrackedValidationMae<0).length,
    trackedNominalWins:methods.filter(row=>row.elapsedMinusTrackedValidationMae>0).length,
    ties:methods.filter(row=>row.elapsedMinusTrackedValidationMae===0).length,
    refitPerSetting:true as const,
    independentValidation:false as const,
    materialIdentityVerified:false as const,
    identifiesMagneticCausation:false as const,
  };
}
