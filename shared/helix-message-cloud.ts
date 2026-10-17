import { z } from "zod";

export const helixMessageCloudTurnSchema = z.object({
  id: z.string().min(1).max(160),
  prompt: z.string().max(8_000),
  delivery: z.enum(["queued", "picked_up", "reported"]),
  report: z.object({
    status: z.enum(["completed", "unable"]),
    text: z.string().max(16_000),
  }).strict().nullable(),
  author: z.enum(["user", "cloud_agent", "codex_task", "system", "live_voice",
    "responses_worker", "minecraft_adapter"]).optional(),
  lane: z.enum(["cloud_agent_dm", "codex_task", "live_voice", "responses_worker", "minecraft_adapter"]).optional(),
  kind: z.enum(["message", "update", "answer", "task_report", "decision", "status"]).optional(),
  sourceChat: z.object({
    helixConversationId: z.string().min(3).max(320),
    title: z.string().max(120),
    taskId: z.string().min(3).max(320).nullable(),
    status: z.enum(["live", "reconnecting"]).optional(),
  }).strict().optional(),
  sourceRun: z.object({
    helixConversationId: z.string().min(3).max(320),
    chatTitle: z.string().max(120),
    runId: z.string().min(1).max(320),
    adapterRef: z.string().min(1).max(512),
    adapterLabel: z.string().min(1).max(80),
  }).strict().optional(),
}).strict();

export const helixMessageCloudFrameSchema = z.object({
  schema: z.literal("helix.message_cloud_frame.v1"),
  helixConversationId: z.string().min(3).max(320),
  source: z.enum(["message_codex", "cloud_agent_dm", "session_activity"]).optional(),
  displayMode: z.enum(["conversation", "reports"]).optional(),
  codexSourceStatus: z.enum(["live", "reconnecting", "unavailable", "unpaired"]).optional(),
  codexSourceReason: z.enum(["pairing_required", "pairing_expired", "pairing_revoked",
    "binding_mismatch", "account_link_required", "task_reference_invalid", "reader_unavailable"]).optional(),
  responsesWorkerStatus: z.enum(["live", "activity_recorded", "unavailable", "not_connected"]).optional(),
  activityScope: z.enum(["selected_chat", "saved_codex_chats"]).optional(),
  pairing: z.object({
    status: z.enum(["pending_claim", "active", "revoked", "expired", "superseded", "unavailable"]),
    taskId: z.string().min(3).max(320).nullable(),
    bindingId: z.string().min(3).max(320).optional(),
    pairingId: z.string().min(3).max(320).optional(),
  }).strict().optional(),
  turns: z.array(helixMessageCloudTurnSchema).max(128),
}).strict().superRefine((frame, context) => {
  if (frame.source !== "session_activity" && frame.turns.length > 3)
    context.addIssue({ code: "custom", path: ["turns"], message: "Ordinary clouds show at most three turns." });
  if (frame.source === "session_activity") frame.turns.forEach((turn, index) => {
    if (!turn.lane || !turn.kind)
      context.addIssue({ code: "custom", path: ["turns", index],
        message: "Activity turns require an attributed lane and kind." });
    if (turn.lane === "responses_worker" && frame.responsesWorkerStatus === "not_connected")
      context.addIssue({ code: "custom", path: ["turns", index],
        message: "Responses activity requires a recorded-activity or verified-live status." });
    if (turn.sourceChat && turn.lane !== "codex_task")
      context.addIssue({ code: "custom", path: ["turns", index, "sourceChat"],
        message: "Only exact-task activity may carry a Codex chat label." });
    if (turn.sourceRun && turn.lane !== "responses_worker" && turn.lane !== "minecraft_adapter")
      context.addIssue({ code: "custom", path: ["turns", index, "sourceRun"],
        message: "Only adapter activity may carry an adapter run label." });
  });
});

export type HelixMessageCloudFrame = z.infer<typeof helixMessageCloudFrameSchema>;
