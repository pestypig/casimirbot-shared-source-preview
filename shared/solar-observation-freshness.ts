import {solarObservationTimeMs} from './solar-observation-time';

export type SolarObservationFreshnessState = 'time_unverified' | 'archive_replay' | 'stale_archive' | 'recent_archive';

export function solarObservationFreshness(input:{acquiredAt?:string|null;fetchedAt?:string|null;replay:boolean;
  nowMs:number;maxAgeMs?:number}) {
  const maxAgeMs=input.maxAgeMs ?? 2*60*60*1000;
  if(!Number.isFinite(input.nowMs)||!Number.isFinite(maxAgeMs)||maxAgeMs<=0)throw new Error('Invalid freshness policy');
  const acquired=solarObservationTimeMs(input.acquiredAt),fetched=solarObservationTimeMs(input.fetchedAt);
  const ageMs=acquired===null?null:input.nowMs-acquired;
  const fetchAgeMs=fetched===null?null:input.nowMs-fetched;
  const invalid=acquired===null || (input.fetchedAt!=null && fetched===null) || (ageMs!==null && ageMs<0) || (fetchAgeMs!==null && fetchAgeMs<0) ||
    (acquired!==null && fetched!==null && fetched<acquired);
  const state:SolarObservationFreshnessState=invalid?'time_unverified':input.replay?'archive_replay':(ageMs ?? Infinity)>maxAgeMs?'stale_archive':'recent_archive';
  return {state,ageMs:ageMs!==null && ageMs>=0?ageMs:null,fetchAgeMs:fetchAgeMs!==null && fetchAgeMs>=0?fetchAgeMs:null,
    maxAgeMs,acquiredAt:input.acquiredAt ?? null,fetchedAt:input.fetchedAt ?? null,
    liveMeasurement:false as const,sourceIdentityAuthenticated:false as const};
}
