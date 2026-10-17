import { z } from "zod";
import { helixEnvironmentMissionActivityProjectionSchema } from
  "./helix-environment-mission-activity-projection";
import { helixEnvironmentMissionActivityScopeSchema } from
  "./helix-environment-mission-activity-projection";

export const HELIX_OWNER_MISSION_ACTIVITY_PAGE_SCHEMA =
  "helix.verified_owner_mission_activity_page.v1" as const;

/** Read-only owner projection. Cursors are opaque to renderers and room text. */
export const helixOwnerMissionActivityPageSchema = z.object({
  schema: z.literal(HELIX_OWNER_MISSION_ACTIVITY_PAGE_SCHEMA),
  run_id: z.string().trim().min(1).max(512),
  session_identity: z.object({
    mission_id: z.string().trim().min(1).max(320),
    mission_revision: z.number().int().positive(),
    binding_epoch: z.number().int().positive(),
    producer_epoch_ref: z.string().trim().min(1).max(512),
    action_authority_ref: z.string().trim().min(1).max(512),
    scope: helixEnvironmentMissionActivityScopeSchema,
  }).strict(),
  projections: z.array(helixEnvironmentMissionActivityProjectionSchema).max(25),
  next_cursor: z.string().min(1).max(8_192).nullable(),
  poll_cursor: z.string().min(1).max(8_192),
  has_more: z.boolean(),
  complete_for_query: z.boolean(),
  content_role: z.literal("mission_activity_not_assistant_answer"),
  answer_authority: z.literal(false),
  assistant_answer: z.literal(false),
  terminal_eligible: z.literal(false),
  raw_content_included: z.literal(false),
  private_reasoning_included: z.literal(false),
  action_authority_granted: z.literal(false),
}).strict().superRefine((page, context) => {
  if (page.has_more !== Boolean(page.next_cursor) ||
      page.complete_for_query === page.has_more) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["next_cursor"],
      message: "Continuation and completeness must match the bounded page." });
  }
  if (page.session_identity.scope.run_id !== page.run_id ||
      page.session_identity.scope.room_ref === null) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["session_identity"],
      message: "A HUD-capable owner read requires one exact room and run." });
  }
  if (page.projections.some(item => item.run_id !== page.run_id || item.surface !== "overlay")) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["projections"],
      message: "Every projection must belong to this exact overlay run." });
  }
});

export type HelixOwnerMissionActivityPage = z.infer<typeof helixOwnerMissionActivityPageSchema>;
