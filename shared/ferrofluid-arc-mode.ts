import {z} from 'zod';

/** One measured or explicitly hypothetical linear mode, not a free-surface solve. */
export const ferrofluidArcModeInputSchema=z.object({
  schemaVersion:z.literal('ferrofluid-arc-mode-input/1'),
  parameterSetId:z.string().trim().min(1).max(160),
  basis:z.enum(['measured-calibrated','hypothesis-sweep']),
  effectiveMassKg:z.number().finite().positive(),
  stiffnessNPerM:z.number().finite().positive(),
  dampingNsPerM:z.number().finite().positive(),
  driveFrequencyHz:z.number().finite().min(0),
  forceAmplitudeN:z.number().finite().min(0),
}).strict();

export type FerrofluidArcModeInput=z.infer<typeof ferrofluidArcModeInputSchema>;

/**
 * Frequency response of m q'' + c q' + k q = F cos(2π f t).
 * The generalized coordinate q could represent a measured ring/string/interface
 * displacement only after its mode shape, effective mass and force are calibrated.
 * No fluid path, ejection threshold, magnetic field or device command is inferred.
 */
export function estimateFerrofluidArcMode(raw:unknown){
  const input=ferrofluidArcModeInputSchema.parse(raw);
  const omega=2*Math.PI*input.driveFrequencyHz;
  const omega0=Math.sqrt(input.stiffnessNPerM/input.effectiveMassKg);
  const stiffnessResidual=input.stiffnessNPerM-input.effectiveMassKg*omega*omega;
  const dissipativeTerm=input.dampingNsPerM*omega;
  const denominator=Math.hypot(stiffnessResidual,dissipativeTerm);
  if(!Number.isFinite(omega0)||!Number.isFinite(denominator)||denominator<=0){
    throw new RangeError('Arc-mode parameters exceed a finite, resolvable numerical range');
  }
  const amplitudeM=input.forceAmplitudeN/denominator;
  const quasiStaticAmplitudeM=input.forceAmplitudeN/input.stiffnessNPerM;
  const meanDissipatedPowerW=0.5*input.dampingNsPerM*omega*omega*amplitudeM*amplitudeM;
  if(!Number.isFinite(amplitudeM)||!Number.isFinite(quasiStaticAmplitudeM)||!Number.isFinite(meanDissipatedPowerW)){
    throw new RangeError('Arc-mode response exceeds a finite numerical range');
  }
  return {
    schemaVersion:'ferrofluid-arc-mode/1' as const,
    parameterSetId:input.parameterSetId,basis:input.basis,
    naturalFrequencyHz:omega0/(2*Math.PI),
    amplitudeM,phaseLagRad:Math.atan2(dissipativeTerm,stiffnessResidual),
    quasiStaticAmplitudeM,
    meanDissipatedPowerW,
    hasPredictedArc:false as const,
    hasMeasuredField:false as const,
    hasFluidTransport:false as const,
    hasActuationPlan:false as const,
  };
}
