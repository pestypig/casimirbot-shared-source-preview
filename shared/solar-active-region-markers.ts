/** HEK catalog locations for display only. They do not constrain a magnetic model. */
export interface SolarActiveRegionEvent {
  ivorn?: string;
  id?: string;
  event_type?: string;
  event_coordsys?: string;
  start_time?: string;
  start?: string;
  end_time?: string;
  end?: string;
  hgc_x?: number;
  hgc_y?: number;
  noaa_ar?: number;
}

export interface SolarActiveRegionMarker {
  id: string;
  longitudeDeg: number;
  latitudeDeg: number;
  startUtc: string;
  endUtc: string | null;
  noaaAr: number | null;
  source: 'HEK_catalog_HGC';
}

const utcMs = (value: unknown): number | null => {
  if (typeof value !== 'string' || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?Z$/.test(value)) return null;
  const time = Date.parse(value);
  return Number.isFinite(time) ? time : null;
};

export function solarActiveRegionMarkers(events: readonly SolarActiveRegionEvent[]): SolarActiveRegionMarker[] {
  const markers: SolarActiveRegionMarker[] = [];
  const seen = new Set<string>();
  for (const event of events) {
    if (markers.length >= 100) break;
    if (event.event_type?.toUpperCase() !== 'AR') continue;
    const id = event.ivorn ?? event.id;
    const lon = event.hgc_x;
    const lat = event.hgc_y;
    const start = event.start_time ?? event.start;
    const startMs = utcMs(start);
    const end = event.end_time ?? event.end;
    const endMs = end == null ? null : utcMs(end);
    if (!id || seen.has(id) || !Number.isFinite(lon) || !Number.isFinite(lat) ||
        Math.abs(lon as number) > 360 || Math.abs(lat as number) > 90 ||
        startMs === null || (end != null && (endMs === null || endMs < startMs))) continue;
    seen.add(id);
    markers.push({id, longitudeDeg: ((lon as number) % 360 + 360) % 360, latitudeDeg: lat as number,
      startUtc: start as string, endUtc: end ?? null,
      noaaAr: Number.isInteger(event.noaa_ar) && (event.noaa_ar as number) > 0 ? event.noaa_ar as number : null,
      source: 'HEK_catalog_HGC'});
  }
  return markers;
}
