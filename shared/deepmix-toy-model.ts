/** Reduced-order exploration only. The hazard law is arbitrary, not a stellar-transition rate. */
import {z} from 'zod';
export const DEEPMIX_TOY_ENGINE_VERSION='deepmix-one-zone-toy/1' as const;
export type DeepMixToyPresetId='sweetspot-legacy/1'|'globe-legacy/1';
export type DeepMixToyParams={
  Mc:number;Xe:number;Xc0:number;eps:number;h0:number;beta:number;Xthr:number;
  trip:{T:number;dt:number;Mtrip:number;mdotMax?:number;guard?:{X:number;band:number}};
  Lc:(Xc:number)=>number;
};
export type DeepMixToyPoint={t:number;Xc:number;Lc:number;h:number;P:number;mdot:number};

export const DEEPMIX_TOY_PRESETS:Record<DeepMixToyPresetId,Omit<DeepMixToyParams,'Lc'>>={
  'sweetspot-legacy/1':{Mc:3.5e29,Xe:0.70,Xc0:0.34,eps:6.3e14,h0:1e-11,beta:60,Xthr:0.30,
    trip:{T:2,dt:0.05,Mtrip:1e18,guard:{X:0.32,band:0.01}}},
  'globe-legacy/1':{Mc:5e22,Xe:0.70,Xc0:0.34,eps:6.3e14,h0:0.002,beta:14,Xthr:0.31,
    trip:{T:0.8,dt:0.5,Mtrip:1e23,guard:{X:0.32,band:0.02}}},
};

/** Versioned luminosity recipes are part of preset identity; never serialize a JS closure as provenance. */
export function deepMixToyParamsForPreset(presetId:DeepMixToyPresetId):DeepMixToyParams{
  const preset=DEEPMIX_TOY_PRESETS[presetId];
  if(presetId==='sweetspot-legacy/1')return {...preset,
    Lc:(Xc:number)=>3.5e26*Math.pow(Math.max(1e-6,Xc/preset.Xc0),0.6)};
  return {...preset,Lc:(Xc:number)=>3.6e26*Math.pow(preset.Xc0/Math.max(1e-4,Xc),0.85)};
}

function requireFinitePositive(name:string,value:number){
  if(!Number.isFinite(value)||value<=0)throw new Error(`DEEPMIX_TOY_INVALID_${name}`);
}
export function validateDeepMixToyParams(p:DeepMixToyParams){
  for(const [name,value] of Object.entries({Mc:p.Mc,eps:p.eps,T:p.trip.T,dt:p.trip.dt}))
    requireFinitePositive(name,value);
  for(const [name,value] of Object.entries({Xe:p.Xe,Xc0:p.Xc0,Xthr:p.Xthr}))
    if(!Number.isFinite(value)||value<0||value>1)throw new Error(`DEEPMIX_TOY_INVALID_${name}`);
  for(const [name,value] of Object.entries({h0:p.h0,beta:p.beta,Mtrip:p.trip.Mtrip,mdotMax:p.trip.mdotMax??0}))
    if(!Number.isFinite(value)||value<0)throw new Error(`DEEPMIX_TOY_INVALID_${name}`);
  if(p.trip.dt>p.trip.T)throw new Error('DEEPMIX_TOY_TRIP_DURATION_EXCEEDS_PERIOD');
  if(p.trip.guard&&(!Number.isFinite(p.trip.guard.X)||p.trip.guard.X<0||p.trip.guard.X>1||
    !Number.isFinite(p.trip.guard.band)||p.trip.guard.band<=0))throw new Error('DEEPMIX_TOY_INVALID_GUARD');
}

/** Euler composition bookkeeping plus a dimensionless accumulation of an assumed hazard law. */
export function simulateDeepMixToy(p:DeepMixToyParams,horizonYears:number,stepYears:number):DeepMixToyPoint[]{
  validateDeepMixToyParams(p);requireFinitePositive('STEP',stepYears);
  if(!Number.isFinite(horizonYears)||horizonYears<0||horizonYears>10_000||
    Math.ceil(horizonYears/stepYears)>50_000)throw new Error('DEEPMIX_TOY_INVALID_HORIZON');
  const yearSeconds=365.25*24*3600,out:DeepMixToyPoint[]=[];
  let Xc=p.Xc0,integratedHazard=0,t=0;
  while(true){
    if(horizonYears-t<1e-10)t=horizonYears;
    const luminosity=p.Lc(Xc);
    requireFinitePositive('LUMINOSITY',luminosity);
    const elapsedInPeriod=t%p.trip.T;
    const active=elapsedInPeriod<p.trip.dt;
    const mdotBase=active?p.trip.Mtrip/(p.trip.dt*yearSeconds):0;
    const guard=p.trip.guard?1/(1+Math.exp((Xc-p.trip.guard.X)/p.trip.guard.band)):1;
    const mdot=Math.min(p.trip.mdotMax??mdotBase,mdotBase)*guard;
    const hazard=p.h0*Math.exp(Math.min(60,p.beta*Math.max(0,p.Xthr-Xc)));
    out.push({t,Xc,Lc:luminosity,h:hazard,P:-Math.expm1(-integratedHazard),mdot});
    if(t>=horizonYears-1e-10)break;
    const delta=Math.min(stepYears,horizonYears-t);
    Xc=Math.min(0.75,Math.max(0,Xc+((mdot*(p.Xe-Xc)-luminosity/p.eps)/p.Mc)*delta*yearSeconds));
    integratedHazard+=hazard*delta;
    t=Math.min(horizonYears,t+delta);
  }
  return out;
}

export function deepMixToyFleetToTrip(p:DeepMixToyParams,ships:number,ratePerShipKgS:number):DeepMixToyParams{
  if(!Number.isFinite(ships)||ships<0||!Number.isFinite(ratePerShipKgS)||ratePerShipKgS<0)
    throw new Error('DEEPMIX_TOY_INVALID_FLEET');
  return {...p,trip:{...p.trip,mdotMax:ships*ratePerShipKgS}};
}

export function scanDeepMixToyFleet(base:DeepMixToyParams,horizonYears:number,shipsGrid:number[],ratePerShipKgS:number){
  return shipsGrid.map(ships=>{
    const series=simulateDeepMixToy(deepMixToyFleetToTrip(base,ships,ratePerShipKgS),horizonYears,0.2);
    const guardX=base.trip.guard?.X??null;
    const finalToyIndex=series.at(-1)?.P??0;
    return {ships,P:finalToyIndex,pass:finalToyIndex<0.2&&
      (guardX===null||series.every(point=>point.Xc>=guardX))};
  });
}

const receiptBody=z.object({schemaVersion:z.literal('deepmix-toy-run/1'),
  engineVersion:z.literal(DEEPMIX_TOY_ENGINE_VERSION),
  presetId:z.enum(['sweetspot-legacy/1','globe-legacy/1']),
  controls:z.object({ships:z.number().finite().nonnegative(),ratePerShipKgS:z.number().finite().nonnegative(),
    horizonYears:z.number().finite().nonnegative(),stepYears:z.number().finite().positive()}).strict(),
  seriesSha256:z.string().regex(/^[a-f0-9]{64}$/),noMixSeriesSha256:z.string().regex(/^[a-f0-9]{64}$/),
  result:z.object({finalToyIndex:z.number().finite().min(0).max(1),noMixToyIndex:z.number().finite().min(0).max(1),
    minimumCoreHydrogen:z.number().finite().min(0).max(1),sampleCount:z.number().int().positive()}).strict(),
  sourceIdentityAuthenticated:z.literal(false),scientificAdmission:z.literal(false),
  stellarTransitionProbability:z.literal(false),solarSphereSceneBound:z.literal(false),
}).strict();
export const deepMixToyRunReceiptSchema=receiptBody.extend({runId:z.string().regex(/^deepmix-toy:[a-f0-9]{64}$/)}).strict();
export type DeepMixToyRunReceipt=z.infer<typeof deepMixToyRunReceiptSchema>;
async function hash(value:unknown){
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(value)))),
    byte=>byte.toString(16).padStart(2,'0')).join('');
}
export async function prepareDeepMixToyRunReceipt(presetId:DeepMixToyPresetId,
  controls:{ships:number;ratePerShipKgS:number;horizonYears:number;stepYears:number}):Promise<DeepMixToyRunReceipt>{
  const params=deepMixToyParamsForPreset(presetId);
  const selected=simulateDeepMixToy(deepMixToyFleetToTrip(params,controls.ships,controls.ratePerShipKgS),
    controls.horizonYears,controls.stepYears);
  const noMix=simulateDeepMixToy({...params,trip:{...params.trip,Mtrip:0,mdotMax:0}},
    controls.horizonYears,controls.stepYears);
  const body=receiptBody.parse({schemaVersion:'deepmix-toy-run/1',engineVersion:DEEPMIX_TOY_ENGINE_VERSION,
    presetId,controls,seriesSha256:await hash(selected),noMixSeriesSha256:await hash(noMix),
    result:{finalToyIndex:selected.at(-1)!.P,noMixToyIndex:noMix.at(-1)!.P,
      minimumCoreHydrogen:selected.reduce((minimum,point)=>Math.min(minimum,point.Xc),1),
      sampleCount:selected.length},
    sourceIdentityAuthenticated:false,scientificAdmission:false,
    stellarTransitionProbability:false,solarSphereSceneBound:false});
  return deepMixToyRunReceiptSchema.parse({...body,runId:`deepmix-toy:${await hash(body)}`});
}
export async function verifyDeepMixToyRunReceipt(input:unknown):Promise<DeepMixToyRunReceipt>{
  const checked=deepMixToyRunReceiptSchema.parse(input);
  const expected=await prepareDeepMixToyRunReceipt(checked.presetId,checked.controls);
  if(JSON.stringify(checked)!==JSON.stringify(expected))throw new Error('DEEPMIX_TOY_RUN_REPLAY_MISMATCH');
  return checked;
}
