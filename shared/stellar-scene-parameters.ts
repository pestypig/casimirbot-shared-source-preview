import {z} from 'zod';

const finite=z.number().finite();
const utc=z.string().datetime({offset:true});
const sourceId=z.string().min(1).max(240);
const basis=z.enum(['direct_measurement','catalog_report','model_inference','illustrative_input']);
const measured=(unit:string,range:'positive'|'fraction'|'nonnegative'='positive')=>z.object({
  value:range==='fraction'?finite.min(0).max(1):range==='nonnegative'?finite.nonnegative():finite.positive(),unit:z.literal(unit),
  uncertainty:finite.nonnegative().nullable(),basis,sourceId}).strict();
const layer=z.object({kind:z.enum(['surface_image','spectrum','photometry','magnetometry','asteroseismology','modeled_surface','modeled_interior']),
  productId:sourceId,observedAtUtc:utc.nullable(),basis,
  spatialSupport:z.enum(['resolved_disk','unresolved_integrated','reconstructed_surface','model_grid','none']),
  registrationId:z.string().regex(/^solar-sphere-registration:[a-f0-9]{64}$/).nullable(),
  uncertaintyStatus:z.enum(['reported','not_supplied','not_applicable'])}).strict().superRefine((item,ctx)=>{
    if(item.registrationId&&(item.kind!=='surface_image'||item.spatialSupport!=='resolved_disk'))
      ctx.addIssue({code:'custom',message:'Solar registration requires a resolved surface image'});
    if(item.basis==='direct_measurement'&&item.spatialSupport==='model_grid')
      ctx.addIssue({code:'custom',message:'A model grid is not a direct measurement'});
    if(item.kind.startsWith('modeled_')&&item.basis!=='model_inference'&&item.basis!=='illustrative_input')
      ctx.addIssue({code:'custom',message:'Modeled layers cannot be direct observations'});
    if(item.observedAtUtc&&item.basis==='illustrative_input')
      ctx.addIssue({code:'custom',message:'Illustrations have no observation timestamp'});
});
const base=z.object({schemaVersion:z.literal('stellar-scene-parameters/1'),
  target:z.object({objectId:sourceId,displayName:z.string().min(1).max(120),
    solarSystemSun:z.boolean(),spectralClass:z.enum(['O','B','A','F','G','K','M']).nullable(),
    luminosityClass:z.enum(['I','II','III','IV','V']).nullable(),
    classificationBasis:basis.nullable(),classificationSourceId:sourceId.nullable(),
    evolutionaryStage:z.enum(['pre_main_sequence','main_sequence','subgiant','red_giant','supergiant','remnant','unknown']),
    stageBasis:basis,stageSourceId:sourceId}).strict(),
  parameters:z.object({mass:measured('Msun').nullable(),age:measured('Gyr','nonnegative').nullable(),
    metallicity:measured('mass_fraction_Z','fraction').nullable(),radius:measured('Rsun').nullable(),
    rotationPeriod:measured('day').nullable(),effectiveTemperature:measured('K').nullable()}).strict(),
  layers:z.array(layer).max(32),
  solarReference:z.object({runId:sourceId,maturity:z.enum(['fixture_only','imported','reproduced_candidate']),
    sourceArtifactId:sourceId}).strict().nullable(),
  solarSphereSceneId:z.string().regex(/^solar-sphere-scene:[a-f0-9]{64}$/).nullable(),
  fullSurfaceObserved:z.literal(false),stellarEvolutionCalibrated:z.literal(false),
  modelObservationComparisonAdmitted:z.literal(false),scientificAdmission:z.literal(false),
  sourceIdentityAuthenticated:z.literal(false)}).strict();
const validate=(scene:z.infer<typeof base>,ctx:z.RefinementCtx)=>{
    const t=scene.target;
    if((t.spectralClass===null)!==(t.classificationBasis===null)||
      (t.spectralClass===null)!==(t.classificationSourceId===null))
      ctx.addIssue({code:'custom',message:'Spectral class requires basis and source'});
    if(t.luminosityClass!==null&&t.spectralClass===null)
      ctx.addIssue({code:'custom',message:'Luminosity class requires spectral class'});
    if(scene.solarSphereSceneId&&!t.solarSystemSun)
      ctx.addIssue({code:'custom',message:'A solar Carrington scene cannot be assigned to another star'});
    if(scene.layers.some(item=>item.registrationId)&&!t.solarSystemSun)
      ctx.addIssue({code:'custom',message:'Solar HMI registration cannot be assigned to another star'});
    if(scene.solarSphereSceneId&&!scene.layers.some(item=>item.registrationId))
      ctx.addIssue({code:'custom',message:'Solar scene linkage requires a registered image layer'});
    if(t.solarSystemSun!==(t.objectId==='Sun'))
      ctx.addIssue({code:'custom',message:'Solar target identity and flag must agree'});
};
const payload=base.superRefine(validate);
export const stellarSceneParametersSchema=base.extend({
  sceneId:z.string().regex(/^stellar-scene:[a-f0-9]{64}$/),
}).strict().superRefine(validate);
export type StellarSceneParameters=z.infer<typeof stellarSceneParametersSchema>;

async function contentId(value:unknown){
  const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(value)))),
    byte=>byte.toString(16).padStart(2,'0')).join('');
  return `stellar-scene:${hash}`;
}

/** Content identity only; supplied sources, classifications and model maturity are not authenticated. */
export async function prepareStellarSceneParameters(input:unknown):Promise<StellarSceneParameters>{
  const body=payload.parse(input);
  return stellarSceneParametersSchema.parse({...body,sceneId:await contentId(body)});
}
export async function verifyStellarSceneParameters(input:unknown):Promise<StellarSceneParameters>{
  const checked=stellarSceneParametersSchema.parse(input);
  const {sceneId,...body}=checked;
  payload.parse(body);
  if(sceneId!==await contentId(body))throw new Error('STELLAR_SCENE_ID_MISMATCH');
  return checked;
}

export function stellarSceneDisplayAuthority(scene:StellarSceneParameters){
  const directResolved=scene.layers.filter(item=>item.basis==='direct_measurement'&&
    item.kind==='surface_image'&&item.spatialSupport==='resolved_disk'&&item.registrationId!==null);
  return {registeredSolarDisk:scene.target.solarSystemSun&&directResolved.length>0,
    observedWholeSphere:false,independentModelComparison:false,
    layerCount:scene.layers.length,unresolvedLayerCount:scene.layers.filter(item=>
      item.spatialSupport==='unresolved_integrated').length};
}
