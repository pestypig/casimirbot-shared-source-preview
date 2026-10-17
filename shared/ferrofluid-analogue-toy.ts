import {z} from 'zod';

/** Geometry and field ratios are illustrative inputs, never device setpoints. */
export const ferrofluidAnalogueToyInputSchema=z.object({
  schemaVersion:z.literal('ferrofluid-analogue-toy-input/1'),
  sphereRadiusMm:z.number().finite().min(10).max(38),
  flaskOffsetXMm:z.number().finite().min(-12).max(12),
  plateToRingMm:z.number().finite().min(20).max(100),
  nominalDialRpm:z.number().finite().min(0).max(1800),
  plateFieldRatio:z.number().finite().min(0).max(2),
  surroundBiasXRatio:z.number().finite().min(-1).max(1),
  gravityDisplayRatio:z.number().finite().min(0).max(1),
}).strict();
export type FerrofluidAnalogueToyInput=z.infer<typeof ferrofluidAnalogueToyInputSchema>;

export const FERROFLUID_TOY_START:FerrofluidAnalogueToyInput={
  schemaVersion:'ferrofluid-analogue-toy-input/1',
  sphereRadiusMm:18,flaskOffsetXMm:0,plateToRingMm:55,nominalDialRpm:500,
  plateFieldRatio:0.2,surroundBiasXRatio:0,gravityDisplayRatio:0.15,
};

type Vector={x:number;y:number;z:number};
const add=(a:Vector,b:Vector):Vector=>({x:a.x+b.x,y:a.y+b.y,z:a.z+b.z});
const dot=(a:Vector,b:Vector)=>a.x*b.x+a.y*b.y+a.z*b.z;
const norm=(a:Vector)=>Math.sqrt(dot(a,a));
function dipoleAt(position:Vector,center:Vector,moment:Vector):Vector{
  const delta={x:position.x-center.x,y:position.y-center.y,z:position.z-center.z};
  const radius=norm(delta);
  const unit={x:delta.x/radius,y:delta.y/radius,z:delta.z/radius};
  const projection=dot(moment,unit);
  const scale=1/(radius*radius*radius);
  return {x:scale*(3*projection*unit.x-moment.x),
    y:scale*(3*projection*unit.y-moment.y),z:scale*(3*projection*unit.z-moment.z)};
}

/** A point-dipole cross-section and arbitrary ratios; no field strength, fluid solver, or current output. */
export function runFerrofluidAnalogueToy(raw:unknown){
  const input=ferrofluidAnalogueToyInputSchema.parse(raw);
  const radius=input.sphereRadiusMm;
  const ring={x:0,y:0,z:0};
  const plate={x:-input.flaskOffsetXMm,y:0,z:-input.plateToRingMm};
  const ringMoment={x:0,y:0,z:radius**3};
  const plateMoment={x:input.plateFieldRatio*input.plateToRingMm**3,y:0,z:0};
  const samples=Array.from({length:72},(_,index)=>{
    const angleRad=2*Math.PI*index/72;
    const position={x:radius*Math.sin(angleRad),y:0,z:radius*Math.cos(angleRad)};
    const field=add(add(dipoleAt(position,ring,ringMoment),
      dipoleAt(position,plate,plateMoment)),{x:input.surroundBiasXRatio,y:0,z:0});
    return {angleRad,fieldX:field.x,fieldZ:field.z,fieldMagnitude:norm(field),
      // Display-only score. Gravity is a user-chosen visual bias, not a force estimate.
      displayScore:norm(field)**2-input.gravityDisplayRatio*Math.cos(angleRad)};
  });
  const mean=samples.reduce((sum,sample)=>sum+sample.displayScore,0)/samples.length;
  const upper=samples.filter(sample=>Math.cos(sample.angleRad)>0.7);
  const lower=samples.filter(sample=>Math.cos(sample.angleRad)<-0.7);
  const average=(items:typeof samples)=>items.reduce((sum,item)=>sum+item.displayScore,0)/items.length;
  return {
    schemaVersion:'ferrofluid-analogue-toy/1' as const,input,samples,
    displayContrast:Math.max(...samples.map(sample=>sample.displayScore))-Math.min(...samples.map(sample=>sample.displayScore)),
    lowerMinusUpperDisplayScore:average(lower)-average(upper),
    meanDisplayScore:mean,nominalDriveHz:input.nominalDialRpm/60,
    pointDipoleCaution:radius/9.525<3,
    ringAxialRotationChangesIdealField:false as const,
    hasMeasuredField:false as const,hasPredictedSurface:false as const,hasActuationPlan:false as const,
  };
}
