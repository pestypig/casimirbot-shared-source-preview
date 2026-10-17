import { solarObservationTimeMs } from './solar-observation-time';

export type SolarEventImageContext = {
  relationship: 'contextual_co_occurrence_only';
  eventId: string | null;
  eventType: string;
  eventStartUtc: string | null;
  eventEndUtc: string | null;
  detectionMethod: string | null;
  imageTimeUtc: string | null;
  imageOffsetFromEventStartSeconds: number | null;
  imageWithinReportedEvent: boolean | null;
  instrument: string | null;
  wavelengthAngstrom: number | null;
  fetchedAtUtc: string | null;
  archiveSnapshotId: string | null;
  missing: string[];
};

type EventInput = { id?: unknown; ivorn?: unknown; event_type?: unknown; start_time?: unknown;
  start?: unknown; end_time?: unknown; end?: unknown; frm_name?: unknown };
type FrameInput = { obstime?: unknown };
type ObservationInput = { instrument?: unknown; wavelength_A?: unknown;
  meta?: { fetched_at_utc?: unknown }; archive_identity?: { snapshotId?: unknown } };

const validUtc = (value: unknown): string | null =>
  solarObservationTimeMs(value) === null ? null : new Date(solarObservationTimeMs(value)!).toISOString();
const nonempty = (value: unknown): string | null =>
  typeof value === 'string' && value.trim() ? value.trim() : null;

/** A selected image is context for an event, not a calibrated event/model comparison. */
export function buildSolarEventImageContext(event: EventInput, frame: FrameInput | null,
  observation: ObservationInput | null): SolarEventImageContext {
  const eventId = nonempty(event.id) ?? nonempty(event.ivorn);
  const eventStartUtc = validUtc(event.start_time ?? event.start);
  const eventEndUtc = validUtc(event.end_time ?? event.end);
  const imageTimeUtc = validUtc(frame?.obstime);
  const startMs = solarObservationTimeMs(eventStartUtc);
  const endMs = solarObservationTimeMs(eventEndUtc);
  const imageMs = solarObservationTimeMs(imageTimeUtc);
  const missing: string[] = [];
  if (!eventId) missing.push('stable event source ID');
  if (!eventStartUtc) missing.push('valid event start with UTC offset');
  if (!eventEndUtc) missing.push('valid event end with UTC offset');
  if (!imageTimeUtc) missing.push('valid selected image acquisition time');
  if (!nonempty(event.frm_name)) missing.push('event detection method');
  if (!observation?.archive_identity?.snapshotId) missing.push('declared image snapshot identity');
  return {
    relationship: 'contextual_co_occurrence_only', eventId,
    eventType: nonempty(event.event_type) ?? 'unknown', eventStartUtc, eventEndUtc,
    detectionMethod: nonempty(event.frm_name), imageTimeUtc,
    imageOffsetFromEventStartSeconds: startMs === null || imageMs === null ? null : (imageMs - startMs) / 1000,
    imageWithinReportedEvent: startMs === null || endMs === null || imageMs === null || endMs < startMs
      ? null : startMs <= imageMs && imageMs <= endMs,
    instrument: nonempty(observation?.instrument),
    wavelengthAngstrom: typeof observation?.wavelength_A === 'number' &&
      Number.isFinite(observation.wavelength_A) && observation.wavelength_A > 0
      ? observation.wavelength_A : null,
    fetchedAtUtc: validUtc(observation?.meta?.fetched_at_utc),
    archiveSnapshotId: nonempty(observation?.archive_identity?.snapshotId), missing,
  };
}
