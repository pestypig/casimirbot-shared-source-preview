import {z} from 'zod';

const finiteCamera=z.tuple([z.number().finite().min(-20).max(20),
  z.number().finite().min(-20).max(20),z.number().finite().min(-20).max(20)]);
const payloadBase=z.object({
  schemaVersion:z.literal('solar-magnetic-view-recipe/1'),
  mapContentId:z.string().regex(/^solar-radial:[a-f0-9]{64}$/).nullable(),
  pfssModelId:z.string().regex(/^solar-pfss:[a-f0-9]{64}$/).nullable(),
  losDiagnosticId:z.string().regex(/^solar-los:[a-f0-9]{64}$/).nullable().optional(),
  coordinateFrame:z.literal('Carrington_display_cartesian'),
  projection:z.literal('perspective'),
  cameraPosition:finiteCamera,
  cameraTarget:z.literal('solar_center'),
  fieldColorScale:z.literal('asinh_p98_abs_radial_gauss/1'),
  showIllustrativeAxialDipole:z.boolean(),
  showMapEquivalentDipole:z.boolean(),
  showPfssLines:z.boolean(),
  showLosMarkers:z.boolean().optional(),
  losMarkerColorBasis:z.enum(['map_residual','radial_l1_residual']).optional(),
  sourceIdentityAuthenticated:z.literal(false),
  scientificAdmission:z.literal(false),
  quantitativeJoinAllowed:z.literal(false),
}).strict();
const validatePayload=(recipe:z.infer<typeof payloadBase>,ctx:z.RefinementCtx)=>{
  if(recipe.pfssModelId&&!recipe.mapContentId)
    ctx.addIssue({code:'custom',message:'PFSS model requires a source map'});
  if(recipe.showMapEquivalentDipole&&!recipe.mapContentId)
    ctx.addIssue({code:'custom',message:'Map-equivalent dipole requires a map'});
  if(recipe.showPfssLines&&!recipe.pfssModelId)
    ctx.addIssue({code:'custom',message:'Visible PFSS lines require a model'});
  if(recipe.losDiagnosticId&&!recipe.mapContentId)
    ctx.addIssue({code:'custom',message:'LOS diagnostic requires a source map'});
  if(recipe.showLosMarkers&&!recipe.losDiagnosticId)
    ctx.addIssue({code:'custom',message:'Visible LOS markers require a diagnostic'});
  if(recipe.losMarkerColorBasis==='radial_l1_residual'&&!recipe.losDiagnosticId)
    ctx.addIssue({code:'custom',message:'Radial l=1 LOS color mode requires a diagnostic'});
  if(Math.hypot(...recipe.cameraPosition)<2.2)
    ctx.addIssue({code:'custom',message:'Camera must remain outside the solar globe'});
};
const payload=payloadBase.superRefine(validatePayload);

export const solarMagneticViewRecipeSchema=payloadBase.extend({
  recipeId:z.string().regex(/^solar-magnetic-view:[a-f0-9]{64}$/),
}).strict().superRefine((recipe,ctx)=>{
  const {recipeId:_,...body}=recipe;
  const result=payload.safeParse(body);
  if(!result.success)for(const issue of result.error.issues)ctx.addIssue(issue);
});
export type SolarMagneticViewRecipe=z.infer<typeof solarMagneticViewRecipeSchema>;
export type SolarMagneticViewRecipePayload=z.infer<typeof payload>;

async function contentId(value:unknown){
  const bytes=new TextEncoder().encode(JSON.stringify(value));
  const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),
    byte=>byte.toString(16).padStart(2,'0')).join('');
  return `solar-magnetic-view:${digest}`;
}

/** Identity of one display configuration, not evidence that any source or model is valid. */
export async function prepareSolarMagneticViewRecipe(input:SolarMagneticViewRecipePayload):Promise<SolarMagneticViewRecipe>{
  const checked=payload.parse(input);
  return solarMagneticViewRecipeSchema.parse({...checked,recipeId:await contentId(checked)});
}

export async function verifySolarMagneticViewRecipe(input:unknown):Promise<SolarMagneticViewRecipe>{
  const checked=solarMagneticViewRecipeSchema.parse(input);
  const {recipeId,...body}=checked;
  if(recipeId!==await contentId(body))throw new Error('SOLAR_MAGNETIC_VIEW_RECIPE_ID_MISMATCH');
  return checked;
}
