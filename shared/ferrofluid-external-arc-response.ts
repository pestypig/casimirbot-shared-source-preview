/**
 * Image-plane response surrogate for the private IMG_8196 clip. This is a
 * deliberately dimensionless forcing proxy, NOT a field/flow reconstruction.
 * Its parameters are effective silhouette-response constants and cannot be
 * interpreted as viscosity, tension, magnetic moment, or fluid velocity.
 */
export const EXTERNAL_ARC_CLIP={
  sourceSha256:'9692FB9D3873E52B17F868C0FA29D1235FED2DCF1D58D435DC974594EED96E3B',
  durationS:15.655011,
  observations:[
    {timeS:0,bodyWidthPx:395,bodyWidthMethodRangePx:[355,409],minSpanPx:90,maxSpanPx:130,role:'fit'},
    {timeS:8,bodyWidthPx:420,bodyWidthMethodRangePx:[380,431],minSpanPx:65,maxSpanPx:100,role:'fit'},
    {timeS:10,bodyWidthPx:438,bodyWidthMethodRangePx:[382,447],minSpanPx:25,maxSpanPx:55,role:'fit'},
  ] as const,
  bodyScaleMethod:'tools/analyze_ferrofluid_external_clip.py; threshold 75 in frozen ROI on the exact private source',
  projectedFeatureSeparation:[
    {timeS:2,relativeYOverBodyWidth:1.205584},
    {timeS:3,relativeYOverBodyWidth:0.992500},
    {timeS:4,relativeYOverBodyWidth:0.789082},
    {timeS:5,relativeYOverBodyWidth:0.645161},
    {timeS:6,relativeYOverBodyWidth:0.585185},
    {timeS:7,relativeYOverBodyWidth:0.479012},
    {timeS:8,relativeYOverBodyWidth:0.471429},
    {timeS:8.5,relativeYOverBodyWidth:0.483173},
    {timeS:9,relativeYOverBodyWidth:0.508121},
    {timeS:9.5,relativeYOverBodyWidth:0.563927},
    {timeS:10,relativeYOverBodyWidth:0.593607},
  ] as const,
  bodyRelativeToCorkImageIndex:{
    method:'tools/analyze_ferrofluid_external_clip.py; detected dark-body bbox center minus cork template origin, divided by body width; body grayscale threshold 75',
    rows:[
      {timeS:2,xOverBodyWidth:0.365482,yOverBodyWidth:1.588832,corkMatchScore:1},
      {timeS:3,xOverBodyWidth:0.360000,yOverBodyWidth:1.566250,corkMatchScore:0.9979},
      {timeS:4,xOverBodyWidth:0.356079,yOverBodyWidth:1.566998,corkMatchScore:0.9968},
      {timeS:5,xOverBodyWidth:0.368486,yOverBodyWidth:1.566998,corkMatchScore:0.9958},
      {timeS:6,xOverBodyWidth:0.398765,yOverBodyWidth:1.533333,corkMatchScore:0.8627},
      {timeS:7,xOverBodyWidth:0.364198,yOverBodyWidth:1.564198,corkMatchScore:0.8510},
      {timeS:8,xOverBodyWidth:0.295238,yOverBodyWidth:1.585714,corkMatchScore:0.8622},
      {timeS:8.5,xOverBodyWidth:0.281250,yOverBodyWidth:1.649038,corkMatchScore:0.8645},
      {timeS:9,xOverBodyWidth:0.219258,yOverBodyWidth:1.640371,corkMatchScore:0.8607},
      {timeS:9.5,xOverBodyWidth:0.155251,yOverBodyWidth:1.639269,corkMatchScore:0.8493},
      {timeS:10,xOverBodyWidth:0.139269,yOverBodyWidth:1.643836,corkMatchScore:0.8653},
    ],
    pairedTwoToTenSecondXChangeByBodyThreshold:{'55':-0.269128,'65':-0.256904,'75':-0.226213,'85':-0.208440,'95':-0.209600},
    meaning:'A projected body-to-cork image index, not measured ring travel; camera, refraction, contour and template identity can change it.',
  },
  crownLineCandidates:[
    {timeS:0,bodyWidthPx:395,nominalSpanPx:119,methodSpanRangePx:[86,122]},
    {timeS:1,bodyWidthPx:397,nominalSpanPx:122,methodSpanRangePx:[120,123]},
    {timeS:2,bodyWidthPx:394,nominalSpanPx:109,methodSpanRangePx:[108,110]},
    {timeS:3,bodyWidthPx:400,nominalSpanPx:97,methodSpanRangePx:[96,133]},
    {timeS:4,bodyWidthPx:403,nominalSpanPx:105,methodSpanRangePx:[100,122]},
    {timeS:5,bodyWidthPx:403,nominalSpanPx:101,methodSpanRangePx:[98,103]},
    {timeS:6,bodyWidthPx:405,nominalSpanPx:113,methodSpanRangePx:[109,115]},
    {timeS:7,bodyWidthPx:405,nominalSpanPx:87,methodSpanRangePx:[86,90]},
    {timeS:8,bodyWidthPx:420,nominalSpanPx:86,methodSpanRangePx:[86,86]},
    {timeS:8.5,bodyWidthPx:416,nominalSpanPx:69,methodSpanRangePx:[67,70]},
    {timeS:9,bodyWidthPx:431,nominalSpanPx:63,methodSpanRangePx:[62,63]},
    {timeS:9.5,bodyWidthPx:438,nominalSpanPx:63,methodSpanRangePx:[61,63]},
    {timeS:10,bodyWidthPx:438,nominalSpanPx:54,methodSpanRangePx:[38,61]},
  ] as const,
  crownLineMethod:'tools/analyze_ferrofluid_external_clip.py; largest black-hat component in body-anchored crown ROI; kernel 25 px, threshold 22; sensitivity kernels 21/25/29 and thresholds 18/22/26',
  pairedFiveToSixSecondDirection:{sameMethodPairs:45,admitted:45,increases:27,decreases:18,ties:0,
    meaning:'exploratory image-processing method sensitivity; no robust oscillation direction'},
  lateObservation:'At about 15 s the original open loop is not visibly restored; a compact protrusion remains.',
  forcingProxy:'Image-plane magnet/cork template-origin separation divided by detected body width from 2–10 s; linearly normalized to its observed 2-s maximum and 8-s minimum. Zero before 2 s and withdrawal to zero by 11 s are explicit extrapolations. This is not a surface gap, 3-D distance or measured B.',
} as const;

export type ArcResponseParameters={
  baselineSpanOverBodyWidth:number;
  maxContractionFraction:number;
  approachTimeConstantS:number;
  recoveryTimeConstantS:number;
};

export function externalMagnetProximityProxy(timeS:number){
  if(!Number.isFinite(timeS)||timeS<0)throw new RangeError('Invalid clip time');
  const rows=EXTERNAL_ARC_CLIP.projectedFeatureSeparation;
  if(timeS<=rows[0].timeS)return 0;
  const far=rows[0].relativeYOverBodyWidth;
  const near=rows.find(row=>row.timeS===8)!.relativeYOverBodyWidth;
  const convert=(separation:number)=>Math.max(0,Math.min(1,(far-separation)/(far-near)));
  for(let index=1;index<rows.length;index++){
    if(timeS<=rows[index].timeS){
      const a=rows[index-1],b=rows[index];
      const fraction=(timeS-a.timeS)/(b.timeS-a.timeS);
      return convert(a.relativeYOverBodyWidth+(b.relativeYOverBodyWidth-a.relativeYOverBodyWidth)*fraction);
    }
  }
  if(timeS<11)return convert(rows[rows.length-1].relativeYOverBodyWidth)*(11-timeS);
  return 0;
}

export function simulateExternalArcResponse(parameters:ArcResponseParameters,stepS=0.05){
  const {baselineSpanOverBodyWidth,maxContractionFraction,approachTimeConstantS,recoveryTimeConstantS}=parameters;
  if(![baselineSpanOverBodyWidth,maxContractionFraction,approachTimeConstantS,recoveryTimeConstantS,stepS].every(Number.isFinite)||
    baselineSpanOverBodyWidth<=0||maxContractionFraction<0||maxContractionFraction>1||
    approachTimeConstantS<=0||recoveryTimeConstantS<=0||stepS<=0||stepS>0.1){
    throw new RangeError('Invalid response surrogate parameters');
  }
  const samples:{timeS:number;proximityProxy:number;response:number;openLoopSpanOverBodyWidth:number}[]=[];
  let response=0;
  const steps=Math.ceil(EXTERNAL_ARC_CLIP.durationS/stepS);
  for(let index=0;index<=steps;index++){
    const timeS=Math.min(index*stepS,EXTERNAL_ARC_CLIP.durationS);
    const proximityProxy=externalMagnetProximityProxy(timeS);
    if(index){
      const priorTimeS=Math.min((index-1)*stepS,EXTERNAL_ARC_CLIP.durationS);
      const intervalS=timeS-priorTimeS;
      const tau=proximityProxy>=response?approachTimeConstantS:recoveryTimeConstantS;
      response+= (proximityProxy-response)*(1-Math.exp(-intervalS/tau));
    }
    samples.push({timeS,proximityProxy,response,
      openLoopSpanOverBodyWidth:baselineSpanOverBodyWidth*(1-maxContractionFraction*response)});
  }
  return samples;
}

function valueAt(samples:ReturnType<typeof simulateExternalArcResponse>,timeS:number){
  const index=Math.round(timeS/(samples[1]?.timeS??0.05));
  return samples[Math.min(index,samples.length-1)].openLoopSpanOverBodyWidth;
}

function* parameterGrid():Generator<ArcResponseParameters>{
  for(const baselineSpanOverBodyWidth of [0.25,0.28,0.3,0.33])
  for(const maxContractionFraction of [0.6,0.7,0.8,0.9,1])
  for(const approachTimeConstantS of [0.5,1,1.5,2,3,4])
  for(const recoveryTimeConstantS of [2,4,8,12,20])
    yield {baselineSpanOverBodyWidth,maxContractionFraction,approachTimeConstantS,recoveryTimeConstantS};
}

/** Grid fit to three exploratory intervals; never an identified physical solve. */
export function fitExternalArcImagePlane(){
  const admissible:{parameters:ArcResponseParameters;centerError:number;spanRatios:number[]}[]=[];
  const allCandidates:{parameters:ArcResponseParameters;spanRatios:number[]}[]=[];
  let tested=0;
  let thresholdEnvelopeCompatibleCount=0;
  for(const parameters of parameterGrid()){
    tested++;
    const samples=simulateExternalArcResponse(parameters);
    const spanRatios=EXTERNAL_ARC_CLIP.observations.map(o=>valueAt(samples,o.timeS));
    allCandidates.push({parameters,spanRatios});
    if(spanRatios.every((span,index)=>{
      const observation=EXTERNAL_ARC_CLIP.observations[index];
      return span>=observation.minSpanPx/observation.bodyWidthMethodRangePx[1]&&
        span<=observation.maxSpanPx/observation.bodyWidthMethodRangePx[0];
    }))thresholdEnvelopeCompatibleCount++;
    if(!spanRatios.every((span,index)=>span>=EXTERNAL_ARC_CLIP.observations[index].minSpanPx/EXTERNAL_ARC_CLIP.observations[index].bodyWidthPx&&
      span<=EXTERNAL_ARC_CLIP.observations[index].maxSpanPx/EXTERNAL_ARC_CLIP.observations[index].bodyWidthPx))continue;
    const centerError=spanRatios.reduce((sum,span,index)=>{
      const observation=EXTERNAL_ARC_CLIP.observations[index];
      const center=(observation.minSpanPx+observation.maxSpanPx)/(2*observation.bodyWidthPx);
      return sum+((span-center)/((observation.maxSpanPx-observation.minSpanPx)/observation.bodyWidthPx))**2;
    },0);
    admissible.push({parameters,centerError,spanRatios});
  }
  admissible.sort((a,b)=>a.centerError-b.centerError);
  const representative=admissible[0]??null;
  const predictionsAt15S=admissible.map(candidate=>valueAt(simulateExternalArcResponse(candidate.parameters),15));
  const predictedRatioRangeAt15S=predictionsAt15S.length?
    [Math.min(...predictionsAt15S),Math.max(...predictionsAt15S)] as const:null;
  const withinClipLeaveOneOut=EXTERNAL_ARC_CLIP.observations.map((heldOut,index)=>{
    const trainingCompatible=allCandidates.filter(candidate=>EXTERNAL_ARC_CLIP.observations.every((observation,j)=>
      j===index||(candidate.spanRatios[j]>=observation.minSpanPx/observation.bodyWidthPx&&
        candidate.spanRatios[j]<=observation.maxSpanPx/observation.bodyWidthPx)));
    const heldOutCompatible=trainingCompatible.filter(candidate=>candidate.spanRatios[index]>=heldOut.minSpanPx/heldOut.bodyWidthPx&&
      candidate.spanRatios[index]<=heldOut.maxSpanPx/heldOut.bodyWidthPx);
    const predictions=trainingCompatible.map(candidate=>candidate.spanRatios[index]);
    return {heldOutTimeS:heldOut.timeS,trainingCompatibleCount:trainingCompatible.length,
      heldOutCompatibleCount:heldOutCompatible.length,
      predictedRatioRange:predictions.length?[Math.min(...predictions),Math.max(...predictions)] as const:null};
  });
  const crownLineFrameCheck=representative?EXTERNAL_ARC_CLIP.crownLineCandidates.map(row=>{
    const predictedRatio=valueAt(simulateExternalArcResponse(representative.parameters),row.timeS);
    const observedRatio=row.nominalSpanPx/row.bodyWidthPx;
    return {timeS:row.timeS,usedInThreeIntervalFit:EXTERNAL_ARC_CLIP.observations.some(o=>o.timeS===row.timeS),
      observedRatio,predictedRatio,residualRatio:predictedRatio-observedRatio,
      withinCrownMethodRange:predictedRatio>=row.methodSpanRangePx[0]/row.bodyWidthPx&&
        predictedRatio<=row.methodSpanRangePx[1]/row.bodyWidthPx};
  }):[];
  const outOfFitRows=crownLineFrameCheck.filter(row=>!row.usedInThreeIntervalFit);
  const outOfFitMae=outOfFitRows.length?
    outOfFitRows.reduce((sum,row)=>sum+Math.abs(row.residualRatio),0)/outOfFitRows.length:null;
  const constantBaselineMae=outOfFitRows.length&&representative?
    outOfFitRows.reduce((sum,row)=>sum+Math.abs(representative.parameters.baselineSpanOverBodyWidth-row.observedRatio),0)/outOfFitRows.length:null;
  return {
    schemaVersion:'ferrofluid-external-arc-image-plane-fit/1' as const,
    tested,admissibleCount:admissible.length,thresholdEnvelopeCompatibleCount,
    representative,predictedRatioRangeAt15S,withinClipLeaveOneOut,
    crownLineFrameCheck,outOfFitMae,constantBaselineMae,
    independentValidation:false as const,
    measuredFieldInput:false as const,
    measuredMagnetDistanceInput:false as const,
    predictsPhysicalArc:false as const,
    identifiesMechanism:false as const,
  };
}

/** Exploratory optical-fit check; even-second training, other frames held out within the same clip. */
export function fitExternalArcCrownTimeSeries(){
  const rows=EXTERNAL_ARC_CLIP.crownLineCandidates;
  const trainTimes=new Set([0,2,4,6,8,10]);
  const training=rows.filter(row=>trainTimes.has(row.timeS));
  const validation=rows.filter(row=>!trainTimes.has(row.timeS));
  let best:{parameters:ArcResponseParameters;trainingMse:number}|null=null;
  let tested=0;
  for(const parameters of parameterGrid()){
    tested++;
    const simulated=simulateExternalArcResponse(parameters);
    const mse=training.reduce((sum,row)=>{
      const observed=row.nominalSpanPx/row.bodyWidthPx;
      return sum+(valueAt(simulated,row.timeS)-observed)**2;
    },0)/training.length;
    if(!best||mse<best.trainingMse)best={parameters,trainingMse:mse};
  }
  if(!best)throw new Error('Empty response grid');
  const simulated=simulateExternalArcResponse(best.parameters);
  const nullBaseline=training.reduce((sum,row)=>sum+row.nominalSpanPx/row.bodyWidthPx,0)/training.length;
  const validationRows=validation.map(row=>{
    const observed=row.nominalSpanPx/row.bodyWidthPx;
    const predicted=valueAt(simulated,row.timeS);
    return {timeS:row.timeS,observedRatio:observed,predictedRatio:predicted,
      withinMethodRange:predicted>=row.methodSpanRangePx[0]/row.bodyWidthPx&&
        predicted<=row.methodSpanRangePx[1]/row.bodyWidthPx};
  });
  return {
    schemaVersion:'ferrofluid-external-crown-series-check/1' as const,
    tested,trainTimesS:[...trainTimes],validationTimesS:validation.map(row=>row.timeS),
    parameters:best.parameters,trainingMse:best.trainingMse,
    validationMae:validationRows.reduce((sum,row)=>sum+Math.abs(row.predictedRatio-row.observedRatio),0)/validationRows.length,
    nullBaselineValidationMae:validationRows.reduce((sum,row)=>sum+Math.abs(nullBaseline-row.observedRatio),0)/validationRows.length,
    validationWithinMethodRange:validationRows.filter(row=>row.withinMethodRange).length,
    validationRows,
    independentRun:false as const,
    crownLineIdentityManuallyConfirmedAtEveryFrame:false as const,
    physicallyCalibrated:false as const,
  };
}
