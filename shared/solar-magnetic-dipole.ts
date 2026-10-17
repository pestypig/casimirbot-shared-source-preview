import {z} from 'zod';

const hash=z.string().regex(/^[a-f0-9]{64}$/);
const utc=z.string().datetime({offset:true});

/** Equal-area Carrington grid. Far-side/infilled cells are not direct observations. */
export const solarGlobalRadialMapSchema=z.object({
  schemaVersion:z.literal('solar-global-radial-map/1'),
  source:z.object({provider:z.string().min(1).max(120),productId:z.string().min(1).max(240),
    sourceUrl:z.string().url().max(1000),sha256:hash,kind:z.enum(['synoptic_derived','assimilated']),
    inputStartUtc:utc.nullable(),inputEndUtc:utc,retrievedAtUtc:utc}).strict(),
  coordinateFrame:z.literal('Carrington'),grid:z.literal('longitude_by_sine_latitude_cell_centers'),
  units:z.literal('G'),longitudeCells:z.number().int().min(12).max(360),
  sineLatitudeCells:z.number().int().min(6).max(180),
  radialGauss:z.array(z.number().finite().min(-1e5).max(1e5)).max(64_800),
  observedMaskStatus:z.enum(['provided','unavailable']),
  observedCellMask:z.array(z.boolean()).max(64_800),
  processing:z.object({method:z.enum(['wcs_equal_area_mean/1','gong_sine_latitude_linear/1']),inputHdu:z.number().int().min(0),
    inputShape:z.tuple([z.number().int().positive(),z.number().int().positive()]),
    rejectedPixelCount:z.number().int().min(0),minSamplesPerCell:z.number().int().positive()}).strict().optional(),
  sourceIdentityAuthenticated:z.literal(false),scientificAdmission:z.literal(false),
}).strict().superRefine((map,ctx)=>{
  const count=map.longitudeCells*map.sineLatitudeCells;
  if(map.radialGauss.length!==count||map.observedCellMask.length!==count)
    ctx.addIssue({code:'custom',message:'Magnetic grid and coverage mask must have identical declared dimensions'});
  if(map.observedMaskStatus==='unavailable'&&map.observedCellMask.some(Boolean))
    ctx.addIssue({code:'custom',message:'Unavailable observed-input mask cannot assert observed cells'});
  if(map.source.inputStartUtc&&Date.parse(map.source.inputEndUtc)<Date.parse(map.source.inputStartUtc))
    ctx.addIssue({code:'custom',message:'Magnetic input interval is reversed'});
});

export type SolarGlobalRadialMap=z.infer<typeof solarGlobalRadialMapSchema>;

/** Local normalized-payload identity. This does not authenticate the declared upstream source hash. */
export async function solarGlobalRadialMapContentId(input:unknown):Promise<string>{
  const map=solarGlobalRadialMapSchema.parse(input);
  const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',
    new TextEncoder().encode(JSON.stringify(map)))),byte=>byte.toString(16).padStart(2,'0')).join('');
  return `solar-radial:${digest}`;
}

/** Equivalent l=1 dipole, m/R_sun^3, from a complete radial map; not a directly measured global moment. */
export function deriveSolarEquivalentDipole(input:unknown) {
  const map=solarGlobalRadialMapSchema.parse(input);
  const {longitudeCells:nLon,sineLatitudeCells:nSin}=map;
  let x=0,y=0,z=0,observed=0;
  for(let j=0;j<nSin;j++){
    const sinLat=-1+(j+0.5)*2/nSin;
    const cosLat=Math.sqrt(Math.max(0,1-sinLat*sinLat));
    for(let i=0;i<nLon;i++){
      const k=j*nLon+i,lon=(i+0.5)*2*Math.PI/nLon,br=map.radialGauss[k];
      x+=br*cosLat*Math.cos(lon);y+=br*cosLat*Math.sin(lon);z+=br*sinLat;
      if(map.observedCellMask[k])observed++;
    }
  }
  const factor=3/(2*nLon*nSin);
  const vectorGauss:[number,number,number]=[x*factor,y*factor,z*factor];
  const magnitudeGauss=Math.hypot(...vectorGauss);
  return {schemaVersion:'solar-equivalent-dipole/1' as const,
    sourceProductId:map.source.productId,sourceSha256:map.source.sha256,
    vectorGauss,magnitudeGauss,observedAreaFraction:map.observedMaskStatus==='provided'?observed/(nLon*nSin):null,
    method:'equal_area_radial_l1_projection/1' as const,
    meaning:'model_or_synoptic_map_equivalent_not_direct_global_measurement' as const,
    sourceIdentityAuthenticated:false as const,scientificAdmission:false as const};
}
