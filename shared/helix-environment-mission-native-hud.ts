import { z } from "zod";
import {
  helixEnvironmentMissionActivityProjectionSchema,
} from "./helix-environment-mission-activity-projection";
import { helixEnvironmentMissionActivityScopeSchema } from
  "./helix-environment-mission-activity-projection";

export const HELIX_ENVIRONMENT_MISSION_NATIVE_HUD_FRAME_SCHEMA =
  "helix.environment_mission_native_hud_frame.v1" as const;

const ref = z.string().trim().min(3).max(320);
const identity = z.object({
  mission_id: ref,
  mission_revision: z.number().int().positive(),
  binding_epoch: z.number().int().positive(),
  producer_epoch_ref: ref,
  action_authority_ref: ref,
  client_process_id: z.number().int().positive(),
  scope: helixEnvironmentMissionActivityScopeSchema,
}).strict();

/** Renderer data remains presentational; native host rechecks trusted identity. */
export const helixEnvironmentMissionNativeHudFrameSchema = identity.extend({
  schema: z.literal(HELIX_ENVIRONMENT_MISSION_NATIVE_HUD_FRAME_SCHEMA),
  observed_at: z.string().datetime({ offset: true }),
  projections: z.array(helixEnvironmentMissionActivityProjectionSchema).max(3),
  content_role: z.literal("mission_activity_not_assistant_answer"),
  private_reasoning_included: z.literal(false),
  raw_content_included: z.literal(false),
  action_authority_granted: z.literal(false),
  answer_authority: z.literal(false),
  assistant_answer: z.literal(false),
  terminal_eligible: z.literal(false),
}).strict().superRefine((frame, context) => {
  if (frame.projections.some(item => item.surface !== "overlay" ||
      item.run_id !== frame.scope.run_id)) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["projections"],
      message: "HUD events must belong to its exact overlay run." });
  }
});

export type HelixEnvironmentMissionNativeHudFrame = z.infer<
  typeof helixEnvironmentMissionNativeHudFrameSchema
>;
export type HelixEnvironmentMissionNativeHudIdentity = z.infer<typeof identity>;
