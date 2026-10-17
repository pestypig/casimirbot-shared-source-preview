import { z } from "zod";
import {
  helixEnvironmentCheckpointDecisionSchema,
  type HelixEnvironmentCheckpointDecisionContext,
} from "./helix-environment-checkpoint-decision";

export const HELIX_ENVIRONMENT_CHECKPOINT_PUBLIC_OUTCOME_SCHEMA =
  "helix.environment_checkpoint_public_outcome.v1" as const;

const ref = z.string().trim().min(1).max(320).regex(/^[a-zA-Z0-9:._/-]+$/u);

/** A display receipt only. It is not a task answer, successor plan or action. */
export const helixEnvironmentCheckpointPublicOutcomeSchema = z.object({
  schema: z.literal(HELIX_ENVIRONMENT_CHECKPOINT_PUBLIC_OUTCOME_SCHEMA),
  run_id: ref,
  goal_id: ref,
  checkpoint_id: ref,
  observation_ref: ref,
  producer_epoch: ref,
  decision_id: ref.nullable(),
  status: z.enum(["proposal", "rejected"]),
  disposition: helixEnvironmentCheckpointDecisionSchema.shape.disposition.nullable(),
  reason: z.enum([
    "response_not_complete", "response_error", "refusal", "unexpected_output",
    "invalid_choice", "invalid_proposal", "context_invalid",
    "identity_or_revision_stale", "proposal_expired", "proposal_future_dated",
    "proposal_horizon_exceeded", "interruption_pending",
  ]).nullable(),
  observed_at: z.string().datetime({ offset: true }),
  provenance: z.literal("derived"),
  content_role: z.literal("checkpoint_worker_outcome_not_assistant_answer"),
  raw_response_included: z.literal(false),
  private_reasoning_included: z.literal(false),
  execution_authority: z.literal(false),
  action_authority_granted: z.literal(false),
  answer_authority: z.literal(false),
  assistant_answer: z.literal(false),
  terminal_eligible: z.literal(false),
}).strict().superRefine((value, context) => {
  if (value.status === "proposal" && (value.disposition === null || value.reason !== null ||
      value.decision_id === null)) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["status"],
      message: "A proposal requires a disposition and host decision ID." });
  }
  if (value.status === "rejected" && (value.disposition !== null || value.reason === null ||
      value.decision_id !== null)) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["status"],
      message: "A rejection may not carry a proposal." });
  }
});

export type HelixEnvironmentCheckpointPublicOutcome = z.infer<
  typeof helixEnvironmentCheckpointPublicOutcomeSchema
>;

export type HelixEnvironmentCheckpointPublicScope = Pick<
  HelixEnvironmentCheckpointDecisionContext,
  "goal_id" | "checkpoint_id" | "observation_ref" | "producer_epoch"
> & { run_id: string };
