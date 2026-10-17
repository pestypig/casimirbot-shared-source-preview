import {z} from 'zod';

const hash=z.string().regex(/^[A-F0-9]{64}$/);
const range=(min:number)=>z.tuple([z.number().finite(),z.number().finite()])
  .refine(([low,high])=>low>=min&&high>=low,'Expected an ordered finite interval');
const point=z.object({xPx:z.number().finite(),yPx:z.number().finite(),uncertaintyPx:z.number().finite().nonnegative()}).strict();
const frame=z.object({
  timeS:z.number().finite().nonnegative(),
  frameSha256:hash,
  state:z.enum(['present','absent','unresolvable']),
  bodyWidthPx:range(Number.MIN_VALUE),
  bodyReferenceYPx:range(0),
  centerline:z.array(point).max(10),
}).strict().superRefine((value,ctx)=>{
  if(value.state==='present'&&value.centerline.length<3)
    ctx.addIssue({code:'custom',path:['centerline'],message:'A present arc needs at least three ordered centerline points.'});
  if(value.state!=='present'&&value.centerline.length!==0)
    ctx.addIssue({code:'custom',path:['centerline'],message:'Absent or unresolvable frames cannot carry an arc contour.'});
});

/**
 * Source-linked manual annotations. All geometry is image-plane only; body-width
 * normalization is a local scale proxy, not camera registration or calibration.
 */
export const ferrofluidArcImagePlaneSeriesSchema=z.object({
  schemaVersion:z.literal('ferrofluid-arc-image-plane-series/1'),
  videoSha256:hash,
  coordinateFrame:z.literal('display-oriented-pixels'),
  clockBasis:z.literal('container-relative'),
  normalization:z.literal('local-body-width-proxy'),
  appearanceCriterion:z.string().trim().min(1),
  annotationMethod:z.string().trim().min(1),
  frames:z.array(frame).min(2).max(1000),
}).strict().superRefine((value,ctx)=>{
  for(let index=1;index<value.frames.length;index++){
    if(value.frames[index].timeS<=value.frames[index-1].timeS)
      ctx.addIssue({code:'custom',path:['frames',index,'timeS'],message:'Frame times must increase strictly.'});
  }
});
export type FerrofluidArcImagePlaneSeries=z.infer<typeof ferrofluidArcImagePlaneSeriesSchema>;

function curvaturePerPixel(points:readonly {xPx:number;yPx:number}[]):number{
  let length=0,turn=0;
  for(let index=1;index<points.length;index++){
    const ax=points[index].xPx-points[index-1].xPx;
    const ay=points[index].yPx-points[index-1].yPx;
    const segment=Math.hypot(ax,ay);
    if(segment<=1e-9)throw new RangeError('Centerline contains coincident points.');
    length+=segment;
    if(index>=2){
      const bx=points[index].xPx-points[index-1].xPx;
      const by=points[index].yPx-points[index-1].yPx;
      const cx=points[index-1].xPx-points[index-2].xPx;
      const cy=points[index-1].yPx-points[index-2].yPx;
      turn+=Math.atan2(cx*by-cy*bx,cx*bx+cy*by);
    }
  }
  return turn/length;
}

function curvatureErrorBound(points:readonly z.infer<typeof point>[]):number{
  const coordinates=points.flatMap(item=>[
    {key:'xPx' as const,uncertainty:item.uncertaintyPx},
    {key:'yPx' as const,uncertainty:item.uncertaintyPx},
  ]);
  const step=0.05;
  return coordinates.reduce((sum,coordinate,index)=>{
    const pointIndex=Math.floor(index/2);
    const shifted=points.map(item=>({...item}));
    shifted[pointIndex][coordinate.key]+=step;
    const forward=curvaturePerPixel(shifted);
    shifted[pointIndex][coordinate.key]-=2*step;
    const backward=curvaturePerPixel(shifted);
    return sum+Math.abs((forward-backward)/(2*step))*coordinate.uncertainty;
  },0);
}

function frameMetrics(item:z.infer<typeof frame>){
  if(item.state!=='present')return {timeS:item.timeS,frameSha256:item.frameSha256,state:item.state} as const;
  const apexLow=Math.min(...item.centerline.map(sample=>sample.yPx-sample.uncertaintyPx));
  const apexHigh=Math.min(...item.centerline.map(sample=>sample.yPx+sample.uncertaintyPx));
  const heightLow=Math.max(0,item.bodyReferenceYPx[0]-apexHigh);
  const heightHigh=Math.max(0,item.bodyReferenceYPx[1]-apexLow);
  const spanLow=Math.max(0,Math.max(...item.centerline.map(sample=>sample.xPx-sample.uncertaintyPx))-
    Math.min(...item.centerline.map(sample=>sample.xPx+sample.uncertaintyPx)));
  const spanHigh=Math.max(...item.centerline.map(sample=>sample.xPx+sample.uncertaintyPx))-
    Math.min(...item.centerline.map(sample=>sample.xPx-sample.uncertaintyPx));
  const widthLow=item.bodyWidthPx[0],widthHigh=item.bodyWidthPx[1];
  const normalizedCurvature=curvaturePerPixel(item.centerline)*((widthLow+widthHigh)/2);
  const normalizedCurvatureError=curvatureErrorBound(item.centerline)*widthHigh+
    Math.abs(curvaturePerPixel(item.centerline))*(widthHigh-widthLow)/2;
  return {
    timeS:item.timeS,frameSha256:item.frameSha256,state:item.state,
    projectedHeightOverBodyWidth:[heightLow/widthHigh,heightHigh/widthLow] as const,
    projectedSpanOverBodyWidth:[spanLow/widthHigh,spanHigh/widthLow] as const,
    signedTurningCurvatureTimesBodyWidth:normalizedCurvature,
    signedTurningCurvatureLinearizedUncertainty:normalizedCurvatureError,
    curvatureUncertaintyMethod:'first-order finite-difference sensitivity with L1 combination; not a strict nonlinear bound' as const,
  };
}

function transitionSummary(frames:readonly z.infer<typeof frame>[]){
  const firstPresent=frames.findIndex(item=>item.state==='present');
  if(firstPresent<0)return {onset:null,relaxation:null};
  const previousAbsence=firstPresent>0&&frames[firstPresent-1].state==='absent'
    ?frames[firstPresent-1]:null;
  const firstEndAfter=frames.findIndex((item,index)=>index>firstPresent&&item.state!=='present');
  const endIsBracketed=firstEndAfter>firstPresent&&frames[firstEndAfter].state==='absent'&&
    frames[firstEndAfter-1].state==='present';
  return {
    onset:previousAbsence?{
      intervalS:[previousAbsence.timeS,frames[firstPresent].timeS] as const,leftCensored:false,
      meaning:'first annotated appearance bracketed by adjacent absent and present frames',
    }:{intervalS:null,leftCensored:true,meaning:'no immediately preceding resolvable absent frame'},
    relaxation:endIsBracketed?{
      intervalS:[frames[firstEndAfter-1].timeS,frames[firstEndAfter].timeS] as const,rightCensored:false,
      meaning:'last present frame to first subsequent absent frame',
    }:{intervalS:null,rightCensored:true,meaning:firstEndAfter>firstPresent
      ?'unresolvable frame prevents a relaxation bracket':'arc remains present at the end'},
  };
}
/** Analyze reviewed frame annotations; this never reads video bytes or infers fluid motion. */
export function analyzeFerrofluidArcImagePlaneSeries(raw:unknown){
  const series=ferrofluidArcImagePlaneSeriesSchema.parse(raw);
  return {
    schemaVersion:'ferrofluid-arc-image-plane-analysis/1' as const,
    videoSha256:series.videoSha256,
    coordinateFrame:series.coordinateFrame,
    clockBasis:series.clockBasis,
    normalization:series.normalization,
    appearanceCriterion:series.appearanceCriterion,
    annotationMethod:series.annotationMethod,
    frames:series.frames.map(frameMetrics),
    timing:transitionSummary(series.frames),
    claimBoundary:{
      geometry:'projected image-plane morphology normalized by local apparent body width; no physical length or 3-D curvature',
      motion:'appearance timing only; no material trajectory, flow direction, ring motion, or string motion inferred',
      field:'no exterior-field synchronization or magnetic forcing admitted by this analysis',
      sourceAudit:'declared hashes are syntax-checked only; no source or frame bytes are verified',
      modelComparison:'not performed; no projected model predictions or held-out annotation set is supplied',
      curvatureSign:'signed in display-oriented pixel coordinates with y increasing downward',
      solar:'does not establish solar plasma reconnection or identical equations',
    },
  };
}
