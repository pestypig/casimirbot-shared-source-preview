import { z } from "zod";
import type { HelixMessageCloudFrame } from "./helix-message-cloud";

/** Public, owner-enabled projection of one visible Float activity entry. */
export const discordFloatActivityEventSchema = z.object({
  schema: z.literal("helix.discord_float_activity_event.v1"),
  event_key: z.string().regex(/^[a-f0-9]{64}$/),
  lane: z.enum(["cloud_agent_dm", "codex_task", "live_voice", "responses_worker", "minecraft_adapter"]),
  kind: z.enum(["message", "update", "answer", "task_report", "decision", "status"]),
  author: z.enum(["user", "cloud_agent", "codex_task", "system", "live_voice",
    "responses_worker", "minecraft_adapter"]),
  source_label: z.string().min(1).max(120),
  text: z.string().min(1).max(1_500),
}).strict();

export const discordFloatActivityReceiptSchema = z.object({
  schema: z.literal("helix.discord_float_activity_receipt.v1"),
  operation: z.literal("room.discord_float_activity.publish"),
  api_version: z.literal("v1"),
  ok: z.literal(true),
  room: z.object({ room_id: z.string().min(3) }).strict(),
  event_key: z.string().regex(/^[a-f0-9]{64}$/),
  delivery_status: z.enum(["delivered", "retry", "failed", "uncertain"]),
  discord_message_id: z.string().regex(/^\d{15,22}$/).nullable(),
  reentry_required: z.literal(true),
  answer_authority: z.literal(false),
  assistant_answer: z.literal(false),
  terminal_eligible: z.literal(false),
  raw_content_included: z.literal(false),
}).strict();

export type DiscordFloatActivityEvent = z.infer<typeof discordFloatActivityEventSchema>;

const protectedText = /\b(?:Bearer\s+[A-Za-z0-9._~+/-]{12,}|(?:access_token|refresh_token|bearer_token|token_value|claim_handle|password|api[_-]?key)\s*[=:]\s*\S+|sk-[A-Za-z0-9_-]{16,}|helix_live_[A-Za-z0-9_-]{32,}|(?:room_source_claim|agent_chat_claim|helix_env_device|helix_probe_lease|helix_room_src)_[A-Za-z0-9:._~-]+)\b/iu;

/** The Float frame is owner-private; this intentionally sends only its visible
 * text after a separate owner opt-in. Entries resembling credentials are held
 * back, and the domain independently rejects its protected credential forms. */
export async function projectDiscordFloatActivityEvent(frame: HelixMessageCloudFrame,
  turn: HelixMessageCloudFrame["turns"][number]): Promise<DiscordFloatActivityEvent | null> {
  if (frame.source !== "session_activity" || !turn.lane || !turn.kind || !turn.author) return null;
  const sourceLabel = (turn.sourceChat?.title ?? turn.sourceRun?.chatTitle ?? "This Helix chat")
    .replace(/[\u0000-\u001f\u007f]/gu, " ").trim().slice(0, 120);
  const text = (turn.prompt || turn.report?.text || "")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/gu, " ").trim().slice(0, 1_500);
  if (!sourceLabel || !text || protectedText.test(sourceLabel) || protectedText.test(text)) return null;
  // Codex's visible update list is a sliding tail. Its display index changes
  // when an older update drops out, even though the message is unchanged.
  // Bind public delivery to the source turn and visible text instead.
  const sourceTurnId = turn.id.replace(/^agent:\d+:/u, "agent:")
    .replace(/:update:\d+$/u, ":update");
  const identity = JSON.stringify([frame.helixConversationId, turn.sourceChat?.helixConversationId,
    turn.sourceRun?.runId, sourceTurnId, turn.kind, text]);
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(identity));
  const eventKey = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
  return discordFloatActivityEventSchema.parse({ schema: "helix.discord_float_activity_event.v1",
    event_key: eventKey, lane: turn.lane, kind: turn.kind, author: turn.author,
    source_label: sourceLabel, text });
}
