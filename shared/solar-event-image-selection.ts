import { solarObservationTimeMs } from './solar-observation-time';

export type SolarEventImageSelection = {
  schemaVersion: 'solar-event-image-selection/1';
  relationship: 'contextual_co_occurrence_only';
  eventId: string;
  eventType: string;
  eventStartUtc: string;
  eventEndUtc: string | null;
  detectionMethod: string | null;
  selectedFrameIndex: number;
  sourceIdentityAuthenticated: false;
  scientificAdmission: false;
};

const KEY_SET = ['schemaVersion', 'relationship', 'eventId', 'eventType', 'eventStartUtc',
  'eventEndUtc', 'detectionMethod', 'selectedFrameIndex', 'sourceIdentityAuthenticated', 'scientificAdmission'];
const bounded = (value: unknown, max: number): value is string =>
  typeof value === 'string' && value.length > 0 && value.length <= max && value.trim() === value &&
  !/[\u0000-\u001f\u007f]/.test(value);
const utc = (value: unknown): value is string => solarObservationTimeMs(value) !== null;

/** This preserves only a catalog assertion and selected image index, never event-execution data. */
export function readSolarEventImageSelection(value: unknown, frameCount: number): SolarEventImageSelection {
  const item = value as Record<string, unknown>;
  if (!item || typeof item !== 'object' || Array.isArray(item) ||
      Object.keys(item).length !== KEY_SET.length || KEY_SET.some(key => !Object.hasOwn(item, key)) ||
      item.schemaVersion !== 'solar-event-image-selection/1' ||
      item.relationship !== 'contextual_co_occurrence_only' ||
      !bounded(item.eventId, 512) || !bounded(item.eventType, 16) || !utc(item.eventStartUtc) ||
      (item.eventEndUtc !== null && !utc(item.eventEndUtc)) ||
      (item.detectionMethod !== null && !bounded(item.detectionMethod, 128)) ||
      !Number.isInteger(item.selectedFrameIndex) || (item.selectedFrameIndex as number) < 0 ||
      (item.selectedFrameIndex as number) >= frameCount ||
      item.sourceIdentityAuthenticated !== false || item.scientificAdmission !== false)
    throw new Error('Selected event/image context rejected');
  if (item.eventEndUtc !== null && solarObservationTimeMs(item.eventEndUtc)! < solarObservationTimeMs(item.eventStartUtc)!)
    throw new Error('Selected event interval rejected');
  return item as SolarEventImageSelection;
}

export function createSolarEventImageSelection(event: { id?: string; ivorn?: string; event_type?: string;
  start_time?: string; start?: string; end_time?: string; end?: string; frm_name?: string },
  selectedFrameIndex: number, frameCount: number): SolarEventImageSelection | null {
  const eventId = event.id ?? event.ivorn;
  const eventStartUtc = event.start_time ?? event.start;
  if (!bounded(eventId, 512) || !utc(eventStartUtc)) return null;
  const eventEndUtc = event.end_time ?? event.end ?? null;
  return readSolarEventImageSelection({ schemaVersion: 'solar-event-image-selection/1',
    relationship: 'contextual_co_occurrence_only', eventId, eventType: event.event_type ?? 'unknown',
    eventStartUtc, eventEndUtc, detectionMethod: event.frm_name ?? null,
    selectedFrameIndex, sourceIdentityAuthenticated: false, scientificAdmission: false }, frameCount);
}
