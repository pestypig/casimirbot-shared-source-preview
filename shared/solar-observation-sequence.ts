/** Timestamp-only diagnostic. Never resamples, sorts, calibrates or admits a join. */
export function inspectSolarObservationSequence(frames:readonly {obstime:string}[]) {
  if(frames.length<1||frames.length>40)throw new Error('Expected 1–40 archive frames');
  const times=frames.map(frame=>{
    const parts=typeof frame.obstime==='string'
      ? /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,3})?(Z|[+-](\d{2}):(\d{2}))$/.exec(frame.obstime)
      : null;
    if(!parts)
      throw new Error('Acquisition time requires an explicit UTC offset');
    const [year,month,day,hour,minute,second]=parts.slice(1,7).map(Number);
    const leap=year%4===0&&(year%100!==0||year%400===0);
    const monthDays=[31,leap?29:28,31,30,31,30,31,31,30,31,30,31];
    if(month<1||month>12||day<1||day>monthDays[month-1]||hour>23||minute>59||second>59
      ||(parts[7]!=='Z'&&(Number(parts[8])>23||Number(parts[9])>59)))
      throw new Error('Invalid acquisition calendar time');
    const time=Date.parse(frame.obstime);
    if(!Number.isFinite(time))throw new Error('Invalid acquisition time');
    return time;
  });
  const intervalsMs=times.slice(1).map((time,index)=>time-times[index]);
  const duplicateTimes=times.length-new Set(times).size;
  const reversedIntervals=intervalsMs.filter(interval=>interval<0).length;
  const strictlyIncreasing=intervalsMs.length>0&&intervalsMs.every(interval=>interval>0);
  // Equal observed spacing is descriptive, not evidence that frames are missing-free.
  const equalObservedSpacing=strictlyIncreasing&&intervalsMs.every(interval=>interval===intervalsMs[0]);
  return {frameCount:times.length,firstAcquiredAt:frames[0].obstime,lastAcquiredAt:frames[frames.length-1].obstime,
    observedSpanMs:Math.max(...times)-Math.min(...times),intervalsMs,duplicateTimes,reversedIntervals,
    strictlyIncreasing,equalObservedSpacing,
    observedSpacingMs:equalObservedSpacing?intervalsMs[0]:null,
    correlationAllowed:false as const,scientificAdmission:false as const,
    limitations:['Acquisition timestamps only; fetch time is not a substitute.',
      'Observed spacing does not establish completeness, registration, calibrated radiance or independence.',
      'No physical image/interior join or correlation statistic is admitted.']};
}
