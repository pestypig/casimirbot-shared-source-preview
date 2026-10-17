import {
  CIVILIZATION_CLAIM_TIERS,
  type CivilizationClaimTierV1,
} from "./civilization-bounds-roadmap.v1";

export const CIVILIZATION_TRAVERSABILITY_ATLAS_ARTIFACT_ID =
  "civilization_traversability_atlas" as const;

export const CIVILIZATION_TRAVERSABILITY_ATLAS_SCHEMA_VERSION =
  "civilization_traversability_atlas/v1" as const;

export const CIVILIZATION_TRAVERSABILITY_FIELD_LAYER_KINDS = [
  "solar_irradiance",
  "seismic_activity",
  "atmospheric_wind",
  "ocean_current",
  "hydrology",
  "water_level",
  "tide_height",
  "terrain",
  "tectonic_hazard",
  "weather_alert",
  "ecological_connectivity",
  "fungal_biodiversity",
  "climate_hazard",
] as const;

export const CIVILIZATION_TRAVERSABILITY_INFRASTRUCTURE_NODE_KINDS = [
  "airport",
  "port",
  "road_junction",
  "rail_junction",
  "border_crossing",
  "canal",
  "pipeline_terminal",
  "submarine_cable_landing",
  "grid_interconnect",
  "river_terminal",
  "ecological_region",
  "dust_source_region",
  "deposition_region",
] as const;

export const CIVILIZATION_TRAVERSABILITY_ROUTE_MODES = [
  "air",
  "sea",
  "road",
  "rail",
  "river",
  "pipeline",
  "submarine_cable",
  "atmospheric",
  "ecological",
] as const;

export const CIVILIZATION_TRAVERSABILITY_ROUTE_REALIZATIONS = [
  "geodesic_lower_bound",
  "modeled_candidate",
  "scheduled",
  "observed",
  "historical",
] as const;

export const CIVILIZATION_TRAVERSABILITY_ROUTE_OBJECTIVES = [
  "fastest",
  "lowest_energy",
  "highest_capacity",
  "highest_reliability",
  "lowest_hazard_exposure",
  "lowest_permission_risk",
  "best_observed",
] as const;

export const CIVILIZATION_TRAVERSABILITY_CONSTRAINT_KINDS = [
  "terrain",
  "weather",
  "current",
  "hazard",
  "capacity",
  "border",
  "airspace",
  "treaty",
  "maintenance",
  "missing_observation",
] as const;

export const CIVILIZATION_TRAVERSABILITY_CONSTRAINT_EFFECTS = [
  "enables",
  "raises_cost",
  "reduces_capacity",
  "blocks",
  "unknown",
] as const;

export type CivilizationTraversabilityFieldLayerKindV1 =
  (typeof CIVILIZATION_TRAVERSABILITY_FIELD_LAYER_KINDS)[number];
export type CivilizationTraversabilityInfrastructureNodeKindV1 =
  (typeof CIVILIZATION_TRAVERSABILITY_INFRASTRUCTURE_NODE_KINDS)[number];
export type CivilizationTraversabilityRouteModeV1 =
  (typeof CIVILIZATION_TRAVERSABILITY_ROUTE_MODES)[number];
export type CivilizationTraversabilityRouteRealizationV1 =
  (typeof CIVILIZATION_TRAVERSABILITY_ROUTE_REALIZATIONS)[number];
export type CivilizationTraversabilityRouteObjectiveV1 =
  (typeof CIVILIZATION_TRAVERSABILITY_ROUTE_OBJECTIVES)[number];
export type CivilizationTraversabilityConstraintKindV1 =
  (typeof CIVILIZATION_TRAVERSABILITY_CONSTRAINT_KINDS)[number];
export type CivilizationTraversabilityConstraintEffectV1 =
  (typeof CIVILIZATION_TRAVERSABILITY_CONSTRAINT_EFFECTS)[number];

export type CivilizationTraversabilityGeometryRefV1 = {
  refId: string;
  kind: "point" | "polyline" | "polygon" | "raster" | "external";
  description: string;
  sourceRefs: string[];
};

export type CivilizationTraversabilityTemporalFrameV1 = {
  observedAt: string;
  validFrom?: string;
  validTo?: string;
  cadence: "static" | "near_real_time" | "hourly" | "daily" | "seasonal" | "annual";
};

export type CivilizationFieldLayerV1 = {
  fieldLayerId: string;
  kind: CivilizationTraversabilityFieldLayerKindV1;
  label: string;
  temporalFrame: CivilizationTraversabilityTemporalFrameV1;
  geometryRef: CivilizationTraversabilityGeometryRefV1;
  units?: string;
  resolution?: string;
  confidence: number | null;
  confidenceMethod?: string;
  uncertainty?: number;
  uncertaintyMethod?: string;
  evidenceRefs: string[];
  missingEvidence: string[];
  claimTier: CivilizationClaimTierV1;
};

export type CivilizationInfrastructureNodeV1 = {
  nodeId: string;
  kind: CivilizationTraversabilityInfrastructureNodeKindV1;
  label: string;
  systemId?: string;
  countryIso3?: string;
  coordinates?: { lat: number; lon: number } | null;
  geometryRef?: CivilizationTraversabilityGeometryRefV1;
  capacityLabel?: string;
  activeFieldLayerIds: string[];
  evidenceRefs: string[];
  missingEvidence: string[];
  confidence: number;
  claimTier: CivilizationClaimTierV1;
};

/** A mapped network way is evidence of a source assertion, not verified operation. */
export type CivilizationInfrastructureEdgeV1 = {
  edgeId: string;
  networkKind: string;
  label: string;
  geometryRef: CivilizationTraversabilityGeometryRefV1;
  coordinates: Array<{ lat: number; lon: number }>;
  nodeRefs: string[];
  sourceAttributes: Record<string, string>;
  sourceRecordUrl: string;
  sourceEditedAt?: string;
  fetchedAt: string;
  assertionKind: "mapped_in_source";
  operationalStatus: "unknown";
  capacity: null;
  permissionStatus: "unknown";
  evidenceRefs: string[];
  missingEvidence: string[];
  claimTier: CivilizationClaimTierV1;
};

/** A provider's administrative depiction; sovereignty and disputes require separate evidence. */
export type CivilizationBoundaryClaimV1 = {
  boundaryId: string;
  countryIso3: string;
  label: string;
  geometryRef: CivilizationTraversabilityGeometryRefV1;
  /** GeoJSON MultiPolygon hierarchy, with positions normalized to named WGS84 coordinates. */
  polygons: Array<Array<Array<{ lat: number; lon: number }>>>;
  boundaryKind: "administrative_coverage";
  claimant: null;
  sovereigntyStatus: "not_assessed";
  disputeStatus: "not_assessed";
  sourceRecordUrl: string;
  sourceDatasetId: string;
  sourceVersion: string;
  sourceYearRepresented: string;
  sourceName: string;
  sourceLicense: string;
  sourceIntegratedAt: string | null;
  sourceBuildAt: string | null;
  fetchedAt: string;
  evidenceRefs: string[];
  missingEvidence: string[];
  claimTier: CivilizationClaimTierV1;
};

/** Natural Earth editorial linework, including claim and reference categories. */
export type CivilizationBoundaryLineAssertionV1 = {
  lineId: string;
  label: string;
  recordCategory: "Claim boundary" | "Breakaway" | "Reference line" | "Elusive frontier";
  geometryRef: CivilizationTraversabilityGeometryRefV1;
  lineParts: Array<Array<{ lat: number; lon: number }>>;
  sourceClaimLabel: string | null;
  sourceComment: string | null;
  claimant: null;
  adjacentAdministrativeIso3: [string | null, string | null];
  viewpointClassifications: Record<string, string>;
  sourceRecordUrl: string;
  sourceDatasetId: string;
  sourceVersion: string;
  sourceRevisionAt: string;
  sourceEffectiveAt: null;
  fetchedAt: string;
  sourceLicense: "Public Domain";
  evidenceRefs: string[];
  missingEvidence: string[];
  claimTier: CivilizationClaimTierV1;
};

/** Generalized Natural Earth river/lake centerline depiction, not a hydrological survey. */
export type CivilizationHydrographicLineV1 = {
  lineId: string;
  label: string;
  featureKind: "river" | "lake_centerline";
  geometryRef: CivilizationTraversabilityGeometryRefV1;
  lineParts: Array<Array<{ lat: number; lon: number }>>;
  sourceFeatureId: string;
  sourceDatasetId: string;
  sourceVersion: string;
  sourceArchiveSha256: string;
  sourceRecordUrl: string;
  sourceSnapshotAcquiredAt: string;
  sourceEffectiveAt: null;
  fetchedAt: string;
  sourceLicense: "Public Domain";
  scaleRank: number;
  navigabilityStatus: "unknown";
  dischargeStatus: "unknown";
  seasonalStatus: "unknown";
  evidenceRefs: string[];
  missingEvidence: string[];
  claimTier: CivilizationClaimTierV1;
};

export type CivilizationMappedNetworkRouteSegmentV1 = {
  edgeId: string;
  networkKind: string;
  fromNodeRef: string;
  toNodeRef: string;
  distanceKm: number;
  sourceRecordUrl: string;
  evidenceRefs: string[];
};

/** A path through mapped topology, without an assertion of usable transport. */
export type CivilizationMappedNetworkRouteCandidateV1 = {
  candidateId: string;
  optionIndex: number;
  generation: "shortest_for_snapped_pair" | "detour_excluding_mapped_way";
  excludedMappedWayId: string | null;
  objective: "shortest_mapped_length";
  pathKind: "topological_alignment";
  evaluatedAt: string;
  requestedOrigin: { lat: number; lon: number };
  requestedDestination: { lat: number; lon: number };
  snappedOriginNodeRef: string;
  snappedDestinationNodeRef: string;
  originSnapDistanceKm: number;
  destinationSnapDistanceKm: number;
  distanceKm: number;
  selectionCostKm: number;
  networkKinds: string[];
  segments: CivilizationMappedNetworkRouteSegmentV1[];
  pipelineTagReview?: {
    status: "not_applicable" | "all_untagged" | "partially_tagged" | "all_tagged_same_text" | "tagged_values_differ";
    wayCount: number;
    untaggedWayCount: number;
    distinctSubstanceTags: string[];
    ways: Array<{ edgeId: string; sourceRecordUrl: string; substanceTag: string | null }>;
    productCompatibility: "unverified";
    flowDirection: "unverified";
  };
  coordinates: Array<{ lat: number; lon: number }>;
  operationalStatus: "unknown";
  capacityStatus: "unknown";
  physicalFeasibility: "unknown";
  jurisdictionalPermission: "unknown";
  hazardAssessment: "unknown";
  evidenceRefs: string[];
  missingEvidence: string[];
  claimTier: CivilizationClaimTierV1;
};

/** An official alert returned for a queried point; the point is not the alert footprint. */
export type CivilizationNaturalHazardNoticeV1 = {
  noticeId: string;
  noticeKind: "official_alert_notice";
  sourceKind: "nws_active_alert";
  label: string;
  queryPoint: { lat: number; lon: number };
  geometryRef: CivilizationTraversabilityGeometryRefV1;
  sourceRecordUrl: string;
  sentAt: string | null;
  effectiveAt: string | null;
  expiresAt: string | null;
  fetchedAt: string;
  severity: string | null;
  certainty: string | null;
  urgency: string | null;
  areaDescription: string | null;
  routeImpact: "not_assessed";
  evidenceRefs: string[];
  missingEvidence: string[];
  claimTier: CivilizationClaimTierV1;
};

export type CivilizationRouteCandidateConstraintV1 = {
  kind: CivilizationTraversabilityConstraintKindV1;
  refId: string;
  effect: CivilizationTraversabilityConstraintEffectV1;
};

export type CivilizationRouteCandidateV1 = {
  routeId: string;
  dependencyEdgeId: string;
  label: string;
  mode: CivilizationTraversabilityRouteModeV1;
  realization: CivilizationTraversabilityRouteRealizationV1;
  geometryRef: CivilizationTraversabilityGeometryRefV1;
  transferNodeIds: string[];
  activeFieldLayerIds: string[];
  metrics: {
    distanceKm?: number;
    durationHours?: number;
    capacity?: number;
    energyCost?: number;
    reliability?: number;
    emissions?: number;
  };
  feasibility: {
    physical: number | null;
    infrastructure: number | null;
    jurisdictional: number | null;
    operationalEvidence: number | null;
  };
  constraints: CivilizationRouteCandidateConstraintV1[];
  confidence: number;
  uncertainty?: number;
  claimTier: CivilizationClaimTierV1;
  evidenceRefs: string[];
  missingEvidence: string[];
  theoryBadgeIds?: string[];
  moralNodeIds?: string[];
};

export type CivilizationObservedFlowV1 = {
  flowId: string;
  routeId: string;
  label: string;
  observedAt: string;
  quantityLabel: string;
  sourceRefs: string[];
  confidence: number;
  evidenceRefs: string[];
  missingEvidence: string[];
  claimTier: CivilizationClaimTierV1;
};

export type CivilizationTraversabilityContextV1 = {
  dependencyEdgeIds: string[];
  routeCandidateIds: string[];
  activeFieldLayerIds: string[];
  infrastructureNodeIds: string[];
  limitingFactors: string[];
  unavailableAlternatives: string[];
  theoryBadgeIds: string[];
  moralNodeIds: string[];
  evidenceRefs: string[];
  missingEvidence: string[];
  routeObjective?: CivilizationTraversabilityRouteObjectiveV1;
  timeCursor?: string;
};

export type CivilizationTraversabilityAtlasAuthorityV1 = {
  assistant_answer: false;
  raw_content_included: false;
  terminal_eligible: false;
  context_role: "tool_evidence";
  ask_context_policy: "evidence_only";
  agent_executable: false;
  prediction_finality: false;
  policy_finality: false;
  moral_finality: false;
  execution_permission: false;
};

export type CivilizationTraversabilityAtlasV1 = {
  artifactId: typeof CIVILIZATION_TRAVERSABILITY_ATLAS_ARTIFACT_ID;
  schemaVersion: typeof CIVILIZATION_TRAVERSABILITY_ATLAS_SCHEMA_VERSION;
  generatedAt: string;
  atlasId: string;
  scenarioId: string;
  title: string;
  temporalFrame: CivilizationTraversabilityTemporalFrameV1;
  fieldLayers: CivilizationFieldLayerV1[];
  infrastructureNodes: CivilizationInfrastructureNodeV1[];
  infrastructureEdges?: CivilizationInfrastructureEdgeV1[];
  boundaryClaims?: CivilizationBoundaryClaimV1[];
  boundaryLineAssertions?: CivilizationBoundaryLineAssertionV1[];
  hydrographicLines?: CivilizationHydrographicLineV1[];
  mappedNetworkRouteCandidates?: CivilizationMappedNetworkRouteCandidateV1[];
  naturalHazardNotices?: CivilizationNaturalHazardNoticeV1[];
  routeCandidates: CivilizationRouteCandidateV1[];
  observedFlows: CivilizationObservedFlowV1[];
  authority: CivilizationTraversabilityAtlasAuthorityV1;
};

export type BuildCivilizationTraversabilityAtlasInput = Omit<
  CivilizationTraversabilityAtlasV1,
  "artifactId" | "schemaVersion" | "generatedAt" | "atlasId" | "authority"
> & {
  generatedAt?: string;
  atlasId?: string;
};

const AUTHORITY: CivilizationTraversabilityAtlasAuthorityV1 = {
  assistant_answer: false,
  raw_content_included: false,
  terminal_eligible: false,
  context_role: "tool_evidence",
  ask_context_policy: "evidence_only",
  agent_executable: false,
  prediction_finality: false,
  policy_finality: false,
  moral_finality: false,
  execution_permission: false,
};

const FORBIDDEN_TRAVERSABILITY_PATTERNS = [
  /\bbest route guaranteed\b/i,
  /\bpolicy finality\b/i,
  /\bprediction guaranteed\b/i,
  /\bexecution permission\b/i,
  /\bterminal authority\b/i,
  /\bmorally certain\b/i,
] as const;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((entry) => typeof entry === "string");

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const includes = <T extends readonly string[]>(
  items: T,
  value: unknown,
): value is T[number] => typeof value === "string" && items.includes(value);

function newAtlasId(): string {
  return `civilization-traversability:${Date.now().toString(36)}:${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

function validateStringArray(prefix: string, value: unknown, issues: string[]): void {
  if (!isStringArray(value)) issues.push(`${prefix} must be an array of strings`);
}

function validateScore(prefix: string, value: unknown, issues: string[]): void {
  if (!isFiniteNumber(value)) {
    issues.push(`${prefix} must be a finite number`);
  } else if (value < 0 || value > 1) {
    issues.push(`${prefix} must be between 0 and 1`);
  }
}

function validateOptionalScore(prefix: string, value: unknown, issues: string[]): void {
  if (value !== undefined) validateScore(prefix, value, issues);
}

function validateGeometryRef(prefix: string, value: unknown, issues: string[]): void {
  if (!isRecord(value)) {
    issues.push(`${prefix} must be an object`);
    return;
  }
  if (!isNonEmptyString(value.refId)) issues.push(`${prefix}.refId must be a non-empty string`);
  if (!["point", "polyline", "polygon", "raster", "external"].includes(String(value.kind))) {
    issues.push(`${prefix}.kind is invalid`);
  }
  if (!isNonEmptyString(value.description)) {
    issues.push(`${prefix}.description must be a non-empty string`);
  }
  validateStringArray(`${prefix}.sourceRefs`, value.sourceRefs, issues);
}

function validateTemporalFrame(prefix: string, value: unknown, issues: string[]): void {
  if (!isRecord(value)) {
    issues.push(`${prefix} must be an object`);
    return;
  }
  if (!isNonEmptyString(value.observedAt)) issues.push(`${prefix}.observedAt must be a non-empty string`);
  if (value.validFrom !== undefined && !isNonEmptyString(value.validFrom)) {
    issues.push(`${prefix}.validFrom must be a non-empty string when present`);
  }
  if (value.validTo !== undefined && !isNonEmptyString(value.validTo)) {
    issues.push(`${prefix}.validTo must be a non-empty string when present`);
  }
  if (!["static", "near_real_time", "hourly", "daily", "seasonal", "annual"].includes(String(value.cadence))) {
    issues.push(`${prefix}.cadence is invalid`);
  }
}

function validateClaimTier(prefix: string, value: unknown, issues: string[]): void {
  if (!includes(CIVILIZATION_CLAIM_TIERS, value)) {
    issues.push(`${prefix} is invalid`);
  }
}

function validateFieldLayer(prefix: string, value: unknown, issues: string[]): void {
  if (!isRecord(value)) {
    issues.push(`${prefix} must be an object`);
    return;
  }
  for (const field of ["fieldLayerId", "label"] as const) {
    if (!isNonEmptyString(value[field])) issues.push(`${prefix}.${field} must be a non-empty string`);
  }
  if (!includes(CIVILIZATION_TRAVERSABILITY_FIELD_LAYER_KINDS, value.kind)) {
    issues.push(`${prefix}.kind is invalid`);
  }
  validateTemporalFrame(`${prefix}.temporalFrame`, value.temporalFrame, issues);
  validateGeometryRef(`${prefix}.geometryRef`, value.geometryRef, issues);
  if (value.confidence !== null) validateScore(`${prefix}.confidence`, value.confidence, issues);
  validateOptionalScore(`${prefix}.uncertainty`, value.uncertainty, issues);
  for (const field of ["confidenceMethod", "uncertaintyMethod"] as const) {
    if (value[field] !== undefined && !isNonEmptyString(value[field])) {
      issues.push(`${prefix}.${field} must be a non-empty string when present`);
    }
  }
  validateStringArray(`${prefix}.evidenceRefs`, value.evidenceRefs, issues);
  validateStringArray(`${prefix}.missingEvidence`, value.missingEvidence, issues);
  validateClaimTier(`${prefix}.claimTier`, value.claimTier, issues);
}

function validateInfrastructureNode(prefix: string, value: unknown, issues: string[]): void {
  if (!isRecord(value)) {
    issues.push(`${prefix} must be an object`);
    return;
  }
  for (const field of ["nodeId", "label"] as const) {
    if (!isNonEmptyString(value[field])) issues.push(`${prefix}.${field} must be a non-empty string`);
  }
  if (!includes(CIVILIZATION_TRAVERSABILITY_INFRASTRUCTURE_NODE_KINDS, value.kind)) {
    issues.push(`${prefix}.kind is invalid`);
  }
  if (value.geometryRef !== undefined) validateGeometryRef(`${prefix}.geometryRef`, value.geometryRef, issues);
  validateStringArray(`${prefix}.activeFieldLayerIds`, value.activeFieldLayerIds, issues);
  validateStringArray(`${prefix}.evidenceRefs`, value.evidenceRefs, issues);
  validateStringArray(`${prefix}.missingEvidence`, value.missingEvidence, issues);
  validateScore(`${prefix}.confidence`, value.confidence, issues);
  validateClaimTier(`${prefix}.claimTier`, value.claimTier, issues);
}

function validateInfrastructureEdge(prefix: string, value: unknown, issues: string[]): void {
  if (!isRecord(value)) {
    issues.push(`${prefix} must be an object`);
    return;
  }
  for (const field of ["edgeId", "networkKind", "label", "sourceRecordUrl", "fetchedAt"] as const) {
    if (!isNonEmptyString(value[field])) issues.push(`${prefix}.${field} must be a non-empty string`);
  }
  if (value.sourceEditedAt !== undefined && !isNonEmptyString(value.sourceEditedAt)) {
    issues.push(`${prefix}.sourceEditedAt must be a non-empty string when present`);
  }
  validateGeometryRef(`${prefix}.geometryRef`, value.geometryRef, issues);
  if (!Array.isArray(value.coordinates) || value.coordinates.length < 2) {
    issues.push(`${prefix}.coordinates must contain at least two positions`);
  } else {
    value.coordinates.forEach((coordinate, index) => {
      if (!isRecord(coordinate) || !isFiniteNumber(coordinate.lat) ||
          !isFiniteNumber(coordinate.lon) || coordinate.lat < -90 ||
          coordinate.lat > 90 || coordinate.lon < -180 || coordinate.lon > 180) {
        issues.push(`${prefix}.coordinates[${index}] must be a valid WGS84 position`);
      }
    });
  }
  validateStringArray(`${prefix}.nodeRefs`, value.nodeRefs, issues);
  if (!isRecord(value.sourceAttributes) ||
      Object.values(value.sourceAttributes).some((entry) => typeof entry !== "string")) {
    issues.push(`${prefix}.sourceAttributes must contain string values`);
  }
  validateStringArray(`${prefix}.evidenceRefs`, value.evidenceRefs, issues);
  validateStringArray(`${prefix}.missingEvidence`, value.missingEvidence, issues);
  if (value.assertionKind !== "mapped_in_source") issues.push(`${prefix}.assertionKind is invalid`);
  if (value.operationalStatus !== "unknown") issues.push(`${prefix}.operationalStatus must remain unknown`);
  if (value.capacity !== null) issues.push(`${prefix}.capacity must remain null`);
  if (value.permissionStatus !== "unknown") issues.push(`${prefix}.permissionStatus must remain unknown`);
  validateClaimTier(`${prefix}.claimTier`, value.claimTier, issues);
}

function validateBoundaryClaim(prefix: string, value: unknown, issues: string[]): void {
  if (!isRecord(value)) {
    issues.push(`${prefix} must be an object`);
    return;
  }
  for (const field of ["boundaryId", "countryIso3", "label", "sourceRecordUrl",
    "sourceDatasetId", "sourceVersion", "sourceYearRepresented", "sourceName",
    "sourceLicense", "fetchedAt"] as const) {
    if (!isNonEmptyString(value[field])) issues.push(`${prefix}.${field} must be a non-empty string`);
  }
  validateGeometryRef(`${prefix}.geometryRef`, value.geometryRef, issues);
  if (!Array.isArray(value.polygons) || value.polygons.length === 0) {
    issues.push(`${prefix}.polygons must contain at least one polygon`);
  } else {
    value.polygons.forEach((polygon, polygonIndex) => {
      if (!Array.isArray(polygon) || polygon.length === 0) {
        issues.push(`${prefix}.polygons[${polygonIndex}] must contain at least one ring`);
        return;
      }
      polygon.forEach((ring, ringIndex) => {
        if (!Array.isArray(ring) || ring.length < 4) {
          issues.push(`${prefix}.polygons[${polygonIndex}][${ringIndex}] must contain at least four positions`);
          return;
        }
        ring.forEach((point, pointIndex) => {
          if (!isRecord(point) || !isFiniteNumber(point.lat) || !isFiniteNumber(point.lon) ||
              point.lat < -90 || point.lat > 90 || point.lon < -180 || point.lon > 180) {
            issues.push(`${prefix}.polygons[${polygonIndex}][${ringIndex}][${pointIndex}] must be a WGS84 position`);
          }
        });
      });
    });
  }
  if (value.boundaryKind !== "administrative_coverage") issues.push(`${prefix}.boundaryKind is invalid`);
  if (value.claimant !== null) issues.push(`${prefix}.claimant must remain null`);
  if (value.sovereigntyStatus !== "not_assessed") issues.push(`${prefix}.sovereigntyStatus must remain not_assessed`);
  if (value.disputeStatus !== "not_assessed") issues.push(`${prefix}.disputeStatus must remain not_assessed`);
  for (const field of ["sourceIntegratedAt", "sourceBuildAt"] as const) {
    if (value[field] !== null && !isNonEmptyString(value[field])) {
      issues.push(`${prefix}.${field} must be a date string or null`);
    }
  }
  validateStringArray(`${prefix}.evidenceRefs`, value.evidenceRefs, issues);
  validateStringArray(`${prefix}.missingEvidence`, value.missingEvidence, issues);
  validateClaimTier(`${prefix}.claimTier`, value.claimTier, issues);
}

function validateBoundaryLineAssertion(prefix: string, value: unknown, issues: string[]): void {
  if (!isRecord(value)) {
    issues.push(`${prefix} must be an object`);
    return;
  }
  for (const field of ["lineId", "label", "sourceRecordUrl", "sourceDatasetId",
    "sourceVersion", "sourceRevisionAt", "fetchedAt"] as const) {
    if (!isNonEmptyString(value[field])) issues.push(`${prefix}.${field} must be a non-empty string`);
  }
  if (!["Claim boundary", "Breakaway", "Reference line", "Elusive frontier"].includes(String(value.recordCategory))) {
    issues.push(`${prefix}.recordCategory is invalid`);
  }
  validateGeometryRef(`${prefix}.geometryRef`, value.geometryRef, issues);
  if (!Array.isArray(value.lineParts) || value.lineParts.length === 0) {
    issues.push(`${prefix}.lineParts must contain at least one line`);
  } else {
    value.lineParts.forEach((part, partIndex) => {
      if (!Array.isArray(part) || part.length < 2) {
        issues.push(`${prefix}.lineParts[${partIndex}] must contain at least two positions`);
        return;
      }
      part.forEach((point, pointIndex) => {
        if (!isRecord(point) || !isFiniteNumber(point.lat) || !isFiniteNumber(point.lon) ||
            point.lat < -90 || point.lat > 90 || point.lon < -180 || point.lon > 180) {
          issues.push(`${prefix}.lineParts[${partIndex}][${pointIndex}] must be WGS84`);
        }
      });
    });
  }
  if (value.sourceClaimLabel !== null && !isNonEmptyString(value.sourceClaimLabel)) {
    issues.push(`${prefix}.sourceClaimLabel must be a string or null`);
  }
  if (value.sourceComment !== null && !isNonEmptyString(value.sourceComment)) {
    issues.push(`${prefix}.sourceComment must be a string or null`);
  }
  if (value.claimant !== null) issues.push(`${prefix}.claimant must remain null`);
  if (!Array.isArray(value.adjacentAdministrativeIso3) || value.adjacentAdministrativeIso3.length !== 2 ||
      value.adjacentAdministrativeIso3.some((entry) => entry !== null && !isNonEmptyString(entry))) {
    issues.push(`${prefix}.adjacentAdministrativeIso3 must be a two-place tuple`);
  }
  if (!isRecord(value.viewpointClassifications) ||
      Object.values(value.viewpointClassifications).some((entry) => typeof entry !== "string")) {
    issues.push(`${prefix}.viewpointClassifications must contain string values`);
  }
  if (value.sourceEffectiveAt !== null) issues.push(`${prefix}.sourceEffectiveAt must remain null`);
  if (value.sourceLicense !== "Public Domain") issues.push(`${prefix}.sourceLicense is invalid`);
  validateStringArray(`${prefix}.evidenceRefs`, value.evidenceRefs, issues);
  validateStringArray(`${prefix}.missingEvidence`, value.missingEvidence, issues);
  validateClaimTier(`${prefix}.claimTier`, value.claimTier, issues);
}

function validateHydrographicLine(prefix: string, value: unknown, issues: string[]): void {
  if (!isRecord(value)) {
    issues.push(`${prefix} must be an object`);
    return;
  }
  for (const field of ["lineId", "label", "sourceFeatureId", "sourceDatasetId",
    "sourceVersion", "sourceArchiveSha256", "sourceRecordUrl", "sourceSnapshotAcquiredAt",
    "fetchedAt"] as const) {
    if (!isNonEmptyString(value[field])) issues.push(`${prefix}.${field} must be non-empty`);
  }
  if (value.featureKind !== "river" && value.featureKind !== "lake_centerline") {
    issues.push(`${prefix}.featureKind is invalid`);
  }
  validateGeometryRef(`${prefix}.geometryRef`, value.geometryRef, issues);
  if (!Array.isArray(value.lineParts) || value.lineParts.length === 0) {
    issues.push(`${prefix}.lineParts must contain at least one line`);
  } else {
    value.lineParts.forEach((part, partIndex) => {
      if (!Array.isArray(part) || part.length < 2) {
        issues.push(`${prefix}.lineParts[${partIndex}] must contain at least two positions`);
        return;
      }
      part.forEach((point, pointIndex) => {
        if (!isRecord(point) || !isFiniteNumber(point.lat) || !isFiniteNumber(point.lon) ||
            point.lat < -90 || point.lat > 90 || point.lon < -180 || point.lon > 180) {
          issues.push(`${prefix}.lineParts[${partIndex}][${pointIndex}] must be WGS84`);
        }
      });
    });
  }
  if (!Number.isInteger(value.scaleRank) || (value.scaleRank as number) < 0) {
    issues.push(`${prefix}.scaleRank must be a nonnegative integer`);
  }
  if (value.sourceEffectiveAt !== null) issues.push(`${prefix}.sourceEffectiveAt must remain null`);
  if (value.sourceLicense !== "Public Domain") issues.push(`${prefix}.sourceLicense is invalid`);
  for (const field of ["navigabilityStatus", "dischargeStatus", "seasonalStatus"] as const) {
    if (value[field] !== "unknown") issues.push(`${prefix}.${field} must remain unknown`);
  }
  validateStringArray(`${prefix}.evidenceRefs`, value.evidenceRefs, issues);
  validateStringArray(`${prefix}.missingEvidence`, value.missingEvidence, issues);
  validateClaimTier(`${prefix}.claimTier`, value.claimTier, issues);
}

function validateMappedNetworkRouteCandidate(prefix: string, value: unknown, issues: string[]): void {
  if (!isRecord(value)) {
    issues.push(`${prefix} must be an object`);
    return;
  }
  for (const field of ["candidateId", "evaluatedAt", "snappedOriginNodeRef", "snappedDestinationNodeRef"] as const) {
    if (!isNonEmptyString(value[field])) issues.push(`${prefix}.${field} must be a non-empty string`);
  }
  if (!Number.isInteger(value.optionIndex) || (value.optionIndex as number) < 1) {
    issues.push(`${prefix}.optionIndex must be a positive integer`);
  }
  if (value.generation !== "shortest_for_snapped_pair" && value.generation !== "detour_excluding_mapped_way") {
    issues.push(`${prefix}.generation is invalid`);
  }
  if (value.excludedMappedWayId !== null && !isNonEmptyString(value.excludedMappedWayId)) {
    issues.push(`${prefix}.excludedMappedWayId must be a string or null`);
  }
  if (value.generation === "shortest_for_snapped_pair" && value.excludedMappedWayId !== null) {
    issues.push(`${prefix}.excludedMappedWayId must be null for a shortest alignment`);
  }
  if (value.generation === "detour_excluding_mapped_way" && !isNonEmptyString(value.excludedMappedWayId)) {
    issues.push(`${prefix}.excludedMappedWayId is required for a detour`);
  }
  if (value.objective !== "shortest_mapped_length") issues.push(`${prefix}.objective is invalid`);
  if (value.pathKind !== "topological_alignment") issues.push(`${prefix}.pathKind is invalid`);
  for (const field of ["requestedOrigin", "requestedDestination"] as const) {
    const point = value[field];
    if (!isRecord(point) || !isFiniteNumber(point.lat) || !isFiniteNumber(point.lon) ||
        point.lat < -90 || point.lat > 90 || point.lon < -180 || point.lon > 180) {
      issues.push(`${prefix}.${field} must be a WGS84 position`);
    }
  }
  for (const field of ["originSnapDistanceKm", "destinationSnapDistanceKm", "distanceKm", "selectionCostKm"] as const) {
    if (!isFiniteNumber(value[field]) || value[field] < 0) issues.push(`${prefix}.${field} must be non-negative`);
  }
  validateStringArray(`${prefix}.networkKinds`, value.networkKinds, issues);
  if (value.pipelineTagReview !== undefined) {
    const review = value.pipelineTagReview;
    if (!isRecord(review) || !["not_applicable", "all_untagged", "partially_tagged", "all_tagged_same_text", "tagged_values_differ"].includes(String(review.status)) ||
        !Number.isInteger(review.wayCount) || (review.wayCount as number) < 0 ||
        !Number.isInteger(review.untaggedWayCount) || (review.untaggedWayCount as number) < 0 ||
        review.productCompatibility !== "unverified" || review.flowDirection !== "unverified") {
      issues.push(`${prefix}.pipelineTagReview is invalid`);
    } else {
      validateStringArray(`${prefix}.pipelineTagReview.distinctSubstanceTags`, review.distinctSubstanceTags, issues);
      if (!Array.isArray(review.ways) || review.ways.length !== review.wayCount ||
          (review.untaggedWayCount as number) > (review.wayCount as number)) {
        issues.push(`${prefix}.pipelineTagReview.ways must match the way count`);
      } else review.ways.forEach((way, index) => {
        if (!isRecord(way) || !isNonEmptyString(way.edgeId) || !isNonEmptyString(way.sourceRecordUrl) ||
            (way.substanceTag !== null && !isNonEmptyString(way.substanceTag))) {
          issues.push(`${prefix}.pipelineTagReview.ways[${index}] is invalid`);
        }
      });
    }
  }
  if (!Array.isArray(value.segments) || value.segments.length === 0) {
    issues.push(`${prefix}.segments must contain at least one segment`);
  } else {
    value.segments.forEach((segment, index) => {
      if (!isRecord(segment)) {
        issues.push(`${prefix}.segments[${index}] must be an object`);
        return;
      }
      for (const field of ["edgeId", "networkKind", "fromNodeRef", "toNodeRef", "sourceRecordUrl"] as const) {
        if (!isNonEmptyString(segment[field])) issues.push(`${prefix}.segments[${index}].${field} must be a non-empty string`);
      }
      if (!isFiniteNumber(segment.distanceKm) || segment.distanceKm < 0) {
        issues.push(`${prefix}.segments[${index}].distanceKm must be non-negative`);
      }
      validateStringArray(`${prefix}.segments[${index}].evidenceRefs`, segment.evidenceRefs, issues);
    });
  }
  if (!Array.isArray(value.coordinates) || value.coordinates.length < 2) {
    issues.push(`${prefix}.coordinates must contain at least two positions`);
  } else {
    value.coordinates.forEach((point, index) => {
      if (!isRecord(point) || !isFiniteNumber(point.lat) || !isFiniteNumber(point.lon) ||
          point.lat < -90 || point.lat > 90 || point.lon < -180 || point.lon > 180) {
        issues.push(`${prefix}.coordinates[${index}] must be a WGS84 position`);
      }
    });
  }
  for (const field of ["operationalStatus", "capacityStatus", "physicalFeasibility",
    "jurisdictionalPermission", "hazardAssessment"] as const) {
    if (value[field] !== "unknown") issues.push(`${prefix}.${field} must remain unknown`);
  }
  validateStringArray(`${prefix}.evidenceRefs`, value.evidenceRefs, issues);
  validateStringArray(`${prefix}.missingEvidence`, value.missingEvidence, issues);
  validateClaimTier(`${prefix}.claimTier`, value.claimTier, issues);
}

function validateNaturalHazardNotice(prefix: string, value: unknown, issues: string[]): void {
  if (!isRecord(value)) {
    issues.push(`${prefix} must be an object`);
    return;
  }
  for (const field of ["noticeId", "label", "sourceRecordUrl", "fetchedAt"] as const) {
    if (!isNonEmptyString(value[field])) issues.push(`${prefix}.${field} must be a non-empty string`);
  }
  if (value.noticeKind !== "official_alert_notice") issues.push(`${prefix}.noticeKind is invalid`);
  if (value.sourceKind !== "nws_active_alert") issues.push(`${prefix}.sourceKind is invalid`);
  const point = value.queryPoint;
  if (!isRecord(point) || !isFiniteNumber(point.lat) || !isFiniteNumber(point.lon) ||
      point.lat < -90 || point.lat > 90 || point.lon < -180 || point.lon > 180) {
    issues.push(`${prefix}.queryPoint must be a WGS84 position`);
  }
  validateGeometryRef(`${prefix}.geometryRef`, value.geometryRef, issues);
  for (const field of ["sentAt", "effectiveAt", "expiresAt", "severity", "certainty", "urgency", "areaDescription"] as const) {
    if (value[field] !== null && !isNonEmptyString(value[field])) {
      issues.push(`${prefix}.${field} must be a non-empty string or null`);
    }
  }
  if (value.routeImpact !== "not_assessed") issues.push(`${prefix}.routeImpact must remain not_assessed`);
  validateStringArray(`${prefix}.evidenceRefs`, value.evidenceRefs, issues);
  validateStringArray(`${prefix}.missingEvidence`, value.missingEvidence, issues);
  validateClaimTier(`${prefix}.claimTier`, value.claimTier, issues);
}

function validateRouteCandidate(prefix: string, value: unknown, issues: string[]): void {
  if (!isRecord(value)) {
    issues.push(`${prefix} must be an object`);
    return;
  }
  for (const field of ["routeId", "dependencyEdgeId", "label"] as const) {
    if (!isNonEmptyString(value[field])) issues.push(`${prefix}.${field} must be a non-empty string`);
  }
  if (!includes(CIVILIZATION_TRAVERSABILITY_ROUTE_MODES, value.mode)) issues.push(`${prefix}.mode is invalid`);
  if (!includes(CIVILIZATION_TRAVERSABILITY_ROUTE_REALIZATIONS, value.realization)) {
    issues.push(`${prefix}.realization is invalid`);
  }
  validateGeometryRef(`${prefix}.geometryRef`, value.geometryRef, issues);
  validateStringArray(`${prefix}.transferNodeIds`, value.transferNodeIds, issues);
  validateStringArray(`${prefix}.activeFieldLayerIds`, value.activeFieldLayerIds, issues);
  if (!isRecord(value.metrics)) issues.push(`${prefix}.metrics must be an object`);
  if (!isRecord(value.feasibility)) {
    issues.push(`${prefix}.feasibility must be an object`);
  } else {
    for (const field of ["physical", "infrastructure", "jurisdictional", "operationalEvidence"] as const) {
      const score = value.feasibility[field];
      if (score !== null) validateScore(`${prefix}.feasibility.${field}`, score, issues);
    }
  }
  if (!Array.isArray(value.constraints)) {
    issues.push(`${prefix}.constraints must be an array`);
  } else {
    value.constraints.forEach((constraint, index) => {
      if (!isRecord(constraint)) {
        issues.push(`${prefix}.constraints[${index}] must be an object`);
        return;
      }
      if (!includes(CIVILIZATION_TRAVERSABILITY_CONSTRAINT_KINDS, constraint.kind)) {
        issues.push(`${prefix}.constraints[${index}].kind is invalid`);
      }
      if (!isNonEmptyString(constraint.refId)) {
        issues.push(`${prefix}.constraints[${index}].refId must be a non-empty string`);
      }
      if (!includes(CIVILIZATION_TRAVERSABILITY_CONSTRAINT_EFFECTS, constraint.effect)) {
        issues.push(`${prefix}.constraints[${index}].effect is invalid`);
      }
    });
  }
  validateScore(`${prefix}.confidence`, value.confidence, issues);
  validateOptionalScore(`${prefix}.uncertainty`, value.uncertainty, issues);
  validateStringArray(`${prefix}.evidenceRefs`, value.evidenceRefs, issues);
  validateStringArray(`${prefix}.missingEvidence`, value.missingEvidence, issues);
  if (value.theoryBadgeIds !== undefined) validateStringArray(`${prefix}.theoryBadgeIds`, value.theoryBadgeIds, issues);
  if (value.moralNodeIds !== undefined) validateStringArray(`${prefix}.moralNodeIds`, value.moralNodeIds, issues);
  validateClaimTier(`${prefix}.claimTier`, value.claimTier, issues);
}

function validateObservedFlow(prefix: string, value: unknown, issues: string[]): void {
  if (!isRecord(value)) {
    issues.push(`${prefix} must be an object`);
    return;
  }
  for (const field of ["flowId", "routeId", "label", "observedAt", "quantityLabel"] as const) {
    if (!isNonEmptyString(value[field])) issues.push(`${prefix}.${field} must be a non-empty string`);
  }
  validateStringArray(`${prefix}.sourceRefs`, value.sourceRefs, issues);
  validateScore(`${prefix}.confidence`, value.confidence, issues);
  validateStringArray(`${prefix}.evidenceRefs`, value.evidenceRefs, issues);
  validateStringArray(`${prefix}.missingEvidence`, value.missingEvidence, issues);
  validateClaimTier(`${prefix}.claimTier`, value.claimTier, issues);
}

function validateAuthority(value: unknown, issues: string[]): void {
  if (!isRecord(value)) {
    issues.push("authority must be an object");
    return;
  }
  for (const field of [
    "assistant_answer",
    "raw_content_included",
    "terminal_eligible",
    "agent_executable",
    "prediction_finality",
    "policy_finality",
    "moral_finality",
    "execution_permission",
  ] as const) {
    if (value[field] !== false) issues.push(`authority.${field} must be false`);
  }
  if (value.context_role !== "tool_evidence") issues.push("authority.context_role must be tool_evidence");
  if (value.ask_context_policy !== "evidence_only") {
    issues.push("authority.ask_context_policy must be evidence_only");
  }
}

export function buildCivilizationTraversabilityAtlasV1(
  input: BuildCivilizationTraversabilityAtlasInput,
): CivilizationTraversabilityAtlasV1 {
  return {
    artifactId: CIVILIZATION_TRAVERSABILITY_ATLAS_ARTIFACT_ID,
    schemaVersion: CIVILIZATION_TRAVERSABILITY_ATLAS_SCHEMA_VERSION,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    atlasId: input.atlasId ?? newAtlasId(),
    scenarioId: input.scenarioId,
    title: input.title,
    temporalFrame: input.temporalFrame,
    fieldLayers: input.fieldLayers,
    infrastructureNodes: input.infrastructureNodes,
    ...(input.infrastructureEdges ? { infrastructureEdges: input.infrastructureEdges } : {}),
    ...(input.boundaryClaims ? { boundaryClaims: input.boundaryClaims } : {}),
    ...(input.boundaryLineAssertions ? { boundaryLineAssertions: input.boundaryLineAssertions } : {}),
    ...(input.hydrographicLines ? { hydrographicLines: input.hydrographicLines } : {}),
    ...(input.mappedNetworkRouteCandidates ? { mappedNetworkRouteCandidates: input.mappedNetworkRouteCandidates } : {}),
    ...(input.naturalHazardNotices ? { naturalHazardNotices: input.naturalHazardNotices } : {}),
    routeCandidates: input.routeCandidates,
    observedFlows: input.observedFlows,
    authority: { ...AUTHORITY },
  };
}

export function validateCivilizationTraversabilityAtlasV1(value: unknown): string[] {
  const issues: string[] = [];
  if (!isRecord(value)) return ["civilization traversability atlas must be an object"];
  if (value.artifactId !== CIVILIZATION_TRAVERSABILITY_ATLAS_ARTIFACT_ID) {
    issues.push(`artifactId must be ${CIVILIZATION_TRAVERSABILITY_ATLAS_ARTIFACT_ID}`);
  }
  if (value.schemaVersion !== CIVILIZATION_TRAVERSABILITY_ATLAS_SCHEMA_VERSION) {
    issues.push(`schemaVersion must be ${CIVILIZATION_TRAVERSABILITY_ATLAS_SCHEMA_VERSION}`);
  }
  for (const field of ["generatedAt", "atlasId", "scenarioId", "title"] as const) {
    if (!isNonEmptyString(value[field])) issues.push(`${field} must be a non-empty string`);
  }
  validateTemporalFrame("temporalFrame", value.temporalFrame, issues);
  if (!Array.isArray(value.fieldLayers)) {
    issues.push("fieldLayers must be an array");
  } else {
    value.fieldLayers.forEach((entry, index) => validateFieldLayer(`fieldLayers[${index}]`, entry, issues));
  }
  if (!Array.isArray(value.infrastructureNodes)) {
    issues.push("infrastructureNodes must be an array");
  } else {
    value.infrastructureNodes.forEach((entry, index) =>
      validateInfrastructureNode(`infrastructureNodes[${index}]`, entry, issues),
    );
  }
  if (value.infrastructureEdges !== undefined) {
    if (!Array.isArray(value.infrastructureEdges)) {
      issues.push("infrastructureEdges must be an array when present");
    } else {
      value.infrastructureEdges.forEach((entry, index) =>
        validateInfrastructureEdge(`infrastructureEdges[${index}]`, entry, issues),
      );
    }
  }
  if (value.boundaryClaims !== undefined) {
    if (!Array.isArray(value.boundaryClaims)) {
      issues.push("boundaryClaims must be an array when present");
    } else {
      value.boundaryClaims.forEach((entry, index) =>
        validateBoundaryClaim(`boundaryClaims[${index}]`, entry, issues),
      );
    }
  }
  if (value.boundaryLineAssertions !== undefined) {
    if (!Array.isArray(value.boundaryLineAssertions)) {
      issues.push("boundaryLineAssertions must be an array when present");
    } else {
      value.boundaryLineAssertions.forEach((entry, index) =>
        validateBoundaryLineAssertion(`boundaryLineAssertions[${index}]`, entry, issues),
      );
    }
  }
  if (value.hydrographicLines !== undefined) {
    if (!Array.isArray(value.hydrographicLines)) {
      issues.push("hydrographicLines must be an array when present");
    } else {
      value.hydrographicLines.forEach((entry, index) =>
        validateHydrographicLine(`hydrographicLines[${index}]`, entry, issues),
      );
    }
  }
  if (value.mappedNetworkRouteCandidates !== undefined) {
    if (!Array.isArray(value.mappedNetworkRouteCandidates)) {
      issues.push("mappedNetworkRouteCandidates must be an array when present");
    } else {
      value.mappedNetworkRouteCandidates.forEach((entry, index) =>
        validateMappedNetworkRouteCandidate(`mappedNetworkRouteCandidates[${index}]`, entry, issues),
      );
    }
  }
  if (value.naturalHazardNotices !== undefined) {
    if (!Array.isArray(value.naturalHazardNotices)) {
      issues.push("naturalHazardNotices must be an array when present");
    } else {
      value.naturalHazardNotices.forEach((entry, index) =>
        validateNaturalHazardNotice(`naturalHazardNotices[${index}]`, entry, issues),
      );
    }
  }
  if (!Array.isArray(value.routeCandidates)) {
    issues.push("routeCandidates must be an array");
  } else {
    value.routeCandidates.forEach((entry, index) => validateRouteCandidate(`routeCandidates[${index}]`, entry, issues));
  }
  if (!Array.isArray(value.observedFlows)) {
    issues.push("observedFlows must be an array");
  } else {
    value.observedFlows.forEach((entry, index) => validateObservedFlow(`observedFlows[${index}]`, entry, issues));
  }
  validateAuthority(value.authority, issues);
  const text = JSON.stringify(value);
  for (const pattern of FORBIDDEN_TRAVERSABILITY_PATTERNS) {
    if (pattern.test(text)) issues.push(`forbidden traversability finality text matched: ${pattern.source}`);
  }
  return issues;
}

export function isCivilizationTraversabilityAtlasV1(
  value: unknown,
): value is CivilizationTraversabilityAtlasV1 {
  return validateCivilizationTraversabilityAtlasV1(value).length === 0;
}
