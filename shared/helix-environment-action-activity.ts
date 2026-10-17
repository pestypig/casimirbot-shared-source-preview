import { z } from "zod";
import { helixOperatorActivityEventSchema } from "./helix-operator-activity";

const ref = z.string().trim().min(1).max(320).regex(/^[a-zA-Z0-9:._/-]+$/u);

/** Sanitized, owner-private activity from a verified action-choice boundary.
 * This reports selection/preflight only; the adapter must publish a separate
 * measured execution receipt before the UI may claim movement occurred. */
export const helixEnvironmentActionActivitySchema = z.object({
  schema: z.literal("environment.responses_actor_activity.v1"),
  event_id: ref,
  helix_conversation_id: ref,
  reasoning_binding_id: ref,
  binding_epoch: z.number().int().positive(),
  run_id: ref,
  goal_id: ref,
  goal_revision: z.number().int().nonnegative(),
  checkpoint_event_id: ref,
  decision_id: ref.nullable(),
  phase: z.enum(["proposed", "preflight_ready", "hold", "escalated", "rejected"]),
  action_code: ref.nullable(),
  target_ref: ref.nullable(),
  reason_code: ref.nullable(),
  observed_at: z.string().datetime({ offset: true }),
  provenance: z.literal("verified_responses_actor_boundary"),
  raw_response_included: z.literal(false),
  private_reasoning_included: z.literal(false),
  execution_authority: z.literal(false),
  action_performed: z.literal(false),
  answer_authority: z.literal(false),
  terminal_eligible: z.literal(false),
}).strict().superRefine((event, ctx) => {
  const hasAction = event.action_code !== null;
  if ((event.phase === "proposed" || event.phase === "preflight_ready") !== hasAction)
    ctx.addIssue({ code: "custom", path: ["action_code"],
      message: "Only candidate selection phases can name an action." });
  if (event.phase === "rejected" && event.reason_code === null)
    ctx.addIssue({ code: "custom", path: ["reason_code"],
      message: "A rejection must identify a stable reason." });
});

export type HelixEnvironmentActionActivity = z.infer<
  typeof helixEnvironmentActionActivitySchema>;

/** One owner-private, exact-run activity page. The two source kinds have
 * different authority: a Responses choice never attests a native effect. */
export const helixAdapterAiActivityPageSchema = z.object({
  schema: z.literal("helix.adapter_ai_activity_page.v1"),
  helix_conversation_id: ref,
  reasoning_binding_id: ref,
  binding_epoch: z.number().int().positive(),
  run_id: ref,
  events: z.array(helixOperatorActivityEventSchema).max(16),
  adapter_results_status: z.enum(["available", "unavailable"]).default("available"),
  answer_authority: z.literal(false),
  terminal_eligible: z.literal(false),
  raw_content_included: z.literal(false),
  private_reasoning_included: z.literal(false),
}).strict().superRefine((page, ctx) => {
  if (page.events.some(event => !["responses_action", "adapter_action_result"].includes(event.source_kind) ||
      event.helix_conversation_ref !== page.helix_conversation_id ||
      event.reasoning_binding_ref !== page.reasoning_binding_id ||
      event.reasoning_binding_epoch !== page.binding_epoch ||
      event.run_id !== page.run_id)) {
    ctx.addIssue({ code: "custom", path: ["events"],
      message: "Every adapter event must belong to this exact chat and binding." });
  }
});

export type HelixAdapterAiActivityPage = z.infer<
  typeof helixAdapterAiActivityPageSchema>;
