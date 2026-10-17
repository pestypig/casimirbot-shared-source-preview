import {z} from 'zod';

const sha256=z.string().regex(/^[a-f0-9]{64}$/);
const packageId=z.string().regex(/^solar-package:[a-f0-9]{64}$/);
const archiveId=z.string().regex(/^solar-observation:[a-f0-9]{64}$/);

const payloadSchema=z.object({
  schemaVersion:z.literal('solar-disk-view-recipe/1'),
  packageId,archiveId,
  frameIndex:z.number().int().min(0).max(39),
  image:z.object({kind:z.literal('archived_display_raster'),instrument:z.string().min(1).max(100),
    wavelengthAngstrom:z.number().positive().finite(),acquiredAt:z.string().datetime({offset:true}),
    fetchedAt:z.string().datetime({offset:true}).nullable(),displaySha256:sha256,
    declaredFitsSha256:sha256,coordinateFrame:z.literal('native_instrument_pixel_grid')}).strict(),
  eventMarker:z.object({kind:z.literal('catalog_assertion'),eventId:z.string().min(1).max(512),
    eventType:z.string().min(1).max(16),relationship:z.literal('contextual_co_occurrence_only')}).strict().nullable(),
  fieldLines:z.literal('off'),
  display:z.object({orientation:z.literal('native_instrument'),stretch:z.literal('replay_sqrt_grayscale')}).strict(),
  sourceIdentityAuthenticated:z.literal(false),scientificAdmission:z.literal(false),
  quantitativeJoinAllowed:z.literal(false),
}).strict();

export const solarDiskViewRecipeSchema=payloadSchema.extend({recipeId:z.string().regex(/^solar-view:[a-f0-9]{64}$/)}).strict();
export type SolarDiskViewRecipe=z.infer<typeof solarDiskViewRecipeSchema>;
export type SolarDiskViewRecipePayload=z.infer<typeof payloadSchema>;

async function digest(value:unknown) {
  const bytes=new TextEncoder().encode(JSON.stringify(value));
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),
    byte=>byte.toString(16).padStart(2,'0')).join('');
}

/** A display recipe, not an observation, PFSS result, or model/observation join. */
export async function prepareSolarDiskViewRecipe(input:SolarDiskViewRecipePayload):Promise<SolarDiskViewRecipe> {
  const payload=payloadSchema.parse(input);
  return solarDiskViewRecipeSchema.parse({...payload,recipeId:`solar-view:${await digest(payload)}`});
}

export async function verifySolarDiskViewRecipe(input:unknown):Promise<SolarDiskViewRecipe> {
  const recipe=solarDiskViewRecipeSchema.parse(input);
  const {recipeId,...payload}=recipe;
  if(recipeId!==`solar-view:${await digest(payload)}`)throw new Error('SOLAR_VIEW_RECIPE_ID_MISMATCH');
  return recipe;
}

/** Call only after verifying the parent package and its observation archive. */
export async function recipeFromVerifiedSolarArchive(packageIdValue:string,archive:{
  archive_identity?:{snapshotId:string};instrument:string;wavelength_A:number;
  meta:{fetched_at_utc:string|null};frames:Array<{index:number;obstime:string;display_sha256:string;
    fits_sha256:string;coordinate_frame:string}>;
  selected_event_context?:{eventId:string;eventType:string;selectedFrameIndex:number};
},frameIndex:number) {
  const frame=archive.frames[frameIndex];
  if(!frame||frame.index!==frameIndex||!archive.archive_identity?.snapshotId)
    throw new Error('SOLAR_VIEW_FRAME_UNAVAILABLE');
  const event=archive.selected_event_context?.selectedFrameIndex===frameIndex?archive.selected_event_context:null;
  return prepareSolarDiskViewRecipe({schemaVersion:'solar-disk-view-recipe/1',
    packageId:packageIdValue,archiveId:archive.archive_identity.snapshotId,frameIndex,
    image:{kind:'archived_display_raster',instrument:archive.instrument,
      wavelengthAngstrom:archive.wavelength_A,acquiredAt:frame.obstime,fetchedAt:archive.meta.fetched_at_utc,
      displaySha256:frame.display_sha256,declaredFitsSha256:frame.fits_sha256,
      coordinateFrame:frame.coordinate_frame as 'native_instrument_pixel_grid'},
    eventMarker:event?{kind:'catalog_assertion',eventId:event.eventId,eventType:event.eventType,
      relationship:'contextual_co_occurrence_only'}:null,
    fieldLines:'off',display:{orientation:'native_instrument',stretch:'replay_sqrt_grayscale'},
    sourceIdentityAuthenticated:false,scientificAdmission:false,quantitativeJoinAllowed:false});
}
