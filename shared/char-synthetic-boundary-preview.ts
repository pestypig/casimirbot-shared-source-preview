import {z} from 'zod';

const finite=z.number().finite();
const sha256=z.string().regex(/^[a-f0-9]{64}$/);
const extent=z.tuple([finite,finite]).refine(([low,high])=>low<high,{message:'Extent must be ordered'});
const stats=z.object({minimum:finite,maximum:finite,meanAbsolute:finite.nonnegative()}).strict()
  .refine(value=>value.minimum<=value.maximum,{message:'Statistics range must be ordered'});
const matrix=z.array(z.array(finite).min(2).max(64)).min(2).max(64);
const archiveManifest={
  't000-024.zip':{bytes:1_282_887_695,md5:'032ce24544b2341fdfd137db8798bce4'},
  't150-174.zip':{bytes:1_536_879_948,md5:'3cc3e5b7b270a7ed8ffb48c57f0d59a5'},
} as const;

/** A bounded preview of synthetic photospheric input, not an observed solar map. */
export const charSyntheticBoundaryPreviewSchema=z.object({
  schemaVersion:z.literal('char-synthetic-boundary-preview/1'),
  source:z.object({
    doi:z.literal('10.5281/zenodo.18341701'),
    recordUrl:z.literal('https://zenodo.org/records/18341701'),
    archiveName:z.enum(['t000-024.zip','t150-174.zip']),
    archiveBytes:z.number().int().positive(),
    archiveMd5:z.string().regex(/^[a-f0-9]{32}$/),
    memberName:z.string().regex(/^[0-9]{6}\.h5$/),memberSha256:sha256,
    license:z.literal('CC-BY-4.0'),
    sourceKind:z.literal('synthetic_ground_truth_boundary_input'),
  }).strict(),
  simulation:z.object({time:finite.nonnegative(),timeUnits:z.literal('LaRe3D_model_units'),
    step:z.number().int().nonnegative(),coordinateFrame:z.literal('local_cartesian_model'),
    utc:z.null(),declaredPlane:z.literal('photospheric_z0_in_publication'),
    planeZNative:finite,nativePlaneMatchesDeclaredZero:z.boolean(),gamma:finite.gt(1)}).strict(),
  grid:z.object({ny:z.number().int().min(2).max(4096),nx:z.number().int().min(2).max(4096),
    xExtentNative:extent,yExtentNative:extent}).strict(),
  statisticsNative:z.object({rho:stats,energy:stats,vx:stats,vy:stats,vz:stats,
    bx:stats,by:stats,bz:stats}).strict(),
  sample:z.object({shape:z.tuple([z.number().int().min(2).max(64),z.number().int().min(2).max(64)]),
    xNative:matrix,yNative:matrix,bxNative:matrix,byNative:matrix,bzNative:matrix}).strict(),
  presentation:z.object({nativePatch:z.literal(true),carringtonGlobeOverlay:z.literal(false),
    reason:z.literal('no_solar_wcs_observer_or_utc_for_synthetic_patch')}).strict(),
  claimBoundary:z.object({realSolarObservation:z.literal(false),globalSunMap:z.literal(false),
    coronalVolumeReconstructed:z.literal(false),publishedCHARRunReproduced:z.literal(false),
    verticalCoordinateReconciled:z.literal(false),
    laboratorySetpoint:z.literal(false),scientificAdmission:z.literal(false)}).strict(),
}).strict().superRefine((preview,ctx)=>{
  const expected=archiveManifest[preview.source.archiveName];
  if(preview.source.archiveBytes!==expected.bytes || preview.source.archiveMd5!==expected.md5)
    ctx.addIssue({code:'custom',message:'Archive identity differs from the frozen Zenodo manifest'});
  if(preview.simulation.nativePlaneMatchesDeclaredZero!==(Math.abs(preview.simulation.planeZNative)<=1e-9))
    ctx.addIssue({code:'custom',message:'Native z zero flag disagrees with the HDF5 coordinate'});
  const [rows,columns]=preview.sample.shape;
  if(rows>preview.grid.ny || columns>preview.grid.nx)
    ctx.addIssue({code:'custom',message:'Sample exceeds source grid'});
  for(const [name,values] of Object.entries(preview.sample)){
    if(name==='shape')continue;
    const samples=values as number[][];
    if(samples.length!==rows || samples.some(row=>row.length!==columns))
      ctx.addIssue({code:'custom',message:`${name} shape differs from declared sample`});
  }
});

export type CharSyntheticBoundaryPreview=z.infer<typeof charSyntheticBoundaryPreviewSchema>;
