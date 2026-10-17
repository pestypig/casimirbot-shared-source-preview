import {z} from 'zod';
import {deriveSolarEquivalentDipole,solarGlobalRadialMapContentId} from './solar-magnetic-dipole';
import {verifySolarMagneticComparisonBundle,type SolarMagneticComparisonBundle} from './solar-magnetic-comparison-bundle';
import {compareDisplayedHmiLosToMapL1} from './solar-magnetic-dipole-los-comparison';

const id=z.string().regex(/^solar-magnetic-bundle:[a-f0-9]{64}$/);
const hash=z.string().regex(/^[a-f0-9]{64}$/);
const text=z.string().min(1).max(1000);
export const solarMagneticBundleEvidenceQuerySchema=z.object({bundleId:id}).strict();
export const solarMagneticBundleEvidenceViewSchema=z.object({
  schemaVersion:z.literal('solar-magnetic-bundle-evidence-view/1'),bundleId:id,
  map:z.object({contentId:z.string().regex(/^solar-radial:[a-f0-9]{64}$/),provider:text,
    productId:text,sourceUrl:z.string().url().max(1000),sourceSha256:hash,kind:z.enum(['synoptic_derived','assimilated']),
    inputStartUtc:z.string().datetime({offset:true}).nullable(),inputEndUtc:z.string().datetime({offset:true}),
    observedMaskStatus:z.enum(['provided','unavailable']),directInputAreaFraction:z.number().min(0).max(1).nullable(),
    units:z.literal('G'),coordinateFrame:z.literal('Carrington')}).strict(),
  equivalentDipole:z.object({vectorGauss:z.tuple([z.number().finite(),z.number().finite(),z.number().finite()]),
    magnitudeGauss:z.number().finite().nonnegative(),units:z.literal('m/Rsun^3_in_gauss'),
    method:z.literal('equal_area_radial_l1_projection/1'),independentlyMeasured:z.literal(false)}).strict(),
  pfss:z.object({modelId:z.string().regex(/^solar-pfss:[a-f0-9]{64}$/),solver:text,solverVersion:text,
    sourceSurfaceRadiusSolar:z.number().finite(),lineCount:z.number().int().positive(),
    lineMeaning:z.literal('modeled_not_directly_measured')}).strict().nullable(),
  measuredHmiLos:z.object({diagnosticId:z.string().regex(/^solar-los:[a-f0-9]{64}$/),sourceSha256:hash,
    observedAtUtc:z.string().datetime({offset:true}),qualityFlag:z.number().int().nonnegative(),
    displaySampleCount:z.number().int().positive(),selection:z.literal('diagnostic_display_points_active_field_subset'),
    mapProjectedLosRmsGauss:z.number().finite().nonnegative(),radialL1ProjectedLosRmsGauss:z.number().finite().nonnegative(),
    matchedUncertaintyAvailable:z.literal(false),sameTimeFullSunObservation:z.literal(false)}).strict().nullable(),
  registration:z.object({registrationId:z.string().regex(/^solar-sphere-registration:[a-f0-9]{64}$/),
    sourceFitsSha256:hash,wcsHeaderSha256:hash,observedAtUtc:z.string().datetime({offset:true}),
    qualityStatus:z.enum(['unknown_nonzero_flag','unassessed_zero_flag']),
    validOnDiskCount:z.number().int().min(1).max(81),offDiskCount:z.number().int().min(0).max(80),
    maxRoundTripErrorPixels:z.number().finite().nonnegative(),
    anchors:z.array(z.object({pixelX:z.number().finite(),pixelY:z.number().finite(),
      carringtonLongitudeDeg:z.number().finite(),carringtonLatitudeDeg:z.number().finite(),
      roundTripErrorPixels:z.number().finite().nonnegative()}).strict()).max(25),
    farSideObserved:z.literal(false),magneticFitAllowed:z.literal(false)}).strict().nullable(),
  view:z.object({recipeId:z.string().regex(/^solar-magnetic-view:[a-f0-9]{64}$/),
    cameraPosition:z.tuple([z.number().finite(),z.number().finite(),z.number().finite()]),
    losMarkerColorBasis:z.enum(['map_residual','radial_l1_residual'])}).strict(),
  sourceIdentityAuthenticated:z.literal(false),scientificAdmission:z.literal(false),scienceRunAllowed:z.literal(false),
  coronalLinesMeasured:z.literal(false),globalMomentMeasured:z.literal(false),
  catalogActiveRegionMarkersIncluded:z.literal(false),catalogMarkersAssimilatedIntoMap:z.literal(false),
  quantitativeValidationAllowed:z.literal(false),rawGridIncluded:z.literal(false),fitsIncluded:z.literal(false),
  assistant_answer:z.literal(false),answer_authority:z.literal(false),terminal_eligible:z.literal(false),
  reentry_required:z.literal(true),
}).strict();

/** Bounded observation from a previously verified owner record, not a scientific acceptance decision. */
export async function buildSolarMagneticBundleEvidenceView(input:SolarMagneticComparisonBundle){
  const bundle=await verifySolarMagneticComparisonBundle(input);
  const map=bundle.map,dipole=deriveSolarEquivalentDipole(map);
  const diagnostic=bundle.losDiagnostic;
  const comparison=diagnostic?await compareDisplayedHmiLosToMapL1(map,diagnostic):null;
  return solarMagneticBundleEvidenceViewSchema.parse({schemaVersion:'solar-magnetic-bundle-evidence-view/1',
    bundleId:bundle.bundleId,map:{contentId:await solarGlobalRadialMapContentId(map),provider:map.source.provider,
      productId:map.source.productId,sourceUrl:map.source.sourceUrl,sourceSha256:map.source.sha256,
      kind:map.source.kind,inputStartUtc:map.source.inputStartUtc,inputEndUtc:map.source.inputEndUtc,
      observedMaskStatus:map.observedMaskStatus,directInputAreaFraction:dipole.observedAreaFraction,
      units:'G',coordinateFrame:'Carrington'},
    equivalentDipole:{vectorGauss:dipole.vectorGauss,magnitudeGauss:dipole.magnitudeGauss,
      units:'m/Rsun^3_in_gauss',method:dipole.method,independentlyMeasured:false},
    pfss:bundle.pfss?{modelId:bundle.pfss.modelId,solver:bundle.pfss.solver.name,
      solverVersion:bundle.pfss.solver.version,sourceSurfaceRadiusSolar:bundle.pfss.solver.sourceSurfaceRadiusSolar,
      lineCount:bundle.pfss.lines.length,lineMeaning:'modeled_not_directly_measured'}:null,
    measuredHmiLos:diagnostic&&comparison?{diagnosticId:diagnostic.diagnosticId,
      sourceSha256:diagnostic.hmi.sha256,observedAtUtc:diagnostic.hmi.observedAtUtc,
      qualityFlag:diagnostic.hmi.qualityFlag,displaySampleCount:comparison.sampleCount,selection:comparison.selection,
      mapProjectedLosRmsGauss:comparison.mapProjectedLosRmsGauss,
      radialL1ProjectedLosRmsGauss:comparison.radialL1ProjectedLosRmsGauss,
      matchedUncertaintyAvailable:false,sameTimeFullSunObservation:false}:null,
    registration:bundle.registration?{registrationId:bundle.registration.registrationId,
      sourceFitsSha256:bundle.registration.source.fitsSha256,
      wcsHeaderSha256:bundle.registration.geometry.wcsHeaderSha256,
      observedAtUtc:bundle.registration.source.observedAtUtc,
      qualityStatus:bundle.registration.coverage.qualityStatus,
      validOnDiskCount:bundle.registration.geometry.validOnDiskCount,
      offDiskCount:bundle.registration.geometry.offDiskCount,
      maxRoundTripErrorPixels:bundle.registration.geometry.maxRoundTripErrorPixels,
      anchors:bundle.registration.anchors.map(anchor=>({pixelX:anchor.pixelX,pixelY:anchor.pixelY,
        carringtonLongitudeDeg:anchor.carringtonLongitudeDeg,
        carringtonLatitudeDeg:anchor.carringtonLatitudeDeg,
        roundTripErrorPixels:anchor.roundTripErrorPixels})),
      farSideObserved:false,magneticFitAllowed:false}:null,
    view:{recipeId:bundle.view.recipeId,cameraPosition:bundle.view.cameraPosition,
      losMarkerColorBasis:bundle.view.losMarkerColorBasis??'map_residual'},
    sourceIdentityAuthenticated:false,scientificAdmission:false,scienceRunAllowed:false,
    coronalLinesMeasured:false,globalMomentMeasured:false,
    catalogActiveRegionMarkersIncluded:false,catalogMarkersAssimilatedIntoMap:false,
    quantitativeValidationAllowed:false,
    rawGridIncluded:false,fitsIncluded:false,assistant_answer:false,answer_authority:false,
    terminal_eligible:false,reentry_required:true});
}
