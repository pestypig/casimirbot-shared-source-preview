import {verifySolarResearchExport} from './solar-research-export';
import {serializeObservationSnapshot,validateObservationReplay} from './solar-observation-replay';
import {verifySolarResearchLiterature} from './solar-research-literature';
import {verifySolarBenchmarkReplay} from './solar-research-benchmark';
import {z} from 'zod';

/** Metadata association only. Referenced artifacts are needed separately for replay. */
export async function prepareSolarResearchEvidenceIndex(bundle:unknown,archive?:unknown,
  context:{literature?:unknown;benchmark?:unknown}={}) {
  const comparison=await verifySolarResearchExport(bundle);
  const literature=context.literature===undefined?undefined:await verifySolarResearchLiterature(bundle,context.literature);
  const benchmark=context.benchmark===undefined?undefined:await verifySolarBenchmarkReplay(bundle,context.benchmark);
  // Serializing verifies an existing identity and supplies content identity for
  // legacy/live input without claiming that its source was authenticated.
  const replay=archive===undefined?undefined:await validateObservationReplay(JSON.parse(await serializeObservationSnapshot(archive)));
  const record=comparison.record;
  const manifest={schemaVersion:'solar-research-evidence-index/1',
    comparison:{recordId:comparison.recordId,operator:record.operator,quantity:record.quantity,units:record.units,
      coordinate:record.coordinate,recordCreatedAt:record.createdAt,acquisitionTime:null,
      observationId:record.observation.id,kernelId:record.kernels.id,
      modelDifferenceId:record.modelDifference?.id ?? null,fixtureOnly:record.fixtureOnly},
    observationArchive:replay?{snapshotId:replay.archive_identity!.snapshotId,instrument:replay.instrument,
      wavelengthAngstrom:replay.wavelength_A,fetchedAt:replay.meta.fetched_at_utc,
      frames:replay.frames.map(frame=>({index:frame.index,acquiredAt:frame.obstime,gridSize:frame.grid_size,
        declaredFitsSha256:frame.fits_sha256,displaySha256:frame.display_sha256,
        coordinate:frame.coordinate_frame,processingRecipe:frame.display_processing,
        normalizationContextAvailable:frame.display_normalization!==undefined})),
      quantity:'display_normalized_instrument_pixels',units:'dimensionless_display_only',
      state:'archive_context_not_live',sourceFitsIncluded:false,
      ...(replay.selected_event_context?{selectedEventContext:replay.selected_event_context}: {}),
      ...(replay.selected_goes_window?{selectedGoesWindow:replay.selected_goes_window}: {})}:null,
    literatureContextId:literature?.associationId ?? null,
    benchmarkPlanId:benchmark?.replay.planId ?? null,
    benchmarkScope:benchmark?'comparison_row_selection_only_not_image_archive':null,
    association:'context_only_no_observation_operator_join',
    quantitativeJoinAllowed:false,correlationScore:null,residualScore:null,independentValidation:false,
    exclusions:['Interior inversion and surface/coronal image pixels are different observables.',
      'No physical forward operator joins the radial record to the instrument image.',
      'The comparison record binds no acquisition interval; creation time cannot supply temporal overlap.',
      'Display normalization/clipping and native pixel grids are not calibrated radiance or registered solar coordinates.',
      'Quoted inversion errors omit covariance/systematics; image uncertainty is not bound.',
      'Context association is not a causal relation, paper validation or scientific acceptance.'],
    requiredReplayInputs:['Exact comparison export bundle',...(replay?['Exact observation snapshot']:[]),
      ...(literature?['Exact literature-context sidecar']:[]),...(benchmark?['Exact benchmark-selection replay']:[])],
    artifactIntegrityVerified:true,sourceIdentityAuthenticated:false,scientificAdmission:false,scienceRunAllowed:false};
  const manifestJson=JSON.stringify(manifest,null,2);
  if(new TextEncoder().encode(manifestJson).length>64_000)throw new Error('Evidence index exceeds 64 KB');
  const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(manifestJson))),
    value=>value.toString(16).padStart(2,'0')).join('');
  return {indexId:`solar-evidence-index:${digest}`,manifestJson};
}
const IndexSchema=z.object({indexId:z.string().regex(/^solar-evidence-index:[a-f0-9]{64}$/),manifestJson:z.string().max(64_000)}).strict();
export async function verifySolarResearchEvidenceIndex(bundle:unknown,archive:unknown|undefined,
  context:{literature?:unknown;benchmark?:unknown},input:unknown) {
  const index=IndexSchema.parse(input);
  const expected=await prepareSolarResearchEvidenceIndex(bundle,archive,context);
  if(index.indexId!==expected.indexId || index.manifestJson!==expected.manifestJson)
    throw new Error('Research evidence index identity or recipe mismatch');
  return {indexId:expected.indexId,artifactIntegrityVerified:true as const,quantitativeJoinAllowed:false as const,
    scientificAdmission:false as const};
}
