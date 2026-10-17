import { z } from "zod";
import { helixEnvironmentTimeSha256 } from "./helix-environment-time";

/** A Responses actor selects a host-prepared plan, never native inputs. */
export const HELIX_ENVIRONMENT_ACTION_CHOICE_SCHEMA =
  "environment.action_choice_proposal.v1" as const;

const id = z.string().trim().min(1).max(320).regex(/^[a-zA-Z0-9:._/-]+$/u);
const hash = z.string().regex(/^sha256:[a-f0-9]{64}$/u);
const revision = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);

export const helixEnvironmentActionCandidateSchema = z.object({
  candidate_id: id,
  plan_id: id,
  plan_hash: hash,
  action_code: id,
  target_ref: id.nullable(),
  estimated_units: z.number().int().positive().max(1_200),
}).strict();

export const helixEnvironmentActionChoiceContextSchema = z.object({
  run_id: id,
  reasoning_binding_id: id,
  binding_epoch: revision,
  environment_id: id,
  source_id: id,
  subject_id: id,
  goal_id: id,
  goal_revision: revision,
  predecessor_plan_id: id,
  predecessor_plan_hash: hash,
  checkpoint_id: id,
  checkpoint_event_id: id,
  checkpoint_event_hash: hash,
  observation_ref: id,
  observation_revision: revision,
  affordance_revision: revision,
  producer_epoch: id,
  authority_id: id,
  authority_revision: revision,
  monotonic_origin_id: id,
  current_unit: revision,
  current_monotonic_ms: revision,
  maximum_proposal_horizon_units: z.number().int().positive(),
  maximum_proposal_lifetime_ms: z.number().int().positive(),
  interruption_pending: z.boolean(),
}).strict();

export const verifiedHelixEnvironmentActionChoiceSourceSchema = z.object({
  context: helixEnvironmentActionChoiceContextSchema,
  observation_summary: z.string().trim().min(1).max(2_000),
  candidates: z.array(helixEnvironmentActionCandidateSchema).min(1).max(8),
}).strict().superRefine((source, ctx) => {
  const ids = new Set(source.candidates.map(candidate => candidate.candidate_id));
  if (ids.size !== source.candidates.length ||
      ids.has("hold_safe") || ids.has("escalate_to_codex")) {
    ctx.addIssue({ code: "custom", path: ["candidates"],
      message: "Candidate IDs must be distinct and cannot shadow control choices." });
  }
});

export type VerifiedHelixEnvironmentActionChoiceSource = z.infer<
  typeof verifiedHelixEnvironmentActionChoiceSourceSchema>;

export const helixEnvironmentActionModelChoiceSchema = z.object({
  choice_id: id,
  rationale_code: id,
}).strict();

export const helixEnvironmentActionChoiceProposalSchema = z.object({
  schema: z.literal(HELIX_ENVIRONMENT_ACTION_CHOICE_SCHEMA),
  decision_id: id,
  context: helixEnvironmentActionChoiceContextSchema.omit({
    current_unit: true, current_monotonic_ms: true,
    maximum_proposal_horizon_units: true, maximum_proposal_lifetime_ms: true,
    interruption_pending: true,
  }),
  choice_source_hash: hash,
  choice_id: id,
  plan_id: id.nullable(),
  plan_hash: hash.nullable(),
  action_code: id.nullable(),
  target_ref: id.nullable(),
  proposed_at_unit: revision,
  expires_at_unit: revision,
  proposed_at_monotonic_ms: revision,
  expires_at_monotonic_ms: revision,
  rationale_code: id,
  execution_authority: z.literal(false),
  answer_authority: z.literal(false),
  terminal_eligible: z.literal(false),
}).strict().superRefine((proposal, ctx) => {
  const control = proposal.choice_id === "hold_safe" ||
    proposal.choice_id === "escalate_to_codex";
  if (control !== (proposal.plan_id === null && proposal.plan_hash === null &&
      proposal.action_code === null && proposal.target_ref === null)) {
    ctx.addIssue({ code: "custom", path: ["choice_id"],
      message: "Control choices cannot carry a plan; action choices must carry one." });
  }
});

export type HelixEnvironmentActionChoiceProposal = z.infer<
  typeof helixEnvironmentActionChoiceProposalSchema>;

export type HelixEnvironmentActionChoiceVerdict =
  | { accepted: true; proposal: HelixEnvironmentActionChoiceProposal; execution_authority: false }
  | { accepted: false; reason: "invalid_choice" | "source_invalid" |
      "source_changed" | "candidate_unavailable" | "interruption_pending" |
      "proposal_expired" | "proposal_future_dated" | "proposal_horizon_exceeded";
      execution_authority: false };

const stripLiveContext = (context: VerifiedHelixEnvironmentActionChoiceSource["context"]) =>
  Object.fromEntries(Object.entries(context).filter(([key]) =>
    !["current_unit", "current_monotonic_ms", "maximum_proposal_horizon_units",
      "maximum_proposal_lifetime_ms", "interruption_pending"].includes(key)));

/** Re-run just before a selected, prebuilt plan enters temporal preflight.
 * An accepted choice is still not a broker admission or permission to act. */
export function assessHelixEnvironmentActionChoiceProposal(
  untrustedProposal: unknown,
  untrustedCurrentSource: unknown,
): HelixEnvironmentActionChoiceVerdict {
  const reject = (reason: Extract<HelixEnvironmentActionChoiceVerdict,
    { accepted: false }>["reason"]): HelixEnvironmentActionChoiceVerdict =>
    ({ accepted: false, reason, execution_authority: false });
  const proposal = helixEnvironmentActionChoiceProposalSchema.safeParse(untrustedProposal);
  if (!proposal.success) return reject("invalid_choice");
  const source = verifiedHelixEnvironmentActionChoiceSourceSchema.safeParse(untrustedCurrentSource);
  if (!source.success) return reject("source_invalid");
  const current = source.data;
  const selected = proposal.data;
  if (current.context.interruption_pending) return reject("interruption_pending");
  if (JSON.stringify(selected.context) !== JSON.stringify(stripLiveContext(current.context)))
    return reject("source_changed");
  if (selected.choice_source_hash !== helixEnvironmentTimeSha256({
    observation_summary: current.observation_summary, candidates: current.candidates,
  })) return reject("source_changed");
  const control = selected.choice_id === "hold_safe" ||
    selected.choice_id === "escalate_to_codex";
  const candidate = current.candidates.find(item => item.candidate_id === selected.choice_id);
  if (!control && (!candidate || candidate.plan_id !== selected.plan_id ||
      candidate.plan_hash !== selected.plan_hash ||
      candidate.action_code !== selected.action_code ||
      candidate.target_ref !== selected.target_ref)) return reject("candidate_unavailable");
  if (selected.expires_at_unit < selected.proposed_at_unit ||
      selected.expires_at_monotonic_ms < selected.proposed_at_monotonic_ms ||
      selected.expires_at_unit - selected.proposed_at_unit >
        current.context.maximum_proposal_horizon_units ||
      selected.expires_at_monotonic_ms - selected.proposed_at_monotonic_ms >
        current.context.maximum_proposal_lifetime_ms) return reject("proposal_horizon_exceeded");
  if (selected.proposed_at_unit > current.context.current_unit ||
      selected.proposed_at_monotonic_ms > current.context.current_monotonic_ms)
    return reject("proposal_future_dated");
  if (selected.expires_at_unit < current.context.current_unit ||
      selected.expires_at_monotonic_ms < current.context.current_monotonic_ms)
    return reject("proposal_expired");
  return { accepted: true, proposal: selected, execution_authority: false };
}

/** Freeze the invocation source, then compare with a fresh, trusted read.
 * Passing here is still only an advisory proposal, not plan admission. */
export function materializeHelixEnvironmentActionChoice(input: {
  untrustedChoice: unknown;
  invocationSource: unknown;
  currentSource: unknown;
  hostDecisionId: string;
  requestedHorizonUnits: number;
  requestedLifetimeMs: number;
}): HelixEnvironmentActionChoiceVerdict {
  const reject = (reason: Extract<HelixEnvironmentActionChoiceVerdict,
    { accepted: false }>["reason"]): HelixEnvironmentActionChoiceVerdict =>
    ({ accepted: false, reason, execution_authority: false });
  const invocation = verifiedHelixEnvironmentActionChoiceSourceSchema.safeParse(input.invocationSource);
  const current = verifiedHelixEnvironmentActionChoiceSourceSchema.safeParse(input.currentSource);
  if (!invocation.success || !current.success || !id.safeParse(input.hostDecisionId).success)
    return reject("source_invalid");
  const before = invocation.data;
  const after = current.data;
  if (before.context.interruption_pending || after.context.interruption_pending)
    return reject("interruption_pending");
  const { current_unit: _beforeUnit, current_monotonic_ms: _beforeMs,
    ...beforeContext } = before.context;
  const { current_unit: _afterUnit, current_monotonic_ms: _afterMs,
    ...afterContext } = after.context;
  if (JSON.stringify(beforeContext) !== JSON.stringify(afterContext) ||
      before.observation_summary !== after.observation_summary ||
      JSON.stringify(before.candidates) !== JSON.stringify(after.candidates))
    return reject("source_changed");
  const choice = helixEnvironmentActionModelChoiceSchema.safeParse(input.untrustedChoice);
  if (!choice.success) return reject("invalid_choice");
  const candidate = before.candidates.find(item => item.candidate_id === choice.data.choice_id);
  const control = choice.data.choice_id === "hold_safe" ||
    choice.data.choice_id === "escalate_to_codex";
  if (!control && !candidate) return reject("candidate_unavailable");
  const horizon = input.requestedHorizonUnits;
  const lifetime = input.requestedLifetimeMs;
  if (!Number.isSafeInteger(horizon) || horizon < 1 ||
      !Number.isSafeInteger(lifetime) || lifetime < 1 ||
      horizon > before.context.maximum_proposal_horizon_units ||
      lifetime > before.context.maximum_proposal_lifetime_ms ||
      before.context.current_unit + horizon > Number.MAX_SAFE_INTEGER ||
      before.context.current_monotonic_ms + lifetime > Number.MAX_SAFE_INTEGER)
    return reject("proposal_horizon_exceeded");
  if (after.context.current_unit < before.context.current_unit ||
      after.context.current_monotonic_ms < before.context.current_monotonic_ms)
    return reject("proposal_future_dated");
  if (after.context.current_unit > before.context.current_unit + horizon ||
      after.context.current_monotonic_ms > before.context.current_monotonic_ms + lifetime)
    return reject("proposal_expired");
  const proposal = helixEnvironmentActionChoiceProposalSchema.safeParse({
    schema: HELIX_ENVIRONMENT_ACTION_CHOICE_SCHEMA,
    decision_id: input.hostDecisionId,
    context: stripLiveContext(before.context),
    choice_source_hash: helixEnvironmentTimeSha256({
      observation_summary: before.observation_summary, candidates: before.candidates,
    }),
    choice_id: choice.data.choice_id,
    plan_id: candidate?.plan_id ?? null,
    plan_hash: candidate?.plan_hash ?? null,
    action_code: candidate?.action_code ?? null,
    target_ref: candidate?.target_ref ?? null,
    proposed_at_unit: before.context.current_unit,
    expires_at_unit: before.context.current_unit + horizon,
    proposed_at_monotonic_ms: before.context.current_monotonic_ms,
    expires_at_monotonic_ms: before.context.current_monotonic_ms + lifetime,
    rationale_code: choice.data.rationale_code,
    execution_authority: false,
    answer_authority: false,
    terminal_eligible: false,
  });
  return proposal.success
    ? { accepted: true, proposal: proposal.data, execution_authority: false }
    : reject("source_invalid");
}
