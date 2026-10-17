import { z } from "zod";

const mirrorTurnSchema = z.object({
  id: z.string().min(1).max(160),
  user: z.string().max(8_000),
  assistant: z.string().max(16_000).nullable(),
  assistantPhase: z.enum(["commentary", "final_answer"]).nullable(),
  updates: z.array(z.string().min(1).max(1_200)).max(12).optional(),
  status: z.enum(["completed", "working", "interrupted"]),
}).strict();

const mirrorFrameFields = {
  schema: z.literal("helix.codex_conversation_cloud_frame.v1"),
  taskId: z.string().regex(/^[0-9a-f-]{32,64}$/i),
  // Private native preview identity. Older stored frames may omit this, but
  // a new floating mirror must carry its exact owner-approved Helix chat.
  helixConversationId: z.string().min(1).max(256).optional(),
  sourceStatus: z.enum(["live", "reconnecting"]).optional(),
};

export const helixCodexMirrorFrameSchema = z.object({
  ...mirrorFrameFields, turns: z.array(mirrorTurnSchema).max(3),
}).strict();

export const helixCodexConsoleFrameSchema = z.object({
  ...mirrorFrameFields, turns: z.array(mirrorTurnSchema).max(50),
}).strict();

export type HelixCodexMirrorFrame = z.infer<typeof helixCodexMirrorFrameSchema>;
export type HelixCodexConsoleFrame = z.infer<typeof helixCodexConsoleFrameSchema>;
