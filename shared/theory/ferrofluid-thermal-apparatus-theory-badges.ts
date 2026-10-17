// math-stage: diagnostic
import type { TheoryBadgeClaimBoundaryV1, TheoryBadgeEdgeV1, TheoryBadgeV1 } from "../contracts/theory-badge-graph.v1";

const APPARATUS = "docs/research/star-watcher-untethered-ferrofluid-core-apparatus-plan-v1.md";
const SOLAR_GOAL = "docs/research/star-watcher-ferrofluid-sun-apparatus-goal-v1.md";
const THERMAL = "docs/research/star-watcher-ferrofluid-thermal-response-and-quantum-analogy-v1.md";
const ADAPTER = "docs/research/star-watcher-magnetic-lab-analogue-adapter-v1.md";
const HANDOFF = "shared/ferrofluid-lab-handoff.ts";
const VIDEO_METHOD = "tools/ferrofluid/README.md";
const BOUNDARY: TheoryBadgeClaimBoundaryV1 = {
  diagnosticOnly: true,
  doesValidateNHM2: false,
  validationClaimAllowed: false,
  physicalMechanismClaimAllowed: false,
  promotionAllowed: false,
};

const sourceRefs: TheoryBadgeV1["sourceRefs"] = [
  { kind: "doc", path: APPARATUS, note: "Proposed geometry, force, energy and ordered apparatus gates." },
  { kind: "doc", path: SOLAR_GOAL, note: "Star Watcher canonical source, versioned target, solid/drilled sphere screen and held-out field objective." },
  { kind: "doc", path: THERMAL, note: "Bulk thermal-response estimand and cross-regime claim boundary." },
  { kind: "doc", path: ADAPTER, note: "Exact apparatus/run and solar-target provenance requirements." },
  { kind: "repo_module", path: HANDOFF, note: "Read-only exact-ID profile and historical evidence summaries." },
  { kind: "doc", path: VIDEO_METHOD, note: "Source-hash-matched image-plane contour and QA workflow." },
];

const badge = (input: {
  id: string; title: string; plainMeaning: string; whyItMatters: string;
  subjects: string[]; level: TheoryBadgeV1["level"]; status: TheoryBadgeV1["status"];
  family: string; equations: TheoryBadgeV1["equations"]; units: TheoryBadgeV1["units"];
  assumptions: string[]; symbols: string[]; observables?: TheoryBadgeV1["observables"];
}): TheoryBadgeV1 => ({
  id: input.id, title: input.title, plainMeaning: input.plainMeaning,
  whyItMatters: input.whyItMatters, subjects: input.subjects,
  level: input.level, status: input.status,
  simulationOwners: ["star_watcher", "ferrofluid_lab"], equationFamilies: [input.family],
  tags: ["apparatus_bound", "bulk_classical_response", "diagnostic_only"],
  equations: input.equations, units: input.units, assumptions: input.assumptions,
  calculatorPayloads: [], sourceRefs, observables: input.observables ?? [],
  hintKeys: {
    subjects: input.subjects, symbols: input.symbols,
    unitSignatures: input.units.flatMap(unit => unit.dimensionSignature ? [unit.dimensionSignature] : []),
    repoPaths: [APPARATUS, SOLAR_GOAL, THERMAL, ADAPTER, HANDOFF, VIDEO_METHOD],
    equationFamilies: [input.family], simulationOwners: ["star_watcher", "ferrofluid_lab"],
  },
  claimBoundary: BOUNDARY,
});

export const FERROFLUID_THERMAL_APPARATUS_BADGES: TheoryBadgeV1[] = [
  badge({
    id: "lab.ferrofluid.star_watcher_target", title: "Pinned Star Watcher solar target",
    plainMeaning: "Star Watcher owns changing source-identified solar features; each laboratory run or declared segment freezes one exact target and spatial transform.",
    whyItMatters: "A newer solar map cannot silently replace the reference after the ferrofluid response has been observed.",
    subjects: ["star_watcher", "solar_magnetic_field", "ferrofluid", "source_provenance"],
    level: "diagnostic_gate", status: "blocked", family: "ferrofluid_solar_target_binding",
    equations: [{ id: "solar_axis_to_lab_axis", role: "definition", displayLatex: "\\hat{\\mathbf n}_{lab}=R\\mathbf d_{1,\\odot}/|\\mathbf d_{1,\\odot}|", computableExpression: null, operatorKind: "field_sample", inputSymbols: ["R", "d_sun_l1"], outputSymbols: ["n_lab"] }],
    units: [{ symbol: "n_lab", unit: "1", quantity: "signed_unit_solar_axis_in_lab_frame", dimensionSignature: "1" }],
    assumptions: ["No exact current solar target is bound to the proposed free-core profile.", "One solar-magnetic-target/1 version must retain exact bundle/source hashes, time interval, frame, masks, flags, transform and score before the run.", "Solar source time and laboratory playback time are separate clocks."],
    symbols: ["d_sun_l1", "R", "n_lab"],
  }),
  badge({
    id: "lab.ferrofluid.apparatus_field", title: "Apparatus composite magnetic field",
    plainMeaning: "Separates the measured free core, overhead lift, optional shaping windings and ambient contributions; the stir plate is off for the first free-core goal.",
    whyItMatters: "An exterior Hall vector is a composite measurement; individual sources need independent calibration and pose control.",
    subjects: ["ferrofluid", "magnetic_field", "star_watcher", "apparatus"],
    level: "model", status: "review", family: "ferrofluid_apparatus_field_decomposition",
    equations: [{ id: "lab_field_decomposition", role: "definition", displayLatex: "\\mathbf B_{lab}=\\mathbf B_{core}(q)+\\mathbf B_{lift}(I_{lift})+\\sum_j I_j\\mathbf G_j+\\mathbf B_{ambient}", computableExpression: null, operatorKind: "field_sample", inputSymbols: ["B_core", "q", "B_lift", "I_lift", "I_j", "G_j", "B_ambient"], outputSymbols: ["B_lab"] }],
    units: [{ symbol: "B_lab", unit: "T", quantity: "composite_magnetic_flux_density", dimensionSignature: "M T^-2 I^-1" }],
    assumptions: ["The first free-core goal has the stir plate off; A0 string/plate observations retain a separate profile.", "Superposition is a model to be checked against the intact apparatus as core pose and ferrofluid loading respond.", "Exterior Hall vectors do not directly measure an interior fluid field."],
    symbols: ["B_lab", "B_core", "B_lift", "I_lift", "I_j", "G_j"],
    observables: [{ id: "exterior_hall_vector", canonicalObservableId: "lab_ferrofluid_exterior_composite_B", symbol: "B_ext", quantity: "exterior_composite_magnetic_flux_density", mathematicalType: "vector", unit: "T", dimensionSignature: "M T^-2 I^-1", coordinateFrame: "apparatus_exterior_sensor_frame_unregistered", operationalDefinitionRef: ADAPTER, responseModelRef: null }],
  }),
  badge({
    id: "lab.ferrofluid.solar_field_comparison", title: "Held-out solar dipole geometry comparison",
    plainMeaning: "A frozen low-order Star Watcher target is scored against registered exterior three-axis measurements after one amplitude fit on training sites.",
    whyItMatters: "The score must preserve solar source identity, signed orientation and held-out probe sites; a moving contour alone cannot supply a field match.",
    subjects: ["star_watcher", "ferrofluid", "solar_analogue", "magnetic_field"],
    level: "diagnostic_gate", status: "blocked", family: "ferrofluid_held_out_solar_dipole_comparison",
    equations: [{ id: "held_out_field_residual", role: "definition", displayLatex: "E_B^2=\\frac{\\sum_{h\\in H}\\|\\mathbf B_h-a\\mathbf b_1(\\mathbf x_h;\\hat{\\mathbf n}_{lab})\\|^2}{\\sum_{h\\in H}\\|\\mathbf B_h\\|^2}", computableExpression: null, operatorKind: "residual", inputSymbols: ["B_h", "a", "b_1", "x_h", "n_lab"], outputSymbols: ["E_B"] }],
    units: [{ symbol: "E_B", unit: "1", quantity: "held_out_normalized_exterior_vector_field_error", dimensionSignature: "1" }],
    assumptions: ["The source, transform, ROI, train/held-out sites and score are frozen before the evaluated run.", "The amplitude is fitted on training sites only; measured core pose and lift current accompany every field sample.", "A Stage A temporary support can calibrate a field but cannot establish untethered-core performance or solar dynamo action."],
    symbols: ["E_B", "B_h", "b_1", "n_lab", "a"],
  }),
  badge({
    id: "lab.ferrofluid.core_force_balance", title: "Free-core force and stability screen",
    plainMeaning: "The proposed untethered ring or sphere must balance magnetic force, buoyancy and weight at the measured gap.",
    whyItMatters: "Contact holding force and a single Hall reading cannot establish stable six-degree-of-freedom levitation.",
    subjects: ["ferrofluid", "levitation", "buoyancy", "apparatus"],
    level: "diagnostic_gate", status: "review", family: "ferrofluid_free_core_force_balance",
    equations: [{ id: "free_core_vertical_balance", role: "constraint", displayLatex: "F_{z,mag}(z,I,q)+\\rho_{bath}gV_{disp}-m_{assembly}g=0", computableExpression: null, operatorKind: "gate_status", inputSymbols: ["F_z_mag", "rho_bath", "g", "V_disp", "m_assembly"], outputSymbols: ["vertical_force_residual"] }],
    units: [{ symbol: "vertical_force_residual", unit: "N", quantity: "net_vertical_force", dimensionSignature: "M L T^-2" }],
    assumptions: ["No free-core lift or stability has been measured.", "Lateral, tilt and yaw escape tests remain separate gates."],
    symbols: ["F_z_mag", "V_disp", "m_assembly", "z"],
  }),
  badge({
    id: "lab.ferrofluid.two_phase_interface", title: "Classical magnetic-fluid interface",
    plainMeaning: "The visible contour is a two-phase viscous free-boundary response to magnetic, gravitational and interfacial stresses.",
    whyItMatters: "A silhouette can change through viscosity, convection, core motion, refraction or segmentation as well as magnetic forcing.",
    subjects: ["ferrofluid", "fluid_interface", "magnetic_stress", "image_contour"],
    level: "model", status: "review", family: "ferrofluid_two_phase_free_boundary",
    equations: [{ id: "bulk_momentum_balance", role: "law", displayLatex: "\\rho D_t\\mathbf u=-\\nabla p+\\nabla\\cdot\\boldsymbol\\tau+\\rho\\mathbf g+\\mathbf f_{mag}", computableExpression: null, operatorKind: "field_sample", inputSymbols: ["rho", "u", "p", "tau", "g", "f_mag"], outputSymbols: ["momentum_residual"] }],
    units: [{ symbol: "A", unit: "1", quantity: "image_plane_contour_response", dimensionSignature: "1" }],
    assumptions: ["The ferrofluid and glycerin are distinct phases with unmeasured interfacial properties.", "Image-plane contours are not 3-D material trajectories."],
    symbols: ["rho", "u", "f_mag", "A"],
    observables: [{ id: "image_plane_contour", canonicalObservableId: "lab_ferrofluid_image_plane_contour_ratio", symbol: "A", quantity: "predeclared_image_plane_contour_ratio", mathematicalType: "scalar", unit: "1", dimensionSignature: "1", coordinateFrame: "registered_camera_image_plane", operationalDefinitionRef: THERMAL, responseModelRef: VIDEO_METHOD }],
  }),
  badge({
    id: "lab.ferrofluid.bulk_thermal_response", title: "Bulk magnetic-fluid thermal response",
    plainMeaning: "A later controlled comparison holds field, rotation, core pose and geometry fixed while measuring a contour response at two fluid temperatures.",
    whyItMatters: "The first stage logs only ambient and exterior-glass temperatures; it cannot yet estimate this controlled contrast.",
    subjects: ["ferrofluid", "thermal_response", "temperature", "star_watcher"],
    level: "diagnostic_gate", status: "blocked", family: "ferrofluid_bulk_thermal_contrast",
    equations: [{ id: "controlled_bulk_contrast", role: "definition", displayLatex: "\\Delta A=A(T_2;B,\\mathrm{rpm},q,G)-A(T_1;B,\\mathrm{rpm},q,G)", computableExpression: null, operatorKind: "residual", inputSymbols: ["T_1", "T_2", "B", "rpm", "q", "G"], outputSymbols: ["Delta_A"] }],
    units: [{ symbol: "Delta_A", unit: "1", quantity: "contour_response_difference", dimensionSignature: "1" }, { symbol: "T", unit: "K", quantity: "fluid_temperature", dimensionSignature: "Theta" }],
    assumptions: ["T0 exterior temperatures are passive proxies, not calibrated fluid temperatures.", "T3 requires a separate temperature-rated vessel, fluid sensors and controlled protocol."],
    symbols: ["Delta_A", "T_1", "T_2", "B", "rpm", "q"],
  }),
  badge({
    id: "lab.ferrofluid.energy_ledger", title: "Electrical and mechanical energy ledger",
    plainMeaning: "Separates measured electrical input and winding loss from magnetic force, motion and fluid response.",
    whyItMatters: "Supply ratings and a permanent magnet's field are not measured experimental energy transfer.",
    subjects: ["ferrofluid", "energy", "coil_heating", "apparatus"],
    level: "derived_relation", status: "review", family: "ferrofluid_apparatus_energy_ledger",
    equations: [{ id: "electrical_input", role: "definition", displayLatex: "E_{elec}=\\int V(t)I(t)\\,dt", computableExpression: null, operatorKind: "worldline_integral", inputSymbols: ["V", "I", "t"], outputSymbols: ["E_elec"] }, { id: "winding_loss", role: "definition", displayLatex: "P_{coil}=I^2R(T)", computableExpression: null, operatorKind: "scalar_expression", inputSymbols: ["I", "R", "T"], outputSymbols: ["P_coil"] }],
    units: [{ symbol: "E_elec", unit: "J", quantity: "electrical_input_energy", dimensionSignature: "M L^2 T^-2" }, { symbol: "P_coil", unit: "W", quantity: "coil_resistive_power", dimensionSignature: "M L^2 T^-3" }],
    assumptions: ["Integrate only branches with measured voltage and current traces.", "Case thermistor temperature does not measure a winding hotspot."],
    symbols: ["E_elec", "V", "I", "P_coil", "R"],
  }),
  badge({
    id: "lab.ferrofluid.cross_regime_claim_boundary", title: "Ferrofluid analogy boundary",
    plainMeaning: "A room-temperature magnetic-fluid response is a classical bulk observable, not a solar flare, spin-coherence or boson-star measurement.",
    whyItMatters: "Cross-regime comparison needs a registered observable map, dimensionless similarity domain, error contract and falsifying test.",
    subjects: ["ferrofluid", "solar_analogue", "quantum_fluid", "isomorphism"],
    level: "claim_boundary", status: "blocked", family: "ferrofluid_cross_regime_comparison_gate",
    equations: [{ id: "cross_regime_map_requirement", role: "gate", displayLatex: "\\mathcal M:(E_{lab},\\partial\\Omega_{lab},O_{lab})\\to(E_{target},\\partial\\Omega_{target},O_{target})", computableExpression: null, operatorKind: "gate_status", inputSymbols: ["E_lab", "boundary_lab", "O_lab", "E_target", "boundary_target", "O_target"], outputSymbols: ["map_gate"] }],
    units: [],
    assumptions: ["No term-by-term solar, quantum-fluid or boson-star isomorphism is registered.", "Shared shape or dipole vocabulary cannot create an observable bridge."],
    symbols: ["M", "O_lab", "O_target"],
  }),
];

export const FERROFLUID_THERMAL_APPARATUS_EDGES: TheoryBadgeEdgeV1[] = [
  { id: "ferrofluid_solar_target_requires_carrington_dipole", from: "lab.ferrofluid.star_watcher_target", to: "solar.magnetic.carrington_equivalent_dipole", relation: "requires", label: "The first laboratory solar target derives its signed l=1 axis from an exact Star Watcher radial-map equivalent dipole.", claimBoundaryNote: "The map vector keeps its Carrington frame, acquisition interval, coverage and source flags before the lab transform." },
  { id: "ferrofluid_solar_comparison_requires_target", from: "lab.ferrofluid.solar_field_comparison", to: "lab.ferrofluid.star_watcher_target", relation: "requires", label: "A source-linked solar comparison requires one pinned Star Watcher target and transform.", claimBoundaryNote: "A changed or unauthenticated map cannot become an unmarked replacement target." },
  { id: "ferrofluid_solar_comparison_requires_field", from: "lab.ferrofluid.solar_field_comparison", to: "lab.ferrofluid.apparatus_field", relation: "requires", label: "The comparison needs calibrated exterior vector samples and measured core/coil state.", claimBoundaryNote: "A contour or nominal current is not a measured vector field." },
  { id: "ferrofluid_interface_requires_field", from: "lab.ferrofluid.two_phase_interface", to: "lab.ferrofluid.apparatus_field", relation: "requires", label: "Interface interpretation requires a source-separated field model and measured composite field.", claimBoundaryNote: "A modeled field is not an authenticated interior field measurement." },
  { id: "ferrofluid_interface_requires_core", from: "lab.ferrofluid.two_phase_interface", to: "lab.ferrofluid.core_force_balance", relation: "requires", label: "Untethered interface interpretation requires independently observed core pose and stability.", claimBoundaryNote: "This edge applies to the proposed free-core profile, not the historical string rig." },
  { id: "ferrofluid_thermal_requires_interface", from: "lab.ferrofluid.bulk_thermal_response", to: "lab.ferrofluid.two_phase_interface", relation: "requires", label: "Thermal contrast requires a predeclared contour observable and nuisance controls.", claimBoundaryNote: "Exterior-glass temperature alone cannot supply the fluid-temperature variable." },
  { id: "ferrofluid_thermal_requires_energy", from: "lab.ferrofluid.bulk_thermal_response", to: "lab.ferrofluid.energy_ledger", relation: "requires", label: "Thermal interpretation requires measured drive and dissipation context.", claimBoundaryNote: "Electrical input and coil loss are not automatically fluid heat or spin response." },
  { id: "ferrofluid_boundary_blocks_solar", from: "lab.ferrofluid.cross_regime_claim_boundary", to: "solar.mhd.footpoint_poynting_flux", relation: "blocks", label: "The laboratory energy ledger does not establish solar MHD Poynting flux or reconnection.", claimBoundaryNote: "No registered observable bridge or dimensionless validity domain connects these outcomes." },
  { id: "ferrofluid_boundary_blocks_bose", from: "lab.ferrofluid.cross_regime_claim_boundary", to: "low_temp.bose.phase_space_density_threshold", relation: "blocks", label: "The visible ferrofluid response does not measure Bose phase-space density.", claimBoundaryNote: "Room-temperature colloid contour and quantum occupation are distinct observables." },
];

export function buildFerrofluidThermalApparatusBadgesV1(): { badges: TheoryBadgeV1[]; edges: TheoryBadgeEdgeV1[] } {
  return {
    badges: FERROFLUID_THERMAL_APPARATUS_BADGES.map(badge => ({ ...badge })),
    edges: FERROFLUID_THERMAL_APPARATUS_EDGES.map(edge => ({ ...edge })),
  };
}
