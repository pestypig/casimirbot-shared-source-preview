import {EXTERNAL_ARC_CLIP,externalMagnetProximityProxy} from './ferrofluid-external-arc-response';

/**
 * Exploratory cascade: a hidden suspension-like state q follows the projected
 * approach index; an interface-like state a follows a mix of q and direct
 * forcing. These are normalized states, NOT measured ring pose or fluid motion.
 */
export type TwoLagParameters={
  baselineSpanOverBodyWidth:number;
  maxContractionFraction:number;
  suspensionTimeConstantS:number;
  interfaceTimeConstantS:number;
  directFraction:number;
};

export function simulateTwoLagResponse(parameters:TwoLagParameters,stepS=0.05){
  const {baselineSpanOverBodyWidth,maxContractionFraction,suspensionTimeConstantS,
    interfaceTimeConstantS,directFraction}=parameters;
  if(![baselineSpanOverBodyWidth,maxContractionFraction,suspensionTimeConstantS,
    interfaceTimeConstantS,directFraction,stepS].every(Number.isFinite)||
    baselineSpanOverBodyWidth<=0||maxContractionFraction<0||maxContractionFraction>1||
    suspensionTimeConstantS<=0||interfaceTimeConstantS<=0||
    directFraction<0||directFraction>1||stepS<=0||stepS>0.1){
    throw new RangeError('Invalid two-lag surrogate parameters');
  }
  const samples:{timeS:number;proximityProxy:number;suspensionState:number;
    interfaceState:number;openLoopSpanOverBodyWidth:number}[]=[];
  let suspensionState=0,interfaceState=0;
  const count=Math.ceil(EXTERNAL_ARC_CLIP.durationS/stepS);
  for(let index=0;index<=count;index++){
    const timeS=Math.min(index*stepS,EXTERNAL_ARC_CLIP.durationS);
    const proximityProxy=externalMagnetProximityProxy(timeS);
    if(index){
      const dt=timeS-samples[index-1].timeS;
      suspensionState+=(proximityProxy-suspensionState)*(1-Math.exp(-dt/suspensionTimeConstantS));
      const interfaceTarget=directFraction*proximityProxy+(1-directFraction)*suspensionState;
      interfaceState+=(interfaceTarget-interfaceState)*(1-Math.exp(-dt/interfaceTimeConstantS));
    }
    samples.push({timeS,proximityProxy,suspensionState,interfaceState,
      openLoopSpanOverBodyWidth:baselineSpanOverBodyWidth*(1-maxContractionFraction*interfaceState)});
  }
  return samples;
}

function predictedAt(samples:ReturnType<typeof simulateTwoLagResponse>,timeS:number){
  const stepS=samples[1].timeS;
  return samples[Math.min(Math.round(timeS/stepS),samples.length-1)].openLoopSpanOverBodyWidth;
}

/** Same-clip even/odd check against the simpler one-state surrogate. */
export function fitTwoLagCrownTimeSeries(){
  const rows=EXTERNAL_ARC_CLIP.crownLineCandidates;
  const trainTimes=new Set([0,2,4,6,8,10]);
  const training=rows.filter(row=>trainTimes.has(row.timeS));
  const validation=rows.filter(row=>!trainTimes.has(row.timeS));
  let best:{parameters:TwoLagParameters;trainingMse:number}|null=null;
  let tested=0;
  for(const baselineSpanOverBodyWidth of [0.25,0.28,0.3,0.33])
  for(const maxContractionFraction of [0.4,0.6,0.8,1])
  for(const suspensionTimeConstantS of [0.25,0.5,1,2,4])
  for(const interfaceTimeConstantS of [0.25,0.5,1,2,4])
  for(const directFraction of [0,0.5,1]){
    tested++;
    const parameters={baselineSpanOverBodyWidth,maxContractionFraction,
      suspensionTimeConstantS,interfaceTimeConstantS,directFraction};
    const samples=simulateTwoLagResponse(parameters);
    const trainingMse=training.reduce((sum,row)=>{
      const residual=predictedAt(samples,row.timeS)-row.nominalSpanPx/row.bodyWidthPx;
      return sum+residual*residual;
    },0)/training.length;
    if(!best||trainingMse<best.trainingMse)best={parameters,trainingMse};
  }
  if(!best)throw new Error('Empty two-lag grid');
  const samples=simulateTwoLagResponse(best.parameters);
  const validationRows=validation.map(row=>{
    const observedRatio=row.nominalSpanPx/row.bodyWidthPx;
    const predictedRatio=predictedAt(samples,row.timeS);
    return {timeS:row.timeS,observedRatio,predictedRatio,
      withinMethodRange:predictedRatio>=row.methodSpanRangePx[0]/row.bodyWidthPx&&
        predictedRatio<=row.methodSpanRangePx[1]/row.bodyWidthPx};
  });
  return {
    schemaVersion:'ferrofluid-external-two-lag-check/1' as const,
    tested,trainTimesS:[...trainTimes],validationTimesS:validation.map(row=>row.timeS),
    parameters:best.parameters,trainingMse:best.trainingMse,
    validationMae:validationRows.reduce((sum,row)=>sum+Math.abs(row.predictedRatio-row.observedRatio),0)/validationRows.length,
    validationWithinMethodRange:validationRows.filter(row=>row.withinMethodRange).length,
    validationRows,
    ringPoseMeasured:false as const,
    localMagneticFieldMeasured:false as const,
    physicalInterfaceSolved:false as const,
    independentRun:false as const,
  };
}
