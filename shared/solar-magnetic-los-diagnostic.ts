import {z} from 'zod';

const hash=z.string().regex(/^[a-f0-9]{64}$/);
const finite=z.number().finite();
const metrics=z.object({sampleCount:z.number().int().min(1),meanResidualGauss:finite,
  medianAbsoluteResidualGauss:z.number().finite().nonnegative(),
  rootMeanSquareResidualGauss:z.number().finite().nonnegative()}).strict();

const base=z.object({schemaVersion:z.literal('solar-magnetic-los-diagnostic/1'),
  sourceMapContentId:z.string().regex(/^solar-radial:[a-f0-9]{64}$/),
  mapSourceProductId:z.string().min(1).max(240),mapSourceSha256:hash,
  mapLatestContributorUtc:z.string().datetime({offset:true}),
  mapEarliestContributorUtc:z.string().datetime({offset:true}).nullable(),
  hmi:z.object({sourceUrl:z.string().url().startsWith('https://'),sha256:hash,
    drmsId:z.string().min(1).max(240),observedAtUtc:z.string().datetime({offset:true}),
    qualityFlag:z.number().int().min(0),instrument:z.string().min(1).max(100),
    fieldComponent:z.literal('line_of_sight'),units:z.literal('G'),
    coordinateFrame:z.literal('helioprojective_WCS'),
    observerCarringtonLongitudeDeg:z.number().min(0).max(360),
    observerCarringtonLatitudeDeg:z.number().min(-90).max(90)}).strict(),
  projection:z.object({method:z.literal('radial_map_times_exact_radial_line_of_sight_cosine_nearest_cell/1'),
    mapCoordinateFrame:z.literal('Carrington'),sampleStridePixels:z.number().int().min(16).max(128),
    minimumMu:z.number().min(0.2).max(0.9),activeThresholdGauss:z.number().min(1).max(1000),
    fullDiskPixelCount:z.number().int().min(65_536).max(16_777_216),
    sampledPixelCount:z.number().int().min(1).max(65_536),
    registeredDiskSampleCount:z.number().int().min(100).max(65_536),
    distinctMapCells:z.number().int().min(1).max(64_800)}).strict(),
  allRegistered:metrics,activeField:metrics,
  longitudeShiftControls:z.tuple([
    z.object({longitudeShiftDeg:z.literal(90),activeFieldOnSameSamples:metrics}).strict(),
    z.object({longitudeShiftDeg:z.literal(180),activeFieldOnSameSamples:metrics}).strict(),
  ]),
  bothAboveThresholdCount:z.number().int().min(0).max(65_536),
  bothAboveThresholdSignAgreement:z.number().min(0).max(1).nullable(),
  displayPoints:z.array(z.object({longitudeDeg:z.number().min(0).max(360),
    latitudeDeg:z.number().min(-90).max(90),measuredLosGauss:finite,
    projectedMapLosGauss:finite,mu:z.number().min(0.2).max(1)}).strict()).min(1).max(1200),
  sourceIdentityAuthenticated:z.literal(false),scientificAdmission:z.literal(false),
  quantitativeValidationAllowed:z.literal(false),
}).strict();
const validate=(value:z.infer<typeof base>,ctx:z.RefinementCtx)=>{
  if(value.allRegistered.sampleCount!==value.projection.registeredDiskSampleCount||
      value.activeField.sampleCount>value.allRegistered.sampleCount||
      value.displayPoints.length>value.activeField.sampleCount)
    ctx.addIssue({code:'custom',message:'LOS diagnostic counts are inconsistent'});
  if(value.bothAboveThresholdCount===0&&value.bothAboveThresholdSignAgreement!==null)
    ctx.addIssue({code:'custom',message:'Sign agreement requires samples above threshold'});
  if(value.longitudeShiftControls.some(control=>control.activeFieldOnSameSamples.sampleCount!==value.activeField.sampleCount))
    ctx.addIssue({code:'custom',message:'Longitude-shift controls must use the same active samples'});
};
const payload=base.superRefine(validate);
export const solarMagneticLosDiagnosticSchema=base.extend({diagnosticId:z.string().regex(/^solar-los:[a-f0-9]{64}$/)})
  .strict().superRefine(validate);
export type SolarMagneticLosDiagnostic=z.infer<typeof solarMagneticLosDiagnosticSchema>;
export type SolarMagneticLosDiagnosticPayload=z.input<typeof payload>;

async function contentId(value:unknown){
  const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',
    new TextEncoder().encode(JSON.stringify(value)))),byte=>byte.toString(16).padStart(2,'0')).join('');
  return `solar-los:${digest}`;
}

/** A projected LOS diagnostic, not a calibrated same-time model–observation fit. */
export async function prepareSolarMagneticLosDiagnostic(input:SolarMagneticLosDiagnosticPayload){
  const checked=payload.parse(input);
  return solarMagneticLosDiagnosticSchema.parse({...checked,diagnosticId:await contentId(checked)});
}

export async function verifySolarMagneticLosDiagnostic(input:unknown){
  const checked=solarMagneticLosDiagnosticSchema.parse(input);
  const {diagnosticId,...body}=checked;
  if(diagnosticId!==await contentId(body))throw new Error('SOLAR_LOS_DIAGNOSTIC_ID_MISMATCH');
  return checked;
}
