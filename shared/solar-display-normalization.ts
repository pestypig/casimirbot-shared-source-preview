import {z} from 'zod';

/** Processing context, not authenticated calibration or recoverable FITS data. */
export const SolarDisplayNormalizationSchema=z.object({
  schemaVersion:z.literal('solar-display-normalization/1'),
  processingRecipe:z.literal('sunpy_resample_percentile_99_5_clip_v1'),
  scale:z.number().finite().positive(),
  scaleSelection:z.enum(['positive_pixel_percentile','fallback_one']),
  percentile:z.literal(99.5),
  inputUnitDeclared:z.string().trim().min(1).max(64).nullable(),
  fitsExptimeSecondsDeclared:z.number().finite().positive().nullable(),
  exposureCorrectionApplied:z.literal(false),
  radiometricCalibrationApplied:z.literal(false),
  clippedToUnitInterval:z.literal(true),
  originalPixelsRecoverable:z.literal(false),
  sourceIdentityAuthenticated:z.literal(false),
}).strict().superRefine((value,context)=>{
  if(value.scaleSelection==='fallback_one' && value.scale!==1)
    context.addIssue({code:z.ZodIssueCode.custom,message:'Fallback normalization must use scale one'});
});
export type SolarDisplayNormalization=z.infer<typeof SolarDisplayNormalizationSchema>;

export function readSolarDisplayNormalization(value:unknown,processingRecipe?:unknown):SolarDisplayNormalization|undefined {
  if(value===undefined)return undefined; // Legacy archives are not retrospectively calibrated.
  const parsed=SolarDisplayNormalizationSchema.safeParse(value);
  if(!parsed.success || processingRecipe!==parsed.data.processingRecipe)
    throw new Error('Display normalization context or processing recipe rejected');
  return parsed.data;
}
