import type {
  TheoryBadgeClaimBoundaryV1,
  TheoryBadgeEdgeV1,
  TheoryBadgeV1,
} from "../contracts/theory-badge-graph.v1";

const CLAIM_BOUNDARY: TheoryBadgeClaimBoundaryV1 = {
  diagnosticOnly: true,
  doesValidateNHM2: false,
  validationClaimAllowed: false,
  physicalMechanismClaimAllowed: false,
  promotionAllowed: false,
};

const source = (
  kind: TheoryBadgeV1["sourceRefs"][number]["kind"],
  path: string,
  id: string,
  note: string,
): TheoryBadgeV1["sourceRefs"][number] => ({ kind, path, id, note });

const badge = (value: Omit<TheoryBadgeV1, "claimBoundary">): TheoryBadgeV1 => ({
  ...value,
  claimBoundary: CLAIM_BOUNDARY,
});

const sharedSubjects = [
  "dark_matter",
  "lz_xenon",
  "boson_star",
  "casimir_dp",
  "shared_scattering_model",
];

export const BOSONIC_DARK_MATTER_SCREEN_THEORY_BADGES: TheoryBadgeV1[] = [
  badge({
    id: "darkmatter.lz_yamashita_yukawa.jeans_maxwell_proxy",
    title: "Yamashita finite-Yukawa Jeans-moment proxy",
    plainMeaning:
      "A converged Maxwell-distribution proxy averages the exact attractive finite-range p-wave Yukawa kernel at the Stenhouse Milky Way and dwarf RMS speeds. The dwarf-to-halo rate ratio is 0.08886, compared with 0.02355 for the Cassel-Hulthen approximation and 0.02407 at Yamashita's representative speeds; the halo-anchored dwarf rate is 2.40e-25 cubic centimeters per second.",
    whyItMatters:
      "It identifies a material finite-range averaging difference worth testing with source-specific velocity distributions before fitting gamma-ray data. It does not calculate a xenon recoil rate or a Casimir-DP coherence loss.",
    subjects: [...sharedSubjects, "yamashita", "stenhouse", "finite_range_yukawa", "p_wave"],
    level: "diagnostic_gate",
    status: "diagnostic",
    simulationOwners: ["casimir_dp_study", "dark_matter_screen"],
    equationFamilies: ["finite_yukawa_velocity_average", "jeans_moment_matched_maxwell_proxy"],
    tags: [
      "exploratory_proxy",
      "source_specific_phase_space_missing",
      "not_gamma_likelihood",
      "not_xenon_rate",
      "not_casimir_dp_rate",
      "no_observable_bridge",
    ],
    equations: [
      {
        id: "finite_yukawa_p_wave_averaged_rate_ratio",
        role: "noncomputable_reference",
        displayLatex: "R_{dwarf/MW}=0.08886; R_{Cassel-Hulthen}=0.02355; R_{representative}=0.02407",
        computableExpression: null,
        operatorKind: "noncomputable_reference",
        inputSymbols: ["m_X", "m_mediator", "alpha_eff", "v_rel", "S_1(v_rel)"],
        outputSymbols: ["R_dwarf/MW", "<sigma v>_dwarf"],
      },
    ],
    units: [
      { symbol: "R_dwarf/MW", quantity: "dimensionless dwarf-to-halo rate ratio", unit: "1", dimensionSignature: "dimensionless" },
      { symbol: "<sigma v>_dwarf", quantity: "halo-anchored dwarf annihilation rate", unit: "cm^3/s", dimensionSignature: "L^3 T^-1" },
    ],
    assumptions: [
      "Attractive finite-mass Yukawa p-wave model with m_X=420 GeV, m_mediator=0.4 GeV and alpha_eff=0.2.",
      "Untruncated Maxwell speed distributions are matched only to RMS speeds from the Stenhouse Milky Way Jeans moment and packaged Boddy dwarf moment.",
      "Gauss-Laguerre order 48 to 96 changes are below 8e-6; this checks quadrature convergence, not phase-space accuracy or resonance completeness.",
      "The exact finite-Yukawa proxy differs from the Cassel-Hulthen approximation; neither is a source-specific astrophysical likelihood or a measured annihilation rate.",
      "No xenon-nucleus response, local recoil spectrum, sphere-scattering kernel, or Casimir-DP coherence kernel is evaluated here.",
      "Maximum claim: reproducible model-dependent velocity-average diagnostic.",
    ],
    calculatorPayloads: [],
    sourceRefs: [
      source("doc", "docs/research/casimir-dp-yamashita-yukawa-jeans-moment-maxwell-2026-09-25.md", "yukawa-jeans-moment-proxy", "Inputs, comparison, values and limitations."),
      source("repo_module", "docs/research/casimir-dp-yamashita-yukawa-jeans-moment-maxwell-2026-09-25.py", "yukawa-jeans-moment-proxy-replay", "Reproducible quadrature replay."),
      source("artifact", "docs/research/casimir-dp-yamashita-yukawa-jeans-moment-maxwell-2026-09-25.json", "yukawa-jeans-moment-proxy-output", "Recorded numerical output and convergence."),
      source("doc", "docs/research/casimir-dp-lz-shared-scattering-work-program.md", "shared-scattering-program-entry-1245", "Canonical next-step and non-connection record."),
    ],
    hintKeys: {
      subjects: ["LZ", "xenon", "dark matter", "Yamashita", "Stenhouse", "finite Yukawa", "p-wave", "Sommerfeld", "dwarf galaxy", "Milky Way", "annihilation", "Casimir-DP"],
      symbols: ["m_X", "m_mediator", "alpha_eff", "S_1", "v_rel", "R_dwarf/MW"],
      unitSignatures: ["cm^3/s"],
      repoPaths: ["casimir-dp-yamashita-yukawa-jeans-moment-maxwell-2026-09-25", "casimir-dp-lz-shared-scattering-work-program.md"],
      equationFamilies: ["finite Yukawa", "Yukawa p-wave", "Jeans moment Maxwell proxy", "velocity average"],
      simulationOwners: ["casimir_dp_study", "dark_matter_screen"],
    },
  }),
  badge({
    id: "darkmatter.lz_stenhouse_yamashita.pure_law_crosscheck",
    title: "Stenhouse pure-law velocity cross-check",
    plainMeaning:
      "A public pure-p-wave and unsaturated Coulomb 1/v conversion replay gives halo-comparable dwarf limits of 2.54e-23 and 1.73e-26 cubic centimeters per second at 550 GeV. The scale ordering is consistent with the paper's approximate ratios, but this is not the finite-mass Yukawa model or a joint fit.",
    whyItMatters:
      "It independently checks the endpoint velocity-law conversion and helps isolate which next step requires the full finite-range kernel and source-specific distributions.",
    subjects: [...sharedSubjects, "stenhouse", "yamashita", "dwarf_galaxy", "velocity_law"],
    level: "diagnostic_gate",
    status: "diagnostic",
    simulationOwners: ["casimir_dp_study", "dark_matter_screen"],
    equationFamilies: ["pure_p_wave_limit_conversion", "coulomb_inverse_speed_limit_conversion"],
    tags: ["exploratory_crosscheck", "not_exact_yukawa", "not_joint_fit", "summary_moment_inputs"],
    equations: [
      {
        id: "stenhouse_pure_velocity_law_limits_550gev",
        role: "noncomputable_reference",
        displayLatex: "<sigma v>_{p-wave}=2.54e-23 cm^3/s; <sigma v>_{1/v}=1.73e-26 cm^3/s at m_X=550 GeV",
        computableExpression: null,
        operatorKind: "noncomputable_reference",
        inputSymbols: ["m_X", "v_rel", "p-wave", "1/v"],
        outputSymbols: ["<sigma v>_{p-wave}", "<sigma v>_{1/v}"],
      },
    ],
    units: [{ symbol: "<sigma v>", quantity: "annihilation rate coefficient", unit: "cm^3/s", dimensionSignature: "L^3 T^-1" }],
    assumptions: [
      "Pinned public analysis release and its Hoof W+W- s-wave table, packaged Boddy stacked-summary moments, and Jeans halo moments are used.",
      "At 550 GeV, the reproduced pure-p-wave and unsaturated Coulomb 1/v limits are 2.54e-23 and 1.73e-26 cm^3/s; approximate ratios are 0.039 and 58.",
      "The summary moments differ from the paper's source-matched posterior treatment; agreement in scale does not reproduce its full inference.",
      "The endpoint laws do not determine the finite-mass Yukawa velocity average, xenon event rate, or Casimir-DP response.",
      "Maximum claim: public endpoint-law conversion cross-check.",
    ],
    calculatorPayloads: [],
    sourceRefs: [
      source("doc", "docs/research/casimir-dp-stenhouse-yamashita-velocity-law-crosscheck-2026-09-25.md", "stenhouse-yamashita-law-crosscheck", "Reproduction method, pinned inputs and limits."),
      source("doc", "docs/research/casimir-dp-lz-shared-scattering-work-program.md", "shared-scattering-program-entry-1244", "Canonical next-step and scope record."),
      source("literature_ref", "https://arxiv.org/abs/2607.08552", "stenhouse-2026", "Primary paper for the public pure-law release."),
    ],
    hintKeys: {
      subjects: ["LZ", "xenon", "dark matter", "Stenhouse", "Yamashita", "p-wave", "Coulomb", "inverse velocity", "dwarf limit", "550 GeV"],
      symbols: ["m_X", "v_rel", "<sigma v>"],
      unitSignatures: ["cm^3/s"],
      repoPaths: ["casimir-dp-stenhouse-yamashita-velocity-law-crosscheck-2026-09-25", "casimir-dp-lz-shared-scattering-work-program.md"],
      equationFamilies: ["pure p-wave", "Coulomb 1/v", "velocity law conversion"],
      simulationOwners: ["casimir_dp_study", "dark_matter_screen"],
    },
  }),
  badge({
    id: "darkmatter.bosonic_multichannel.compatibility_screen",
    title: "Bosonic dark-sector and xenon compatibility screen",
    plainMeaning:
      "The current scale screen separates an ultralight boson-star benchmark from GeV-to-TeV xenon and gamma-ray candidates. The illustrative 1e-17 eV free-field constituent can support an Sgr A*-scale mass benchmark but cannot supply ordinary elastic xenon recoils; heavier candidates can reach recoil energies in some cases but do not inherit that star solution. A multicomponent sector is a construction option, not an established connection.",
    whyItMatters:
      "It prevents shared words such as bosonic field, gravity, and dark matter from being mistaken for a common model. A single Lagrangian, population history and detector responses are still required.",
    subjects: [...sharedSubjects, "bosonic_dark_sector", "ultralight_field", "multicomponent_model", "xenon_recoil"],
    level: "diagnostic_gate",
    status: "review",
    simulationOwners: ["boson_star_simulation", "casimir_dp_study", "dark_matter_screen"],
    equationFamilies: ["free_field_boson_star_mass_scale", "elastic_xenon_recoil_kinematics", "multichannel_compatibility"],
    tags: ["diagnostic_screen", "not_likelihood", "not_population_inference", "two_component_unbuilt", "no_shared_observable_bridge"],
    equations: [
      {
        id: "bosonic_star_xenon_recoil_scale_separation",
        role: "noncomputable_reference",
        displayLatex: "E_R,max=2 mu^2 v^2/m_Xe; E_kin=m_X v^2/2; M_max=0.633 M_Pl^2/m_X",
        computableExpression: null,
        operatorKind: "noncomputable_reference",
        inputSymbols: ["m_X", "v", "mu", "m_Xe", "M_Pl"],
        outputSymbols: ["E_R,max", "E_kin", "M_max"],
      },
    ],
    units: [
      { symbol: "m_X", quantity: "dark-sector constituent mass", unit: "eV or GeV", dimensionSignature: "mass" },
      { symbol: "E_R,max", quantity: "maximum elastic xenon nuclear recoil", unit: "keV", dimensionSignature: "energy" },
      { symbol: "M_max", quantity: "free-field boson-star maximum mass", unit: "solar masses", dimensionSignature: "mass" },
    ],
    assumptions: [
      "The ultralight 1e-17 eV row uses an illustrative free complex-scalar benchmark; its estimated maximum star mass and recoil ceiling are scale checks, not a reproduction of the referenced image model or a boson-star solver result.",
      "For that ultralight mass, ordinary single-particle elastic xenon recoil is kinematically unavailable by many orders of magnitude; coherent-field and gravitational responses require different detector models.",
      "Heavy boson recoil and gamma benchmarks have their own interaction, abundance, stability and formation requirements; a boson-star solution at one mass does not transfer to another.",
      "A two-component architecture is only a candidate model-construction direction until its Lagrangian, cosmological history, component fractions and common observables are specified.",
      "No raw sky data were reprocessed, no LZ likelihood was fit, and no new boson-star simulation was executed by this screen.",
      "Maximum claim: source-backed kinematic and model-compatibility triage.",
    ],
    calculatorPayloads: [],
    sourceRefs: [
      source("doc", "docs/research/casimir-dp-bosonic-compatibility-screen-2026-09-24.md", "bosonic-compatibility-screen", "Candidate branches, kinematics, scale results and stop conditions."),
      source("repo_module", "docs/research/casimir-dp-bosonic-free-field-scaling-2026-09-24.py", "bosonic-free-field-scaling-replay", "Reproducible scale-check script."),
      source("doc", "docs/research/casimir-dp-four-observable-branch-verdict-2026-09-25.md", "four-observable-branch-verdict", "Cross-channel status and residual limits."),
      source("doc", "docs/research/casimir-dp-lz-shared-scattering-work-program.md", "shared-scattering-program", "The current shared-scattering model gate."),
    ],
    hintKeys: {
      subjects: ["boson star", "bosonic dark matter", "ultralight", "dark structures", "xenon", "LZ", "nuclear recoil", "two component", "multi component", "Casimir-DP", "gravity", "invisible matter"],
      symbols: ["m_X", "E_R", "M_max", "M_Pl", "v", "mu"],
      unitSignatures: ["keV", "GeV", "eV", "solar masses"],
      repoPaths: ["casimir-dp-bosonic-compatibility-screen-2026-09-24", "casimir-dp-four-observable-branch-verdict-2026-09-25", "casimir-dp-lz-shared-scattering-work-program.md"],
      equationFamilies: ["boson star mass scaling", "elastic recoil kinematics", "dark matter compatibility"],
      simulationOwners: ["boson_star_simulation", "casimir_dp_study", "dark_matter_screen"],
    },
  }),
  badge({
    id: "darkmatter.shared_scattering.normalization_bridge_gate",
    title: "Shared scattering normalization bridge gate",
    plainMeaning:
      "For one weak-scattering channel with a common multiplicative strength, the xenon expected count and interferometer decoherence exponent can be written as lambda_Xe=A K_Xe and D=A K_coh, so D/lambda_Xe=K_coh/K_Xe when the xenon kernel is nonzero. The identity is a normalization strategy; the target and coherence kernels have not yet been evaluated for the same microscopic interaction.",
    whyItMatters:
      "This is the explicit bridge the next model must close: one mediator and coupling convention must predict a xenon recoil spectrum and the frozen Casimir-DP apparatus response without separate parameter choices.",
    subjects: [...sharedSubjects, "xenon_scattering", "decoherence", "normalization_bridge", "bosonic_dark_sector"],
    level: "diagnostic_gate",
    status: "blocked",
    simulationOwners: ["casimir_dp_study", "dark_matter_screen"],
    equationFamilies: ["shared_weak_scattering_normalization", "xenon_target_kernel", "interferometer_coherence_kernel"],
    tags: ["shared_parameter_required", "kernel_values_missing", "no_observable_bridge_registered", "not_a_fit", "not_a_mechanism"],
    equations: [
      {
        id: "shared_scattering_xenon_coherence_normalization",
        role: "definition",
        displayLatex: "lambda_Xe=A K_Xe(psi); D=A K_coh(psi); D/lambda_Xe=K_coh(psi)/K_Xe(psi)",
        computableExpression: null,
        operatorKind: "noncomputable_reference",
        inputSymbols: ["A", "psi", "K_Xe", "K_coh"],
        outputSymbols: ["lambda_Xe", "D", "D/lambda_Xe"],
      },
    ],
    units: [
      { symbol: "lambda_Xe", quantity: "expected xenon event count", unit: "count", dimensionSignature: "dimensionless count" },
      { symbol: "D", quantity: "decoherence exponent, negative logarithm of coherence magnitude ratio", unit: "1", dimensionSignature: "dimensionless" },
      { symbol: "D/lambda_Xe", quantity: "coherence exponent per expected xenon event", unit: "1/count", dimensionSignature: "count^-1" },
    ],
    assumptions: [
      "The factorization assumes a single-channel weak-scattering model with common multiplicative strength A and remaining parameters psi; coupling-dependent transport, interference and saturation require the full parameter-dependent calculation.",
      "Each kernel must include the actual exposure or branch-history duration, target response, xenon isotope composition, momentum-transfer distribution and apparatus branch filter.",
      "The identity is algebraic and does not set the event expectation to one because an observed event is under discussion.",
      "The 248 keV xenon recoil, the finite-Yukawa gamma proxy, the conditional Diósi-Penrose forecast and the separate boson-star screen are not currently derived from a common model.",
      "Admission requires one explicit interaction, matching amplitudes across targets, evaluated xenon and coherence kernels, heating/force checks, and independently sourced parameter bounds.",
      "Maximum claim: blocked diagnostic bridge definition; no shared observable transformation is registered.",
    ],
    calculatorPayloads: [],
    sourceRefs: [
      source("doc", "docs/research/casimir-dp-lz-shared-scattering-work-program.md", "shared-scattering-program", "Canonical active model definition and shared-kernel next step."),
      source("doc", "docs/research/casimir-dp-lz-mechanism-bridge-research-2026-09-06.md", "mechanism-bridge-baseline", "Prior hard-kick, kinematics and common-kernel review."),
      source("doc", "docs/research/casimir-dp-four-observable-branch-verdict-2026-09-25.md", "four-observable-branch-verdict", "Records that the screened channels remain unconnected."),
    ],
    hintKeys: {
      subjects: ["LZ", "xenon", "dark matter", "shared scattering", "coherence loss", "decoherence", "boson star", "Casimir-DP", "same parameters", "common kernel", "248 keV"],
      symbols: ["lambda_Xe", "D", "K_Xe", "K_coh", "A", "psi"],
      unitSignatures: ["count", "1/count"],
      repoPaths: ["casimir-dp-lz-shared-scattering-work-program.md", "casimir-dp-lz-mechanism-bridge-research-2026-09-06.md", "casimir-dp-four-observable-branch-verdict-2026-09-25.md"],
      equationFamilies: ["shared scattering", "xenon recoil", "decoherence kernel", "normalization strategy"],
      simulationOwners: ["casimir_dp_study", "dark_matter_screen"],
    },
  }),
];

export const BOSONIC_DARK_MATTER_SCREEN_THEORY_EDGES: TheoryBadgeEdgeV1[] = [
  {
    id: "darkmatter_yukawa_proxy_documents_shared_kernel_gate",
    from: "darkmatter.lz_yamashita_yukawa.jeans_maxwell_proxy",
    to: "darkmatter.shared_scattering.normalization_bridge_gate",
    relation: "documents",
    label: "The finite-Yukawa proxy supplies an astrophysical velocity-average comparator, not either detector kernel required by the shared-scattering gate.",
    claimBoundaryNote: "An annihilation-rate proxy does not determine a xenon scattering cross-section or Casimir-DP coherence response.",
  },
  {
    id: "darkmatter_stenhouse_crosscheck_documents_yukawa_proxy",
    from: "darkmatter.lz_stenhouse_yamashita.pure_law_crosscheck",
    to: "darkmatter.lz_yamashita_yukawa.jeans_maxwell_proxy",
    relation: "documents",
    label: "The pure-law conversion is an endpoint cross-check alongside the finite-range Yukawa proxy.",
    claimBoundaryNote: "Endpoint-law agreement in scale is not an exact finite-mass Yukawa recast or a joint fit.",
  },
  {
    id: "darkmatter_bosonic_compatibility_blocks_shared_mechanism_claim",
    from: "darkmatter.bosonic_multichannel.compatibility_screen",
    to: "darkmatter.shared_scattering.normalization_bridge_gate",
    relation: "blocks",
    label: "The scale screen leaves the boson-star, xenon and astrophysical channels without a common specified model and response calculation.",
    claimBoundaryNote: "Shared bosonic terminology does not create a shared interaction or observable bridge.",
  },
];

export function buildBosonicDarkMatterScreenTheoryBadgesV1(): {
  badges: TheoryBadgeV1[];
  edges: TheoryBadgeEdgeV1[];
} {
  return {
    badges: BOSONIC_DARK_MATTER_SCREEN_THEORY_BADGES.map((item) => ({ ...item })),
    edges: BOSONIC_DARK_MATTER_SCREEN_THEORY_EDGES.map((item) => ({ ...item })),
  };
}
