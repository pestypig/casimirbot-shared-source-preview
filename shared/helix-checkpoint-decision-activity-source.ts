import { z } from "zod";
import { helixEnvironmentCheckpointPublicOutcomeSchema } from
  "./helix-environment-checkpoint-public-outcome";

export const HELIX_CHECKPOINT_DECISION_ACTIVITY_SOURCE_SCHEMA =
  "helix.checkpoint_decision_activity_source.v1" as const;

const ref = z.string().trim().min(1).max(320).regex(/^[a-zA-Z0-9:._/-]+$/u);

/** An immutable, public-only source for a canonical operator activity event.
 * No provider prose, raw response, credential, successor or execution grant
 * belongs in this record. */
export const helixCheckpointDecisionActivitySourceSchema = z.object({
  schema: z.literal(HELIX_CHECKPOINT_DECISION_ACTIVITY_SOURCE_SCHEMA),
  event_id: ref,
  profile_ref: ref,
  node_ref: ref,
  run_id: ref,
  environment_binding_ref: ref,
  room_ref: ref,
  source_ref: ref,
  world_ref: ref,
  authority_ref: ref,
  subject_ref: ref,
  producer_epoch_ref: ref,
  checkpoint_event_id: ref,
  checkpoint_event_hash: z.string().regex(/^sha256:[a-f0-9]{64}$/u),
  outcome: helixEnvironmentCheckpointPublicOutcomeSchema,
  content_role: z.literal("checkpoint_decision_activity_source_not_assistant_answer"),
  execution_authority: z.literal(false),
  answer_authority: z.literal(false),
  assistant_answer: z.literal(false),
  terminal_eligible: z.literal(false),
}).strict().superRefine((value, context) => {
  if (value.outcome.run_id !== value.run_id ||
      value.outcome.producer_epoch !== value.producer_epoch_ref) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["outcome"],
      message: "Checkpoint outcome and source identity differ." });
  }
});

export type HelixCheckpointDecisionActivitySource = z.infer<
  typeof helixCheckpointDecisionActivitySourceSchema
>;
