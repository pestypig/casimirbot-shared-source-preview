/** Private local validation only. These limits are not approved customer terms. */
export const HOSTED_BUDGET_MODEL = "local.t10-p50.validation.v1" as const;
export type HostedResourceUnits = {
  requests: number; responseBytes: number; egressBytes: number; storageBytes: number;
  cpuMillis: number; memoryMiBMillis: number; databaseMillis: number;
  /** Fixed point USD millionths, from a pinned model; never inferred from bytes. */
  modeledCostMicrousd: number;
};
export const ZERO_HOSTED_UNITS: HostedResourceUnits = {
  requests: 0, responseBytes: 0, egressBytes: 0, storageBytes: 0,
  cpuMillis: 0, memoryMiBMillis: 0, databaseMillis: 0, modeledCostMicrousd: 0,
};
export const HOSTED_REQUEST_UPPER_BOUND: HostedResourceUnits = {
  requests: 1, responseBytes: 128 * 1024, egressBytes: 128 * 1024,
  storageBytes: 4096, cpuMillis: 20000, memoryMiBMillis: 40960000,
  databaseMillis: 0, modeledCostMicrousd: 1000,
};
export const HOSTED_LIMITS = {
  T10: { effects: 10, leases: 12, requests: 100, protectedRequests: 20,
    egressBytes: 25 * 1024 ** 2, protectedEgressBytes: 5 * 1024 ** 2,
    storageBytes: 5 * 1024 ** 2, cpuMillis: 2400000,
    memoryMiBMillis: 4915200000, databaseMillis: 120 * 60000, pbt: 1000 },
  P50: { effects: 50, leases: 60, requests: 300, protectedRequests: 30,
    egressBytes: 100 * 1024 ** 2, protectedEgressBytes: 10 * 1024 ** 2,
    storageBytes: 25 * 1024 ** 2, cpuMillis: 6600000,
    memoryMiBMillis: 13516800000, databaseMillis: 600 * 60000, pbt: 4000 },
} as const;
export type HostedEffectAdmission = {
  sponsorProfileId: string; termId: string; eligibilityRevision: number;
  roomId: string; sponsorRevision: number; memberProfileId: string; memberRevision: number;
  programOwnerProfileId: string; nodeId: string; programId: string;
  documentId: string; documentRevision: number; connectorEpoch: string;
  grantId: string; requestId: string; bodySha256: string; upperBound: HostedResourceUnits;
};
export type HostedReservation = {
  reservationId: string; termId: string; input: HostedEffectAdmission;
  status: "reserved" | "dispatched" | "outcome_unknown" | "verified_success" | "verified_failure" | "canceled";
  reservedAt: string; dispatchedAt?: string; effectId?: string; evidenceRef?: string;
  actual?: HostedResourceUnits;
};
export type HostedTermStatus = {
  local_only: true; production_eligible: false; personal_tools_available: true;
  eligible: boolean; reason: string; termId: string | null; revision: number;
  profile: "T10" | "P50" | null; startsAt: string | null; endsAt: string | null;
  successfulEffects: number; unresolvedEffects: number; leases: number;
  settledPbt: number; heldPbt: number; model: typeof HOSTED_BUDGET_MODEL;
  limits: typeof HOSTED_LIMITS.T10 | typeof HOSTED_LIMITS.P50 | null;
  units: HostedResourceUnits;
};
