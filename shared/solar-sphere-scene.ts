import {z} from 'zod';
import {solarGlobalRadialMapContentId} from './solar-magnetic-dipole';
import {verifySolarMagneticComparisonBundle,type SolarMagneticComparisonBundle} from './solar-magnetic-comparison-bundle';

const id=(prefix:string)=>z.string().regex(new RegExp(`^${prefix}:[a-f0-9]{64}$`));
const utc=z.string().datetime({offset:true});
const layer=z.object({kind:z.enum(['magnetic_boundary','field_model','los_image','surface_registration']),
  productId:z.string().min(1).max(240),observedAtUtc:utc.nullable(),
  relationship:z.enum(['source_boundary','model_derived_from_boundary','independent_observation_juxtaposed','same_source_projection']),
  coverage:z.enum(['assembled_unknown_direct_input','assembled_input_mask_provided','modeled','direct_visible_samples_only']),
  claim:z.enum(['derived_map','modeled_not_measured','measured_los_quality_unassessed','geometry_not_magnetic_fit'])}).strict();
const payload=z.object({schemaVersion:z.literal('solar-sphere-scene/1'),
  bundleId:id('solar-magnetic-bundle'),registrationId:id('solar-sphere-registration').nullable(),
  referenceFrame:z.literal('Carrington'),referenceUtc:utc,
  viewRecipeId:id('solar-magnetic-view'),layers:z.array(layer).min(1).max(4),
  farSideObserved:z.literal(false),sameTimeFullSunObservation:z.literal(false),
  independentModelValidation:z.literal(false),scientificAdmission:z.literal(false),
  sourceIdentityAuthenticated:z.literal(false)}).strict();
export const solarSphereSceneSchema=payload.extend({sceneId:id('solar-sphere-scene')}).strict();
export const solarSphereSceneQuerySchema=z.object({bundleId:id('solar-magnetic-bundle'),
  expectedSceneId:id('solar-sphere-scene')}).strict();
export type SolarSphereScene=z.infer<typeof solarSphereSceneSchema>;

async function contentId(body:z.infer<typeof payload>){
  const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(body)))),
    byte=>byte.toString(16).padStart(2,'0')).join('');
  return `solar-sphere-scene:${hash}`;
}

/** A deterministic index of independently typed layers, not a fused solar observation. */
export async function buildSolarSphereScene(input:SolarMagneticComparisonBundle):Promise<SolarSphereScene>{
  const bundle=await verifySolarMagneticComparisonBundle(input);
  const mapId=await solarGlobalRadialMapContentId(bundle.map);
  const layers:z.infer<typeof layer>[]=[{kind:'magnetic_boundary',productId:mapId,
    observedAtUtc:bundle.map.source.inputEndUtc,relationship:'source_boundary',
    coverage:bundle.map.observedMaskStatus==='provided'?'assembled_input_mask_provided':'assembled_unknown_direct_input',claim:'derived_map'}];
  if(bundle.pfss)layers.push({kind:'field_model',productId:bundle.pfss.modelId,
    observedAtUtc:null,relationship:'model_derived_from_boundary',coverage:'modeled',claim:'modeled_not_measured'});
  if(bundle.losDiagnostic)layers.push({kind:'los_image',productId:bundle.losDiagnostic.diagnosticId,
    observedAtUtc:bundle.losDiagnostic.hmi.observedAtUtc,relationship:'independent_observation_juxtaposed',
    coverage:'direct_visible_samples_only',claim:'measured_los_quality_unassessed'});
  if(bundle.registration)layers.push({kind:'surface_registration',productId:bundle.registration.registrationId,
    observedAtUtc:bundle.registration.source.observedAtUtc,relationship:'same_source_projection',
    coverage:'direct_visible_samples_only',claim:'geometry_not_magnetic_fit'});
  const body=payload.parse({schemaVersion:'solar-sphere-scene/1',bundleId:bundle.bundleId,
    registrationId:bundle.registration?.registrationId??null,referenceFrame:'Carrington',
    referenceUtc:bundle.map.source.inputEndUtc,viewRecipeId:bundle.view.recipeId,layers,
    farSideObserved:false,sameTimeFullSunObservation:false,independentModelValidation:false,
    scientificAdmission:false,sourceIdentityAuthenticated:false});
  return solarSphereSceneSchema.parse({...body,sceneId:await contentId(body)});
}
