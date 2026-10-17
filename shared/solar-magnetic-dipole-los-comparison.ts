import {deriveSolarEquivalentDipole,solarGlobalRadialMapContentId,solarGlobalRadialMapSchema,
  type SolarGlobalRadialMap} from './solar-magnetic-dipole';
import {verifySolarMagneticLosDiagnostic,type SolarMagneticLosDiagnostic} from './solar-magnetic-los-diagnostic';

/** Radial l=1 component only. This omits the dipole's horizontal photospheric field. */
export function projectRadialL1ToLos(vectorGauss:[number,number,number],
  latitudeDeg:number,longitudeDeg:number,radialLosCosine:number){
  if(![...vectorGauss,latitudeDeg,longitudeDeg,radialLosCosine].every(Number.isFinite)||
      latitudeDeg< -90||latitudeDeg>90||longitudeDeg<0||longitudeDeg>360||
      radialLosCosine<0||radialLosCosine>1)
    throw new Error('SOLAR_DIP_LOS_PROJECTION_INVALID');
  const lat=latitudeDeg*Math.PI/180,lon=longitudeDeg*Math.PI/180;
  const radialL1Gauss=2*(vectorGauss[0]*Math.cos(lat)*Math.cos(lon)+
    vectorGauss[1]*Math.cos(lat)*Math.sin(lon)+vectorGauss[2]*Math.sin(lat));
  return radialL1Gauss*radialLosCosine;
}

/** Exploratory same-displayed-sample comparison, not global-moment measurement or calibrated validation. */
export async function compareDisplayedHmiLosToMapL1(mapInput:SolarGlobalRadialMap,
  diagnosticInput:SolarMagneticLosDiagnostic){
  const map=solarGlobalRadialMapSchema.parse(mapInput);
  const diagnostic=await verifySolarMagneticLosDiagnostic(diagnosticInput);
  const mapId=await solarGlobalRadialMapContentId(map);
  if(diagnostic.sourceMapContentId!==mapId||
      diagnostic.mapSourceProductId!==map.source.productId||
      diagnostic.mapSourceSha256!==map.source.sha256||
      diagnostic.mapLatestContributorUtc!==map.source.inputEndUtc||
      diagnostic.mapEarliestContributorUtc!==map.source.inputStartUtc)
    throw new Error('SOLAR_DIP_LOS_SOURCE_MISMATCH');
  const dipole=deriveSolarEquivalentDipole(map);
  let mapSquared=0,l1Squared=0;
  const l1ProjectedLosGauss=diagnostic.displayPoints.map(point=>{
    const predicted=projectRadialL1ToLos(dipole.vectorGauss,point.latitudeDeg,point.longitudeDeg,point.mu);
    mapSquared+=(point.measuredLosGauss-point.projectedMapLosGauss)**2;
    l1Squared+=(point.measuredLosGauss-predicted)**2;
    return predicted;
  });
  const count=diagnostic.displayPoints.length;
  return {schemaVersion:'solar-displayed-hmi-los-l1-comparison/1' as const,
    sourceMapContentId:mapId,losDiagnosticId:diagnostic.diagnosticId,
    sampleCount:count,selection:'diagnostic_display_points_active_field_subset' as const,
    mapProjectedLosRmsGauss:Math.sqrt(mapSquared/count),
    radialL1ProjectedLosRmsGauss:Math.sqrt(l1Squared/count),
    l1ProjectedLosGauss,
    projection:'two_times_map_l1_dot_radial_unit_vector_times_mu/1' as const,
    matchedUncertaintyAvailable:false as const,sameTimeFullSunObservation:false as const,
    scientificAdmission:false as const,quantitativeValidationAllowed:false as const};
}
