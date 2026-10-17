import {z} from 'zod';

const hash=z.string().regex(/^[a-f0-9]{64}$/);
const point=z.tuple([z.number().finite().min(1).max(5),z.number().finite().min(-90).max(90),
  z.number().finite().min(0).max(360)]);
const payloadBase=z.object({schemaVersion:z.literal('solar-pfss-geometry/1'),
  sourceMapProductId:z.string().min(1).max(240),sourceMapSha256:hash,
  sourceMapContentId:z.string().regex(/^solar-radial:[a-f0-9]{64}$/),
  solver:z.object({name:z.string().min(1).max(100),version:z.string().min(1).max(100),
    sourceSurfaceRadiusSolar:z.number().finite().min(1.5).max(5),runAtUtc:z.string().datetime({offset:true}),
    boundaryProcessing:z.string().min(1).max(240),
    grid:z.object({longitudeCells:z.number().int().min(12).max(360),
      sineLatitudeCells:z.number().int().min(6).max(180),radialCells:z.number().int().min(8).max(200)}).strict(),
    tracing:z.object({name:z.string().min(1).max(100),seedRadiusSolar:z.number().finite().min(1).max(5),
      seedPattern:z.string().min(1).max(160),maxSteps:z.number().int().min(1).max(10000),
      stepSize:z.number().finite().positive().max(10),rejectedLines:z.number().int().min(0)}).strict()}).strict(),
  coordinateFrame:z.literal('Carrington'),units:z.literal('solar_radii_degrees'),
  lines:z.array(z.object({lineId:z.string().min(1).max(100),topology:z.enum(['open','closed']),
    polarity:z.enum(['positive','negative','unknown']),points:z.array(point).min(2).max(128)}).strict()).min(1).max(128),
  sourceIdentityAuthenticated:z.literal(false),scientificAdmission:z.literal(false),
}).strict();
const validateGeometry=(model:z.infer<typeof payloadBase>,ctx:z.RefinementCtx)=>{
  const ids=new Set<string>();
  for(const [i,line] of model.lines.entries()){
    if(ids.has(line.lineId))ctx.addIssue({code:'custom',path:['lines',i,'lineId'],message:'Duplicate field-line ID'});
    ids.add(line.lineId);
    if(line.points.some(([radius])=>radius>model.solver.sourceSurfaceRadiusSolar+1e-6))
      ctx.addIssue({code:'custom',path:['lines',i,'points'],message:'Field line exceeds source surface'});
  }
};
const payload=payloadBase.superRefine(validateGeometry);

export const solarPfssGeometrySchema=payloadBase.extend({modelId:z.string().regex(/^solar-pfss:[a-f0-9]{64}$/)}).strict().superRefine(validateGeometry);
export type SolarPfssGeometry=z.infer<typeof solarPfssGeometrySchema>;
export type SolarPfssGeometryPayload=z.input<typeof payload>;

async function idFor(value:unknown) {
  const bytes=new TextEncoder().encode(JSON.stringify(value));
  const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),
    byte=>byte.toString(16).padStart(2,'0')).join('');
  return `solar-pfss:${digest}`;
}

export async function prepareSolarPfssGeometry(input:SolarPfssGeometryPayload):Promise<SolarPfssGeometry> {
  const checked=payload.parse(input);
  return solarPfssGeometrySchema.parse({...checked,modelId:await idFor(checked)});
}

export async function verifySolarPfssGeometry(input:unknown):Promise<SolarPfssGeometry> {
  const checked=solarPfssGeometrySchema.parse(input);
  const {modelId,...body}=checked;
  if(modelId!==await idFor(body))throw new Error('SOLAR_PFSS_MODEL_ID_MISMATCH');
  return checked;
}
