import { HELIX_MCP_EVIDENCE_CAPABILITY_DESCRIPTOR_SCHEMA, HELIX_MCP_EVIDENCE_OBSERVATION_SCHEMA,
  helixMcpEvidenceCapabilityDescriptorSchema } from './contracts/helix-mcp-evidence-capability.v1';

export const SOLAR_RESEARCH_READ_SCOPE='helix.solar_research.read';
export const SOLAR_MAGNETIC_ARCHIVE_SEARCH_DESCRIPTOR=helixMcpEvidenceCapabilityDescriptorSchema.parse({
  schema:HELIX_MCP_EVIDENCE_CAPABILITY_DESCRIPTOR_SCHEMA,
  capability_id:'helix.solar_research.magnetic_archive.search',capability_version:1,
  mcp_tool_name:'helix_solar_magnetic_archive_search',semantic_family:'research.solar.magnetic_archive',
  handler_id:'helix.solar_research.fixed_provider_archive_search',handler_contract_version:'solar-magnetic-archive-search/1',
  admission_profiles:[{surface:'full_mcp',account_scope:'developer',required_oauth_scopes:[SOLAR_RESEARCH_READ_SCOPE]}],
  permission_class:'read_observe',interaction_kind:'observe',effect_class:'read_only',confirmation_policy:'never',
  observation_schema:HELIX_MCP_EVIDENCE_OBSERVATION_SCHEMA,observation_retention_class:'profile_durable',
  reentry_required:true,terminal_support_policy:'reusable_while_fresh',
  claim_ceiling:{class:'bounded_observation',description:'Bounded read-time file listings at two fixed provider paths. Filenames are discovery hints, not inspected FITS observations, authenticated source bytes, current measurements, rights clearance, or scientific admission.'},
});
export const SOLAR_MAGNETIC_ACQUISITION_EVIDENCE_DESCRIPTOR=helixMcpEvidenceCapabilityDescriptorSchema.parse({
  schema:HELIX_MCP_EVIDENCE_CAPABILITY_DESCRIPTOR_SCHEMA,
  capability_id:'helix.solar_research.magnetic_acquisition.inspect',capability_version:1,
  mcp_tool_name:'helix_solar_magnetic_acquisition_get',semantic_family:'research.solar.magnetic_acquisition',
  handler_id:'helix.solar_research.owner_magnetic_acquisition_reader',handler_contract_version:'solar-magnetic-archive-acquisition/1',
  admission_profiles:[{surface:'full_mcp',account_scope:'developer',required_oauth_scopes:[SOLAR_RESEARCH_READ_SCOPE]}],
  permission_class:'read_observe',interaction_kind:'observe',effect_class:'read_only',confirmation_policy:'never',
  observation_schema:HELIX_MCP_EVIDENCE_OBSERVATION_SCHEMA,observation_retention_class:'profile_durable',
  reentry_required:true,terminal_support_policy:'reusable_while_fresh',
  claim_ceiling:{class:'bounded_observation',description:'Exact owner-retained source-byte receipt after content-hash check; an optional HMI header time and numeric quality flag are not interpreted science quality. No raw FITS bytes, rights clearance, calibrated global field, PFSS validation, or stellar-model fit.'},
});
export const SOLAR_MAGNETIC_BUNDLE_EVIDENCE_DESCRIPTOR=helixMcpEvidenceCapabilityDescriptorSchema.parse({
  schema:HELIX_MCP_EVIDENCE_CAPABILITY_DESCRIPTOR_SCHEMA,
  capability_id:'helix.solar_research.magnetic_bundle.inspect',capability_version:1,
  mcp_tool_name:'helix_solar_magnetic_bundle_get',semantic_family:'research.solar.magnetic_comparison',
  handler_id:'helix.solar_research.authorized_magnetic_bundle_reader',
  handler_contract_version:'solar-magnetic-bundle-evidence-view/1',
  admission_profiles:[{surface:'full_mcp',account_scope:'developer',required_oauth_scopes:[SOLAR_RESEARCH_READ_SCOPE]}],
  permission_class:'read_observe',interaction_kind:'observe',effect_class:'read_only',confirmation_policy:'never',
  observation_schema:HELIX_MCP_EVIDENCE_OBSERVATION_SCHEMA,observation_retention_class:'profile_durable',
  reentry_required:true,terminal_support_policy:'reusable_while_fresh',
  claim_ceiling:{class:'bounded_observation',description:'Owner-retained magnetic map, derived dipole, modeled PFSS lines, HMI LOS diagnostic and view identities only. No raw FITS, source authentication, same-time full-Sun observation, science admission or magnetic-field validation.'},
});
export const SOLAR_SPHERE_SCENE_EVIDENCE_DESCRIPTOR=helixMcpEvidenceCapabilityDescriptorSchema.parse({
  schema:HELIX_MCP_EVIDENCE_CAPABILITY_DESCRIPTOR_SCHEMA,
  capability_id:'helix.solar_research.sphere_scene.inspect',capability_version:1,
  mcp_tool_name:'helix_solar_sphere_scene_get',semantic_family:'research.solar.sphere_scene',
  handler_id:'helix.solar_research.authorized_sphere_scene_reader',handler_contract_version:'solar-sphere-scene/1',
  admission_profiles:[{surface:'full_mcp',account_scope:'developer',required_oauth_scopes:[SOLAR_RESEARCH_READ_SCOPE]}],
  permission_class:'read_observe',interaction_kind:'observe',effect_class:'read_only',confirmation_policy:'never',
  observation_schema:HELIX_MCP_EVIDENCE_OBSERVATION_SCHEMA,observation_retention_class:'profile_durable',
  reentry_required:true,terminal_support_policy:'reusable_while_fresh',
  claim_ceiling:{class:'bounded_observation',description:'Exact owner-retained scene references and layer relationships only. Neither a same-time full-Sun observation nor model validation, raw imagery, source authentication, or scientific admission.'},
});
export const SOLAR_PACKAGE_CATALOG_DESCRIPTOR=helixMcpEvidenceCapabilityDescriptorSchema.parse({
  schema:HELIX_MCP_EVIDENCE_CAPABILITY_DESCRIPTOR_SCHEMA,
  capability_id:'helix.solar_research.package.catalog',capability_version:1,
  mcp_tool_name:'helix_solar_research_package_list',semantic_family:'research.solar.catalog',
  handler_id:'helix.solar_research.authorized_package_catalog',handler_contract_version:'solar-package-catalog/1',
  admission_profiles:[{surface:'full_mcp',account_scope:'developer',required_oauth_scopes:[SOLAR_RESEARCH_READ_SCOPE]}],
  permission_class:'read_observe',interaction_kind:'observe',effect_class:'read_only',confirmation_policy:'never',
  observation_schema:HELIX_MCP_EVIDENCE_OBSERVATION_SCHEMA,observation_retention_class:'profile_durable',
  reentry_required:true,terminal_support_policy:'reusable_while_fresh',
  claim_ceiling:{class:'bounded_observation',description:'Exact owner catalog page at read time; selected artifact identities and counts only. Uninspected pages and later membership are not verified. No acquisition freshness, source authentication, science admission or model execution.'},
});
/** Read-only package adopter; live authorization and science admission remain separate. */
export const SOLAR_PACKAGE_EVIDENCE_DESCRIPTOR=helixMcpEvidenceCapabilityDescriptorSchema.parse({
  schema:HELIX_MCP_EVIDENCE_CAPABILITY_DESCRIPTOR_SCHEMA,
  capability_id:'helix.solar_research.package.inspect',capability_version:1,
  mcp_tool_name:'helix_solar_research_package_get',semantic_family:'research.solar.package',
  handler_id:'helix.solar_research.authorized_package_reader',handler_contract_version:'solar-package-evidence-view/1',
  admission_profiles:[{surface:'full_mcp',account_scope:'developer',required_oauth_scopes:[SOLAR_RESEARCH_READ_SCOPE]}],
  permission_class:'read_observe',interaction_kind:'observe',effect_class:'read_only',confirmation_policy:'never',
  observation_schema:HELIX_MCP_EVIDENCE_OBSERVATION_SCHEMA,observation_retention_class:'profile_durable',
  reentry_required:true,terminal_support_policy:'reusable_while_fresh',
  claim_ceiling:{class:'bounded_observation',description:'Retained package identities, bounded comparison rows and archive/paper metadata only. No pixels, acquisition freshness, authenticated source, quantitative image/model join, scientific admission or lifetime claim.'},
});
export const SOLAR_RESEARCH_EVIDENCE_DESCRIPTOR=helixMcpEvidenceCapabilityDescriptorSchema.parse({
  schema:HELIX_MCP_EVIDENCE_CAPABILITY_DESCRIPTOR_SCHEMA,
  capability_id:'helix.solar_research.comparison.inspect',capability_version:1,
  mcp_tool_name:'helix_solar_research_comparison_get',semantic_family:'research.solar.comparison',
  handler_id:'helix.solar_research.authorized_evidence_reader',handler_contract_version:'solar-research-evidence-view/1',
  admission_profiles:[{surface:'full_mcp',account_scope:'developer',required_oauth_scopes:[SOLAR_RESEARCH_READ_SCOPE]}],
  permission_class:'read_observe',interaction_kind:'observe',effect_class:'read_only',confirmation_policy:'never',
  observation_schema:HELIX_MCP_EVIDENCE_OBSERVATION_SCHEMA,observation_retention_class:'profile_durable',
  reentry_required:true,terminal_support_policy:'reusable_while_fresh',
  claim_ceiling:{class:'bounded_observation',description:'Exact retained solar comparison values and declared identities only. No source authentication, complete seismic fit, acquisition freshness, G1 admission, solver execution or lifetime claim.'},
});
