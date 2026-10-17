import { HELIX_AGENT_RUN_READ_SCOPE } from "./contracts/helix-agent-api.v1";
import { HELIX_MCP_EVIDENCE_CAPABILITY_DESCRIPTOR_SCHEMA, HELIX_MCP_EVIDENCE_OBSERVATION_SCHEMA,
  helixMcpEvidenceCapabilityDescriptorSchema } from "./contracts/helix-mcp-evidence-capability.v1";

export const PRIVATE_CLOCK_MCP_TOOL = "helix_private_clock_observe";
export const PRIVATE_CLOCK_MCP_SCHEMA = "casimirbot.private_clock_mcp_observation.v1";
export const PRIVATE_CLOCK_MCP_SCOPE = HELIX_AGENT_RUN_READ_SCOPE;
export const PRIVATE_CLOCK_MCP_DESCRIPTOR = helixMcpEvidenceCapabilityDescriptorSchema.parse({
  schema: HELIX_MCP_EVIDENCE_CAPABILITY_DESCRIPTOR_SCHEMA, capability_id: "helix.private_clock.observe", capability_version: 1,
  mcp_tool_name: PRIVATE_CLOCK_MCP_TOOL, semantic_family: "environment.system.clock", handler_id: "helix.private_clock.native",
  handler_contract_version: PRIVATE_CLOCK_MCP_SCHEMA,
  admission_profiles: [{ surface: "full_mcp", account_scope: "developer", required_oauth_scopes: [PRIVATE_CLOCK_MCP_SCOPE] }],
  // Persistent native permission is admission, not per-mutation confirmation.
  permission_class: "read_observe", interaction_kind: "observe", effect_class: "read_only", confirmation_policy: "never",
  observation_schema: HELIX_MCP_EVIDENCE_OBSERVATION_SCHEMA, observation_retention_class: "profile_durable", reentry_required: true,
  terminal_support_policy: "reusable_while_fresh",
  claim_ceiling: { class: "bounded_observation", description: "Only the exact installed private clock observation at its recorded time. Requires native Home permission; grants no further execution, program control, room access or assistant-answer authority." },
});
