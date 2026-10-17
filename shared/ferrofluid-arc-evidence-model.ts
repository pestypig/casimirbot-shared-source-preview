import {z} from 'zod';

const PLATE_TO_RING_BOUNDS_MM=[20,100] as const;

/** Research inputs are candidate geometry, not recovered apparatus measurements. */
export const ferrofluidArcEvidenceInputSchema=z.object({
  schemaVersion:z.literal('ferrofluid-arc-evidence-input/1'),
  plateToRingMm:z.number().finite().min(PLATE_TO_RING_BOUNDS_MM[0]).max(PLATE_TO_RING_BOUNDS_MM[1]),
  candidateOffsetMm:z.number().finite().min(-60).max(60),
  candidateLineLengthMm:z.number().finite().min(20).max(100),
  candidateLineTensionN:z.number().finite().positive().max(0.2),
  lineDiameterMm:z.number().finite().min(0.1).max(1),
  assumedNylonDensityKgM3:z.number().finite().min(900).max(1500),
  ringMassG:z.number().finite().min(1).max(20),
  candidateCoupledModeHz:z.number().finite().min(20).max(40),
  candidateDampingRatio:z.number().finite().min(0.005).max(0.5),
}).strict();
export type FerrofluidArcEvidenceInput=z.infer<typeof ferrofluidArcEvidenceInputSchema>;

export const FERROFLUID_ARC_EVIDENCE_START:FerrofluidArcEvidenceInput={
  schemaVersion:'ferrofluid-arc-evidence-input/1',
  plateToRingMm:55,
  candidateOffsetMm:27.5,
  candidateLineLengthMm:50,
  candidateLineTensionN:0.05,
  lineDiameterMm:0.45,
  assumedNylonDensityKgM3:1140,
  ringMassG:5.09,
  candidateCoupledModeHz:32.46,
  candidateDampingRatio:0.05,
};

/** Source identities and observations; no private media bytes are bundled. */
export const FERROFLUID_ARC_EVIDENCE={
  magnetometer:{
    sourceUrl:'https://drive.google.com/file/d/1CN2kiOEaU2rsQDE2nLnRJ3yYGKLzIntZ/view?usp=drivesdk',
    sha256:'F546B54109D6EB49BF637EFC1777103AAD3F0E0EDF0705D4F73209E047B4062C',
    sampleCount:59559,durationS:594.809,
    earlierHz:28.98,earlierWindowS:[200,230] as const,
    transitionWindowS:[230,240] as const,
    laterHz:32.46,laterWindowS:[270,300] as const,
    shutdownWindowS:[586,588] as const,
    units:'CSV units; header omits unit',
    temporalHoldout:{
      analysisScript:'tools/analyze_ferrofluid_magnetometer.py',
      channel:'Bz',segmentLengthS:10,frequencyGridStepHz:0.02,
      trainingWindowS:[270,550] as const,
      trainingFrequencyRangeHz:[32.44,32.48] as const,
      trainingMedianHz:32.46,
      heldOutWindowS:[550,580] as const,
      heldOutFrequenciesHz:[32.46,32.48,32.48] as const,
      withinTrainingRange:true,
      independentRun:false,
      arcLabeledInCsv:false,
    },
    vectorEllipse:{
      analysisScript:'tools/analyze_ferrofluid_magnetometer.py',
      quantity:'3D phone-vector harmonic ellipse minor/major axis ratio',
      windows:[
        {startS:200,endS:230,frequencyHz:28.98,majorAxisAppUnits:5.5105,minorOverMajor:0.5258,vectorVarianceExplained:0.4535},
        {startS:270,endS:300,frequencyHz:32.46,majorAxisAppUnits:4.4915,minorOverMajor:0.5321,vectorVarianceExplained:0.5375},
        {startS:300,endS:330,frequencyHz:32.46,majorAxisAppUnits:4.9669,minorOverMajor:0.5356,vectorVarianceExplained:0.6873},
        {startS:550,endS:580,frequencyHz:32.48,majorAxisAppUnits:4.2190,minorOverMajor:0.5365,vectorVarianceExplained:0.4838},
      ],
      trainingWindowS:[270,550] as const,
      trainingRatioRange:[0.5304,0.5410] as const,
      heldOutWindowS:[550,580] as const,
      heldOutRatios:[0.5363,0.5361,0.5318] as const,
      heldOutWithinTrainingRange:true,
      trainingMajorAxisAppUnitsRange:[4.7306,5.1583] as const,
      heldOutMajorAxisAppUnits:[5.1045,4.8954,4.6190] as const,
      heldOutMajorAxisWithinTrainingRange:false,
      fieldUnit:'app-reported; CSV header omits unit' as const,
      phoneAxesFixedDuringWindow:'owner-reported-not-instrument-verified' as const,
      rotorIdentified:false,
      independentReplication:false,
    },
  },
  ownerReport:{stableArcStartS:270,stableArcUntilAtLeastS:582,
    flaskOffAxis:true,dialMayHaveMovedDuringSearch:true,
    phoneFromPlateCenterMmApprox:177.8},
  arcClip:{sha256:'3038BFDAFFB3DF62C9BF7668F9B146442A670D427F602C193DA7411003A7767D',
    durationS:17.981678,sameRunAsCsv:'not-established' as const,
    containerCreationTimeUtc:'2026-10-02T16:03:30.000000Z' as const,
    csvFilenameDate:'2026-10-04' as const,
    sourceClockCrossValidated:false as const,
    cameraFramingStable:false as const,
    pixelTrajectoryCalibrated:false as const,
    observations:[
      {timeS:0.5,label:'short hook'},
      {timeS:3,label:'hook extends'},
      {timeS:6,label:'arched protrusion'},
      {timeS:10,label:'apparent longer arch'},
      {timeS:15,label:'arch not reliably resolved after reframing'},
    ]},
  stills:[
    {role:'driven side view',sha256:'C64387839EBDF8A223A25365F1399C67A11D2ABEC73A5F52A6C92AB1DBB9CF56'},
    {role:'top placement view',sha256:'80B3FD648187E502F1B7D9D469AF8F9F2E3DC1E672428CD4DB82313D036A1284'},
    {role:'zero-RPM rest view',sha256:'161465EC4FB5DBC4DFC33F09257CC949D541CEC67434E62655917DD68014D2BF'},
    {role:'arc still',sha256:'831B673F183D9517CAAA6C90D7AB4FA782ECDB9FC4CAA94887DE0164473119D6'},
    {role:'phone setup view',sha256:'9E49ECBB7358FABD3DBFC191DB2AAA86E3DE6C9A21BC08D3A520702E7A2FFA85'},
  ],
} as const;

/** Competing explanations remain unresolved until the stated controls are run. */
export const FERROFLUID_ARC_HYPOTHESES=[
  {
    id:'offset-field-gradient',
    mechanism:'Off-axis rotating field creates an asymmetric, phase-varying field gradient near the ring and interface.',
    discriminatingControl:'At matched measured drive and fill, compare centered, positive-offset, and negative-offset placements; map local vector field without the flask.',
    expectedIfImportant:'A repeatable orientation or onset change follows offset, with a mirror tendency when offset sign reverses.',
  },
  {
    id:'line-ring-mode',
    mechanism:'Magnetic torque or force drives a coupled nylon-line, swivel, ring, and fluid mode.',
    discriminatingControl:'Change only free line span or ring load, then measure ring/string motion and onset frequency with a fixed camera.',
    expectedIfImportant:'A mode-linked onset shifts with span, tension, or ring loading; the dry-string calculation is only a limiting case.',
  },
  {
    id:'fluid-interface-circulation',
    mechanism:'Magnetic forcing and viscous/interfacial dynamics create a protrusion or circulation path with possible hysteresis.',
    discriminatingControl:'At fixed offset, sweep measured drive up and down slowly, record the interface and safe passive tracers if compatible with the fluid.',
    expectedIfImportant:'Onset/decay may lag the drive, differ by sweep direction, or persist briefly after a drive change.',
  },
] as const;

const G=9.80665;

/** Unit-force, unit-static-stiffness response of a hypothetical linear mode. */
export function normalizedModeResponse(driveHz:number,naturalHz:number,dampingRatio:number){
  if(!Number.isFinite(driveHz)||driveHz<0||!Number.isFinite(naturalHz)||naturalHz<=0||
    !Number.isFinite(dampingRatio)||dampingRatio<=0)throw new RangeError('Invalid mode-response parameters');
  const ratio=driveHz/naturalHz;
  return 1/Math.hypot(1-ratio*ratio,2*dampingRatio*ratio);
}

/**
 * Point-dipole geometry: rotating horizontal plate moment below the ring.
 * Ratio is the amplitude of B_z at (offset, 0, height) to the horizontal
 * B amplitude on the plate axis at that height. It is NOT a force, measured
 * local field, or jet likelihood. The ideal maximum is at |offset|=height/2.
 */
export function idealVerticalFieldRatio(offsetMm:number,heightMm:number){
  const x=Math.abs(offsetMm)/heightMm;
  return 3*x/(1+x*x)**2.5;
}

/** ∂B_z/∂x normalized by the horizontal plate dipole's field scale / height. */
export function idealHorizontalGradientRatio(offsetMm:number,heightMm:number){
  const x=Math.abs(offsetMm)/heightMm;
  return 3*(1-4*x*x)/(1+x*x)**3.5;
}

/** ∂B_z/∂z on the signed offset axis, using the same force-gradient scale. */
export function idealVerticalGradientRatio(offsetMm:number,heightMm:number){
  const x=offsetMm/heightMm;
  return x===0?0:3*x*(x*x-4)/(1+x*x)**3.5;
}

function offsetAtFractionOfPeak(fraction:number,side:'near'|'far'){
  const target=fraction*idealVerticalFieldRatio(0.5,1);
  let low=side==='near'?0:0.5;
  let high=side==='near'?0.5:2;
  for(let index=0;index<60;index++){
    const middle=(low+high)/2;
    const belowTarget=idealVerticalFieldRatio(middle,1)<target;
    if(belowTarget===(side==='near'))low=middle;
    else high=middle;
  }
  return (low+high)/2;
}

/** Geometry sensitivity and a dry-string check, never an arc prediction. */
export function runFerrofluidArcEvidenceModel(raw:unknown){
  const input=ferrofluidArcEvidenceInputSchema.parse(raw);
  const measuredFrequencyHz=FERROFLUID_ARC_EVIDENCE.magnetometer.laterHz;
  const lineLengthM=input.candidateLineLengthMm/1000;
  const lineDiameterM=input.lineDiameterMm/1000;
  const lineMassPerLengthKgM=Math.PI*(lineDiameterM/2)**2*input.assumedNylonDensityKgM3;
  const requiredDryStringTensionN=lineMassPerLengthKgM*(2*lineLengthM*measuredFrequencyHz)**2;
  const dryStringFundamentalHz=Math.sqrt(input.candidateLineTensionN/lineMassPerLengthKgM)/(2*lineLengthM);
  const ringWeightN=(input.ringMassG/1000)*G;
  const pendulumFrequencyHz=Math.sqrt(G/lineLengthM)/(2*Math.PI);
  const verticalFieldRatio=idealVerticalFieldRatio(input.candidateOffsetMm,input.plateToRingMm);
  const horizontalGradientRatio=idealHorizontalGradientRatio(input.candidateOffsetMm,input.plateToRingMm);
  const verticalGradientRatio=idealVerticalGradientRatio(input.candidateOffsetMm,input.plateToRingMm);
  const peakOffsetMm=input.plateToRingMm/2;
  const offsetSweep=Array.from({length:51},(_,index)=>{
    const offsetMm=index*input.plateToRingMm/50;
    return {
      offsetMm,
      relativeVerticalFieldAmplitude:idealVerticalFieldRatio(offsetMm,input.plateToRingMm),
      normalizedHorizontalGradientMagnitude:Math.abs(idealHorizontalGradientRatio(offsetMm,input.plateToRingMm))/3,
      normalizedVerticalGradientMagnitude:Math.abs(idealVerticalGradientRatio(offsetMm,input.plateToRingMm))/3,
    };
  });
  const signedAmplitude=Math.sign(input.candidateOffsetMm)*verticalFieldRatio;
  const phaseSamples=Array.from({length:49},(_,index)=>{
    const phaseRad=2*Math.PI*index/48;
    return {phaseRad,relativeVerticalField:signedAmplitude*Math.cos(phaseRad)};
  });
  const lineSpanSweep=[20,50,100].map(lengthMm=>({
    lengthMm,
    requiredDryTensionN:lineMassPerLengthKgM*(2*(lengthMm/1000)*measuredFrequencyHz)**2,
  }));
  const earlierModeResponse=normalizedModeResponse(FERROFLUID_ARC_EVIDENCE.magnetometer.earlierHz,
    input.candidateCoupledModeHz,input.candidateDampingRatio);
  const laterModeResponse=normalizedModeResponse(FERROFLUID_ARC_EVIDENCE.magnetometer.laterHz,
    input.candidateCoupledModeHz,input.candidateDampingRatio);
  if(![requiredDryStringTensionN,dryStringFundamentalHz,ringWeightN,pendulumFrequencyHz,verticalFieldRatio,horizontalGradientRatio,verticalGradientRatio].every(Number.isFinite)){
    throw new RangeError('Ferrofluid evidence-model sweep exceeded finite numerical range');
  }
  return {
    schemaVersion:'ferrofluid-arc-evidence-model/1' as const,
    input,
    measuredFrequencyHz,
    assumption:'phone dominant frequency equals the relevant plate-drive frequency; unverified pole count and aliasing' as const,
    geometry:{
      candidateOffsetOverHeight:input.candidateOffsetMm/input.plateToRingMm,
      relativeVerticalFieldAmplitude:verticalFieldRatio,
      signedHorizontalGradientRatio:horizontalGradientRatio,
      signedVerticalGradientRatio:verticalGradientRatio,
      idealForceDirectionDeg:Math.atan2(verticalGradientRatio,horizontalGradientRatio)*180/Math.PI,
      peakIdealVerticalFieldOffsetMm:peakOffsetMm,
      ninetyPercentPeakBandMm:[offsetAtFractionOfPeak(0.9,'near')*input.plateToRingMm,offsetAtFractionOfPeak(0.9,'far')*input.plateToRingMm] as const,
      offsetSweep,phaseSamples,
    },
    dryLineCheck:{
      assumedLineMassPerLengthKgM:lineMassPerLengthKgM,
      assumedFundamentalHz:dryStringFundamentalHz,
      tensionRequiredForMeasuredHzN:requiredDryStringTensionN,
      ringWeightInAirN:ringWeightN,
      requiredTensionOverRingWeight:requiredDryStringTensionN/ringWeightN,
      idealPendulumHz:pendulumFrequencyHz,
      lineSpanSweep,
    },
    coupledModeSensitivity:{
      basis:'hypothesis-only, equal force amplitudes at both phone frequencies and a linear time-invariant single mode' as const,
      earlierNormalizedResponse:earlierModeResponse,
      laterNormalizedResponse:laterModeResponse,
      laterOverEarlierResponse:laterModeResponse/earlierModeResponse,
      qualityFactor:1/(2*input.candidateDampingRatio),
      naturalFrequencyMeasured:false as const,
      forceAmplitudeRatioMeasured:false as const,
      phoneFrequencyEqualsModeDriveMeasured:false as const,
      predictsArcOnset:false as const,
    },
    scenarioBounds:{
      meaning:'schema-bounded scenario envelope; not measurement uncertainty or a statistical confidence interval' as const,
      allowedHeightMm:PLATE_TO_RING_BOUNDS_MM,
      idealPeakOffsetMm:[PLATE_TO_RING_BOUNDS_MM[0]/2,PLATE_TO_RING_BOUNDS_MM[1]/2] as const,
      ninetyPercentPeakOffsetEnvelopeMm:[offsetAtFractionOfPeak(0.9,'near')*PLATE_TO_RING_BOUNDS_MM[0],offsetAtFractionOfPeak(0.9,'far')*PLATE_TO_RING_BOUNDS_MM[1]] as const,
    },
    comparison:{
      videoAndCsvSynchronized:false as const,
      numericOffsetMeasured:false as const,
      lineTensionMeasured:false as const,
      localFieldGradientMeasured:false as const,
      hasPredictedJet:false as const,
      hasPredictedMaterialReturn:false as const,
      hasSolarReconnectionEvidence:false as const,
      hasActuationPlan:false as const,
    },
  };
}
