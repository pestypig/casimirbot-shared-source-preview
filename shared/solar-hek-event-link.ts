/** A navigation link for a declared HEK IVORN, not validation of the record or its revision. */
export function solarHekEventRecordUrl(eventId: unknown): string | null {
  if (typeof eventId !== 'string' || eventId.length > 512 ||
      !/^ivo:\/\/[A-Za-z0-9.-]+\/[A-Za-z0-9._~:/%+-]+$/.test(eventId)) return null;
  return `https://www.lmsal.com/hek/her?cmd=view-voevent&ivorn=${encodeURIComponent(eventId)}`;
}
