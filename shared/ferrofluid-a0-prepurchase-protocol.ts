/** Read-only preregistration proposal. This is neither an acquired run nor an instrument validator. */
export const FERROFLUID_A0_PREPURCHASE_PROTOCOL_IDS = ["a0-phase-shape-prepurchase/1"] as const;
export type FerrofluidA0PrepurchaseProtocolId = (typeof FERROFLUID_A0_PREPURCHASE_PROTOCOL_IDS)[number];

const protocol = {
  schemaVersion: "ferrofluid-observation-protocol/1",
  protocolId: "a0-phase-shape-prepurchase/1",
  apparatusProfileId: "string-a0-reported/1",
  scope: "optional_historical_string_and_stir_plate_diagnostic_not_a_prerequisite_for_untethered_flow_design",
  status: "versioned_proposal_no_synchronized_run_or_phase_admission",
  objective: "Measure whether the suspended ring loses one-to-one lock with a separately qualified plate-drive phase reference, and whether line motion and the ferrofluid contour change before or after that transition.",
  contextRefs: [
    "docs/research/star-watcher-ferrofluid-globe-apparatus-a0-v1.md",
    "docs/research/star-watcher-deformation-symmetry-and-mountain-comparison-v1.md",
    "docs/research/star-watcher-ferrofluid-thermal-response-and-quantum-analogy-v1.md",
    "docs/research/ferrofluid-arc-video-response-gate-v1.md",
    "docs/research/star-watcher-a0-prepurchase-observation-contract-v1.md",
    "docs/research/star-watcher-magnetic-lab-analogue-adapter-v1.md",
  ],
  theoryBadgeIds: [
    "lab.ferrofluid.apparatus_field",
    "lab.ferrofluid.two_phase_interface",
    "lab.ferrofluid.magnetic_phase_lock_stepout_gate",
    "lab.ferrofluid.projected_shape_quadrupole",
    "lab.ferrofluid.pattern_persistence_response_gate",
    "lab.ferrofluid.bulk_thermal_response",
    "lab.ferrofluid.cross_regime_claim_boundary",
    "quantum.spin.measurement_axis_boundary",
  ],
  primaryEndpoint: {
    id: "field_to_core_lock_and_phase_slip",
    definition: "For each held setting, report qualified plate-drive reference frequency and ring yaw frequency, sustained one-to-one locking or slips, and wrapped drive-reference-minus-ring phase only when source separation, phase-grade clocks and ring orientation pass QA.",
    units: "Hz; dimensionless frequency ratio; radians",
    missingRule: "If yaw or field phase is unresolved, report not_measured; a dial mark or unmarked ring silhouette is not a substitute.",
  },
  secondaryEndpoints: [
    { id: "line_mode", meaning: "line displacement, mode frequency and lead/lag relative to ring and contour", condition: "only with resolvable line tracking and documented support geometry" },
    { id: "crown_h_over_R", meaning: "normalized, quality-gated projected crown height", condition: "fixed calibrated camera and registered body radius" },
    { id: "q2_image", meaning: "centered projected elongation and its axial phase", condition: "segmentation QA and resolvably noncircular shape" },
    { id: "arc_events", meaning: "onset, apparent detachment/recontact and relaxation times", condition: "source video supports events; morphology is not a material pathline" },
  ],
  hypotheses: [
    { id: "H_stepout", prediction: "Qualified plate-drive phase reference keeps rotating while ring loses sustained one-to-one following at reproducible held settings; lag/slips precede or coincide with a changed contour response.", alternative: "Apparent stop comes from axial symmetry, view aliasing, sensor aliasing, ring tilt, line torsion, rotor change or occlusion.", claimCeiling: "measured synchronization transition in this rig; a magnetic-torque step-out mechanism needs separate coupling and support controls" },
    { id: "H_string_assist", prediction: "A resolved line mode/contact change leads the arc and a controlled support change shifts its onset after field and ring pose are accounted for.", alternative: "Field/core change or wetting and interfacial motion explains the contour without a line mode.", claimCeiling: "mechanical-support contribution, not a solar Alfvén wave" },
    { id: "H_shape_response", prediction: "A declared model predicts held-out h/R or q2 amplitude, orientation and relaxation from measured forcing and apparatus pose.", alternative: "Camera motion, refraction, core translation, fluid loading or slow settling explains the response.", claimCeiling: "classical magnetic-fluid and interface response" },
  ],
  sequence: "fixed-camera plate-off baseline; repeated held low-to-high-to-low settings with logged changes and settling windows; plate-off return; retain nulls and failed settings; keep bottle position, lighting and fill unchanged",
  requiredStreams: [
    { id: "front_video", needs: "original bytes, frame timestamps/exposure, fixed geometry and scale, core yaw fiducial or independently justified orientation channel, line and contour visibility" },
    { id: "hall_3axis_local", needs: "original timestamped Bx/By/Bz, units, range, calibration, indexed exterior location/orientation, noise and saturation flags; field is composite and exterior" },
    { id: "plate_drive_phase_reference", needs: "a simultaneous indexed reference sensor or independently validated rotor/plate phase channel; separate plate-only/ring-only calibration and spatial phase uncertainty; no single composite probe may be assumed to isolate the drive" },
    { id: "plate_and_geometry", needs: "plate on/off and dial-change timestamps, bottle offset, ring and line geometry; mechanical rotor rate only if independently measured" },
    { id: "passive_temperature", needs: "room-air and exterior-glass traces with locations and timestamps; neither is fluid temperature" },
    { id: "second_view_optional", needs: "registered second view when 3-D pose or apparent detachment needs checking" },
  ],
  timingAdmission: {
    frequencyOnly: "Demonstrate the true timestamped sample rate and absence of aliasing over the declared frequency band; Nyquist alone is a minimum, not a phase-accuracy demonstration.",
    phaseFormula: "max_cross_stream_error_s <= target_phase_error_deg / (360 * highest_claimed_frequency_hz)",
    example: "At 32 Hz, a 10-degree phase target allows at most 0.00087 s cross-stream timing error; this is an illustrative design target, not an observed A0 frequency or a product specification.",
    fullBudgetCaveat: "The 0.87-ms figure spends all 10 degrees on timing. An illustrative 5-degree timing allocation at 32 Hz is 0.43 ms, leaving a separate budget for drive-reference phase, ring/shape angle extraction, rolling shutter and model error. Calibrate systematic offsets and bound drift over each hold.",
    marginExamples: [
      { claimedFrequencyHz: 3.33, timingOnlyAt10DegMs: 8.34, meaning: "approximately the catalog 200-RPM mechanical rate, not a measured A0 rate" },
      { claimedFrequencyHz: 10, timingOnlyAt10DegMs: 2.78, meaning: "illustrative low-to-mid frequency" },
      { claimedFrequencyHz: 30, timingOnlyAt10DegMs: 0.93, meaning: "approximately the catalog 1800-RPM mechanical rate, not a measured local field rate" },
      { claimedFrequencyHz: 32, timingOnlyAt10DegMs: 0.87, meaning: "illustrative exterior-field band near the historical phone signal; not a synchronized run" },
      { claimedFrequencyHz: 64, timingOnlyAt10DegMs: 0.43, meaning: "conditional doubled image-quadrupole harmonic only if a 32-Hz pattern is actually measured" },
    ],
    claimTiers: [
      { id: "onset_and_relaxation", requirement: "Bracket logged setting changes and response times with uncertainty; sub-millisecond phase synchronization is unnecessary unless an event lead/lag of that size is claimed." },
      { id: "held_frequency_and_one_to_one_following", requirement: "Estimate frequencies independently over held windows, resolve ring yaw and check video/sensor aliasing; absolute cross-stream phase is not required for a reproducible frequency ratio." },
      { id: "cycle_resolved_field_to_ring_or_shape_phase", requirement: "Use a qualified drive-phase source, per-sample acquisition timestamps, bounded clock offset/drift, exposure and rolling-shutter timing, and a complete angular error budget; phase is undefined as one fixed offset after sustained slips." },
    ],
    directTrackingTarget: "Plan roughly 8 or more samples per claimed cycle unless a validated estimator and uncertainty study justifies fewer; preserve raw timestamps and exposure timing.",
    existingExternalJoin: "ferrofluid.evidence_join_audit uses 0.1-s alignment and at least three samples for another external-magnet question; its forcingInputAdmitted does not admit A0 phase or step-out claims.",
  },
  requiredRunManifestFields: [
    "run_id_and_immutable_apparatus_profile_id_revision_hash",
    "protocol_id_and_exact_MCP_observation_digest",
    "condition_and_sham_labels_with_predeclared_setting_sequence",
    "raw_video_hall_temperature_file_sha256_and_capture_metadata",
    "utc_start_and_each_stream_monotonic_clock_identity",
    "sync_events_method_cross_stream_error_and_missing_or_dropped_intervals",
    "sensor_locations_frames_units_cadence_range_calibration_and_saturation",
    "plate_drive_reference_method_source_separation_and_spatial_phase_uncertainty",
    "ring_fiducial_visibility_line_geometry_bottle_offset_and_material_lots",
    "estimated_preorder_field_band_with_assumptions_then_measured_installed_range",
    "observed_field_core_line_contour_traces_with_extractor_versions_and_QA",
    "commanded_plate_state_separate_from_measured_field_and_rotation",
    "predeclared_solar_bundle_id_or_null_with_feature_and_non_similarities",
    "training_holdout_ids_and_prospective_or_conditional_diagnostic_evaluation_mode",
  ],
  historicalDryReplay: {
    evidenceId: "a0-arc-clip-historical/1",
    runId: null,
    result: "incomplete_historical_evidence_not_phase_grade",
    missing: ["same_run_synchronized_video_and_vector_field", "independent_plate_drive_phase_reference", "measured_ring_yaw_and_line_mode", "phase_grade_clock_error", "calibrated_camera_and_Hall_geometry", "qualified_fluid_temperature"],
  },
  purchaseDecision: "Before ordering, set Hall range/rate, independent plate-phase-reference and camera/timestamp acceptance criteria from the predicted field band and claimed phase tolerance. After arrival, qualify the full indexed sensor/logger/video chain and reject saturated, composite-only or mistimed phase traces. Buy matched rings or actuators only against the next identified comparison; no thermal or spin-sensitive purchase follows from this protocol.",
  crossRegimeClaimCeiling: "The lab may test a magnetic-fluid transfer function and, if a line mode is measured, compare a reduced one-dimensional wave operator. A contour cannot establish solar reconnection, coronal rain, a Kelvin vortex, BEC, boson-star gravity or a new spin-gravity coupling.",
} as const;

export function getFerrofluidA0PrepurchaseProtocol(protocolId: FerrofluidA0PrepurchaseProtocolId) {
  if (protocolId !== protocol.protocolId) throw new RangeError("unknown_ferrofluid_a0_protocol");
  return protocol;
}
