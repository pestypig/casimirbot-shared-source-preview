import { z } from "zod";

export const DISCORD_STREAM_PROPOSE_SCOPE = "helix.discord_stream.propose" as const;
export const discordStreamDurationHoursSchema = z.union([
  z.literal(1), z.literal(8), z.literal(24),
]);

export const codexThreadIdSchema = z.string().uuid();
export const discordStreamSourceRefSchema = z.string()
  .regex(/^codex-thread:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu);
export const discordStreamSelectionSchema = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("all"), source_refs: z.array(discordStreamSourceRefSchema)
    .min(1).max(32) }).strict(),
  z.object({ mode: z.literal("selected"), source_refs: z.array(discordStreamSourceRefSchema)
    .min(1).max(32) }).strict(),
]);

export const discordStreamProposalSchema = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("all") }).strict(),
  z.object({ mode: z.literal("selected"), chat_links: z.array(z.string().url().max(512))
    .min(1).max(32) }).strict(),
]);

export const discordStreamOwnerChangeSchema = z.object({
  device_ref: z.string().regex(/^desktop:[a-f0-9]{64}$/u),
  expected_revision: z.number().int().nonnegative(),
  selection: discordStreamSelectionSchema,
  proposal_id: z.string().uuid().nullable().optional(),
  duration_hours: discordStreamDurationHoursSchema.optional(),
  resume_approval_id: z.string().uuid().optional(),
}).strict().refine(value => Boolean(value.duration_hours) !== Boolean(value.resume_approval_id),
  "Choose one new approval duration or an existing approval to resume.");

export const discordStreamLeaseSchema = z.object({
  device_ref: z.string().regex(/^desktop:[a-f0-9]{64}$/u),
  expected_revision: z.number().int().positive(),
}).strict();

export const discordStreamSourceGrantSchema = z.object({
  device_ref: z.string().regex(/^desktop:[a-f0-9]{64}$/u),
  source_ref: discordStreamSourceRefSchema,
  title: z.string().min(1).max(120),
  granted: z.boolean(),
}).strict();

export const discordStreamEventSchema = z.object({
  schema: z.literal("helix.discord_stream_event.v1"),
  revision: z.number().int().positive(),
  device_ref: z.string().regex(/^desktop:[a-f0-9]{64}$/u),
  source_ref: discordStreamSourceRefSchema,
  event_key: z.string().regex(/^[a-f0-9]{64}$/u),
  lane: z.enum(["cloud_agent_dm", "codex_task", "live_voice", "responses_worker", "minecraft_adapter"]),
  kind: z.enum(["message", "update", "answer", "task_report", "decision", "status"]),
  author: z.enum(["user", "cloud_agent", "codex_task", "system", "live_voice",
    "responses_worker", "minecraft_adapter"]),
  source_label: z.string().min(1).max(120),
  text: z.string().min(1).max(1_500),
}).strict();

export const discordStreamReceiptSchema = z.object({
  schema: z.literal("helix.discord_stream_receipt.v1"),
  ok: z.literal(true),
  room_id: z.string().min(3),
  event_key: z.string().regex(/^[a-f0-9]{64}$/u),
  revision: z.number().int().positive(),
  delivery_status: z.enum(["delivered", "retry", "failed", "uncertain"]),
  discord_message_id: z.string().regex(/^\d{15,22}$/u).nullable(),
  transcript_included: z.literal(false),
}).strict();

export type DiscordStreamSelection = z.infer<typeof discordStreamSelectionSchema>;
export type DiscordStreamEvent = z.infer<typeof discordStreamEventSchema>;

/** An agent may name a Codex chat exactly, but cannot turn the link into a catalog. */
export function codexThreadIdFromLink(link: string): string | null {
  try {
    const url = new URL(link);
    if (url.protocol !== "codex:" || url.hostname !== "threads" ||
        url.username || url.password || url.search || url.hash) return null;
    const id = url.pathname.slice(1).toLowerCase();
    return codexThreadIdSchema.safeParse(id).success ? id : null;
  } catch { return null; }
}

export function discordStreamSourceRef(link: string): string | null {
  const id = codexThreadIdFromLink(link);
  return id ? `codex-thread:${id}` : null;
}

/** Each activity row must identify its own chat. A display filter is never authority. */
export function discordStreamSourceForTurn(frame: {
  helixConversationId: string;
  pairing?: { taskId: string | null };
}, turn: { sourceChat?: { taskId: string | null };
  sourceRun?: { helixConversationId: string } },
  grantsByHelixChat: ReadonlyMap<string, string>): string | null {
  const task = turn.sourceChat
    ? turn.sourceChat.taskId
    : turn.sourceRun
      ? grantsByHelixChat.get(turn.sourceRun.helixConversationId) ?? null
      : grantsByHelixChat.get(frame.helixConversationId) ?? frame.pairing?.taskId ?? null;
  if (!task) return null;
  const raw = task.replace(/^(?:codex-task:|codex-thread:local:|codex:thread:)/u, "").toLowerCase();
  return codexThreadIdSchema.safeParse(raw).success ? `codex-thread:${raw}` : null;
}
