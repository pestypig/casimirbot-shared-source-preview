import {z} from 'zod';

const hash=z.string().regex(/^[a-f0-9]{64}$/);
const utc=z.string().datetime({offset:true});
const finite=z.number().finite();
const anchor=z.object({pixelX:finite.nonnegative(),pixelY:finite.nonnegative(),
  hpcXArcsec:finite,hpcYArcsec:finite,carringtonLongitudeDeg:finite.min(0).lt(360),
  carringtonLatitudeDeg:finite.min(-90).max(90),returnPixelX:finite.nonnegative(),
  returnPixelY:finite.nonnegative(),roundTripErrorPixels:finite.nonnegative(),
  radialLineOfSightCosine:finite.min(0).max(1)}).strict();

const base=z.object({schemaVersion:z.literal('solar-sphere-registration/1'),
  source:z.object({provider:z.literal('SDO/HMI'),productId:z.string().min(1).max(240),
    sourceUrl:z.string().url().startsWith('https://').max(1000),fitsSha256:hash,
    observedAtUtc:utc,qualityFlag:z.number().int().nonnegative(),
    qualityInterpretation:z.enum(['uninterpreted_nonzero','zero_flag_not_full_quality_assessment']),
    hduIndex:z.number().int().min(0).max(1),width:z.number().int().min(256).max(4096),
    height:z.number().int().min(256).max(4096),fieldComponent:z.literal('line_of_sight'),
    units:z.literal('G')}).strict(),
  geometry:z.object({sourceFrame:z.literal('helioprojective_WCS'),targetFrame:z.literal('Carrington'),
    wcsHeaderSha256:hash,observerCarringtonLongitudeDeg:finite.min(0).lt(360),
    observerCarringtonLatitudeDeg:finite.min(-90).max(90),observerDistanceMeters:finite.positive(),
    solarRadiusMeters:finite.positive(),algorithm:z.literal('sunpy_hpc_visible_surface_to_carrington_roundtrip/1'),
    sunpyVersion:z.string().min(1).max(40),astropyVersion:z.string().min(1).max(40),
    sampleGrid:z.literal('nine_by_nine_pixel_centers'),roundTripTolerancePixels:finite.positive().max(1),
    sampledCount:z.literal(81),validOnDiskCount:z.number().int().min(1).max(81),
    offDiskCount:z.number().int().min(0).max(80),rejectedOnDiskCount:z.number().int().min(0).max(80),
    maxRoundTripErrorPixels:finite.nonnegative().max(1)}).strict(),
  anchors:z.array(anchor).min(3).max(25),
  coverage:z.object({visibleHemisphereOnly:z.literal(true),farSideObserved:z.literal(false),
    offDiskSurfaceLocation:z.literal('not_supported'),
    pixelFootprint:z.literal('sampled_grid_only_not_full_pixel_coverage'),
    qualityStatus:z.enum(['unknown_nonzero_flag','unassessed_zero_flag'])}).strict(),
  sourceIdentityAuthenticated:z.literal(false),scientificAdmission:z.literal(false),
  magneticFitAllowed:z.literal(false),coronalHeightInferred:z.literal(false),
}).strict();
const validate=(value:z.infer<typeof base>,ctx:z.RefinementCtx)=>{
  const {source,geometry,anchors}=value;
  if(geometry.validOnDiskCount+geometry.offDiskCount+geometry.rejectedOnDiskCount!==81)
    ctx.addIssue({code:'custom',message:'Sample counts must cover the 9x9 grid'});
  if(anchors.length>geometry.validOnDiskCount)
    ctx.addIssue({code:'custom',message:'Anchor count exceeds valid samples'});
  if(anchors.some(a=>a.pixelX>=source.width||a.returnPixelX>=source.width||
      a.pixelY>=source.height||a.returnPixelY>=source.height||
      a.roundTripErrorPixels>geometry.roundTripTolerancePixels))
    ctx.addIssue({code:'custom',message:'Anchor is outside image or round-trip tolerance'});
  const max=Math.max(...anchors.map(a=>a.roundTripErrorPixels));
  if(max>geometry.maxRoundTripErrorPixels+1e-8)
    ctx.addIssue({code:'custom',message:'Anchor error exceeds declared maximum'});
  if((source.qualityFlag===0)!==(source.qualityInterpretation==='zero_flag_not_full_quality_assessment')||
    (source.qualityFlag===0)!==(value.coverage.qualityStatus==='unassessed_zero_flag'))
    ctx.addIssue({code:'custom',message:'Quality state contradicts the source flag'});
  const unique=new Set(anchors.map(a=>`${a.pixelX},${a.pixelY}`));
  if(unique.size!==anchors.length)ctx.addIssue({code:'custom',message:'Duplicate anchor pixel'});
};
const payload=base.superRefine(validate);

export const solarSphereRegistrationSchema=base.extend({
  registrationId:z.string().regex(/^solar-sphere-registration:[a-f0-9]{64}$/),
}).strict().superRefine(validate);
export type SolarSphereRegistration=z.infer<typeof solarSphereRegistrationSchema>;
export type SolarSphereRegistrationPayload=z.input<typeof payload>;

async function registrationId(value:SolarSphereRegistrationPayload){
  const bytes=new TextEncoder().encode(JSON.stringify(value));
  const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),
    byte=>byte.toString(16).padStart(2,'0')).join('');
  return `solar-sphere-registration:${digest}`;
}

/** A local geometry/content check, not upstream authentication or solar-field admission. */
export async function prepareSolarSphereRegistration(input:unknown){
  const checked=payload.parse(input);
  return solarSphereRegistrationSchema.parse({...checked,registrationId:await registrationId(checked)});
}

export async function verifySolarSphereRegistration(input:unknown){
  const parsed=solarSphereRegistrationSchema.parse(input);
  const {registrationId:id,...body}=parsed;
  const checked=payload.parse(body);
  if(id!==await registrationId(checked))throw new Error('SOLAR_SPHERE_REGISTRATION_ID_MISMATCH');
  return parsed;
}
