/**
 * Exploratory arithmetic for TWO distinct gravitational-response estimands.
 * A local Cherenkov Stokes asymmetry is not a gravitational-response input.
 * Neither function establishes a physical bridge, measured result, or proof.
 */
export type JointSpinGravityResponseInput = {
  etaES: number;
  etaCherenkovPhoton: number;
  sigmaEtaES: number;
  sigmaEtaCherenkovPhoton: number;
  errorCorrelation: number;
};

function checkedInput(input: JointSpinGravityResponseInput) {
  const {
    etaES,
    etaCherenkovPhoton,
    sigmaEtaES,
    sigmaEtaCherenkovPhoton,
    errorCorrelation,
  } = input;
  if (![etaES, etaCherenkovPhoton, sigmaEtaES,
    sigmaEtaCherenkovPhoton, errorCorrelation].every(Number.isFinite) ||
    sigmaEtaES <= 0 || sigmaEtaCherenkovPhoton <= 0 ||
    Math.abs(errorCorrelation) >= 1) {
    throw new Error("Finite estimates, positive errors, and |error correlation| < 1 are required");
  }
  const denominator = 1 - errorCorrelation ** 2;
  return {
    inv00: 1 / (sigmaEtaES ** 2 * denominator),
    inv01: -errorCorrelation /
      (sigmaEtaES * sigmaEtaCherenkovPhoton * denominator),
    inv11: 1 / (sigmaEtaCherenkovPhoton ** 2 * denominator),
  };
}

function quadratic(x: number, y: number, inv00: number, inv01: number, inv11: number) {
  return inv00 * x * x + 2 * inv01 * x * y + inv11 * y * y;
}

/**
 * Two-dimensional zero-response diagnostic, conditional on actual measured
 * estimates and an independently justified covariance matrix. It is not a
 * common-coupling fit and does not assign a p-value or discovery status.
 */
export function jointZeroResponseDiagnostic(input: JointSpinGravityResponseInput) {
  const inverse = checkedInput(input);
  return {
    standardizedEtaES: input.etaES / input.sigmaEtaES,
    standardizedEtaCherenkovPhoton:
      input.etaCherenkovPhoton / input.sigmaEtaCherenkovPhoton,
    covarianceWeightedSquaredDistance: quadratic(
      input.etaES, input.etaCherenkovPhoton,
      inverse.inv00, inverse.inv01, inverse.inv11,
    ),
    degreesOfFreedomIfGaussianNull: 2,
  };
}

export type DeclaredResponseModel = {
  modelId: string;
  yb171Loading: number;
  cherenkovPhotonLoading: number;
};

/**
 * A conditional one-parameter generalized-least-squares projection.
 * The loadings MUST be supplied by an explicit, separately testable physical
 * model. Merely assigning both loadings to one asserts no justified bridge.
 */
export function fitDeclaredCommonParameter(
  input: JointSpinGravityResponseInput,
  model: DeclaredResponseModel,
) {
  const { inv00, inv01, inv11 } = checkedInput(input);
  const { yb171Loading: a, cherenkovPhotonLoading: b } = model;
  if (typeof model.modelId !== "string" || !model.modelId.trim() ||
    ![a, b].every(Number.isFinite) || (a === 0 && b === 0)) {
    throw new Error("A named model with finite nonzero response loadings is required");
  }
  const information = quadratic(a, b, inv00, inv01, inv11);
  const numerator = a * (inv00 * input.etaES + inv01 * input.etaCherenkovPhoton) +
    b * (inv01 * input.etaES + inv11 * input.etaCherenkovPhoton);
  const estimate = numerator / information;
  return {
    modelId: model.modelId,
    conditionalEstimate: estimate,
    conditionalStandardError: 1 / Math.sqrt(information),
    residualSquaredDistance: quadratic(
      input.etaES - a * estimate,
      input.etaCherenkovPhoton - b * estimate,
      inv00, inv01, inv11,
    ),
    residualDegreesOfFreedomIfGaussian: 1,
  };
}
