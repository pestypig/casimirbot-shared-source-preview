import {z} from 'zod';
import {deriveSolarEquivalentDipole,solarGlobalRadialMapContentId,solarGlobalRadialMapSchema} from './solar-magnetic-dipole';
import {solarPfssGeometrySchema,verifySolarPfssGeometry} from './solar-pfss-geometry';
import {solarMagneticLosDiagnosticSchema,verifySolarMagneticLosDiagnostic} from './solar-magnetic-los-diagnostic';
import {solarMagneticViewRecipeSchema,verifySolarMagneticViewRecipe} from './solar-magnetic-view-recipe';
import {solarSphereRegistrationSchema,verifySolarSphereRegistration} from './solar-sphere-registration';

const payload=z.object({
  schemaVersion:z.literal('solar-magnetic-comparison-bundle/1'),
  map:solarGlobalRadialMapSchema,
  pfss:solarPfssGeometrySchema.nullable(),
  losDiagnostic:solarMagneticLosDiagnosticSchema.nullable(),
  registration:solarSphereRegistrationSchema.optional(),
  view:solarMagneticViewRecipeSchema,
  sourceIdentityAuthenticated:z.literal(false),
  scientificAdmission:z.literal(false),
  quantitativeValidationAllowed:z.literal(false),
}).strict();
export const solarMagneticComparisonBundleSchema=payload.extend({
  bundleId:z.string().regex(/^solar-magnetic-bundle:[a-f0-9]{64}$/),
}).strict();
export type SolarMagneticComparisonBundle=z.infer<typeof solarMagneticComparisonBundleSchema>;
export type SolarMagneticComparisonBundlePayload=z.infer<typeof payload>;

async function digest(value:unknown){
  const bytes=new TextEncoder().encode(JSON.stringify(value));
  const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),
    byte=>byte.toString(16).padStart(2,'0')).join('');
  return `solar-magnetic-bundle:${hash}`;
}

async function verifyLinks(bundle:SolarMagneticComparisonBundlePayload){
  const mapId=await solarGlobalRadialMapContentId(bundle.map);
  if(bundle.view.mapContentId!==mapId)
    throw new Error('SOLAR_MAGNETIC_BUNDLE_VIEW_MAP_MISMATCH');
  if(bundle.pfss){
    await verifySolarPfssGeometry(bundle.pfss);
    if(bundle.pfss.sourceMapContentId!==mapId ||
      bundle.pfss.sourceMapProductId!==bundle.map.source.productId ||
      bundle.pfss.sourceMapSha256!==bundle.map.source.sha256)
      throw new Error('SOLAR_MAGNETIC_BUNDLE_PFSS_MAP_MISMATCH');
  }
  if(bundle.view.pfssModelId!==(bundle.pfss?.modelId??null))
    throw new Error('SOLAR_MAGNETIC_BUNDLE_VIEW_PFSS_MISMATCH');
  if(bundle.losDiagnostic){
    await verifySolarMagneticLosDiagnostic(bundle.losDiagnostic);
    if(bundle.losDiagnostic.sourceMapContentId!==mapId ||
      bundle.losDiagnostic.mapSourceProductId!==bundle.map.source.productId ||
      bundle.losDiagnostic.mapSourceSha256!==bundle.map.source.sha256 ||
      bundle.losDiagnostic.mapLatestContributorUtc!==bundle.map.source.inputEndUtc ||
      bundle.losDiagnostic.mapEarliestContributorUtc!==bundle.map.source.inputStartUtc)
      throw new Error('SOLAR_MAGNETIC_BUNDLE_LOS_MAP_MISMATCH');
  }
  if((bundle.view.losDiagnosticId??null)!==(bundle.losDiagnostic?.diagnosticId??null))
    throw new Error('SOLAR_MAGNETIC_BUNDLE_VIEW_LOS_MISMATCH');
  if(bundle.registration){
    await verifySolarSphereRegistration(bundle.registration);
    if(!bundle.losDiagnostic||
      bundle.registration.source.fitsSha256!==bundle.losDiagnostic.hmi.sha256||
      bundle.registration.source.productId!==bundle.losDiagnostic.hmi.drmsId||
      bundle.registration.source.observedAtUtc!==bundle.losDiagnostic.hmi.observedAtUtc||
      bundle.registration.source.qualityFlag!==bundle.losDiagnostic.hmi.qualityFlag)
      throw new Error('SOLAR_MAGNETIC_BUNDLE_REGISTRATION_HMI_MISMATCH');
  }
  if(bundle.view.showMapEquivalentDipole&&deriveSolarEquivalentDipole(bundle.map).magnitudeGauss<1e-6)
    throw new Error('SOLAR_MAGNETIC_BUNDLE_DIPOLE_UNDEFINED');
  await verifySolarMagneticViewRecipe(bundle.view);
  return mapId;
}

/** Local content and relationship check; neither sources nor physical accuracy are authenticated. */
export async function prepareSolarMagneticComparisonBundle(input:SolarMagneticComparisonBundlePayload){
  const checked=payload.parse(input);
  await verifyLinks(checked);
  return solarMagneticComparisonBundleSchema.parse({...checked,bundleId:await digest(checked)});
}

export async function verifySolarMagneticComparisonBundle(input:unknown){
  const checked=solarMagneticComparisonBundleSchema.parse(input);
  const {bundleId,...body}=checked;
  if(bundleId!==await digest(body))throw new Error('SOLAR_MAGNETIC_BUNDLE_ID_MISMATCH');
  await verifyLinks(body);
  return checked;
}
