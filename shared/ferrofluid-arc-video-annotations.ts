/**
 * One-reviewer, approximate edge ranges on three extracted 1080 × 1920 frames.
 * These are projected silhouettes through curved glass, not material landmarks.
 * The private pixels are not bundled. Source/frame hashes permit local replay.
 */
export const FERROFLUID_ARC_VIDEO_IMAGE_PLANE={
  clipSha256:'3038BFDAFFB3DF62C9BF7668F9B146442A670D427F602C193DA7411003A7767D',
  coordinateFrame:'display-oriented 1080×1920 PNG, x increasing right' as const,
  method:'single-reviewer conservative visual edge ranges; no independent annotation or camera calibration' as const,
  frames:[
    {timeS:0.5,frameSha256:'691CD97DC9E9F9B426FF1E1556CFBE7C555039C446191F7F141694A48B5065A3',
      arcLeftPx:[345,365],arcRightPx:[405,425],bodyLeftPx:[185,205],bodyRightPx:[615,635]},
    {timeS:3,frameSha256:'61AB698CA595D763ACCBCFADE1A0589E5C485F0DEF6DFC85FACC354E401539EB',
      arcLeftPx:[390,410],arcRightPx:[510,530],bodyLeftPx:[185,205],bodyRightPx:[740,760]},
    {timeS:10,frameSha256:'C34C382A65C3EA8F314B9C951438019D88D98C6260F3D39EB914D36C97F0134D',
      arcLeftPx:[340,365],arcRightPx:[570,595],bodyLeftPx:[70,100],bodyRightPx:[750,780]},
  ],
  physicallyCalibrated:false as const,
  cameraFramingFixed:false as const,
  measuresMaterialTrajectory:false as const,
} as const;

type EdgeRange=readonly [number,number];
type HorizontalSilhouette={
  arcLeftPx:EdgeRange;arcRightPx:EdgeRange;bodyLeftPx:EdgeRange;bodyRightPx:EdgeRange;
};

/** Conservative bounds induced by the manually marked edge intervals. */
export function projectedArcSpanOverBodyWidthBounds(frame:HorizontalSilhouette){
  const ranges=[frame.arcLeftPx,frame.arcRightPx,frame.bodyLeftPx,frame.bodyRightPx];
  if(ranges.some(([low,high])=>!Number.isFinite(low)||!Number.isFinite(high)||low<0||high>1080||low>high)){
    throw new RangeError('Image-plane edge range is invalid');
  }
  const minimumArcWidth=frame.arcRightPx[0]-frame.arcLeftPx[1];
  const maximumArcWidth=frame.arcRightPx[1]-frame.arcLeftPx[0];
  const minimumBodyWidth=frame.bodyRightPx[0]-frame.bodyLeftPx[1];
  const maximumBodyWidth=frame.bodyRightPx[1]-frame.bodyLeftPx[0];
  if(minimumArcWidth<=0||minimumBodyWidth<=0)throw new RangeError('Image-plane spans must remain positive');
  return [minimumArcWidth/maximumBodyWidth,maximumArcWidth/minimumBodyWidth] as const;
}
