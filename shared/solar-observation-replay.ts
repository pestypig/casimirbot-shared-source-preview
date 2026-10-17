import { decodeObservation } from '../public/solar-workstation-comparison.js';
import {readSolarDisplayNormalization} from './solar-display-normalization';
import {solarObservationTimeMs} from './solar-observation-time';
import {readSolarEventImageSelection} from './solar-event-image-selection';
import {readSolarGoesFrameWindow} from './solar-goes-frame-window';

export const SOLAR_OBSERVATION_SNAPSHOT_MAX_BYTES = 8_000_000;
function readRegistrationGeometry(value:unknown){
  if(value===undefined||value===null)return null;
  if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('Solar observer geometry must be an object');
  const geometry=value as Record<string,unknown>;
  const longitude=geometry.observerCarringtonLongitudeDeg,latitude=geometry.observerCarringtonLatitudeDeg;
  const distance=geometry.observerDistanceMeters,radius=geometry.solarRadiusMeters;
  if(typeof longitude!=='number'||!Number.isFinite(longitude)||longitude<0||longitude>=360||
    typeof latitude!=='number'||!Number.isFinite(latitude)||latitude< -90||latitude>90||
    typeof distance!=='number'||!Number.isFinite(distance)||
    typeof radius!=='number'||!Number.isFinite(radius)||radius<=0||distance<=radius)
    throw new Error('Solar observer geometry is outside supported physical bounds');
  return {observerCarringtonLongitudeDeg:longitude,observerCarringtonLatitudeDeg:latitude,
    observerDistanceMeters:distance,solarRadiusMeters:radius};
}
async function archiveIdentity(replay:unknown) {
  const bytes=new TextEncoder().encode(JSON.stringify(replay));
  if(bytes.length>SOLAR_OBSERVATION_SNAPSHOT_MAX_BYTES)throw new Error('Snapshot exceeds the 8 MB replay limit');
  const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),value=>value.toString(16).padStart(2,'0')).join('');
  return {schemaVersion:'solar-observation-archive-identity/1',snapshotId:`solar-observation:${digest}`,payloadSha256:digest,
    processingRecipe:'solar-observation-replay-sanitization/1',sourceIdentityAuthenticated:false,containsSourceFits:false,
    liveMeasurement:false,scientificAdmission:false};
}
export async function serializeObservationSnapshot(input: unknown): Promise<string> {
  const replay = await validateObservationReplay(input);
  const {archive_identity:_previous,...payload}=replay;
  const text = JSON.stringify({...payload,archive_identity:await archiveIdentity(payload)});
  if (new TextEncoder().encode(text).byteLength > SOLAR_OBSERVATION_SNAPSHOT_MAX_BYTES)
    throw new Error('Snapshot exceeds the 8 MB replay limit; choose fewer frames or a smaller grid');
  return text;
}

export async function validateObservationReplay(input: unknown) {
  const payload = input as Record<string, any>;
  if (!payload || typeof payload.instrument !== 'string' || !payload.instrument ||
      !Number.isFinite(payload.wavelength_A) || payload.wavelength_A <= 0 ||
      payload.meta?.observed_mode !== 'observed' ||
      !Array.isArray(payload.frames) || payload.frames.length < 1 || payload.frames.length > 40) {
    throw new Error('Expected a bounded observed SunPy snapshot, not model/demo data');
  }
  const fetchedAt=payload.meta?.fetched_at_utc;
  if(fetchedAt!=null&&solarObservationTimeMs(fetchedAt)===null)
    throw new Error('Snapshot retrieval time requires a valid calendar time with explicit UTC offset');
  const frames = [];
  let encodedBytes=0;
  for (const [index, frame] of payload.frames.entries()) {
    // Reject implausible encoded grids before atob allocates or scans them.
    if(!frame || !Number.isInteger(frame.grid_size) || frame.grid_size<32 || frame.grid_size>512 ||
      typeof frame.map_b64!=='string' || frame.map_b64.length!==4*Math.ceil(frame.grid_size**2*4/3))
      throw new Error('Observation grid encoded byte-count mismatch');
    encodedBytes+=frame.map_b64.length;
    if(encodedBytes>SOLAR_OBSERVATION_SNAPSHOT_MAX_BYTES)
      throw new Error('Snapshot exceeds the 8 MB replay limit');
    decodeObservation(frame);
    if (!/^[a-f0-9]{64}$/.test(frame.fits_sha256 ?? '') ||
        !/^[a-f0-9]{64}$/.test(frame.display_sha256 ?? '') ||
        frame.coordinate_frame !== 'native_instrument_pixel_grid' ||
        solarObservationTimeMs(frame.obstime)===null) {
      throw new Error('Snapshot lacks explicit coordinates, UTC time or content hashes');
    }
    const bytes = Uint8Array.from(atob(frame.map_b64), c => c.charCodeAt(0));
    const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)),
      v => v.toString(16).padStart(2, '0')).join('');
    if (hash !== frame.display_sha256) throw new Error('Snapshot display hash mismatch');
    const normalization=readSolarDisplayNormalization(frame.display_normalization,frame.display_processing);
    const registrationGeometry=readRegistrationGeometry(frame.registration_geometry);
    // Only admit fields needed for image replay. Imported event/bridge objects
    // are not executable inputs or observational authority; the separate bounded
    // selected-event assertion below is display context only.
    frames.push({ index, obstime: frame.obstime as string, grid_size: frame.grid_size as number,
      map_b64: frame.map_b64 as string, fits_sha256: frame.fits_sha256 as string,
      display_sha256: hash, coordinate_frame: frame.coordinate_frame as string,
      ...(normalization?{display_normalization:normalization}:{}),
      ...(registrationGeometry?{registration_geometry:registrationGeometry}:{}),
      display_processing: typeof frame.display_processing === 'string' ? frame.display_processing : 'unspecified',
      wcs_header: frame.wcs_header && typeof frame.wcs_header === 'object' && !Array.isArray(frame.wcs_header)
        ? Object.fromEntries(Object.entries(frame.wcs_header).filter(([key, value]) =>
            key.length <= 80 && (typeof value === 'string' || typeof value === 'boolean' ||
              (typeof value === 'number' && Number.isFinite(value))))) : null });
  }
  const selectedEventContext=payload.selected_event_context===undefined ? undefined :
    readSolarEventImageSelection(payload.selected_event_context,frames.length);
  const selectedGoesWindow=payload.selected_goes_window===undefined ? undefined :
    readSolarGoesFrameWindow(payload.selected_goes_window,frames);
  const replay={ instrument: payload.instrument as string, wavelength_A: payload.wavelength_A as number,
    frames, events: [], meta: { source: 'imported_observation_replay', observed_mode: 'observed',
      fetched_at_utc: typeof fetchedAt==='string'?fetchedAt:null },
    ...(selectedEventContext ? {selected_event_context:selectedEventContext}: {}),
    ...(selectedGoesWindow ? {selected_goes_window:selectedGoesWindow}: {}) };
  if(payload.archive_identity!==undefined) {
    const expected=await archiveIdentity(replay);
    const provided=payload.archive_identity;
    if(!provided || typeof provided!=='object' || Array.isArray(provided) ||
      Object.keys(provided).length!==Object.keys(expected).length ||
      Object.entries(expected).some(([key,value])=>provided[key]!==value))
      throw new Error('Snapshot archive identity or lineage mismatch');
    return {...replay,archive_identity:expected};
  }
  return {...replay,archive_identity:undefined};
}
