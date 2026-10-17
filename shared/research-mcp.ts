import { z } from "zod";

export const RESEARCH_MCP_PATH = "/mcp/research";
export const RESEARCH_MCP_CONNECTION_PATH = "/connect/research";
export const RESEARCH_MCP_VERSION = "0.1.0";
export const RESEARCH_MCP_SERVICE_ID = "casimirbot.research";
export const RESEARCH_MCP_MAX_GRANT_MS = 7 * 24 * 60 * 60 * 1000;
export const researchBundleSchema = z.enum(["ferrofluid", "theory-reference", "solar-analysis"]);
export type ResearchBundle = z.infer<typeof researchBundleSchema>;

export type ResearchCapability = {
  name: string;
  bundle: ResearchBundle | "service";
  source_tools: readonly string[];
  implementation: string;
  ownership: "curated_context" | "caller_supplied" | "service_metadata";
  dependencies: readonly string[];
  provider_calls: 0;
  retained_data: "none";
  effect: "calculation" | "reference";
  claim_ceiling: string;
};

const ferrofluidImplementations = [
  ["context", "curated ferrofluid context"],
  ["prepurchase_protocol", "shared/ferrofluid-a0-prepurchase-protocol.ts"],
  ["untethered_field_protocol", "shared/ferrofluid-untethered-field-protocol.ts"],
  ["untethered_flow_protocol", "shared/ferrofluid-untethered-flow-protocol.ts"],
  ["theory_context", "shared/theory/ferrofluid-thermal-apparatus-theory-badges.ts; shared/theory/relational-orientation-theory-badges.ts; shared/theory/qcd-spin-correlation-theory-badges.ts"],
  ["relative_axis", "shared/ferrofluid-relative-axis.ts"],
  ["lab_profile", "shared/ferrofluid-lab-handoff.ts"],
  ["lab_handoff", "shared/ferrofluid-lab-handoff.ts"],
  ["geometry", "shared/ferrofluid-analogue-toy.ts"],
  ["arc_mode", "shared/ferrofluid-arc-mode.ts"],
  ["evidence_model", "shared/ferrofluid-arc-evidence-model.ts"],
  ["repeat_compare", "shared/ferrofluid-arc-repeat-comparison.ts"],
  ["source_hash_compare", "shared/ferrofluid-arc-repeat-comparison.ts"],
  ["projected_arc_bounds", "shared/ferrofluid-arc-video-annotations.ts"],
  ["single_lag", "shared/ferrofluid-external-arc-response.ts"],
  ["two_lag", "shared/ferrofluid-external-two-lag-response.ts"],
  ["frozen_fit", "shared/ferrofluid-external-arc-response.ts; shared/ferrofluid-external-two-lag-response.ts"],
  ["forcing_controls", "shared/ferrofluid-external-forcing-controls.ts"],
  ["evidence_join_audit", "shared/ferrofluid-external-evidence-join.ts"],
  ["external_magnet", "shared/ferrofluid-external-magnet-scenario.ts"],
  ["dipole_field", "shared/ferrofluid-external-magnet-scenario.ts"],
  ["ring_moment", "shared/ferrofluid-external-magnet-scenario.ts"],
  ["scale_degeneracy", "shared/ferrofluid-external-magnet-scenario.ts"],
  ["normalized_mode", "shared/ferrofluid-arc-evidence-model.ts"],
  ["field_ratios", "shared/ferrofluid-arc-evidence-model.ts"],
  ["approach_proxy", "shared/ferrofluid-external-arc-response.ts"],
] as const;

/** Explicit runtime allowlist. Source inventory and readOnlyHint never admit a tool. */
export const RESEARCH_CAPABILITIES: readonly ResearchCapability[] = [
  { name: "harness.status", bundle: "service", source_tools: [],
    implementation: "server/mcp/research-mcp-server.ts", ownership: "service_metadata",
    dependencies: [], provider_calls: 0, retained_data: "none", effect: "reference",
    claim_ceiling: "Research service status only; no installed harness or task connection." },
  ...ferrofluidImplementations.map(([name, implementation]): ResearchCapability => ({
    name: "ferrofluid." + name, bundle: "ferrofluid", source_tools: [],
    implementation,
    ownership: ["context", "prepurchase_protocol", "untethered_field_protocol", "untethered_flow_protocol", "theory_context", "lab_profile", "lab_handoff", "frozen_fit", "forcing_controls", "approach_proxy"].includes(name)
      ? "curated_context" : "caller_supplied",
    dependencies: ["bounded in-memory inputs", "existing ferrofluid calculation modules"],
    provider_calls: 0, retained_data: "none",
    effect: ["context", "prepurchase_protocol", "untethered_field_protocol", "untethered_flow_protocol", "theory_context", "lab_profile", "lab_handoff"].includes(name) ? "reference" : "calculation",
    claim_ceiling: "Existing toy, image-plane, ideal-model or exact-ID reference limits; no source-byte or calibration authentication, measured thermal run, physical prediction admission or hardware effect.",
  })),
  { name: "theory.yb171.context", bundle: "theory-reference",
    source_tools: ["helix_yb171_clock_theory_proposal"],
    implementation: "shared/theory/ytterbium-clock-correlation-theory-badges.ts",
    ownership: "curated_context", dependencies: ["three explicit static theory badges and their edges"],
    provider_calls: 0, retained_data: "none", effect: "reference",
    claim_ceiling: "Unacquired proposal and equations only; no design calculation, apparatus result, proof execution or theory promotion." },
  { name: "solar.equivalent_dipole", bundle: "solar-analysis",
    source_tools: ["helix_solar_magnetic_bundle_get"],
    implementation: "shared/solar-magnetic-dipole.ts",
    ownership: "caller_supplied", dependencies: ["caller-declared Carrington map; at most 2048 cells"],
    provider_calls: 0, retained_data: "none", effect: "calculation",
    claim_ceiling: "Equivalent l=1 moment from supplied map; not a measured global moment or authenticated upstream source." },
];

export const researchCapabilityFor = (name: string) =>
  RESEARCH_CAPABILITIES.find(capability => capability.name === name);

export const researchToolAllowed = (name: string, bundles: readonly ResearchBundle[]) => {
  const capability = researchCapabilityFor(name);
  return !!capability && (capability.bundle === "service" || bundles.includes(capability.bundle));
};

export const RESEARCH_RESOURCES = [
  { name: "ferrofluid-context", uri: "casimirbot://research/ferrofluid/context", tool: "ferrofluid.context", bundle: "ferrofluid" },
  { name: "yb171-theory-context", uri: "casimirbot://research/theory/yb171", tool: "theory.yb171.context", bundle: "theory-reference" },
] as const;
