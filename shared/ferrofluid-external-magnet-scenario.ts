import {z} from 'zod';

const MU0=4*Math.PI*1e-7;
type Vec3=readonly [number,number,number];
const vec3=z.tuple([z.number().finite(),z.number().finite(),z.number().finite()]);

/** SI-coordinate, far-field scenario; not a recovered field inside the flask. */
export const externalMagnetScenarioSchema=z.object({
  schemaVersion:z.literal('ferrofluid-external-magnet-scenario/1'),
  sourceId:z.string().trim().min(1).max(160),
  magnetCenterM:vec3,
  magneticMomentAm2:vec3,
  largestMagnetDimensionM:z.number().finite().positive(),
  crownPositionM:vec3,
  ringPositionM:vec3,
  ringMomentAm2:vec3,
}).strict();
export type ExternalMagnetScenario=z.infer<typeof externalMagnetScenarioSchema>;

const add=(a:Vec3,b:Vec3):Vec3=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]];
const sub=(a:Vec3,b:Vec3):Vec3=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]];
const scale=(a:Vec3,k:number):Vec3=>[a[0]*k,a[1]*k,a[2]*k];
const dot=(a:Vec3,b:Vec3)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const norm=(a:Vec3)=>Math.hypot(...a);
const cross=(a:Vec3,b:Vec3):Vec3=>[
  a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0],
];

/** Ideal point-dipole field in vacuum; invalid at/near the real magnet. */
export function idealDipoleFieldTesla(momentAm2:Vec3,displacementM:Vec3):Vec3{
  const r=norm(displacementM);
  if(!Number.isFinite(r)||r<=0||!Number.isFinite(norm(momentAm2)))throw new RangeError('Invalid dipole field input');
  const direction=scale(displacementM,1/r);
  const field=scale(sub(scale(direction,3*dot(momentAm2,direction)),momentAm2),MU0/(4*Math.PI*r**3));
  if(!field.every(Number.isFinite))throw new RangeError('Dipole field exceeds finite numerical range');
  return field;
}

/** Uniform remanence approximation to the far-field moment of an axial ring. */
export function idealAxialRingMomentAm2(outerDiameterM:number,innerDiameterM:number,thicknessM:number,remanenceTesla:number){
  if(![outerDiameterM,innerDiameterM,thicknessM,remanenceTesla].every(Number.isFinite)||
    outerDiameterM<=0||innerDiameterM<0||innerDiameterM>=outerDiameterM||thicknessM<=0||remanenceTesla<=0){
    throw new RangeError('Invalid ideal ring dimensions or remanence');
  }
  return remanenceTesla*Math.PI*(outerDiameterM**2-innerDiameterM**2)*thicknessM/(4*MU0);
}

/**
 * Exact point-dipole scaling degeneracy. Scaling an unknown source moment by
 * lambda^3 and its unknown separation by lambda preserves B at one point,
 * while the local spatial gradient scales as 1/lambda. It does not infer the
 * source moment, separation, gradient or fluid force from an image.
 */
export function idealDipoleScaleDegeneracy(momentAm2:Vec3,displacementM:Vec3,lambda:number){
  if(!Number.isFinite(lambda)||lambda<=0||norm(momentAm2)<=0||norm(displacementM)<=0){
    throw new RangeError('Invalid dipole scale-degeneracy input');
  }
  const baselineField=idealDipoleFieldTesla(momentAm2,displacementM);
  const scaledMoment=scale(momentAm2,lambda**3);
  const scaledDisplacement=scale(displacementM,lambda);
  const scaledField=idealDipoleFieldTesla(scaledMoment,scaledDisplacement);
  return {
    schemaVersion:'ferrofluid-ideal-dipole-scale-degeneracy/1' as const,
    lambda,baselineFieldTesla:baselineField,scaledFieldTesla:scaledField,
    baselineSourceMomentAm2:momentAm2,scaledSourceMomentAm2:scaledMoment,
    baselineDisplacementM:displacementM,scaledDisplacementM:scaledDisplacement,
    exactGradientMagnitudeRatio:1/lambda,
    measuredMagnetGeometry:false as const,
    measuredField:false as const,
    inferredForce:false as const,
  };
}

/**
 * Evaluates only the handheld magnet's ideal far-field contribution and its
 * possible torque/force on an ideal ring dipole. No plate or ferrofluid field,
 * magnetization law, flow, jet or arc morphology is inferred.
 */
export function evaluateExternalMagnetScenario(raw:unknown){
  const input=externalMagnetScenarioSchema.parse(raw);
  if(norm(input.magneticMomentAm2)<=0||norm(input.ringMomentAm2)<=0){
    throw new RangeError('Magnetic moments must be nonzero');
  }
  const crownSeparation=sub(input.crownPositionM,input.magnetCenterM);
  const ringSeparation=sub(input.ringPositionM,input.magnetCenterM);
  const crownDistanceM=norm(crownSeparation);
  const ringDistanceM=norm(ringSeparation);
  if(crownDistanceM<=0||ringDistanceM<=0)throw new RangeError('An evaluation point coincides with the source');
  const crownFieldTesla=idealDipoleFieldTesla(input.magneticMomentAm2,crownSeparation);
  const ringFieldTesla=idealDipoleFieldTesla(input.magneticMomentAm2,ringSeparation);
  const ringTorqueNm=cross(input.ringMomentAm2,ringFieldTesla);
  // Central difference of U = -m_ring · B_external. This is an ideal, fixed-orientation force only.
  const h=Math.min(1e-4,ringDistanceM/1000);
  const forceN=[0,1,2].map(axis=>{
    const delta:Vec3=axis===0?[h,0,0]:axis===1?[0,h,0]:[0,0,h];
    const plus=idealDipoleFieldTesla(input.magneticMomentAm2,add(ringSeparation,delta));
    const minus=idealDipoleFieldTesla(input.magneticMomentAm2,sub(ringSeparation,delta));
    return dot(input.ringMomentAm2,sub(plus,minus))/(2*h);
  }) as [number,number,number];
  return {
    schemaVersion:'ferrofluid-external-magnet-result/1' as const,
    sourceId:input.sourceId,
    crown:{sourceDistanceM:crownDistanceM,fieldTesla:crownFieldTesla,fieldMagnitudeTesla:norm(crownFieldTesla),
      separationOverSourceSize:crownDistanceM/input.largestMagnetDimensionM},
    ring:{sourceDistanceM:ringDistanceM,fieldTesla:ringFieldTesla,fieldMagnitudeTesla:norm(ringFieldTesla),
      separationOverSourceSize:ringDistanceM/input.largestMagnetDimensionM,
      idealTorqueNm:ringTorqueNm,idealForceN:forceN},
    farFieldHeuristicMet:crownDistanceM>=3*input.largestMagnetDimensionM&&
      ringDistanceM>=3*input.largestMagnetDimensionM,
    hasMeasuredExternalField:false as const,
    hasMeasuredTotalField:false as const,
    hasMeasuredRingPose:false as const,
    hasPredictedArc:false as const,
    hasPredictedJet:false as const,
  };
}
