import type {HelixProfileStorageSnapshot,HelixProfileStorageWriteRequest} from './helix-profile-storage';

const retainedKey=(key:unknown)=>typeof key==='string' &&
  (key.startsWith('solar-research-record:') || key.startsWith('solar-research-package:') ||
    key.startsWith('solar-magnetic-bundle:'));

/** Browser backup may neither create nor replace server-retained research keys.
 * Numerical integrity/admission remains the domain reader's responsibility. */
export function preserveRetainedSolarRecords(current:HelixProfileStorageSnapshot,incoming:HelixProfileStorageWriteRequest):HelixProfileStorageWriteRequest {
  return {
    entries:[...incoming.entries.filter(entry=>!retainedKey(entry.storage_key)),
      ...current.entries.filter(entry=>retainedKey(entry.storage_key))],
    artifacts:[...incoming.artifacts.filter(artifact=>!retainedKey(artifact.storage_key)),
      ...current.artifacts.filter(artifact=>retainedKey(artifact.storage_key))],
  };
}
