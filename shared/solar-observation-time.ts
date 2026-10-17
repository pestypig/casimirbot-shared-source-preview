/** Validate declared Gregorian timestamps; milliseconds are diagnostic resolution,
 * not a claim to preserve sub-millisecond timing in arithmetic. */
export function solarObservationTimeMs(value: unknown): number | null {
  if (typeof value !== 'string') return null;
  const parts=/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,9})?(Z|[+-](\d{2}):(\d{2}))$/.exec(value);
  if (!parts) return null;
  const [year,month,day,hour,minute,second]=parts.slice(1,7).map(Number);
  const leap=year%4===0&&(year%100!==0||year%400===0);
  const days=[31,leap?29:28,31,30,31,30,31,31,30,31,30,31];
  if(month<1||month>12||day<1||day>days[month-1]||hour>23||minute>59||second>59||
    (parts[7]!=='Z'&&(Number(parts[8])>23||Number(parts[9])>59)))return null;
  const time=Date.parse(value);
  return Number.isFinite(time)?time:null;
}
