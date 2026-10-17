import {z} from 'zod';
import {verifySolarResearchEvidencePackage} from './solar-research-evidence-package';
import {readSolarResearchEvidenceSlice,solarResearchEvidenceViewSchema} from './solar-research-evidence-view';
import {SolarDisplayNormalizationSchema} from './solar-display-normalization';
import {buildSolarEventImageContext} from './solar-event-image-context';
import {recipeFromVerifiedSolarArchive,solarDiskViewRecipeSchema} from './solar-disk-view-recipe';
const hash=z.string().regex(/^[a-f0-9]{64}$/);
export const solarPackageEvidenceQuerySchema=z.object({packageId:z.string().regex(/^solar-package:[a-f0-9]{64}$/),
  rowOffset:z.number().int().min(0).max(75).default(0),rowLimit:z.number().int().min(1).max(20).default(10),
  frameOffset:z.number().int().min(0).max(39).default(0),frameLimit:z.number().int().min(1).max(20).default(10)}).strict();
const frame=z.object({index:z.number().int().min(0).max(39),acquiredAt:z.string().max(64),gridSize:z.number().int().min(32).max(512),
  declaredFitsSha256:hash,displaySha256:hash,coordinate:z.string().max(200),processingRecipe:z.string().max(200),
  normalization:SolarDisplayNormalizationSchema.nullable()}).strict();
const text=z.string().max(1000),strings=z.array(text).max(32);
const eventSelection=z.object({relationship:z.literal('contextual_co_occurrence_only'),
  eventId:z.string().min(1).max(512),eventType:z.string().min(1).max(16),
  eventStartUtc:z.string().max(64),eventEndUtc:z.string().max(64).nullable(),
  detectionMethod:z.string().max(128).nullable(),selectedFrameIndex:z.number().int().min(0).max(39),
  imageAcquiredAt:z.string().max(64),imageOffsetFromEventStartSeconds:z.number().finite(),
  imageWithinReportedInterval:z.boolean().nullable(),sourceIdentityAuthenticated:z.literal(false),
  scientificAdmission:z.literal(false)}).strict();
const graphSelection=z.object({schemaVersion:z.literal('solar-goes-frame-window/1'),
  relationship:z.literal('temporal_context_only'),source:z.literal('SunPy/Fido GOES XRS'),
  channel:z.literal('long'),units:z.literal('W/m2'),selectedFrameIndex:z.number().int().min(0).max(39),
  frameAcquiredAt:z.string().max(64),windowStartUtc:z.string().max(64),windowEndUtc:z.string().max(64),
  bins:z.array(z.object({startUtc:z.string().max(64),endUtc:z.string().max(64),
    meanLongWm2:z.number().positive().finite()}).strict()).max(25),
  sourceFilesAuthenticated:z.literal(false),scientificAdmission:z.literal(false)}).strict();
export const solarPackageEvidenceViewSchema=z.object({schemaVersion:z.literal('solar-package-evidence-view/1'),
  packageId:z.string().regex(/^solar-package:[a-f0-9]{64}$/),indexId:z.string().regex(/^solar-evidence-index:[a-f0-9]{64}$/),
  comparison:solarResearchEvidenceViewSchema,
  diskViewRecipe:solarDiskViewRecipeSchema.nullable(),
  archive:z.object({snapshotId:z.string().regex(/^solar-observation:[a-f0-9]{64}$/),instrument:text,
    wavelengthAngstrom:z.number().finite(),fetchedAt:z.string().max(64).nullable(),
    state:z.literal('archive_context_not_live'),quantity:z.literal('display_normalized_instrument_pixels'),units:z.literal('dimensionless_display_only'),
    totalFrames:z.number().int().min(1).max(40),frameOffset:z.number().int().min(0).max(39),frames:z.array(frame).max(20),
    nextFrameOffset:z.number().int().min(1).max(39).nullable(),eventSelection:eventSelection.nullable(),
    graphSelection:graphSelection.nullable()}).strict().nullable(),
  literature:z.object({associationId:z.string().regex(/^solar-literature:[a-f0-9]{64}$/),
    paper:z.object({title:text,citation:text,arxivVersion:text,url:z.string().url().max(1000),doi:text,journal:text,location:text}).strict(),
    distinction:text,limitations:strings}).strict().nullable(),
  benchmark:z.object({planId:z.string().regex(/^solar-benchmark:[a-f0-9]{64}$/),question:text,
    frozenAt:z.string().datetime(),informationCutoff:z.string().datetime(),calibrationRows:z.number().int().min(0).max(76),
    evaluationRows:z.number().int().min(1).max(76),excludedRows:z.number().int().min(0).max(76),
    scope:z.literal('comparison_row_selection_only_not_image_archive'),availabilityProvenance:z.literal('operator_declared_not_authenticated'),
    independentValidation:z.literal(false),performanceScore:z.null()}).strict().nullable(),
  exclusions:strings,requiredReplayInputs:strings,quantitativeJoinAllowed:z.literal(false),correlationScore:z.null(),
  sourceIdentityAuthenticated:z.literal(false),scientificAdmission:z.literal(false),scienceRunAllowed:z.literal(false),
  assistant_answer:z.literal(false),answer_authority:z.literal(false),agent_executable:z.literal(false),terminal_eligible:z.literal(false),
  raw_content_included:z.literal(false),reentry_required:z.literal(true),pixelsIncluded:z.literal(false),originalFitsIncluded:z.literal(false),
}).strict();

/** Bounded normalization only: no acquisition, retention or authorization. */
export async function readSolarPackageEvidenceView(packageJson:string,input:unknown) {
  const query=solarPackageEvidenceQuerySchema.parse(input);
  const verified=await verifySolarResearchEvidencePackage(packageJson);
  const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(packageJson))),b=>b.toString(16).padStart(2,'0')).join('');
  if(query.packageId!==`solar-package:${digest}`)throw new Error('SOLAR_PACKAGE_ID_MISMATCH');
  const replay=verified.archiveReplay,manifest=verified.manifest;
  if(query.frameOffset>=(replay?.frames.length??1))throw new Error('SOLAR_PACKAGE_FRAME_OFFSET_INVALID');
  const frames=replay?.frames.slice(query.frameOffset,query.frameOffset+query.frameLimit);
  const selected=replay?.selected_event_context;
  const selectedImage=selected?replay!.frames[selected.selectedFrameIndex]:null;
  const selectedContext=selected&&selectedImage?buildSolarEventImageContext({id:selected.eventId,
    event_type:selected.eventType,start_time:selected.eventStartUtc,end_time:selected.eventEndUtc??undefined,
    frm_name:selected.detectionMethod??undefined},selectedImage,replay):null;
  const literature=verified.literatureReplay,selection=verified.benchmarkReplay?.selection;
  const view=solarPackageEvidenceViewSchema.parse({schemaVersion:'solar-package-evidence-view/1',packageId:query.packageId,indexId:verified.indexId,
    comparison:await readSolarResearchEvidenceSlice(verified.comparison,{offset:query.rowOffset,limit:query.rowLimit}),
    diskViewRecipe:replay?await recipeFromVerifiedSolarArchive(query.packageId,replay,query.frameOffset):null,
    archive:replay?{snapshotId:replay.archive_identity!.snapshotId,instrument:replay.instrument,wavelengthAngstrom:replay.wavelength_A,
      fetchedAt:replay.meta.fetched_at_utc,state:'archive_context_not_live',quantity:'display_normalized_instrument_pixels',units:'dimensionless_display_only',
      totalFrames:replay.frames.length,frameOffset:query.frameOffset,frames:frames!.map(f=>({index:f.index,acquiredAt:f.obstime,gridSize:f.grid_size,
        declaredFitsSha256:f.fits_sha256,displaySha256:f.display_sha256,coordinate:f.coordinate_frame,processingRecipe:f.display_processing,
      normalization:f.display_normalization??null})),nextFrameOffset:query.frameOffset+frames!.length<replay.frames.length?query.frameOffset+frames!.length:null,
      eventSelection:selected&&selectedImage&&selectedContext?{relationship:'contextual_co_occurrence_only',
        eventId:selected.eventId,eventType:selected.eventType,eventStartUtc:selected.eventStartUtc,
        eventEndUtc:selected.eventEndUtc,detectionMethod:selected.detectionMethod,
        selectedFrameIndex:selected.selectedFrameIndex,imageAcquiredAt:selectedImage.obstime,
        imageOffsetFromEventStartSeconds:selectedContext.imageOffsetFromEventStartSeconds!,
        imageWithinReportedInterval:selectedContext.imageWithinReportedEvent,
        sourceIdentityAuthenticated:false,scientificAdmission:false}:null,
      graphSelection:replay.selected_goes_window??null}:null,
    literature:literature?{associationId:literature.associationId,paper:literature.context.paper,distinction:literature.context.distinction,
      limitations:literature.context.limitations}:null,
    benchmark:selection?{planId:verified.benchmarkReplay!.planId,question:selection.question,frozenAt:selection.frozenAt,informationCutoff:selection.informationCutoff,
      calibrationRows:selection.calibrationRows.length,evaluationRows:selection.evaluationRows.length,excludedRows:selection.excludedRows.length,
      scope:'comparison_row_selection_only_not_image_archive',availabilityProvenance:selection.availabilityProvenance,independentValidation:false,performanceScore:null}:null,
    exclusions:manifest.exclusions,requiredReplayInputs:manifest.requiredReplayInputs,quantitativeJoinAllowed:false,correlationScore:null,
    sourceIdentityAuthenticated:false,scientificAdmission:false,scienceRunAllowed:false,assistant_answer:false,answer_authority:false,
    agent_executable:false,terminal_eligible:false,raw_content_included:false,reentry_required:true,pixelsIncluded:false,originalFitsIncluded:false});
  if(new TextEncoder().encode(JSON.stringify(view)).length>128_000)throw new Error('SOLAR_PACKAGE_VIEW_SIZE_LIMIT');
  return view;
}
