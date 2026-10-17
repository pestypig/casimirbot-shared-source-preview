/** Exact-ID, read-only research-design reference. No run, source-byte validation or hardware authority. */
export const FERROFLUID_UNTETHERED_FLOW_PROTOCOL_IDS = ["untethered-dynamo-flow-prepurchase/1"] as const;
export type FerrofluidUntetheredFlowProtocolId = (typeof FERROFLUID_UNTETHERED_FLOW_PROTOCOL_IDS)[number];

const protocol = {
  schemaVersion: "ferrofluid-observation-protocol/1",
  protocolId: "untethered-dynamo-flow-prepurchase/1",
  apparatusProfileId: "untethered-proposed/1",
  status: "design_only_no_levitated_run_selected_solar_velocity_target_or_flow_readout",
  objective: "Choose one source-identified solar-model flow/magnetic-response feature and test whether a plate-off, feedback-stabilized free core with independently driven exterior fields can generate and measure a comparable normalized flow/interface response.",
  priority: "conditional_followon_after_untethered_solar_field_geometry_screen",
  predecessorRule: "The string-supported A0 arc, plate following and 32-Hz phone-field result are historical diagnostics, not prerequisites or predicted outcomes for this apparatus.",
  sourceRefs: [
    "docs/research/star-watcher-untethered-dynamo-flow-feasibility-v1.md",
    "docs/research/star-watcher-untethered-ferrofluid-core-apparatus-plan-v1.md",
    "docs/research/star-watcher-magnetic-lab-analogue-adapter-v1.md",
    "docs/research/star-watcher-char-mhd-boundary-benchmark-v1.md",
    "docs/research/star-watcher-a0-prepurchase-observation-contract-v1.md",
  ],
  theoryBadgeIds: [
    "lab.ferrofluid.apparatus_field",
    "lab.ferrofluid.core_force_balance",
    "lab.ferrofluid.two_phase_interface",
    "lab.ferrofluid.bulk_thermal_response",
    "lab.ferrofluid.cross_regime_claim_boundary",
  ],
  selectedSolarTarget: null,
  solarTargetContract: "Before actuator selection, freeze exact solar observation or dynamo-model ID/hash, native time and coordinates, provenance, observed-versus-simulated status, velocity and magnetic variables, feature operator, normalization, uncertainty, and a term map covering imposed versus flow-generated field, buoyancy, rotation/Coriolis force, viscosity, induction, boundaries and explicit non-similarities. Existing magnetic maps or CHAR Bz previews alone are not a validated dynamo-flow target.",
  candidateFeatureFamily: "differential shear and velocity-fluctuation/transport statistics with a separately scored magnetic-pattern response; one exact target and metric must be selected before a comparison claim",
  apparatusConfiguration: {
    coreSupport: "proposed_feedback_stabilized_untethered_core",
    drive: "independently mapped side-coil fields/gradients, separate from the overhead lift controller",
    stirPlate: "off_by_default_not_required_for_untethered_forcing",
    string: "absent",
    arc: "not_expected_or_assumed",
  },
  governingRegimeChecks: [
    { id: "Re", expression: "rho*U*L/eta_dynamic", meaning: "inertial-to-viscous flow screening with measured velocity, length, density, viscosity and temperature; morphology alone does not establish turbulence" },
    { id: "Rm", expression: "mu*sigma*U*L", meaning: "magnetic induction-to-diffusion screening with measured electrical conductivity and permeability; an externally imposed field plus moving magnetized matter is not self-excited dynamo action" },
    { id: "Pm", expression: "Rm/Re = mu*sigma*eta_dynamic/rho", meaning: "magnetic-to-viscous diffusivity ratio for a declared simple-property model; report only with qualified material values" },
    { id: "Ro", expression: "U/(2*Omega*L)", meaning: "rotation-to-inertia screen only when a physical global rotation rate Omega exists; the proposed plate-off condition has no default solar-like Coriolis counterpart" },
    { id: "flow_time", expression: "U*tau_corr/L", meaning: "normalized velocity-correlation time only after a qualified velocity time series exists" },
    { id: "magnetic_interface", expression: "Delta_p_mag*L/gamma", meaning: "magnetic-to-interfacial-stress screening only after actual field, material and interface measurements" },
  ],
  measurementLadder: [
    { id: "F0_target_and_observability", pass: "exact target, measurable flow statistic, Re/Rm screening assumptions, material/optical inventory and a falsifiable purchase envelope", fail: "target is an image resemblance, unverified dynamo output or an RPM match" },
    { id: "F1_plate_off_core_support", pass: "measured gap force, power/temperature, fail-off behavior, and bounded core translation/tilt with plate and shaping coils off", fail: "stable position inferred from one Hall point or a catalog contact-force rating" },
    { id: "F2_independent_forcing", pass: "calibrated branch currents/field basis and lift-versus-shaping coupling with and without the core", fail: "nominal coil commands or exterior Hall changes presented as a controlled fluid drive" },
    { id: "F3_flow_response", pass: "registered core, contour and qualified phase-specific flow measurements with baseline/sham contrast", fail: "shape or composite Hall changes presented as internal velocity or turbulence" },
    { id: "F4_held_out_comparison", pass: "repeatable shear/fluctuation or transport statistics, normalized forcing/response, uncertainty and held-out conditions against the selected target", fail: "a visually similar arc, imposed polarity flip or moving permanent magnet presented as solar dynamo induction" },
  ],
  requiredRunFields: [
    "run_id_protocol_id_apparatus_profile_revision_and_raw_source_hashes",
    "selected_solar_model_or_observation_id_feature_operator_and_source_status_or_null",
    "plate_off_on_state_and_independent_lift_vs_shaping_commands_currents_and_power",
    "calibrated_exterior_vector_field_positions_orientation_clock_and_saturation",
    "core_3d_pose_or_bounded_projection_with_visibility_and_contact_flags",
    "front_side_contour_and_validated_velocity_measurement_region_phase_and_QA",
    "fluid_lots_composition_density_viscosity_conductivity_temperature_and_uncertainty",
    "controlled_sham_repeated_settings_failed_runs_and_evaluation_mode",
    "Re_Rm_other_declared_dimensionless_values_or_explicit_not_measured",
  ],
  timingRule: "The A0 0.87-ms-at-32-Hz example is not a free-core requirement. Qualify camera cadence, exposure, spatial blur and field/current/video alignment against the selected flow scale ell, measured U, tau_flow~ell/U and any claimed forcing-to-flow lag or spectrum; leave numerical margins unset until F0 fixes the feature and bandwidth.",
  purchaseGate: "First establish target, optical flow-readout feasibility, provisional fluid regime, catalog-bounded geometry and a delivered first-stage quote. A duplicate bottle and calipers may then establish actual geometry before any lift-coil purchase. Retain the two glycerin bottles as provisional for the prior two-phase baseline until viscosity is checked against the chosen flow target. Prefer reusable geometry, field/current and pose diagnostics over A0-only plate-phase hardware. No coil array, replacement fluid, camera upgrade or levitation claim follows from this source-only proposal.",
  claimCeiling: "An admitted run could establish externally forced ferrohydrodynamic flow/interface behavior and a declared dimensionless comparison. It cannot establish solar convective turbulence, self-excited dynamo regeneration, flare reconnection or a new spin-gravity coupling without separately matching their governing mechanisms and observations.",
} as const;

export function getFerrofluidUntetheredFlowProtocol(protocolId: FerrofluidUntetheredFlowProtocolId) {
  if (protocolId !== protocol.protocolId) throw new RangeError("unknown_ferrofluid_untethered_flow_protocol");
  return protocol;
}
