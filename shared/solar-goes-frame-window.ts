import { solarObservationTimeMs } from './solar-observation-time';

export type SolarGoesFrameWindow = {
  schemaVersion: 'solar-goes-frame-window/1';
  relationship: 'temporal_context_only';
  source: 'SunPy/Fido GOES XRS';
  channel: 'long';
  units: 'W/m2';
  selectedFrameIndex: number;
  frameAcquiredAt: string;
  windowStartUtc: string;
  windowEndUtc: string;
  bins: Array<{startUtc:string;endUtc:string;meanLongWm2:number}>;
  sourceFilesAuthenticated: false;
  scientificAdmission: false;
};

const utc = (value: unknown): value is string => solarObservationTimeMs(value) !== null;

/** Fido's pandas ISO strings omit a zone; only this known UTC producer is normalized. */
function sourceUtc(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const candidate = /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,9})?$/.test(value) ? `${value}Z` : value;
  const ms = solarObservationTimeMs(candidate);
  return ms === null ? null : new Date(ms).toISOString();
}

export function readSolarGoesFrameWindow(value: unknown, frames: Array<{obstime:string}>): SolarGoesFrameWindow {
  const item = value as Record<string, unknown>;
  const keys = ['schemaVersion','relationship','source','channel','units','selectedFrameIndex',
    'frameAcquiredAt','windowStartUtc','windowEndUtc','bins','sourceFilesAuthenticated','scientificAdmission'];
  if (!item || typeof item !== 'object' || Array.isArray(item) || Object.keys(item).length !== keys.length ||
      keys.some(key=>!Object.hasOwn(item,key)) || item.schemaVersion !== 'solar-goes-frame-window/1' ||
      item.relationship !== 'temporal_context_only' || item.source !== 'SunPy/Fido GOES XRS' ||
      item.channel !== 'long' || item.units !== 'W/m2' || item.sourceFilesAuthenticated !== false ||
      item.scientificAdmission !== false || !Number.isInteger(item.selectedFrameIndex) ||
      (item.selectedFrameIndex as number) < 0 || (item.selectedFrameIndex as number) >= frames.length ||
      !utc(item.frameAcquiredAt) || item.frameAcquiredAt !== frames[item.selectedFrameIndex as number].obstime ||
      !utc(item.windowStartUtc) || !utc(item.windowEndUtc) ||
      solarObservationTimeMs(item.windowEndUtc)! <= solarObservationTimeMs(item.windowStartUtc)! ||
      solarObservationTimeMs(item.frameAcquiredAt)! < solarObservationTimeMs(item.windowStartUtc)! ||
      solarObservationTimeMs(item.frameAcquiredAt)! > solarObservationTimeMs(item.windowEndUtc)! ||
      !Array.isArray(item.bins) || item.bins.length > 25) throw new Error('Selected GOES frame window rejected');
  let previousStart = -Infinity;
  for (const bin of item.bins) {
    const row = bin as Record<string, unknown>;
    if (!row || typeof row !== 'object' || Array.isArray(row) ||
        Object.keys(row).length !== 3 || !Object.hasOwn(row,'startUtc') ||
        !Object.hasOwn(row,'endUtc') || !Object.hasOwn(row,'meanLongWm2') ||
        !utc(row.startUtc) || !utc(row.endUtc) ||
        solarObservationTimeMs(row.startUtc)! < solarObservationTimeMs(item.windowStartUtc)! ||
        solarObservationTimeMs(row.endUtc)! > solarObservationTimeMs(item.windowEndUtc)! ||
        solarObservationTimeMs(row.endUtc)! <= solarObservationTimeMs(row.startUtc)! ||
        solarObservationTimeMs(row.startUtc)! <= previousStart ||
        typeof row.meanLongWm2 !== 'number' || !Number.isFinite(row.meanLongWm2) || row.meanLongWm2 <= 0)
      throw new Error('Selected GOES bin rejected');
    previousStart = solarObservationTimeMs(row.startUtc)!;
  }
  return item as SolarGoesFrameWindow;
}

/** Bounded graph context; no GOES source file or causal flare attribution is inferred. */
export function createSolarGoesFrameWindow(input: {
  frames:Array<{obstime:string}>;selectedFrameIndex:number;
  bins?:Array<{start?:string;end?:string;mean_long?:number}>;
}): SolarGoesFrameWindow | null {
  const frame = input.frames[input.selectedFrameIndex];
  const frameMs = solarObservationTimeMs(frame?.obstime);
  if (frameMs === null) return null;
  const startMs = frameMs - 30*60_000, endMs = frameMs + 30*60_000;
  const bins = (input.bins ?? []).flatMap(bin=>{
    const startUtc = sourceUtc(bin.start), endUtc = sourceUtc(bin.end);
    const start = solarObservationTimeMs(startUtc), end = solarObservationTimeMs(endUtc);
    if (start === null || end === null || end <= start || start < startMs || end > endMs ||
        typeof bin.mean_long !== 'number' || !Number.isFinite(bin.mean_long) || bin.mean_long <= 0) return [];
    return [{startUtc,endUtc,meanLongWm2:bin.mean_long}];
  }).sort((a,b)=>Math.abs((solarObservationTimeMs(a.startUtc)!+solarObservationTimeMs(a.endUtc)!)/2-frameMs)-
      Math.abs((solarObservationTimeMs(b.startUtc)!+solarObservationTimeMs(b.endUtc)!)/2-frameMs))
    .slice(0,25).sort((a,b)=>solarObservationTimeMs(a.startUtc)!-solarObservationTimeMs(b.startUtc)!);
  return readSolarGoesFrameWindow({schemaVersion:'solar-goes-frame-window/1',relationship:'temporal_context_only',
    source:'SunPy/Fido GOES XRS',channel:'long',units:'W/m2',selectedFrameIndex:input.selectedFrameIndex,
    frameAcquiredAt:frame!.obstime,windowStartUtc:new Date(startMs).toISOString(),
    windowEndUtc:new Date(endMs).toISOString(),bins,sourceFilesAuthenticated:false,scientificAdmission:false},input.frames);
}
