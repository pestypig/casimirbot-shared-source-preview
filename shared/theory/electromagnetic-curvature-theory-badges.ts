import type {
  TheoryBadgeClaimBoundaryV1,
  TheoryBadgeEdgeV1,
  TheoryBadgeV1,
} from "../contracts/theory-badge-graph.v1";

const EM_TEACHING_BOUNDARY: TheoryBadgeClaimBoundaryV1 = {
  diagnosticOnly: true,
  doesValidateNHM2: false,
  validationClaimAllowed: false,
  physicalMechanismClaimAllowed: false,
  promotionAllowed: false,
};

const emBadge = (badge: Omit<TheoryBadgeV1, "claimBoundary">): TheoryBadgeV1 => ({
  ...badge,
  claimBoundary: EM_TEACHING_BOUNDARY,
});

const emNotes = {
  kind: "literature_ref" as const,
  path: "https://ocw.mit.edu/courses/6-013-electromagnetics-and-applications-spring-2009/d3be4ea78b036a6362230fb41780cf54_MIT6_013S09_notes.pdf",
  id: "MIT-6.013-electromagnetic-energy",
  note: "Poynting theorem, electric and magnetic field energy densities, and vacuum plane-wave flux.",
};

const grNotes = {
  kind: "literature_ref" as const,
  path: "https://ocw.mit.edu/courses/8-033-introduction-to-relativity-and-spacetime-physics-fall-2024/mit8_033_f24_lec_full.pdf",
  id: "MIT-8.033-Einstein-source-coupling",
  note: "Einstein equation source coupling has units (8 pi G/c^4) times energy density = inverse length squared.",
};

const sourceBoundary = {
  kind: "doc" as const,
  path: "docs/research/nhm2-source-to-experiment-closure-parallel-work-packet-v1.md",
  id: "einstein-maxwell-benchmark-rung",
  note: "A source/runtime-disjoint Einstein-Maxwell benchmark remains a distinct unexecuted rung; scalar badges do not close it.",
};

export const ELECTROMAGNETIC_CURVATURE_THEORY_BADGES: TheoryBadgeV1[] = [
  emBadge({
    id: "physics.em.vacuum_field_energy_density",
    title: "Vacuum Electromagnetic Field Energy Density",
    plainMeaning: "Computes the classical local energy density of electric and magnetic fields in vacuum.",
    whyItMatters: "It identifies a stress-energy input before any claim about a metric response.",
    subjects: ["electromagnetism", "energy_density", "stress_energy"],
    level: "law",
    status: "canonical_reference",
    simulationOwners: ["curvature_collapse"],
    equationFamilies: ["maxwell_energy_density"],
    tags: ["calculator_loadable", "classical_field", "vacuum"],
    equations: [{
      id: "vacuum_em_field_energy_density",
      role: "calculator_demo",
      displayLatex: "u_{EM}=\\frac{\\epsilon_0}{2}(E^2+c^2B^2)",
      computableExpression: "u_em = 4.4270939064e-12*(E_V_m^2+8.987551787368176e16*B_T^2)",
      operatorKind: "scalar_expression",
      inputSymbols: ["E_V_m", "B_T"],
      outputSymbols: ["u_em"],
    }],
    units: [
      { symbol: "u_em", unit: "J/m^3", quantity: "energy_density", dimensionSignature: "M L^-1 T^-2" },
      { symbol: "E_V_m", unit: "V/m", quantity: "electric_field", dimensionSignature: "M L T^-3 I^-1" },
      { symbol: "B_T", unit: "T", quantity: "magnetic_flux_density", dimensionSignature: "M T^-2 I^-1" },
    ],
    assumptions: [
      "Classical electromagnetic fields in vacuum, evaluated in a specified local frame.",
      "No material response, boundary renormalization, apparatus stress tensor, or metric solution is inferred.",
    ],
    calculatorPayloads: [{
      id: "vacuum_em_field_energy_density_payload",
      expression: "u_em = 4.4270939064e-12*(E_V_m^2+8.987551787368176e16*B_T^2)",
      displayLatex: "u_{EM}=\\frac{\\epsilon_0}{2}(E^2+c^2B^2)",
      preferredAction: "solve_with_steps",
      targetVariable: "u_em",
      setupContext: null,
    }],
    sourceRefs: [
      emNotes,
      { kind: "repo_module", path: "modules/core/physics-constants.ts", id: "VACUUM_PERMITTIVITY", note: "Local numeric epsilon0 and c convention." },
      sourceBoundary,
    ],
    hintKeys: {
      subjects: ["electromagnetism", "energy_density", "stress_energy"],
      symbols: ["u_em", "E_V_m", "B_T"],
      unitSignatures: ["M L^-1 T^-2", "M L T^-3 I^-1", "M T^-2 I^-1"],
      repoPaths: ["modules/core/physics-constants.ts", "docs/research/nhm2-source-to-experiment-closure-parallel-work-packet-v1.md"],
      equationFamilies: ["maxwell_energy_density"],
      simulationOwners: ["curvature_collapse"],
    },
  }),
  emBadge({
    id: "curvature.proxy.em_energy_density",
    title: "Electromagnetic Curvature-Unit Source Proxy",
    plainMeaning: "Converts a classical EM energy-density scalar into the inverse-length-squared units of the Einstein source term.",
    whyItMatters: "It teaches the source coupling scale while leaving the tensor equation and metric solve open.",
    subjects: ["electromagnetism", "curvature", "stress_energy", "proxy"],
    level: "derived_relation",
    status: "project_derived",
    simulationOwners: ["curvature_collapse"],
    equationFamilies: ["einstein_source_coupling", "curvature_proxy"],
    tags: ["calculator_loadable", "source_units", "diagnostic"],
    equations: [{
      id: "em_energy_density_to_curvature_units",
      role: "calculator_demo",
      displayLatex: "\\kappa_{EM}=\\frac{8\\pi G}{c^4}u_{EM}",
      computableExpression: "kappa_em = 2.0766474428449717e-43*u_em",
      operatorKind: "scalar_expression",
      inputSymbols: ["u_em"],
      outputSymbols: ["kappa_em"],
    }],
    units: [
      { symbol: "u_em", unit: "J/m^3", quantity: "energy_density", dimensionSignature: "M L^-1 T^-2" },
      { symbol: "kappa_em", unit: "m^-2", quantity: "curvature_unit_source_proxy", dimensionSignature: "L^-2" },
    ],
    assumptions: [
      "Scalar dimensional conversion only; the full electromagnetic stress tensor and Einstein equations remain unsolved.",
      "The numeric prefactor uses the repository's G and exact c constants.",
      "Does not supply an NHM2 source tensor, observed curvature, or the planned Einstein-Maxwell benchmark.",
    ],
    calculatorPayloads: [{
      id: "em_curvature_unit_source_payload",
      expression: "kappa_em = 2.0766474428449717e-43*u_em",
      displayLatex: "\\kappa_{EM}=\\frac{8\\pi G}{c^4}u_{EM}",
      preferredAction: "solve_with_steps",
      targetVariable: "kappa_em",
      setupContext: null,
    }],
    sourceRefs: [
      grNotes,
      { kind: "repo_module", path: "shared/curvature-proxy.ts", id: "kappa_u", note: "Shared scalar prefactor implementation." },
      { kind: "repo_module", path: "shared/physics-const.ts", id: "G", note: "Local G and c convention." },
      sourceBoundary,
    ],
    hintKeys: {
      subjects: ["electromagnetism", "curvature", "stress_energy", "proxy"],
      symbols: ["u_em", "kappa_em"],
      unitSignatures: ["M L^-1 T^-2", "L^-2"],
      repoPaths: ["shared/curvature-proxy.ts", "shared/physics-const.ts", "docs/research/nhm2-source-to-experiment-closure-parallel-work-packet-v1.md"],
      equationFamilies: ["einstein_source_coupling", "curvature_proxy"],
      simulationOwners: ["curvature_collapse"],
    },
  }),
  emBadge({
    id: "physics.em.vacuum_plane_wave_flux",
    title: "Vacuum Plane-Wave Energy Flux",
    plainMeaning: "Relates energy density and energy flux for an ideal traveling plane wave in vacuum.",
    whyItMatters: "It explains the old lab's matching density and flux prefactors as an identity under a plane-wave assumption.",
    subjects: ["electromagnetism", "plane_wave", "energy_flux"],
    level: "derived_relation",
    status: "canonical_reference",
    simulationOwners: ["curvature_collapse"],
    equationFamilies: ["poynting_flux", "plane_wave"],
    tags: ["calculator_loadable", "vacuum", "plane_wave"],
    equations: [{
      id: "plane_wave_energy_flux",
      role: "calculator_demo",
      displayLatex: "S=c\\,u_{EM}",
      computableExpression: "S_W_m2 = 299792458*u_em",
      operatorKind: "scalar_expression",
      inputSymbols: ["u_em"],
      outputSymbols: ["S_W_m2"],
    }],
    units: [
      { symbol: "u_em", unit: "J/m^3", quantity: "energy_density", dimensionSignature: "M L^-1 T^-2" },
      { symbol: "S_W_m2", unit: "W/m^2", quantity: "energy_flux", dimensionSignature: "M T^-3" },
    ],
    assumptions: [
      "Ideal traveling plane wave in vacuum; S=c u is not a general static-field identity.",
      "This scalar flux relation is not a field solution, source tensor, or NHM2 viability receipt.",
    ],
    calculatorPayloads: [{
      id: "vacuum_plane_wave_flux_payload",
      expression: "S_W_m2 = 299792458*u_em",
      displayLatex: "S=c\\,u_{EM}",
      preferredAction: "solve_with_steps",
      targetVariable: "S_W_m2",
      setupContext: null,
    }],
    sourceRefs: [emNotes, sourceBoundary],
    hintKeys: {
      subjects: ["electromagnetism", "plane_wave", "energy_flux"],
      symbols: ["u_em", "S_W_m2"],
      unitSignatures: ["M L^-1 T^-2", "M T^-3"],
      repoPaths: ["docs/research/nhm2-source-to-experiment-closure-parallel-work-packet-v1.md"],
      equationFamilies: ["poynting_flux", "plane_wave"],
      simulationOwners: ["curvature_collapse"],
    },
  }),
];

export const ELECTROMAGNETIC_CURVATURE_THEORY_EDGES: TheoryBadgeEdgeV1[] = [
  {
    id: "em_energy_density_derives_curvature_units",
    from: "physics.em.vacuum_field_energy_density",
    to: "curvature.proxy.em_energy_density",
    relation: "derives",
    label: "The curvature-unit scalar uses the classical EM energy density as input.",
    claimBoundaryNote: "An input scalar is not a conserved tensor or metric solution.",
  },
  {
    id: "em_energy_density_specializes_plane_wave_flux",
    from: "physics.em.vacuum_field_energy_density",
    to: "physics.em.vacuum_plane_wave_flux",
    relation: "specializes",
    label: "An ideal vacuum plane wave carries flux S=c u.",
    claimBoundaryNote: "The relation applies only in its declared wave domain.",
  },
  {
    id: "efe_documents_em_source_coupling",
    from: "physics.gr.einstein_field_equation",
    to: "curvature.proxy.em_energy_density",
    relation: "documents",
    label: "Einstein's source prefactor supplies the curvature-unit conversion.",
    claimBoundaryNote: "Scalar unit conversion is not an Einstein-Maxwell solve.",
  },
];

export function buildElectromagneticCurvatureTheoryBadgesV1(): {
  badges: TheoryBadgeV1[];
  edges: TheoryBadgeEdgeV1[];
} {
  return {
    badges: ELECTROMAGNETIC_CURVATURE_THEORY_BADGES.map((badge) => ({ ...badge })),
    edges: ELECTROMAGNETIC_CURVATURE_THEORY_EDGES.map((edge) => ({ ...edge })),
  };
}
