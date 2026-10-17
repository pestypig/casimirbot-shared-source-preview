import { FERROFLUID_ARC_EVIDENCE } from "./ferrofluid-arc-evidence-model";

export const FERROFLUID_LAB_PROFILE_IDS = ["string-a0-reported/1", "untethered-proposed/1"] as const;
export type FerrofluidLabProfileId = (typeof FERROFLUID_LAB_PROFILE_IDS)[number];
export const FERROFLUID_LAB_EVIDENCE_IDS = ["a0-arc-clip-historical/1"] as const;
export type FerrofluidLabEvidenceId = (typeof FERROFLUID_LAB_EVIDENCE_IDS)[number];

const profiles = {
  "string-a0-reported/1": {
    schemaVersion: "magnetic-apparatus-profile-summary/1",
    profileId: "string-a0-reported/1",
    maturity: "owner_reported_geometry_not_calibrated",
    support: "nylon_line_and_swivel",
    core: "reported_axial_ring_identity_unconfirmed",
    fluid: "glycerin_and_ferrofluid_lots_and_properties_unverified",
    drives: ["existing_rotating_stir_plate"],
    temperatureSensors: "none_in_historical_record",
    prepurchaseProtocolIds: ["a0-phase-shape-prepurchase/1"],
    theoryBadgeIds: ["lab.ferrofluid.apparatus_field", "lab.ferrofluid.two_phase_interface", "lab.ferrofluid.energy_ledger", "lab.ferrofluid.relative_axis_response"],
    sourceRefs: ["docs/research/star-watcher-ferrofluid-globe-apparatus-a0-v1.md"],
  },
  "untethered-proposed/1": {
    schemaVersion: "magnetic-apparatus-profile-summary/1",
    profileId: "untethered-proposed/1",
    maturity: "design_only_no_built_or_calibrated_apparatus",
    support: "proposed_feedback_stabilized_free_core",
    core: "R422_R424_compact_axial_ring_and_solid_S3_sphere_screen_with_conditional_5mm_8mm_predrilled_single_sphere_comparators_R841_retention_and_later_R424DIA_yaw_control_no_multisphere_first_cart",
    fluid: "new_bottle_and_material_inputs_not_yet_measured",
    drives: ["proposed_overhead_lift", "conditional_independent_side_windings", "stir_plate_off_by_default"],
    temperatureSensors: "no_stage_A_thermistor_one_conditional_stage_B_coil_case_thermistor_fluid_temperature_method_still_needed",
    prepurchaseProtocolIds: ["untethered-solar-field-prepurchase/1", "untethered-dynamo-flow-prepurchase/1"],
    theoryBadgeIds: ["lab.ferrofluid.apparatus_field", "lab.ferrofluid.core_force_balance", "lab.ferrofluid.two_phase_interface", "lab.ferrofluid.bulk_thermal_response", "lab.ferrofluid.energy_ledger", "lab.ferrofluid.relative_axis_response"],
    sourceRefs: ["docs/research/star-watcher-ferrofluid-sun-apparatus-goal-v1.md", "docs/research/star-watcher-untethered-ferrofluid-core-apparatus-plan-v1.md", "docs/research/star-watcher-untethered-solar-field-purchase-gate-v1.md", "docs/research/star-watcher-untethered-dynamo-flow-feasibility-v1.md"],
  },
} as const;

const historicalEvidence = {
  schemaVersion: "magnetic-lab-evidence-handoff/1",
  evidenceId: "a0-arc-clip-historical/1",
  profileId: "string-a0-reported/1",
  recordKind: "historical_video_only_not_synchronized_lab_run",
  videoSha256: FERROFLUID_ARC_EVIDENCE.arcClip.sha256,
  videoDurationS: FERROFLUID_ARC_EVIDENCE.arcClip.durationS,
  videoSourceClockCrossValidated: false,
  magnetometerSameRun: FERROFLUID_ARC_EVIDENCE.arcClip.sameRunAsCsv,
  temperature: "not_measured",
  exteriorField: "not_synchronized_to_this_video",
  corePose: "not_measured_as_3d_pose",
  measuredCurrent: "not_measured",
  measuredRotation: "not_measured",
  thermalContrastEligible: false,
  solarComparisonEligible: false,
  sourceRefs: [
    "shared/ferrofluid-arc-evidence-model.ts",
    "docs/research/star-watcher-ferrofluid-thermal-response-and-quantum-analogy-v1.md",
  ],
  missingForThermalContrast: [
    "run_synchronized_temperature_traces_and_sensor_locations",
    "source_verified_hall_video_clock_join",
    "measured_drive_and_core_rotation",
    "qualified_material_properties_and_controlled_thermal_protocol",
  ],
} as const;

/** Curated, exact-ID summaries only. No private bytes, filesystem lookup or owner run database. */
export function getFerrofluidLabProfile(profileId: FerrofluidLabProfileId) {
  return profiles[profileId];
}

export function getFerrofluidLabHandoff(profileId: FerrofluidLabProfileId, evidenceId: FerrofluidLabEvidenceId) {
  if (profileId !== historicalEvidence.profileId || evidenceId !== historicalEvidence.evidenceId) {
    throw new RangeError("ferrofluid_lab_evidence_profile_mismatch");
  }
  return {
    schemaVersion: "ferrofluid-lab-handoff/1" as const,
    profile: profiles[profileId],
    evidence: historicalEvidence,
    runId: null,
    theoryBadgeIds: ["lab.ferrofluid.two_phase_interface", "lab.ferrofluid.bulk_thermal_response", "lab.ferrofluid.cross_regime_claim_boundary"],
    crossServiceJoin: {
      starWatcherReader: "helix_solar_magnetic_bundle_get",
      solarBundleId: null,
      solarToLabObservableBridge: "not_registered",
      localVideoReader: "ferrofluid.segment_raw_video",
      localVideoSourceHashRequired: true,
    },
    sourceBytesVerifiedByService: false,
    claimCeiling: "historical_image_plane_evidence_only_no_thermal_run_or_solar_isomorphism" as const,
  };
}
