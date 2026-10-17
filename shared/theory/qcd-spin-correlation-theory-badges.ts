// math-stage: diagnostic
import type { TheoryBadgeClaimBoundaryV1, TheoryBadgeEdgeV1, TheoryBadgeV1 } from "../contracts/theory-badge-graph.v1";

const NOTE = "docs/research/star-watcher-qcd-spin-correlation-reference-v1.md";
const boundary: TheoryBadgeClaimBoundaryV1 = {
  diagnosticOnly: true, doesValidateNHM2: false, validationClaimAllowed: false,
  physicalMechanismClaimAllowed: false, promotionAllowed: false,
};
const paper = (id: string): TheoryBadgeV1["sourceRefs"][number] => ({ kind: "literature_ref", id });
const make = (id: string, title: string, plainMeaning: string, equation: string | null,
  symbols: string[], sources: string[], assumptions: string[]): TheoryBadgeV1 => ({
  id, title, plainMeaning,
  whyItMatters: "Separates the relevant quantum observable from classical body rotation and visible fluid deformation.",
  subjects: ["QCD", "quantum_spin", "angular_momentum", "relative_axes"],
  level: "claim_boundary", status: "canonical_reference",
  simulationOwners: ["star_watcher", "relational_orientation"],
  equationFamilies: ["qcd_spin_correlations"], tags: ["qcd_reference", "diagnostic_only"],
  equations: equation ? [{ id: `${id}.equation`, role: "noncomputable_reference", displayLatex: equation,
    computableExpression: null, operatorKind: "noncomputable_reference", inputSymbols: symbols, outputSymbols: [] }] : [],
  units: [], assumptions, calculatorPayloads: [],
  sourceRefs: [{ kind: "doc", path: NOTE }, ...sources.map(paper)], observables: [],
  hintKeys: { subjects: ["QCD", "quantum_spin"], symbols, unitSignatures: [], repoPaths: [NOTE],
    equationFamilies: ["qcd_spin_correlations"], simulationOwners: ["star_watcher", "relational_orientation"] },
  claimBoundary: boundary,
});

export const QCD_SPIN_CORRELATION_BADGES: TheoryBadgeV1[] = [
  make("qcd.strange_quark.spin_flavor_boundary", "Strange flavor and spin-one-half state",
    "A strange quark has intrinsic spin one half; flavor does not specify its polarization or a hidden classical tilt.",
    "P(+_{\\hat m}|+_{\\hat n})=(1+\\hat m\\cdot\\hat n)/2", ["m_hat", "n_hat"],
    ["https://pdg.lbl.gov/2024/reviews/rpp2024-rev-qcd.pdf"],
    ["The probability is for a prepared pure spin state and ideal projective measurement.", "Confinement prevents an isolated strange-quark Stern-Gerlach measurement."]),
  make("qcd.gluon.on_shell_helicity_boundary", "Gluon spin and physical helicity",
    "The gluon is classified as spin one, while a physical on-shell massless gluon has helicities plus or minus one.",
    "\\lambda_g=\\pm 1", ["lambda_g"],
    ["https://pdg.lbl.gov/2024/reviews/rpp2024-rev-qcd.pdf"],
    ["On-shell physical gluon helicity is distinct from three rest-frame projections of a massive spin-one particle.", "Color is an internal charge, not an ordinary spatial axis."]),
  make("qcd.pair.singlet_triplet_correlation", "Pair spin correlation without constituent polarization",
    "Two spin-one-half states can each have zero individual mean spin yet differ in total spin and pair correlation.",
    "\\tfrac12\\otimes\\tfrac12=0\\oplus1,\\quad\\langle\\mathbf S_1\\cdot\\mathbf S_2\\rangle_{J=0}=-3\\hbar^2/4,\\quad\\langle\\mathbf S_1\\cdot\\mathbf S_2\\rangle_{J=1}=+\\hbar^2/4",
    ["S_1", "S_2", "J"], ["https://ocw.mit.edu/courses/8-05-quantum-physics-ii-fall-2013/ffe665c0cba2eae19a83e88dec42925c_MIT8_05F13_Chap_08.pdf"],
    ["The two-particle result is exact for ideal angular-momentum addition.", "It is not a complete kaon or QCD bound-state calculation."]),
  make("qcd.proton.ji_spin_accounting", "Proton spin decomposition",
    "Proton spin is a total conserved angular momentum with quark spin, quark orbital and gluon total contributions defined at a resolution scale.",
    "\\tfrac12=\\tfrac12\\Delta\\Sigma(\\mu)+L_q^{\\rm kin}(\\mu)+J_g(\\mu)",
    ["Delta_Sigma", "L_q", "J_g", "mu"], ["https://journals.aps.org/prl/abstract/10.1103/PhysRevLett.78.610"],
    ["Ji decomposition is used; component values depend on scale and definitions.", "Zero net strangeness does not require zero strange-quark spin contribution."]),
  make("qcd.hyperon.lambda_global_polarization", "Lambda ensemble polarization from collision geometry",
    "STAR inferred a statistical Lambda and anti-Lambda spin preference relative to the collision angular-momentum direction from decay products.",
    "P=(N_+-N_-)/(N_++N_-)", ["P", "N_plus", "N_minus"],
    ["https://www.nature.com/articles/nature23004"],
    ["This is ensemble polarization, not the angle of every constituent spin.", "Relating Lambda polarization to strange-quark polarization requires a hadron-structure model."]),
  make("qcd.hyperon.lambda_pair_correlation", "Lambda–anti-Lambda pair spin correlation",
    "The 2026 STAR result infers a pair relative-polarization signal of (18 ± 4)% from final-state hyperon decays.",
    null, [], ["https://www.nature.com/articles/s41586-025-09920-0"],
    ["Interpreting final-state correlation as inherited strange–antistrange correlation is model dependent.", "Pair correlation alone does not establish entanglement or a Bell violation."]),
  make("qcd.meson.phi_tensor_alignment", "Spin-one tensor alignment without a net spin arrow",
    "The phi-meson spin-projection population rho00 tests an axis preference; an unpolarized ensemble has rho00 equal to one third.",
    "\\rho_{00}=P(m=0),\\quad\\rho_{00}^{\\rm unpolarized}=1/3", ["rho_00", "m"],
    ["https://www.nature.com/articles/s41586-022-05557-5"],
    ["A spin-one alignment statistic is distinct from vector polarization.", "A preferred projection axis can coexist with zero mean spin."]),
];

export const QCD_SPIN_CORRELATION_EDGES: TheoryBadgeEdgeV1[] = [
  { id: "qcd_strange_spin_documents_axis_probability", from: "qcd.strange_quark.spin_flavor_boundary", to: "quantum.spin.measurement_axis_boundary", relation: "documents", label: "Strange flavor obeys the spin-one-half measurement rule.", claimBoundaryNote: "Flavor and spin orientation are separate labels." },
  { id: "qcd_pair_documents_constituent_spin", from: "qcd.pair.singlet_triplet_correlation", to: "qcd.strange_quark.spin_flavor_boundary", relation: "documents", label: "Pair angular momentum depends on correlations even when each constituent is unpolarized.", claimBoundaryNote: "Ideal pair algebra is not a full hadron wavefunction." },
  { id: "qcd_lambda_pair_documents_pair_algebra", from: "qcd.hyperon.lambda_pair_correlation", to: "qcd.pair.singlet_triplet_correlation", relation: "documents", label: "The measured hyperon pair motivates a spin-correlation question.", claimBoundaryNote: "Observed final states do not uniquely reconstruct an initial quark-pair quantum state." },
  { id: "qcd_lambda_global_documents_axis", from: "qcd.hyperon.lambda_global_polarization", to: "quantum.spin.measurement_axis_boundary", relation: "documents", label: "Collision angular momentum supplies the polarization reference axis.", claimBoundaryNote: "Heavy-ion dynamics are not a rotating-equilibrium tanh toy or a ferrofluid mechanism." },
  { id: "qcd_phi_documents_pair_distinction", from: "qcd.meson.phi_tensor_alignment", to: "qcd.hyperon.lambda_global_polarization", relation: "documents", label: "Tensor alignment and vector polarization are separate observables.", claimBoundaryNote: "The particles, states and measurement channels differ." },
  { id: "qcd_spin_blocks_ferrofluid_inference", from: "qcd.pair.singlet_triplet_correlation", to: "lab.ferrofluid.relative_axis_response", relation: "blocks", label: "A fluid silhouette cannot identify microscopic QCD spin correlation.", claimBoundaryNote: "No spin-sensitive observable, coupling model or cross-regime calibration is registered." },
];

export function buildQcdSpinCorrelationBadgesV1(): { badges: TheoryBadgeV1[]; edges: TheoryBadgeEdgeV1[] } {
  return { badges: QCD_SPIN_CORRELATION_BADGES.map(badge => ({ ...badge })), edges: QCD_SPIN_CORRELATION_EDGES.map(edge => ({ ...edge })) };
}
