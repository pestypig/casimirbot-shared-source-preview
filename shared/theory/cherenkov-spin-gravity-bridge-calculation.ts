/**
 * Scale calculations for a proposed spin-tagged Cherenkov/gravity comparison.
 * They are leading-order design illustrations, not a spin-gravity theory,
 * an apparatus model, or measured sensitivity.
 */
export const CHERENKOV_BRIDGE_LIGHT_SPEED_M_S = 299_792_458;
export const CHERENKOV_BRIDGE_STANDARD_GRAVITY_M_S2 = 9.80665;
// NIST 2022 CODATA electron mass-energy equivalent, converted from MeV.
export const ELECTRON_REST_ENERGY_EV = 510_998.950_69;

export type CherenkovSpinGravityDesignInput = {
  heightDifferenceM: number;
  photonFrequencyHz: number;
  electronKineticEnergyEV: number;
  refractiveIndex: number;
  gravityM_S2?: number;
};

/**
 * Ideal independent-photon scale for estimating the centroid of a known
 * Gaussian spectral location family. Excludes source drift, throughput,
 * detector response, link errors, and all spin/polarization systematics.
 */
export function idealGaussianCentroidPhotonScale(
  singlePhotonFrequencySdHz: number,
  targetFrequencyShiftHz: number,
) {
  if (![singlePhotonFrequencySdHz, targetFrequencyShiftHz].every(Number.isFinite) ||
    singlePhotonFrequencySdHz <= 0 || targetFrequencyShiftHz <= 0) {
    throw new Error("Positive finite spectral width and target shift are required");
  }
  return (singlePhotonFrequencySdHz / targetFrequencyShiftHz) ** 2;
}

export function cherenkovSpinGravityDesign(input: CherenkovSpinGravityDesignInput) {
  const {
    heightDifferenceM,
    photonFrequencyHz,
    electronKineticEnergyEV,
    refractiveIndex,
    gravityM_S2 = CHERENKOV_BRIDGE_STANDARD_GRAVITY_M_S2,
  } = input;
  if (![heightDifferenceM, photonFrequencyHz, electronKineticEnergyEV, refractiveIndex, gravityM_S2]
    .every(Number.isFinite) ||
    heightDifferenceM <= 0 || photonFrequencyHz <= 0 ||
    electronKineticEnergyEV <= 0 || refractiveIndex <= 1 || gravityM_S2 <= 0) {
    throw new Error("Positive finite design inputs and refractive index above one are required");
  }

  const potentialDifferenceM2S2 = gravityM_S2 * heightDifferenceM;
  const fractionalGravitationalShift = potentialDifferenceM2S2 /
    CHERENKOV_BRIDGE_LIGHT_SPEED_M_S ** 2;
  const lorentzFactor = 1 + electronKineticEnergyEV / ELECTRON_REST_ENERGY_EV;
  const electronBeta = Math.sqrt(1 - 1 / lorentzFactor ** 2);
  const thresholdRefractiveIndex = 1 / electronBeta;
  const aboveCherenkovThreshold = refractiveIndex * electronBeta > 1;
  const nominalCherenkovAngleRad = aboveCherenkovThreshold
    ? Math.acos(1 / (refractiveIndex * electronBeta))
    : null;

  // A freely descending electron's local *total* energy changes by E * DeltaU/c^2
  // to leading order in a static field. This is not a proposed measurement.
  const electronVerticalEnergyScaleEV =
    (ELECTRON_REST_ENERGY_EV + electronKineticEnergyEV) * fractionalGravitationalShift;
  const betaChangeScale = electronVerticalEnergyScaleEV /
    (ELECTRON_REST_ENERGY_EV * electronBeta * lorentzFactor ** 3);
  const cherenkovAngleChangeScaleRad = nominalCherenkovAngleRad === null
    ? null
    : betaChangeScale /
      (refractiveIndex * electronBeta ** 2 * Math.sin(nominalCherenkovAngleRad));
  const photonFrequencyShiftScaleHz =
    photonFrequencyHz * fractionalGravitationalShift;

  return {
    potentialDifferenceM2S2,
    fractionalGravitationalShift,
    electronBeta,
    thresholdRefractiveIndex,
    aboveCherenkovThreshold,
    nominalCherenkovAngleRad,
    electronVerticalEnergyScaleEV,
    equivalentSingleElectronVoltageScaleV: electronVerticalEnergyScaleEV,
    cherenkovAngleChangeScaleRad,
    photonFrequencyShiftScaleHz,
    spinHalfDifferenceFrequencyScaleAtEta1eMinus3Hz:
      photonFrequencyShiftScaleHz * 1e-3,
    standardSpinDifferentialRedshiftCoefficient: 0,
  };
}
