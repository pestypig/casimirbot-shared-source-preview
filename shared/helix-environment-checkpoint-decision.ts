import { z } from "zod";

/** A model may propose a checkpoint disposition, never a native input or plan. */
export const HELIX_ENVIRONMENT_CHECKPOINT_DECISION_SCHEMA =
  "environment.checkpoint_decision_proposal.v1" as const;

const id = z.string().trim().min(1).max(320).regex(/^[a-zA-Z0-9:._/-]+$/u);
const revision = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
const hash = z.string().regex(/^sha256:[a-f0-9]{64}$/u);

export const helixEnvironmentCheckpointDecisionSchema = z.object({
  schema: z.literal(HELIX_ENVIRONMENT_CHECKPOINT_DECISION_SCHEMA),
  decision_id: id,
  environment_id: id,
  source_id: id,
  subject_id: id,
  goal_id: id,
  goal_revision: revision,
  predecessor_plan_id: id,
  predecessor_plan_hash: hash,
  checkpoint_id: id,
  observation_ref: id,
  observation_revision: revision,
  affordance_revision: revision,
  producer_epoch: id,
  authority_id: id,
  authority_revision: revision,
  monotonic_origin_id: id,
  proposed_at_unit: revision,
  expires_at_unit: revision,
  proposed_at_monotonic_ms: revision,
  expires_at_monotonic_ms: revision,
  disposition: z.enum([
    "continue_same_goal",
    "repair_same_goal",
    "hold_safe",
    "escalate_to_codex",
  ]),
  evidence_refs: z.array(id).min(1).max(16),
  rationale_code: id,
  execution_authority: z.literal(false),
  answer_authority: z.literal(false),
  terminal_eligible: z.literal(false),
}).strict();

export type HelixEnvironmentCheckpointDecision = z.infer<
  typeof helixEnvironmentCheckpointDecisionSchema
>;

/** The only fields accepted from a Responses model; all binding fields are host-owned. */
export const helixEnvironmentCheckpointModelChoiceSchema = z.object({
  disposition: helixEnvironmentCheckpointDecisionSchema.shape.disposition,
  rationale_code: id,
}).strict();

export type HelixEnvironmentCheckpointDecisionContext = Pick<
  HelixEnvironmentCheckpointDecision,
  "goal_id" | "goal_revision" | "predecessor_plan_id" |
  "environment_id" | "source_id" | "subject_id" |
  "predecessor_plan_hash" | "checkpoint_id" | "observation_ref" |
  "observation_revision" | "affordance_revision" |
  "producer_epoch" | "authority_id" | "authority_revision" |
  "monotonic_origin_id"
> & {
  current_unit: number;
  current_monotonic_ms: number;
  maximum_proposal_horizon_units: number;
  maximum_proposal_lifetime_ms: number;
  interruption_pending: boolean;
};

export type HelixEnvironmentCheckpointDecisionVerdict =
  | { accepted: true; proposal: HelixEnvironmentCheckpointDecision; execution_authority: false }
  | { accepted: false; reason: "invalid_proposal" | "context_invalid" | "identity_or_revision_stale" |
      "proposal_expired" | "proposal_future_dated" | "proposal_horizon_exceeded" |
      "interruption_pending"; execution_authority: false };

const same = (proposal: HelixEnvironmentCheckpointDecision, context: HelixEnvironmentCheckpointDecisionContext) =>
  proposal.environment_id === context.environment_id &&
  proposal.source_id === context.source_id &&
  proposal.subject_id === context.subject_id &&
  proposal.goal_id === context.goal_id &&
  proposal.goal_revision === context.goal_revision &&
  proposal.predecessor_plan_id === context.predecessor_plan_id &&
  proposal.predecessor_plan_hash === context.predecessor_plan_hash &&
  proposal.checkpoint_id === context.checkpoint_id &&
  proposal.observation_ref === context.observation_ref &&
  proposal.observation_revision === context.observation_revision &&
  proposal.affordance_revision === context.affordance_revision &&
  proposal.producer_epoch === context.producer_epoch &&
  proposal.authority_id === context.authority_id &&
  proposal.authority_revision === context.authority_revision &&
  proposal.monotonic_origin_id === context.monotonic_origin_id;

/** Pure preflight only. A passing verdict is not Helix admission or execution. */
export function assessHelixEnvironmentCheckpointDecision(
  untrustedProposal: unknown,
  context: HelixEnvironmentCheckpointDecisionContext,
): HelixEnvironmentCheckpointDecisionVerdict {
  const reject = (reason: Extract<HelixEnvironmentCheckpointDecisionVerdict, { accepted: false }>["reason"])
    : HelixEnvironmentCheckpointDecisionVerdict => ({ accepted: false, reason, execution_authority: false });
  if (!Number.isSafeInteger(context.current_unit) || context.current_unit < 0 ||
      !Number.isSafeInteger(context.current_monotonic_ms) || context.current_monotonic_ms < 0 ||
      !Number.isSafeInteger(context.maximum_proposal_horizon_units) ||
      context.maximum_proposal_horizon_units < 1 ||
      !Number.isSafeInteger(context.maximum_proposal_lifetime_ms) ||
      context.maximum_proposal_lifetime_ms < 1) return reject("context_invalid");
  const parsed = helixEnvironmentCheckpointDecisionSchema.safeParse(untrustedProposal);
  if (!parsed.success) return reject("invalid_proposal");
  const proposal = parsed.data;
  if (!same(proposal, context)) return reject("identity_or_revision_stale");
  if (context.interruption_pending) return reject("interruption_pending");
  if (proposal.proposed_at_unit > context.current_unit ||
      proposal.proposed_at_monotonic_ms > context.current_monotonic_ms)
    return reject("proposal_future_dated");
  if (proposal.expires_at_unit < context.current_unit ||
      proposal.expires_at_monotonic_ms < context.current_monotonic_ms)
    return reject("proposal_expired");
  if (proposal.expires_at_unit < proposal.proposed_at_unit ||
      proposal.expires_at_unit - proposal.proposed_at_unit > context.maximum_proposal_horizon_units ||
      proposal.expires_at_monotonic_ms < proposal.proposed_at_monotonic_ms ||
      proposal.expires_at_monotonic_ms - proposal.proposed_at_monotonic_ms > context.maximum_proposal_lifetime_ms)
    return reject("proposal_horizon_exceeded");
  return { accepted: true, proposal, execution_authority: false };
}

/** Stamp from the invocation snapshot, then compare against freshly read state on return. */
export function materializeHelixEnvironmentCheckpointDecision(
  untrustedChoice: unknown,
  invocationContext: HelixEnvironmentCheckpointDecisionContext,
  currentContext: HelixEnvironmentCheckpointDecisionContext,
  hostDecisionId: string,
  requestedHorizonUnits: number,
  requestedLifetimeMs: number,
): HelixEnvironmentCheckpointDecisionVerdict {
  const choice = helixEnvironmentCheckpointModelChoiceSchema.safeParse(untrustedChoice);
  if (!choice.success) return { accepted: false, reason: "invalid_proposal", execution_authority: false };
  if (!Number.isSafeInteger(requestedHorizonUnits) || requestedHorizonUnits < 1 ||
      !Number.isSafeInteger(requestedLifetimeMs) || requestedLifetimeMs < 1 ||
      requestedHorizonUnits > invocationContext.maximum_proposal_horizon_units ||
      requestedLifetimeMs > invocationContext.maximum_proposal_lifetime_ms)
    return { accepted: false, reason: "proposal_horizon_exceeded", execution_authority: false };
  const proposal: HelixEnvironmentCheckpointDecision = {
    schema: HELIX_ENVIRONMENT_CHECKPOINT_DECISION_SCHEMA,
    decision_id: hostDecisionId,
    environment_id: invocationContext.environment_id,
    source_id: invocationContext.source_id,
    subject_id: invocationContext.subject_id,
    goal_id: invocationContext.goal_id,
    goal_revision: invocationContext.goal_revision,
    predecessor_plan_id: invocationContext.predecessor_plan_id,
    predecessor_plan_hash: invocationContext.predecessor_plan_hash,
    checkpoint_id: invocationContext.checkpoint_id,
    observation_ref: invocationContext.observation_ref,
    observation_revision: invocationContext.observation_revision,
    affordance_revision: invocationContext.affordance_revision,
    producer_epoch: invocationContext.producer_epoch,
    authority_id: invocationContext.authority_id,
    authority_revision: invocationContext.authority_revision,
    monotonic_origin_id: invocationContext.monotonic_origin_id,
    proposed_at_unit: invocationContext.current_unit,
    expires_at_unit: invocationContext.current_unit + requestedHorizonUnits,
    proposed_at_monotonic_ms: invocationContext.current_monotonic_ms,
    expires_at_monotonic_ms: invocationContext.current_monotonic_ms + requestedLifetimeMs,
    disposition: choice.data.disposition,
    evidence_refs: [invocationContext.observation_ref],
    rationale_code: choice.data.rationale_code,
    execution_authority: false,
    answer_authority: false,
    terminal_eligible: false,
  };
  return assessHelixEnvironmentCheckpointDecision(proposal, currentContext);
}
