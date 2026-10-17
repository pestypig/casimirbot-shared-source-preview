import {z} from 'zod';

const contract=z.enum(['operator-controls/1','solar-sphere-scene/1','stellar-scene-parameters/1',
  'solar-magnetic-comparison-bundle/1','starsim-solar-mesa-repro-artifact.v1']);
export const solarModelPluginDescriptorSchema=z.object({
  schemaVersion:z.literal('solar-model-plugin/1'),
  pluginId:z.string().regex(/^casimirbot\.solar\.[a-z0-9-]+$/),version:z.string().regex(/^\d+\.\d+\.\d+$/),
  panelId:z.string().regex(/^[a-z0-9-]+$/).nullable(),title:z.string().min(1).max(100),
  section:z.enum(['Reduced-order structure','Exploratory transport','Illustrations & mission concepts']),
  kind:z.string().min(1).max(80),description:z.string().min(1).max(300),
  execution:z.enum(['client_local','server_controlled','external_import']),
  acceptedInputs:z.array(contract).min(1).max(6),outputContract:z.string().min(1).max(120),
  outputGeometry:z.enum(['none','scalar','time_series','one_dimensional_interior','two_dimensional_surface','three_dimensional_field','illustration']),
  sceneBinding:z.enum(['none','solar_exact','stellar_exact']),
  maturity:z.enum(['illustration','reduced_order_toy','unvalidated_model','calibration_candidate']),
  currentInput:z.string().min(1).max(120),sceneStatus:z.string().min(1).max(140),
  implementationRef:z.string().min(1).max(240),
  sourceIdentityAuthenticated:z.literal(false),scientificAdmission:z.literal(false),
  independentModelValidation:z.literal(false),
}).strict().superRefine((plugin,ctx)=>{
  if(plugin.sceneBinding==='solar_exact'&&!plugin.acceptedInputs.includes('solar-sphere-scene/1'))
    ctx.addIssue({code:'custom',message:'Solar scene binding requires the solar scene input contract'});
  if(plugin.sceneBinding==='stellar_exact'&&!plugin.acceptedInputs.includes('stellar-scene-parameters/1'))
    ctx.addIssue({code:'custom',message:'Stellar scene binding requires the stellar scene input contract'});
  if(plugin.sceneBinding==='none'&&plugin.acceptedInputs.some(value=>value==='solar-sphere-scene/1'||value==='stellar-scene-parameters/1'))
    ctx.addIssue({code:'custom',message:'Declared scene input requires scene binding'});
  if(plugin.execution==='external_import'&&plugin.panelId!==null)
    ctx.addIssue({code:'custom',message:'External import cannot launch a local panel'});
});
export type SolarModelPluginDescriptor=z.infer<typeof solarModelPluginDescriptorSchema>;

/** Manifest validation only. It neither loads arbitrary code nor admits scientific results. */
export function registerSolarModelPlugins(input:unknown):SolarModelPluginDescriptor[]{
  const plugins=z.array(solarModelPluginDescriptorSchema).max(50).parse(input);
  const ids=new Set<string>(),panels=new Set<string>();
  for(const plugin of plugins){
    if(ids.has(plugin.pluginId))throw new Error('SOLAR_MODEL_PLUGIN_DUPLICATE_ID');
    ids.add(plugin.pluginId);
    if(plugin.panelId){
      if(panels.has(plugin.panelId))throw new Error('SOLAR_MODEL_PLUGIN_DUPLICATE_PANEL');
      panels.add(plugin.panelId);
    }
  }
  return plugins;
}
